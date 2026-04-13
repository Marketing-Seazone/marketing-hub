import Link from "next/link"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

const ARTEFATOS = [
  {
    href: "/growth/hospedes-midia-paga",
    emoji: "📊",
    title: "Mídia Paga — Hóspedes",
    desc: "Gastos diários de Meta Ads e Google Ads para hóspedes. Explorador de tabelas Nekt.",
  },
]

export default function Page() {
  return (
    <TeamLayout teamId="growth">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {ARTEFATOS.map(a => (
          <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "24px 20px",
              boxShadow: T.elevSm, cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = T.elevMd)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = T.elevSm)}
            >
              <span style={{ fontSize: 28 }}>{a.emoji}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "10px 0 4px" }}>{a.title}</p>
              <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </TeamLayout>
  )
}
