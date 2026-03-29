"use client"

import Link from "next/link"
import { TEAMS, T } from "@/lib/constants"
import { Palette, BarChart2, Megaphone, TrendingUp, Zap, BookOpen } from "lucide-react"

const TEAM_ICONS = {
  "criacao":           Palette,
  "product-marketing": BarChart2,
  "social-midia":      Megaphone,
  "growth":            TrendingUp,
  "ativacao":          Zap,
} as const

const SeazoneIcon = () => (
  <svg width="26" height="27" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M46.2131 15.1755L37.6794 10.1673C37.6977 10.0485 37.7528 9.9388 37.7528 9.81999V2.2665C37.7528 1.01444 36.7342 0 35.4771 0H30.9257C29.6686 0 28.6501 1.01444 28.6501 2.2665V4.90314L25.5531 3.09816C24.296 2.34876 22.6397 2.4767 21.4744 3.33578L21.4147 3.35863L1.78243 14.7003C0.144493 15.6736-0.539125 17.9355 0.479423 19.6308C1.53468 21.3901 3.86081 21.8654 5.49416 20.892L6.6687 20.2157C5.27852 22.9255 4.41138 25.9871 4.41138 29.3275C4.41138 34.6099 6.44848 39.8146 10.2107 43.5662C11.688 45.0422 13.4086 46.276 15.2942 47.1853C16.7441 47.8845 18.2765 48.4694 19.8685 48.7618C21.979 49.1457 24.1629 48.9492 26.2964 48.9537C28.5996 48.9537 30.9074 48.9583 33.2106 48.9629C35.2982 48.9674 37.3857 48.9766 39.4962 48.9811C40.0239 48.9811 40.5423 48.8441 41.0103 48.6064C41.6113 48.3003 41.9692 47.9667 42.3638 47.4412C42.8134 46.8472 43.1254 46.1297 43.1254 45.3621V21.582C44.6899 22.1441 46.5894 21.6552 47.5207 20.1015C48.5393 18.4062 47.8557 16.1443 46.2131 15.171M36.3947 29.7022C36.3947 36.9312 31.4809 42.8077 24.0712 42.8077C16.6615 42.8077 11.2155 36.5565 11.2155 29.3275C11.2155 22.0984 16.6615 16.0757 24.0712 16.0757C31.4809 16.0757 36.3947 21.6506 36.3947 28.802V29.7067V29.7022Z" fill="#FC6058"/>
  </svg>
)

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: T.elevSm,
      }}>
        <SeazoneIcon />
        <span style={{ width: 1, height: 20, background: T.border }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: T.cardFg }}>Marketing Hub</span>
        <span style={{ fontSize: 13, color: T.mutedFg, marginLeft: 4 }}>Seazone</span>
      </header>

      {/* Hero */}
      <div style={{ padding: "48px 32px 32px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, marginBottom: 8 }}>
          Artefatos & Ferramentas
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.cardFg, margin: "0 0 8px" }}>
          Marketing Hub
        </h1>
        <p style={{ fontSize: 14, color: T.mutedFg, margin: 0 }}>
          Acesse os artefatos e ferramentas de cada time de marketing.
        </p>
      </div>

      {/* Team grid */}
      <main style={{ padding: "0 32px 48px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
            {/* Card tutorial */}
          <Link href="/tutorial" style={{ textDecoration: "none" }}>
            <div style={{
              background: `${T.cinza800}`,
              border: `1px solid ${T.cinza700}`,
              borderRadius: 14,
              padding: "24px 24px 20px",
              boxShadow: T.elevSm,
              cursor: "pointer",
              transition: "box-shadow 0.15s, transform 0.15s",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevMd
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevSm
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookOpen size={20} color="#fff" />
              </div>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "block", marginBottom: 4 }}>
                  Como adicionar um artefato
                </span>
                <span style={{ fontSize: 13, color: T.cinza200, lineHeight: 1.5 }}>
                  Guia passo a passo para subir novos artefatos em qualquer time via Git + Pull Request.
                </span>
              </div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.cinza200 }}>Ler tutorial</span>
                <span style={{ fontSize: 12, color: T.cinza200 }}>→</span>
              </div>
            </div>
          </Link>

        {TEAMS.map(team => {
            const Icon = TEAM_ICONS[team.id]
            return (
              <Link key={team.id} href={team.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: "24px 24px 20px",
                  boxShadow: T.elevSm,
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevMd
                    ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevSm
                    ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${team.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={team.color} />
                  </div>

                  {/* Label + description */}
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, display: "block", marginBottom: 4 }}>
                      {team.label}
                    </span>
                    <span style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.5 }}>
                      {team.description}
                    </span>
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: team.color }}>Acessar</span>
                    <span style={{ fontSize: 12, color: team.color }}>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
