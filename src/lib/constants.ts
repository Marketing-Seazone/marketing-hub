// Design tokens — mesmo sistema do saleszone
export const T = {
  primary:    "#0055FF",
  primaryFg:  "#FFFFFF",
  bg:         "#FFFFFF",
  fg:         "#080E32",
  card:       "#FFFFFF",
  cardFg:     "#141A3C",
  muted:      "#F3F3F5",
  mutedFg:    "#6B6E84",
  border:     "#E6E7EA",
  destructive:"#E7000B",
  elevSm:     "0 1px 2px rgba(0,0,0,0.12), 0 0.1px 0.3px rgba(0,0,0,0.08)",
  elevMd:     "0 4px 12px rgba(0,0,0,0.08)",
  cinza50:    "#F3F3F5",
  cinza100:   "#E6E7EA",
  cinza200:   "#CECFD6",
  cinza400:   "#9C9FAD",
  cinza600:   "#6B6E84",
  cinza700:   "#525670",
  cinza800:   "#393E5B",
  verde600:   "#5EA500",
  laranja500: "#FF6900",
  roxo600:    "#9810FA",
  teal600:    "#0D9488",
  indigo600:  "#4F46E5",
  font:       "'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
  // Status semânticos
  statusOk:       "#10b981",
  statusOkFg:     "#059669",
  statusOkBg:     "#d1fae5",
  statusOkDark:   "#065f46",
  statusWarn:     "#f59e0b",
  statusWarnFg:   "#d97706",
  statusWarnBg:   "#fef3c7",
  statusWarnDark: "#92400e",
  statusErr:      "#ef4444",
  statusErrFg:    "#dc2626",
  statusErrBg:    "#fee2e2",
  statusErrDark:  "#991b1b",
  pendingBg:      "#dbeafe",
  pendingFg:      "#1e40af",
} as const

export type TeamId = "criacao" | "product-marketing" | "social-midia" | "growth" | "ativacao"

export interface Team {
  id: TeamId
  label: string
  description: string
  color: string
  href: string
}

export const TEAMS: Team[] = [
  {
    id: "criacao",
    label: "Criação",
    description: "Artefatos de criação visual, briefings, templates e assets de campanha.",
    color: T.roxo600,
    href: "/criacao",
  },
  {
    id: "product-marketing",
    label: "Product Marketing",
    description: "Go-to-market, posicionamento de produto, decks e materiais de lançamento.",
    color: T.primary,
    href: "/product-marketing",
  },
  {
    id: "social-midia",
    label: "Social Mídia",
    description: "Calendário editorial, relatórios de performance e pautas de conteúdo.",
    color: T.teal600,
    href: "/social-midia",
  },
  {
    id: "growth",
    label: "Growth",
    description: "Dashboards de mídia paga, experimentos e resultados de performance.",
    color: T.laranja500,
    href: "/growth",
  },
  {
    id: "ativacao",
    label: "Marketing de Ativação",
    description: "Ações de ativação, eventos, campanhas de relacionamento e CRM.",
    color: T.verde600,
    href: "/ativacao",
  },
]
