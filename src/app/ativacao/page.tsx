import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function Page() {
  return (
    <TeamLayout teamId="ativacao">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <a
          href="https://cco-events.lovable.app"
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
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Eventos CCO
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Gestão de eventos para o time CCO. Kanban de prospecção, validação e abordagem por região e segmento.
          </p>
        </a>

        <a
          href="https://pr-director.seazone.properties"
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
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Agentes de PR
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Agência de PR com IA. Gera releases, briefings, segmentação de veículos e emails de assessoria de imprensa.
          </p>
        </a>

        <a
          href="https://expansao-sp.lovable.app"
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
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Marketing Expansão SP
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Dashboard de marketing de ativação para Expansão São Paulo. Investimento por canal, pipeline de contratações e fornecedores.
          </p>
        </a>

      </div>
    </TeamLayout>
  )
                   }
