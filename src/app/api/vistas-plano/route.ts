import { NextRequest, NextResponse } from "next/server"

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const KEY_SECTIONS = "vistas:plano:sections"
const KEY_TASKS = "vistas:plano:tasks"

export interface PlanoSection {
  id: string
  label: string
  parentId: string | null
  order: number
}

export interface PlanoTask {
  id: string
  title: string
  notes: string | null
  deadline: string | null
  link: string | null
  status: "pendente" | "em-andamento" | "concluido" | "bloqueado"
  sectionId: string
  createdAt: string
}

const DEFAULT_SECTIONS: PlanoSection[] = [
  { id: "midia-paga", label: "Mídia Paga", parentId: null, order: 0 },
  { id: "website-tech", label: "Website / Tech", parentId: null, order: 1 },
  { id: "social", label: "Social", parentId: null, order: 2 },
  { id: "influenciadores", label: "Influenciadores", parentId: "social", order: 3 },
  { id: "automacao", label: "Automação", parentId: null, order: 4 },
]

async function kvGet<T>(key: string): Promise<T | null> {
  if (!KV_URL || !KV_TOKEN) return null
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  })
  const data = await res.json()
  if (!data.result) return null
  try { return JSON.parse(data.result) } catch { return null }
}

async function kvSet(key: string, value: unknown) {
  if (!KV_URL || !KV_TOKEN) return
  await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, JSON.stringify(value)]),
  })
}

export async function GET() {
  let sections = await kvGet<PlanoSection[]>(KEY_SECTIONS)
  if (!sections) {
    sections = DEFAULT_SECTIONS
    await kvSet(KEY_SECTIONS, sections)
  }
  const tasks = (await kvGet<PlanoTask[]>(KEY_TASKS)) ?? []
  return NextResponse.json({ sections, tasks })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === "addSection") {
    const sections = (await kvGet<PlanoSection[]>(KEY_SECTIONS)) ?? DEFAULT_SECTIONS
    const section: PlanoSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: (body.label as string)?.trim() || "Nova sub-área",
      parentId: (body.parentId as string) || null,
      order: sections.length,
    }
    sections.push(section)
    await kvSet(KEY_SECTIONS, sections)
    return NextResponse.json(section, { status: 201 })
  }

  if (action === "addTask") {
    const tasks = (await kvGet<PlanoTask[]>(KEY_TASKS)) ?? []
    const task: PlanoTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: (body.title as string)?.trim() || "",
      notes: (body.notes as string) || null,
      deadline: (body.deadline as string) || null,
      link: (body.link as string) || null,
      status: (body.status as PlanoTask["status"]) || "pendente",
      sectionId: body.sectionId as string,
      createdAt: new Date().toISOString(),
    }
    tasks.push(task)
    await kvSet(KEY_TASKS, tasks)
    return NextResponse.json(task, { status: 201 })
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { action, id } = body as { action: string; id: string }

  if (action === "updateSection") {
    const sections = (await kvGet<PlanoSection[]>(KEY_SECTIONS)) ?? DEFAULT_SECTIONS
    const idx = sections.findIndex(s => s.id === id)
    if (idx === -1) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    if (body.label) sections[idx] = { ...sections[idx], label: (body.label as string).trim() }
    await kvSet(KEY_SECTIONS, sections)
    return NextResponse.json(sections[idx])
  }

  if (action === "updateTask") {
    const tasks = (await kvGet<PlanoTask[]>(KEY_TASKS)) ?? []
    const idx = tasks.findIndex(t => t.id === id)
    if (idx === -1) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { action: _a, id: _i, ...updates } = body
    tasks[idx] = { ...tasks[idx], ...updates }
    await kvSet(KEY_TASKS, tasks)
    return NextResponse.json(tasks[idx])
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { action, id } = body as { action: string; id: string }

  if (action === "deleteSection") {
    const sections = (await kvGet<PlanoSection[]>(KEY_SECTIONS)) ?? []
    await kvSet(KEY_SECTIONS, sections.filter(s => s.id !== id))
    const tasks = (await kvGet<PlanoTask[]>(KEY_TASKS)) ?? []
    await kvSet(KEY_TASKS, tasks.filter(t => t.sectionId !== id))
    return NextResponse.json({ ok: true })
  }

  if (action === "deleteTask") {
    const tasks = (await kvGet<PlanoTask[]>(KEY_TASKS)) ?? []
    await kvSet(KEY_TASKS, tasks.filter(t => t.id !== id))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}
