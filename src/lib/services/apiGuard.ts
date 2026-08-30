/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — API GUARD
   Shared protection for API routes:
     • rateLimit()      — sliding-window per-client rate limiting
     • CircuitBreaker   — trips after repeated upstream failures so a
                          dead external API (Gemini, Yahoo, NSE…) doesn't
                          cascade timeouts and burn cost/quota
     • cacheHeaders()   — stale-while-revalidate Cache-Control headers
     • clientKey()      — best-effort client identity from request headers

   NOTE: state is in-memory and therefore per-serverless-instance. On
   Vercel this caps abuse per warm instance rather than globally; for a
   hard global limit, back this with Redis/Upstash. It still meaningfully
   protects against runaway loops and single-client cost spirals.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";

// ─── CLIENT IDENTITY ────────────────────────────────────────
export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

// ─── RATE LIMITER (sliding window) ──────────────────────────
interface Bucket {
  hits: number[]; // timestamps (ms) within the current window
}
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests allowed within the window. Default 30. */
  limit?: number;
  /** Window length in ms. Default 60_000 (1 minute). */
  windowMs?: number;
  /** Logical name so different routes get independent counters. */
  scope?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number; // ms until the window frees up
  limit: number;
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions = {}): RateLimitResult {
  const limit = opts.limit ?? 30;
  const windowMs = opts.windowMs ?? 60_000;
  const scope = opts.scope ?? "global";
  const key = `${scope}:${clientKey(req)}`;
  const now = Date.now();

  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop timestamps outside the window.
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, resetMs: windowMs - (now - oldest), limit };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - bucket.hits.length, resetMs: windowMs, limit };
}

/** Returns a 429 NextResponse if the client is over the limit, else null. */
export function rateLimitResponse(
  req: NextRequest,
  opts: RateLimitOptions = {}
): NextResponse | null {
  const r = rateLimit(req, opts);
  if (r.ok) return null;
  const retrySecs = Math.ceil(r.resetMs / 1000);
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again shortly.",
      retryAfter: retrySecs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retrySecs),
        "X-RateLimit-Limit": String(r.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// ─── CIRCUIT BREAKER ────────────────────────────────────────
type CircuitState = "closed" | "open" | "half-open";

interface CircuitOptions {
  /** Consecutive failures before the circuit opens. Default 5. */
  failureThreshold?: number;
  /** How long to stay open before a trial request. Default 30_000ms. */
  cooldownMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;

  constructor(public readonly name: string, opts: CircuitOptions = {}) {
    this.threshold = opts.failureThreshold ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
  }

  /** True when calls should be short-circuited (upstream considered down). */
  get isOpen(): boolean {
    if (this.state === "open" && Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = "half-open"; // allow one trial request through
    }
    return this.state === "open";
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  /**
   * Run `fn` through the breaker. If the circuit is open, `fallback` is used
   * (or an error thrown if none provided) without hitting the upstream.
   */
  async exec<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    if (this.isOpen) {
      if (fallback) return await fallback();
      throw new Error(`Circuit "${this.name}" is open — upstream unavailable`);
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) return await fallback();
      throw err;
    }
  }
}

/** Shared breaker for all Gemini (generativelanguage) calls. */
export const geminiBreaker = new CircuitBreaker("gemini", {
  failureThreshold: 4,
  cooldownMs: 45_000,
});

// ─── CACHE HEADERS ──────────────────────────────────────────
/**
 * Build Cache-Control headers with stale-while-revalidate so the CDN can
 * serve a cached response instantly while refreshing in the background.
 */
export function cacheHeaders(maxAgeSecs: number, swrSecs = maxAgeSecs * 4): HeadersInit {
  return {
    "Cache-Control": `public, s-maxage=${maxAgeSecs}, stale-while-revalidate=${swrSecs}`,
    "CDN-Cache-Control": `public, s-maxage=${maxAgeSecs}, stale-while-revalidate=${swrSecs}`,
  };
}

/** JSON response helper that attaches stale-while-revalidate cache headers. */
export function cachedJson(
  data: unknown,
  maxAgeSecs: number,
  init?: { status?: number; swrSecs?: number }
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: cacheHeaders(maxAgeSecs, init?.swrSecs),
  });
}

// ─── PER-SOURCE BREAKER REGISTRY ────────────────────────────
// Named breakers so each external data source (TradingView, NSE, CoinDCX…)
// trips independently — a dead NSE endpoint shouldn't disable TradingView.
const breakerRegistry = new Map<string, CircuitBreaker>();

export function getBreaker(name: string, opts?: ConstructorParameters<typeof CircuitBreaker>[1]): CircuitBreaker {
  let b = breakerRegistry.get(name);
  if (!b) {
    b = new CircuitBreaker(name, opts);
    breakerRegistry.set(name, b);
  }
  return b;
}

// ─── FETCH WITH RETRY + TIMEOUT + BREAKER ───────────────────
export interface ResilientFetchOptions extends RequestInit {
  /** Number of retry attempts after the first try. Default 2. */
  retries?: number;
  /** Per-attempt timeout in ms. Default 6000. */
  timeoutMs?: number;
  /** Base backoff in ms; grows exponentially with jitter. Default 300. */
  backoffMs?: number;
  /**
   * Circuit-breaker name. When provided, repeated failures trip the breaker
   * and subsequent calls short-circuit (throw immediately) until cooldown.
   */
  breaker?: string;
}

/**
 * fetch() wrapped with timeout, exponential-backoff retries, and an optional
 * per-source circuit breaker. Retries on network errors and 5xx/429 responses.
 * Throws on final failure so callers keep their existing try/catch fallbacks.
 */
export async function fetchWithRetry(
  url: string,
  opts: ResilientFetchOptions = {}
): Promise<Response> {
  const { retries = 2, timeoutMs = 6000, backoffMs = 300, breaker, ...init } = opts;

  const attempt = async (): Promise<Response> => {
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        // Retry transient upstream failures.
        if ((res.status >= 500 || res.status === 429) && i < retries) {
          lastErr = new Error(`Upstream ${res.status}`);
        } else {
          return res;
        }
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
      }
      // Exponential backoff with jitter before the next attempt.
      if (i < retries) {
        const delay = backoffMs * 2 ** i + Math.random() * backoffMs;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("fetchWithRetry failed");
  };

  if (breaker) {
    return getBreaker(breaker, { failureThreshold: 5, cooldownMs: 30_000 }).exec(attempt);
  }
  return attempt();
}
