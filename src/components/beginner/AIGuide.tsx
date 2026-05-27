"use client";
import { useState, useRef, useEffect } from "react";
import { COLORS } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT AI GUIDE — BEGINNER COPILOT (LIGHT THEME)
   A floating AI assistant with premium light UI.
   ═══════════════════════════════════════════════════════════════ */

const QUICK_ANSWERS: Record<string, string> = {
  "How do I start investing?": "Great question! Here's a simple 4-step plan:\n\n1. Open a Demat account — Use Zerodha, Groww, or Upstox (free and easy)\n2. Start with a SIP — Invest ₹500-5000/month in a NIFTY 50 index fund\n3. Learn the basics — Use White Tiger's Learn section daily\n4. Be patient — Investing is a marathon, not a sprint!\n\nDon't try to time the market. Just start early and stay consistent.",
  "What is a good first investment?": "For beginners, the best first investment is a NIFTY 50 Index Fund via SIP.\n\nWhy?\n• It gives you exposure to India's top 50 companies\n• Low cost (0.1-0.2% expense ratio)\n• No need to pick individual stocks\n• Start with just ₹500/month\n• Historically returned ~12% annually\n\nPopular options: UTI Nifty 50 Index Fund, HDFC Nifty 50 Index Fund.",
  "How much should I invest?": "A good rule of thumb:\n\n50-30-20 Rule:\n• 50% of income → Needs (rent, food, bills)\n• 30% → Wants (entertainment, dining)\n• 20% → Savings & Investments\n\nStart small — even ₹500/month matters!\n\nAt age 22 with ₹5,000/month SIP at 12% return:\n• 10 years = ₹11.6 lakh\n• 20 years = ₹49.9 lakh\n• 30 years = ₹1.76 crore!",
  "Are stocks risky?": "Yes, but not as scary as people think!\n\nShort-term (< 1 year): Very risky — prices can drop 20-40%\nMedium-term (3-5 years): Moderate risk — most dips recover\nLong-term (10+ years): Historically, almost always profitable\n\nKey insight: NIFTY 50 has NEVER given negative returns over any 10-year period.\n\nTips to reduce risk:\n• Diversify (don't put all money in 1 stock)\n• Use SIP (spreads out your risk)\n• Invest only money you don't need for 5+ years",
  "What is NIFTY 50?": "NIFTY 50 is like a report card of India's stock market.\n\nIt tracks the 50 biggest and most important companies in India across sectors like banking, IT, oil, pharma, and FMCG.\n\nWhen people say \"the market is up today,\" they usually mean NIFTY went up.\n\nFun facts:\n• Started at 1,000 in 1996\n• Now above 23,000 — that's 23x growth!\n• Investing in a NIFTY index fund = owning a tiny piece of all 50 companies",
  "What is mutual fund?": "A Mutual Fund is like a bus ride for your money!\n\nImagine 1,000 people each put ₹1,000 into a pool. A professional fund manager takes this ₹10 lakh and invests it in stocks, bonds, or both.\n\nBenefits:\n• Professional management\n• Diversification (your money goes into 30-60 stocks)\n• Start with just ₹500\n• Regulated by SEBI (safe)\n\nTypes:\n• Equity funds (stocks) — higher returns, higher risk\n• Debt funds (bonds) — stable, lower returns\n• Hybrid funds — mix of both",
  "Should I invest in crypto?": "Crypto is high-risk, high-reward.\n\nPros:\n• Potential for very high returns\n• 24/7 market\n• Decentralized technology\n\nCons:\n• Extremely volatile (50%+ drops are normal)\n• Tax: 30% flat tax on profits in India\n• Many scams and rug pulls\n\nBeginner advice:\n• Only invest money you can afford to lose completely\n• Stick to Bitcoin and Ethereum only\n• Never more than 5-10% of your total portfolio",
  "How are stocks taxed?": "Stock taxes in India are simpler than you think:\n\nShort-term (held < 1 year): 15% on profits\nLong-term (held > 1 year): First ₹1 lakh profit = TAX FREE, above ₹1 lakh = 10% tax\n\nDividends: Taxed at your income tax slab rate\n\nTip: Hold investments for >1 year to pay lower tax!",
};

const SUGGESTED_QUESTIONS = [
  "How do I start investing?",
  "What is a good first investment?",
  "How much should I invest?",
  "Are stocks risky?",
  "What is NIFTY 50?",
  "What is mutual fund?",
  "Should I invest in crypto?",
  "How are stocks taxed?",
];

interface Message { role: "user" | "ai"; text: string; }

export default function AIGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your White Tiger AI Guide — ask me anything about investing, stocks, mutual funds, or finance. I'll explain it simply!" },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  function handleSend(question?: string) {
    const q = question || input.trim();
    if (!q) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let answer = "That's a great question! While I can answer common beginner questions instantly, for more specific queries, check out the Learn section in each tab.\n\nTry asking me about:\n• How to start investing\n• What is NIFTY 50\n• Are stocks risky\n• How are stocks taxed\n• What is mutual fund";

      for (const [key, val] of Object.entries(QUICK_ANSWERS)) {
        const keyWords = key.toLowerCase().split(" ").filter(w => w.length > 2);
        const matchCount = keyWords.filter(w => lower.includes(w)).length;
        if (matchCount >= Math.ceil(keyWords.length * 0.5)) { answer = val; break; }
      }

      setMessages(prev => [...prev, { role: "ai", text: answer }]);
    }, 500);
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} style={{
        position: "fixed", bottom: 80, left: 16, zIndex: 200,
        width: 52, height: 52, borderRadius: "50%",
        background: "linear-gradient(135deg, #059669, #10b981)",
        border: "none",
        boxShadow: "0 4px 20px rgba(5,150,105,0.35), 0 2px 6px rgba(0,0,0,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: "1.5rem",
        animation: "guidePulse 3s ease-in-out infinite",
      }}>
        ✨
        <style>{`
          @keyframes guidePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
        `}</style>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
    }} onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        maxHeight: "85vh",
        borderRadius: "20px 20px 0 0",
        background: "#ffffff",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${COLORS.divider}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(5,150,105,0.04), rgba(79,70,229,0.02))",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.3rem" }}>✨</span>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: COLORS.textPrimary }}>White Tiger AI Guide</div>
              <div style={{ fontSize: "0.62rem", color: COLORS.accent, fontWeight: 600 }}>Your finance learning companion</div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{
            background: COLORS.bg, border: "none", color: COLORS.textDim,
            borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: "0.9rem",
          }}>&#10005;</button>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{
          flex: 1, overflowY: "auto", padding: 16,
          display: "flex", flexDirection: "column", gap: 12,
          minHeight: 200, maxHeight: "50vh",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              <div style={{
                padding: "12px 16px", borderRadius: 14,
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #059669, #10b981)"
                  : COLORS.bg,
                border: msg.role === "ai" ? `1px solid ${COLORS.cardBorder}` : "none",
                color: msg.role === "user" ? "#fff" : COLORS.textPrimary,
                fontSize: "0.8rem", lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ fontSize: "0.6rem", color: COLORS.textDim, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Popular Questions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTED_QUESTIONS.slice(0, 6).map(q => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  padding: "6px 12px", borderRadius: 20,
                  background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`,
                  color: COLORS.accent, fontSize: "0.62rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          borderTop: `1px solid ${COLORS.divider}`,
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about investing..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 12,
              background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`,
              color: COLORS.textPrimary, fontSize: "0.82rem", outline: "none",
            }}
          />
          <button onClick={() => handleSend()} style={{
            width: 44, height: 44, borderRadius: 12, border: "none",
            background: input.trim() ? "linear-gradient(135deg, #059669, #10b981)" : COLORS.bg,
            color: input.trim() ? "#fff" : COLORS.textDim,
            cursor: input.trim() ? "pointer" : "default",
            fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            &#10148;
          </button>
        </div>
      </div>
    </div>
  );
}
