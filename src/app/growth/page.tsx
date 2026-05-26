"use client"

import Link from "next/link"
import { ChevronLeft, TrendingDown } from "lucide-react"
import { T } from "@/lib/constants"

const ARTIFACTS = [
  {
    href: "/growth/analise-funil-mia",
    title: "Análise: Funil CTWA + Mia",
    desc: "Por que leads ficam presos e não avançam para Agendado. Bugs da Mia, timing de transbordo, no-show e hipóteses investigadas com dados.",
    tag: "26 mai 2026",
    badge: "Bug crítico",
    badgeColor: T.statusErr,
    Icon: TrendingDown,
  },
]

export default function Page() {
  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.laranja500, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Growth</span>
      </header>

      <main style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.cardFg, margin: "0 0 4px" }}>Growth</h1>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Dashboards de mídia paga, experimentos e resultados de performance.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ARTIFACTS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 14, padding: "20px 24px",
                  boxShadow: T.elevSm, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 18,
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevMd; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevSm; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${T.laranja500}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <a.Icon size={20} color={T.laranja500} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: T.cardFg, margin: 0 }}>{a.title}</p>
                    {a.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: `${a.badgeColor}18`, color: a.badgeColor, padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>
                        {a.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
                </div>
                <span style={{ fontSize: 11, color: T.mutedFg, flexShrink: 0 }}>{a.tag}</span>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
