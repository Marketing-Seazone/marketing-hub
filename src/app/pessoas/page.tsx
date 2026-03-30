"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { T } from "@/lib/constants"
import { ChevronLeft, Trophy, GitCommit, Plus } from "lucide-react"
import Link from "next/link"

const ADMIN_LOGIN = "Sampa-J"
const REPO = "Sampa-J/marketing-hub"

type Contributor = {
  login: string
  avatar_url: string
  html_url: string
  commits: number
  additions: number
  deletions: number
  activeWeeks: number
}

export default function PessoasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = session?.user?.login === ADMIN_LOGIN

  useEffect(() => {
    if (status === "loading") return
    if (!isAdmin) {
      router.replace("/")
    }
  }, [status, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    async function fetchContributors() {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/stats/contributors`, {
          headers: { Accept: "application/vnd.github.v3+json" },
        })

        // GitHub retorna 202 enquanto computa os stats — tenta novamente
        if (res.status === 202) {
          setTimeout(fetchContributors, 2000)
          return
        }

        const data = await res.json()
        if (!Array.isArray(data)) return

        const parsed: Contributor[] = data.map((c: {
          author: { login: string; avatar_url: string; html_url: string }
          total: number
          weeks: { a: number; d: number; c: number }[]
        }) => ({
          login: c.author.login,
          avatar_url: c.author.avatar_url,
          html_url: c.author.html_url,
          commits: c.total,
          additions: c.weeks.reduce((sum, w) => sum + w.a, 0),
          deletions: c.weeks.reduce((sum, w) => sum + w.d, 0),
          activeWeeks: c.weeks.filter(w => w.c > 0).length,
        }))

        const BOT_LOGINS = ["claude", "github-actions", "dependabot"]

        setContributors(
          parsed
            .filter(c => !BOT_LOGINS.some(bot => c.login.toLowerCase().includes(bot)))
            .sort((a, b) => b.commits - a.commits)
        )
      } finally {
        setLoading(false)
      }
    }

    fetchContributors()
  }, [isAdmin])

  if (status === "loading" || !isAdmin) return null

  const medalColors = ["#F59E0B", "#9CA3AF", "#CD7C34"]

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: T.card, borderBottom: `1px solid ${T.border}`,
        height: 52, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 12,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 6,
          color: T.mutedFg, textDecoration: "none", fontSize: 13, fontWeight: 500,
        }}>
          <ChevronLeft size={16} />
          Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>Pessoas</span>
        <span style={{
          marginLeft: 4,
          background: "#FEF3C7", color: "#92400E",
          fontSize: 10, fontWeight: 700,
          padding: "2px 6px", borderRadius: 4,
        }}>ADMIN</span>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.cardFg, margin: "0 0 4px" }}>
            Ranking de Contribuições
          </h1>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            Colaboradores do repositório · {REPO}
          </p>
        </div>

        {loading ? (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "40px 24px",
            textAlign: "center", color: T.mutedFg, fontSize: 13,
          }}>
            Carregando dados do GitHub...
          </div>
        ) : contributors.length === 0 ? (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "40px 24px",
            textAlign: "center", color: T.mutedFg, fontSize: 13,
          }}>
            Nenhum contribuidor encontrado.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contributors.map((c, i) => (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: T.card,
                  border: `1px solid ${i === 0 ? "#F59E0B" : T.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  textDecoration: "none",
                  boxShadow: i === 0 ? "0 0 0 1px #F59E0B20, 0 2px 8px #F59E0B10" : T.elevSm,
                }}
              >
                {/* Posição */}
                <div style={{
                  width: 32, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i < 3 ? (
                    <Trophy size={18} color={medalColors[i]} fill={medalColors[i]} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.mutedFg }}>
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  width={40}
                  height={40}
                  style={{ borderRadius: "50%", flexShrink: 0 }}
                />

                {/* Nome + stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
                    {c.login}
                  </p>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.mutedFg }}>
                      <GitCommit size={12} />
                      {c.commits} commit{c.commits !== 1 ? "s" : ""}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#16A34A" }}>
                      <Plus size={12} />
                      {c.additions.toLocaleString("pt-BR")} linhas
                    </span>
                    <span style={{ fontSize: 12, color: T.mutedFg }}>
                      {c.activeWeeks} sem. ativas
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: T.primary, margin: "0 0 2px" }}>
                    {(c.commits * 15 + c.activeWeeks * 25 + Math.floor(c.additions / 20)).toLocaleString("pt-BR")}
                  </p>
                  <p style={{ fontSize: 10, color: T.mutedFg, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    pts
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, color: T.mutedFg, marginTop: 20, textAlign: "center" }}>
          Score = commits × 15 + semanas ativas × 25 + linhas adicionadas ÷ 20
        </p>
      </main>
    </div>
  )
}
