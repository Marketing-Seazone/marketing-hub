import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function Page() {
  return (
    <TeamLayout teamId="growth">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <a href="https://opps-seazone.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            textDecoration: "none",
            display: "block",
            boxShadow: T.elevSm,
          }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Opps Seazone
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Atribuição de oportunidades de Instagram orgânico (stories/comunidade) para WhatsApp via Timelines.ai.
          </p>
        </a>

        <a href="https://seazone-manychat.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            textDecoration: "none",
            display: "block",
            boxShadow: T.elevSm,
          }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Manychat — Analytics
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Analytics da IA nativa do Manychat com deals do Pipedrive.
          </p>
        </a>

      </div>
    </TeamLayout>
  )
}
