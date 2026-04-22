import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

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

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSection(row: any): PlanoSection {
  return {
    id: row.id,
    label: row.label,
    parentId: row.parent_id ?? null,
    order: row.order,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTask(row: any): PlanoTask {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? null,
    deadline: row.deadline ?? null,
    link: row.link ?? null,
    status: row.status,
    sectionId: row.section_id,
    createdAt: row.created_at,
  }
}

export async function GET() {
  const supabase = getClient()

  const { data: sectionsData } = await supabase
    .from("plano_sections")
    .select("*")
    .order("order")

  let sections = (sectionsData ?? []).map(toSection)

  if (sections.length === 0) {
    await supabase.from("plano_sections").insert(
      DEFAULT_SECTIONS.map(s => ({
        id: s.id,
        label: s.label,
        parent_id: s.parentId,
        order: s.order,
      }))
    )
    sections = DEFAULT_SECTIONS
  }

  const { data: tasksData } = await supabase
    .from("plano_tasks")
    .select("*")
    .order("created_at")

  return NextResponse.json({ sections, tasks: (tasksData ?? []).map(toTask) })
}

export async function POST(req: NextRequest) {
  const supabase = getClient()
  const body = await req.json()
  const { action } = body

  if (action === "addSection") {
    const { count } = await supabase
      .from("plano_sections")
      .select("*", { count: "exact", head: true })
    const row = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: (body.label as string)?.trim() || "Nova sub-área",
      parent_id: (body.parentId as string) || null,
      order: count ?? 0,
    }
    await supabase.from("plano_sections").insert(row)
    return NextResponse.json(toSection(row), { status: 201 })
  }

  if (action === "addTask") {
    const row = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: (body.title as string)?.trim() || "",
      notes: (body.notes as string) || null,
      deadline: (body.deadline as string) || null,
      link: (body.link as string) || null,
      status: (body.status as PlanoTask["status"]) || "pendente",
      section_id: body.sectionId as string,
      created_at: new Date().toISOString(),
    }
    await supabase.from("plano_tasks").insert(row)
    return NextResponse.json(toTask(row), { status: 201 })
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const supabase = getClient()
  const body = await req.json()
  const { action, id } = body as { action: string; id: string }

  if (action === "updateSection") {
    const { data } = await supabase
      .from("plano_sections")
      .update({ label: (body.label as string).trim() })
      .eq("id", id)
      .select()
      .single()
    if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json(toSection(data))
  }

  if (action === "updateTask") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { action: _a, id: _i, sectionId, ...rest } = body
    const updates: Record<string, unknown> = { ...rest }
    if (sectionId) updates.section_id = sectionId
    const { data } = await supabase
      .from("plano_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json(toTask(data))
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = getClient()
  const body = await req.json()
  const { action, id } = body as { action: string; id: string }

  if (action === "deleteSection") {
    await supabase.from("plano_sections").delete().eq("id", id)
    return NextResponse.json({ ok: true })
  }

  if (action === "deleteTask") {
    await supabase.from("plano_tasks").delete().eq("id", id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Action obrigatória" }, { status: 400 })
}
