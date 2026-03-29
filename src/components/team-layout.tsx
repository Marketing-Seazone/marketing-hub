"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { T, TEAMS, type TeamId } from "@/lib/constants"

interface TeamLayoutProps {
  teamId: TeamId
  children?: React.ReactNode
}

export function TeamLayout({ teamId, children }: TeamLayoutProps) {
  const team = TEAMS.find(t => t.id === teamId)!

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 24px",
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: T.elevSm,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: team.color, flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>{team.label}</span>
      </header>

      {/* Content */}
      <main style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {children ?? (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "48px 32px",
            textAlign: "center", boxShadow: T.elevSm,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${team.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <span style={{ fontSize: 22 }}>🚧</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 6px" }}>
              Em construção
            </p>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
              Os artefatos do time de {team.label} aparecerão aqui.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
