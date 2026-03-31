import Link from "next/link"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
export default function Page() {
  return (
    <TeamLayout teamId="social-midia">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/social-midia/calendario-seazone" style={{
          background: T.card,
          border: 1px solid ${T.border},
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
        <Link href="https://linha-editorial-rodrigo-ruas-seazone.lovable.app" target="_blank" style={{
          background: T.card,
          border: 1px solid ${T.border},
          borderRadius: 12,
          padding: "20px 24px",
          textDecoration: "none",
          display: "block",
          boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Linha Editorial — Rodrigo Ruas
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Gestão de imóveis para aluguel por temporada. 4 pilares · 1 Reels/semana · 3 meses.
          </p>
        </Link>
        <Link href="https://linha-editorial-pedro-escola-de-imoveis.lovable.app" target="_blank" style={{
          background: T.card,
          border: 1px solid ${T.border},
          borderRadius: 12,
          padding: "20px 24px",
          textDecoration: "none",
          display: "block",
          boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Linha Editorial — Pedro (Escola de Imóveis)
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Investimento imobiliário e short stay. 4 pilares · Reels + Carrossel · 3 meses.
          </p>
        </Link>
      </div>
    </TeamLayout>
  )
}
