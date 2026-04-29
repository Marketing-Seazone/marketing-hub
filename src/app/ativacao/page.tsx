import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

const projects = [
  {
    title: "Eventos CCO",
    description: "Gestão de eventos para o time CCO. Kanban de prospecção, validação e abordagem de eventos por região e segmento.",
    url: "https://cco-events.lovable.app",
    emoji: "🎪",
    status: "Ativo",
  },
  {
    title: "Agentes de PR",
    description: "Agência de PR com IA. Gera releases, briefings, segmentação de veículos e emails de assessoria de imprensa automaticamente.",
    url: "https://pr-director.seazone.properties",
    emoji: "📰",
    status: "Ativo",
  },
]

export default function Page() {
  return (
    <TeamLayout teamId="ativacao">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Projetos de Ativação
          </h2>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            Ferramentas e dashboards do time de Marketing de Ativação.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: "24px",
                  boxShadow: T.elevSm,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "#5EA50018",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {project.emoji}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px",
                    borderRadius: 20, background: T.statusOkBg, color: T.statusOkDark,
                  }}>
                    {project.status}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 6px" }}>
                    {project.title}
                  </p>
                  <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "#5EA500", fontWeight: 600 }}>
                    Abrir ferramenta →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </TeamLayout>
  )
                     }
