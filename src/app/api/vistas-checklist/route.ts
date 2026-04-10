import { NextRequest, NextResponse } from "next/server"

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const KEY = "vistas:checklist"

export interface Task {
  id: string
  title: string
  done: boolean
  deadline: string | null
  link: string | null
  notes: string | null
  section: string | null   // "midia-paga" | "website" | "geral"
  isWarning: boolean
  createdAt: string
}

async function kvGet(): Promise<Task[]> {
  if (!KV_URL || !KV_TOKEN) return []
  const res = await fetch(`${KV_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  })
  const data = await res.json()
  if (!data.result) return []
  try { return JSON.parse(data.result) } catch { return [] }
}

async function kvSet(tasks: Task[]) {
  if (!KV_URL || !KV_TOKEN) return
  await fetch(`${KV_URL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", KEY, JSON.stringify(tasks)]),
  })
}

export async function GET() {
  const tasks = await kvGet()
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const { title, deadline, link, notes, section, isWarning } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
  const tasks = await kvGet()
  const task: Task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    done: false,
    deadline: deadline || null,
    link: link || null,
    notes: notes || null,
    section: section || null,
    isWarning: isWarning || false,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  await kvSet(tasks)
  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  const tasks = await kvGet()
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
  tasks[idx] = { ...tasks[idx], ...updates }
  await kvSet(tasks)
  return NextResponse.json(tasks[idx])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const tasks = (await kvGet()).filter(t => t.id !== id)
  await kvSet(tasks)
  return NextResponse.json({ ok: true })
}
