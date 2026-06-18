"use client"

import { useState, useCallback } from "react"

const PROFILES = {
  seazone: {
    name: "Seazone",
    emoji: "🌊",
    tagline: "Proptech • Aluguel por Temporada",
    accent: "#0066FF",
    accentLight: "#EBF3FF",
    accentDark: "#0047CC",
    bg: "linear-gradient(135deg, #0066FF 0%, #0047CC 100%)",
  },
  vistas: {
    name: "Vistas de Anitá",
    emoji: "🏔️",
    tagline: "Cabanas • Serra Catarinense",
    accent: "#2D6A4F",
    accentLight: "#EAF4EE",
    accentDark: "#1B4332",
    bg: "linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)",
  },
}

const NETWORKS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "#E1306C",
    toneNote: "Tom visual e inspirador. Emojis bem-vindos. Linguagem próxima.",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "#1877F2",
    toneNote: "Tom acessível e informativo. Pode ser ligeiramente mais detalhado.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "#0A66C2",
    toneNote: "Tom profissional e sóbrio. Sem emoji ou apenas 1. Linguagem formal.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.83 4.83 0 01-1.01-.04z" />
      </svg>
    ),
    color: "#000000",
    toneNote: "Tom descontraído e jovial. Linguagem leve. Pode ser mais breve e direto.",
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "6px",
        border: "1px solid #E2E8F0",
        background: copied ? "#F0FDF4" : "white",
        color: copied ? "#16A34A" : "#64748B",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copiado!
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copiar
        </>
      )}
    </button>
  )
}

type ProfileId = keyof typeof PROFILES
type Responses = Record<string, { label: string; text: string }>

export default function AgenteRespostas() {
  const [profileId, setProfileId] = useState<ProfileId>("seazone")
  const [networkId, setNetworkId] = useState("instagram")
  const [comment, setComment] = useState("")
  const [context, setContext] = useState("")
  const [responses, setResponses] = useState<Responses | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profile = PROFILES[profileId]
  const network = NETWORKS.find((n) => n.id === networkId)

  const generateResponses = useCallback(async () => {
    if (!comment.trim()) return
    setLoading(true)
    setError(null)
    setResponses(null)

    try {
      const res = await fetch("/api/social-response/gerar-respostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, networkId, comment, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar respostas")
      setResponses(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar respostas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [profileId, networkId, comment, context])

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        minHeight: "100vh",
        background: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; }
        .net-btn { transition: all 0.15s ease; }
        .net-btn:hover { transform: translateY(-1px); }
        .profile-card { transition: all 0.2s ease; cursor: pointer; }
        .profile-card:hover { transform: translateY(-2px); }
        .gen-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important; }
        .gen-btn:active:not(:disabled) { transform: translateY(0); }
        .resp-card { animation: slideIn 0.3s ease forwards; opacity: 0; }
        .resp-card:nth-child(1) { animation-delay: 0s; }
        .resp-card:nth-child(2) { animation-delay: 0.1s; }
        .resp-card:nth-child(3) { animation-delay: 0.2s; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .dot { animation: pulse 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: profile.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            {profile.emoji}
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#0F172A" }}>
              Agente de Respostas
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>Social Media • Seazone & Vistas de Anitá</div>
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#94A3B8",
            background: "#F1F5F9",
            padding: "4px 10px",
            borderRadius: "20px",
          }}
        >
          Powered by Claude AI
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", width: "100%", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Step 1: Profile */}
        <section>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            01 — Perfil
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(Object.entries(PROFILES) as [ProfileId, typeof PROFILES[ProfileId]][]).map(([id, p]) => (
              <div
                key={id}
                className="profile-card"
                onClick={() => setProfileId(id)}
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: `2px solid ${profileId === id ? p.accent : "#E2E8F0"}`,
                  background: profileId === id ? p.accentLight : "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: p.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {p.emoji}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{p.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>{p.tagline}</div>
                </div>
                {profileId === id && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: p.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Step 2: Network */}
        <section>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            02 — Rede Social
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                className="net-btn"
                onClick={() => setNetworkId(n.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: `2px solid ${networkId === n.id ? profile.accent : "#E2E8F0"}`,
                  background: networkId === n.id ? profile.accentLight : "white",
                  color: networkId === n.id ? profile.accent : "#475569",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ color: networkId === n.id ? profile.accent : n.color }}>{n.icon}</span>
                {n.name}
              </button>
            ))}
          </div>
          {network && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "#F8FAFC",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={profile.accent} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {network.toneNote}
            </div>
          )}
        </section>

        {/* Step 3: Comment */}
        <section>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            03 — Comentário a Responder
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Cole aqui o comentário recebido no ${network?.name}...`}
            rows={3}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "10px",
              border: `1.5px solid ${comment ? profile.accent : "#E2E8F0"}`,
              background: "white",
              fontSize: "14px",
              color: "#0F172A",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: "1.6",
              transition: "border-color 0.15s",
            }}
          />
        </section>

        {/* Step 4: Context (optional) */}
        <section>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
            04 — Contexto Adicional{" "}
            <span style={{ fontWeight: "400", color: "#CBD5E1", textTransform: "none", letterSpacing: 0 }}>
              (opcional)
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "8px" }}>
            Ex: &quot;Comentário em post sobre investimento&quot;, &quot;Reclamação sobre check-in&quot;, &quot;Dúvida sobre pet friendly&quot;
          </div>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o contexto do post ou da situação..."
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1.5px solid #E2E8F0",
              background: "white",
              fontSize: "13px",
              color: "#0F172A",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
          />
        </section>

        {/* Generate Button */}
        <button
          className="gen-btn"
          onClick={generateResponses}
          disabled={loading || !comment.trim()}
          style={{
            padding: "15px 32px",
            borderRadius: "10px",
            border: "none",
            background: comment.trim() ? profile.bg : "#E2E8F0",
            color: comment.trim() ? "white" : "#94A3B8",
            fontSize: "14px",
            fontWeight: "600",
            cursor: comment.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: comment.trim() ? `0 4px 14px ${profile.accent}40` : "none",
            letterSpacing: "0.02em",
          }}
        >
          {loading ? (
            <>
              <span>Gerando respostas</span>
              <div style={{ display: "flex", gap: "3px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="dot"
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "white",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Gerar 3 Opções de Resposta
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Responses */}
        {responses && (
          <section>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
              Opções de Resposta — {network?.name} • {profile.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(responses).map(([key, resp], i) => (
                <div
                  key={key}
                  className="resp-card"
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1.5px solid #E2E8F0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 16px",
                      background: i === 0 ? profile.accentLight : "#F8FAFC",
                      borderBottom: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: i === 0 ? profile.accent : "#CBD5E1",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {key}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: i === 0 ? profile.accentDark : "#475569",
                        }}
                      >
                        {resp.label}
                      </span>
                    </div>
                    <CopyButton text={resp.text} />
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#1E293B",
                        lineHeight: "1.65",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {resp.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={generateResponses}
              style={{
                marginTop: "12px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: `1.5px solid ${profile.accent}`,
                background: "transparent",
                color: profile.accent,
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Gerar novas variações
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
