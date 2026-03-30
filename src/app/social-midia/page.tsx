import Link from "next/link"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function Page() {
  return (
    <TeamLayout teamId="social-midia">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/social-midia/calendario-seazone" style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "20px 24px",
          textDecoration: "none",
          display: "block",
          boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Calendário de Conteúdo — Seazone
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Planejamento e geração de conteúdo para redes sociais com IA.
          </p>
        </Link>
      </div>
    </TeamLayout>
  )
}
```

Salva. Depois no cmd:
```
git add .
git commit -m "fix(social): incorpora ferramenta via iframe e usa tokens do tema"
git push origin feat/social-calendario-seazone