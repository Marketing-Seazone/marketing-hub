"use client"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function CalendarioSeazonePage() {
  return (
    <TeamLayout teamId="social-midia">
      <div style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "24px",
        boxShadow: T.elevSm,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: "0 0 8px" }}>
          Calendário de Conteúdo — Seazone
        </h2>
        <p style={{ fontSize: 13, color: T.mutedFg, marginBottom: 16 }}>
          Planejamento e geração de conteúdo para redes sociais da Seazone com IA.
        </p>
        <a href="https://seazone-calendar.vercel.app" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-block",
          background: "#0055FF",
          color: "#fff",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}>
          Abrir ferramenta →
        </a>
      </div>
    </TeamLayout>
  )
}