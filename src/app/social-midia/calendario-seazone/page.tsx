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
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: "0 0 16px" }}>
          Calendário de Conteúdo — Seazone
        </h2>
        <iframe
          src="https://seazone-calendar.vercel.app"
          style={{ width: "100%", height: "80vh", border: "none", borderRadius: 8 }}
        />
      </div>
    </TeamLayout>
  )
}