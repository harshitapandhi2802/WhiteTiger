"use client";

/* Client helpers for /api/workspace (saved strategies, positions, journal). */

export type WorkspaceKind = "position" | "strategy" | "journal";

export interface SavedItem<T> { id: string; data: T; created_at: string; updated_at: string }

export class WorkspaceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function call(input: string, init?: RequestInit) {
  const res = await fetch(input, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new WorkspaceError(body.error || "Something went wrong", res.status);
  return body;
}

export async function listItems<T>(kind: WorkspaceKind): Promise<SavedItem<T>[]> {
  const body = await call(`/api/workspace?kind=${kind}`);
  return body.items as SavedItem<T>[];
}

export async function saveItem<T extends object>(kind: WorkspaceKind, id: string, data: T): Promise<void> {
  await call("/api/workspace", { method: "POST", body: JSON.stringify({ kind, id, data }) });
}

export async function deleteItem(kind: WorkspaceKind, id: string): Promise<void> {
  await call(`/api/workspace?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
