"use client"

import Link from "next/link"
import { ChevronLeft, BarChart2, FileText, ArrowRight } from "lucide-react"
import { T } from "@/lib/constants"

const ARTEFATOS = [
  {
    label: "PMM Serviços",
    tag: "Posicionamento",
    desc: "Go-to-market, posicionamento de produto, decks e materiais de lançamento SZS",
    href: "/product-marketing/szs/pmm",
    Icon: FileText,
    color: T.primary,
  },
  {
    label: "Criativos SZS",
    tag: "Mídia Paga",
    desc: "Performance de anúncios e campanhas Proprietários — Meta Ads com análise de IA",
    href: "/szs-ads",
    Icon: BarChart2,
    color: T.roxo600,
  },
]

const SeazoneIcon = () => (
  <svg width="22" height="23" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M46.2131 15.1755L37.6794 10.1673C37.6977 10.0485 37.7528 9.9388 37.7528 9.81999V2.2665C37.7528 1.01444 36.7342 0 35.4771 0H30.9257C29.6686 0 28.6501 1.01444 28.6501 2.2665V4.90314L25.5531 3.09816C24.296 2.34876 22.6397 2.4767 21.4744 3.33578L21.4147 3.35863L1.78243 14.7003C0.144493 15.6736-0.539125 17.9355 0.479423 19.6308C1.53468 21.3901 3.86081 21.8654 5.49416 20.892L6.6687 20.2157C5.27852 22.9255 4.41138 25.9871 4.41138 29.3275C4.41138 34.6099 6.44848 39.8146 10.2107 43.5662C11.688 45.0422 13.4086 46.276 15.2942 47.1853C16.7441 47.8845 18.2765 48.4694 19.8685 48.7618C21.979 49.1457 24.1629 48.9492 26.2964 48.9537C28.5996 48.9537 30.9074 48.9583 33.2106 48.9629C35.2982 48.9674 37.3857 48.9766 39.4962 48.9811C40.0239 48.9811 40.5423 48.8441 41.0103 48.6064C41.6113 48.3003 41.9692 47.9667 42.3638 47.4412C42.8134 46.8472 43.1254 46.1297 43.1254 45.3621V21.582C44.6899 22.1441 46.5894 21.6552 47.5207 20.1015C48.5393 18.4062 47.8557 16.1443 46.2131 15.171M36.3947 29.7022C36.3947 36.9312 31.4809 42.8077 24.0712 42.8077C16.6615 42.8077 11.2155 36.5565 11.2155 29.3275C11.2155 22.0984 16.6615 16.0757 24.0712 16.0757C31.4809 16.0757 36.3947 21.6506 36.3947 28.802V29.7067V29.7022Z" fill="rgba(255,255,255,0.9)"/>
  </svg>
)

export default function PmmSzsHubPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Topbar */}
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
          <ChevronLeft size={14} /> Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>PMM | SZS</span>
      </header>

      <main style={{ padding: "28px 24px 64px", maxWidth: 860, margin: "0 auto" }}>

        {/* ── Hero banner ── */}
        <div style={{
          background: `linear-gradient(135deg, ${T.cinza800} 0%, #0a1628 100%)`,
          borderRadius: 18, padding: "36px 40px",
          marginBottom: 28, boxShadow: T.elevMd,
          display: "flex", flexDirection: "column", gap: 20,
          position: "relative", overflow: "hidden",
        }}>
          {/* decoração de fundo */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${T.primary}25 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -30, left: "40%",
            width: 160, height: 160, borderRadius: "50%",
            background: `radial-gradient(circle, ${T.roxo600}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SeazoneIcon />
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
            }}>
              Product Marketing · Serviços
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.15 }}>
              PMM | SZS
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.65, maxWidth: 440 }}>
              Vertical de Serviços — estratégia de produto, posicionamento e performance
              de mídia paga para captação de Proprietários.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Go-to-market", "Meta Ads", "Proprietários", "SZS"].map(tag => (
              <span key={tag} style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px",
                borderRadius: 6, background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em",
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* ── Sub-cards ── */}
        <p style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: T.cinza400, margin: "0 0 12px",
        }}>
          Artefatos
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {ARTEFATOS.map(({ label, tag, desc, href, Icon, color }) => (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderTop: `3px solid ${color}`,
                  borderRadius: 14, padding: "22px 22px 20px",
                  boxShadow: T.elevSm, cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  display: "flex", flexDirection: "column", gap: 14,
                  height: "100%",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = T.elevMd
                  el.style.transform = "translateY(-3px)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = T.elevSm
                  el.style.transform = "translateY(0)"
                }}
              >
                {/* icon + tag */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "3px 8px",
                    borderRadius: 5, background: `${color}12`, color,
                  }}>
                    {tag}
                  </span>
                </div>

                {/* texto */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 6px" }}>{label}</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>

                {/* footer */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 600, color,
                  borderTop: `1px solid ${T.border}`, paddingTop: 12,
                }}>
                  Acessar <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
