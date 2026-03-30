"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { T } from "@/lib/constants"
import { LayoutDashboard, Palette, Zap, TrendingUp, BarChart2, Megaphone, Database, BookOpen, Users } from "lucide-react"

const SeazoneIcon = () => (
  <svg width="26" height="27" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M46.2131 15.1755L37.6794 10.1673C37.6977 10.0485 37.7528 9.9388 37.7528 9.81999V2.2665C37.7528 1.01444 36.7342 0 35.4771 0H30.9257C29.6686 0 28.6501 1.01444 28.6501 2.2665V4.90314L25.5531 3.09816C24.296 2.34876 22.6397 2.4767 21.4744 3.33578L21.4147 3.35863L1.78243 14.7003C0.144493 15.6736-0.539125 17.9355 0.479423 19.6308C1.53468 21.3901 3.86081 21.8654 5.49416 20.892L6.6687 20.2157C5.27852 22.9255 4.41138 25.9871 4.41138 29.3275C4.41138 34.6099 6.44848 39.8146 10.2107 43.5662C11.688 45.0422 13.4086 46.276 15.2942 47.1853C16.7441 47.8845 18.2765 48.4694 19.8685 48.7618C21.979 49.1457 24.1629 48.9492 26.2964 48.9537C28.5996 48.9537 30.9074 48.9583 33.2106 48.9629C35.2982 48.9674 37.3857 48.9766 39.4962 48.9811C40.0239 48.9811 40.5423 48.8441 41.0103 48.6064C41.6113 48.3003 41.9692 47.9667 42.3638 47.4412C42.8134 46.8472 43.1254 46.1297 43.1254 45.3621V21.582C44.6899 22.1441 46.5894 21.6552 47.5207 20.1015C48.5393 18.4062 47.8557 16.1443 46.2131 15.171M36.3947 29.7022C36.3947 36.9312 31.4809 42.8077 24.0712 42.8077C16.6615 42.8077 11.2155 36.5565 11.2155 29.3275C11.2155 22.0984 16.6615 16.0757 24.0712 16.0757C31.4809 16.0757 36.3947 21.6506 36.3947 28.802V29.7067V29.7022Z" fill="#FC6058"/>
  </svg>
)

const SUB_CARDS = [
  { label: "Criação",              desc: "Briefings, templates e assets de campanha",       href: "/criacao",                     color: T.roxo600,    Icon: Palette     },
  { label: "Marketing de Ativação",desc: "Eventos, ativações e campanhas de relacionamento", href: "/ativacao",                    color: T.verde600,   Icon: Zap         },
  { label: "Growth | Não Paga",    desc: "Orgânico, email, WhatsApp e conversão",            href: "/growth",                      color: T.laranja500, Icon: TrendingUp  },
  { label: "Growth | Mídia Paga",  desc: "Meta Ads, Google Ads e performance",               href: "/marketing-geral",             color: T.laranja500, Icon: BarChart2   },
  { label: "PMM | SZI",            desc: "Go-to-market e posicionamento Investimentos",      href: "/product-marketing",           color: T.primary,    Icon: BarChart2   },
  { label: "PMM | SZS",            desc: "Go-to-market e posicionamento Serviços",           href: "/product-marketing",           color: T.primary,    Icon: BarChart2   },
  { label: "PMM | MKT PLACE",      desc: "Go-to-market e posicionamento Marketplace",        href: "/product-marketing",           color: T.primary,    Icon: BarChart2   },
  { label: "Mídias Sociais",       desc: "Calendário editorial e performance de conteúdo",   href: "/social-midia",                color: T.teal600,    Icon: Megaphone   },
]

function hoverCard(el: HTMLDivElement, enter: boolean) {
  el.style.boxShadow = enter ? T.elevMd : T.elevSm
  el.style.transform = enter ? "translateY(-2px)" : "translateY(0)"
}

export default function Home() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.login === "Sampa-J"

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <SeazoneIcon />
        <span style={{ width: 1, height: 20, background: T.border }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: T.cardFg }}>Marketing Hub</span>
        <span style={{ fontSize: 13, color: T.mutedFg, marginLeft: 4 }}>Seazone</span>
      </header>

      <main style={{ padding: "40px 32px 48px", maxWidth: 960, margin: "0 auto" }}>

        {/* ── Card principal: Marketing Hub ── */}
        <Link href="/marketing-geral" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${T.cinza800} 0%, #0a1628 100%)`,
              border: `1px solid ${T.cinza700}`,
              borderRadius: 18, padding: "36px 40px",
              boxShadow: T.elevMd, cursor: "pointer",
              transition: "box-shadow 0.15s, transform 0.15s",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
            }}
            onMouseEnter={e => hoverCard(e.currentTarget as HTMLDivElement, true)}
            onMouseLeave={e => hoverCard(e.currentTarget as HTMLDivElement, false)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <LayoutDashboard size={28} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>
                  Dashboard Principal
                </p>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                  Marketing Hub
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                  KPIs, seguidores, mídia paga, funis, ativação e mídia não paga — tudo em um lugar.
                </p>
              </div>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            }}>
              Acessar <span style={{ fontSize: 18 }}>→</span>
            </div>
          </div>
        </Link>

        {/* ── Grid de sub-cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}>
          {SUB_CARDS.map(card => (
            <Link key={card.label} href={card.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "20px 20px 16px",
                  boxShadow: T.elevSm, cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  display: "flex", flexDirection: "column", gap: 12, height: "100%",
                }}
                onMouseEnter={e => hoverCard(e.currentTarget as HTMLDivElement, true)}
                onMouseLeave={e => hoverCard(e.currentTarget as HTMLDivElement, false)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: `${card.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <card.Icon size={18} color={card.color} />
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, display: "block", marginBottom: 4 }}>
                    {card.label}
                  </span>
                  <span style={{ fontSize: 12, color: T.mutedFg, lineHeight: 1.5 }}>
                    {card.desc}
                  </span>
                </div>
                <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 600, color: card.color }}>
                  Acessar →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Utilidades (Dados, Tutorial, Pessoas) ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 14,
        }}>
          <Link href="/dados" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: T.cinza800, border: `1px solid ${T.cinza700}`,
                borderRadius: 14, padding: "16px 20px",
                boxShadow: T.elevSm, cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
                display: "flex", alignItems: "center", gap: 12,
              }}
              onMouseEnter={e => hoverCard(e.currentTarget as HTMLDivElement, true)}
              onMouseLeave={e => hoverCard(e.currentTarget as HTMLDivElement, false)}
            >
              <Database size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Explorador de Dados</span>
            </div>
          </Link>

          <Link href="/tutorial" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: T.cinza800, border: `1px solid ${T.cinza700}`,
                borderRadius: 14, padding: "16px 20px",
                boxShadow: T.elevSm, cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
                display: "flex", alignItems: "center", gap: 12,
              }}
              onMouseEnter={e => hoverCard(e.currentTarget as HTMLDivElement, true)}
              onMouseLeave={e => hoverCard(e.currentTarget as HTMLDivElement, false)}
            >
              <BookOpen size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Como adicionar artefato</span>
            </div>
          </Link>

          {isAdmin && (
            <Link href="/pessoas" style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: T.card, border: `1px solid #F59E0B`,
                  borderRadius: 14, padding: "16px 20px",
                  boxShadow: T.elevSm, cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  display: "flex", alignItems: "center", gap: 12,
                }}
                onMouseEnter={e => hoverCard(e.currentTarget as HTMLDivElement, true)}
                onMouseLeave={e => hoverCard(e.currentTarget as HTMLDivElement, false)}
              >
                <Users size={16} color="#F59E0B" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B" }}>Pessoas</span>
              </div>
            </Link>
          )}
        </div>

      </main>
    </div>
  )
}
