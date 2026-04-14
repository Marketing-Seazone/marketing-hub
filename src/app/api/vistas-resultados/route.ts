import { NextRequest, NextResponse } from "next/server"

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const KEY = "vistas:resultados"

export type ResultadoArea = "midia-paga" | "influenciadores" | "social" | "automacao"

export interface ResultadoEntry {
  id: string
  area: ResultadoArea
  date: string
  // Mídia Paga
  tema?: string
  criativos?: number
  campanha?: string
  // Influenciadores
  semana?: string
  qtdInflus?: number
  cuponsUsados?: number
  // Social
  qtdPosts?: number
  temaPost?: string
  formato?: string
  // Automação
  descricao?: string
  createdAt: string
}

async function kvGet(): Promise<ResultadoEntry[]> {
  if (!KV_URL || !KV_TOKEN) return []
  const res = await fetch(`${KV_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  })
  const data = await res.json()
  if (!data.result) return []
  try { return JSON.parse(data.result) } catch { return [] }
}

async function kvSet(entries: ResultadoEntry[]) {
  if (!KV_URL || !KV_TOKEN) return
  await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", KEY, JSON.stringify(entries)]),
  })
}

export async function GET() {
  return NextResponse.json(await kvGet())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const entries = await kvGet()
  const entry: ResultadoEntry = {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...body,
    createdAt: new Date().toISOString(),
  }
  entries.push(entry)
  await kvSet(entries)
  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const entries = (await kvGet()).filter(e => e.id !== id)
  await kvSet(entries)
  return NextResponse.json({ ok: true })
}
