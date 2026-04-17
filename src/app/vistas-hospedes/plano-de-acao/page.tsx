"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronLeft, Plus, Trash2, Check, Calendar, Link2, Pencil, X, Loader2,
} from "lucide-react"
import { T } from "@/lib/constants"
import type { PlanoSection, PlanoTask } from "@/app/api/vistas-plano/route"

const COR = "#7C3AED"

/* ── Status helpers ── */
type Status = PlanoTask["status"]

const STATUS_LABELS: Record<Status, string> = {
  pendente: "Pendente",
  "em-andamento": "Em andamento",
  concluido: "Concluído",
  bloqueado: "Bloqueado",
}
const STATUS_COLORS: Record<Status, { bg: string; fg: string; border: string }> = {
  pendente:      { bg: "#f3f4f6", fg: "#6b7280", border: "#d1d5db" },
  "em-andamento":{ bg: "#fef3c7", fg: "#92400e", border: "#fcd34d" },
  concluido:     { bg: "#d1fae5", fg: "#065f46", border: "#6ee7b7" },
  bloqueado:     { bg: "#fee2e2", fg: "#991b1b", border: "#fca5a5" },
}

function StatusBadge({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const sc = STATUS_COLORS[status]
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value as Status)}
      style={{
        padding: "3px 24px 3px 8px",
        borderRadius: 20,
        border: `1px solid ${sc.border}`,
        background: sc.bg,
        color: sc.fg,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: T.font,
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        flexShrink: 0,
      }}
    >
      {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

/* ── Task form ── */
interface TaskForm { title: string; notes: string; deadline: string; link: string; status: Status }
const EMPTY_TASK: TaskForm = { title: "", notes: "", deadline: "", link: "", status: "pendente" }

const inputStyle = {
  padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
  fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted,
  outline: "none", width: "100%",
}

/* ── Section Card ── */
function SectionCard({
  section, tasks, allSections,
  onAddTask, onUpdateTask, onDeleteTask,
  onRenameSection, onDeleteSection,
  nested = false,
}: {
  section: PlanoSection
  tasks: PlanoTask[]
  allSections: PlanoSection[]
  onAddTask: (sectionId: string, form: TaskForm) => Promise<void>
  onUpdateTask: (id: string, updates: Partial<PlanoTask>) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onRenameSection: (id: string, label: string) => Promise<void>
  onDeleteSection: (id: string) => Promise<void>
  nested?: boolean
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(section.label)
  const [addingTask, setAddingTask] = useState(false)
  const [taskForm, setTaskForm] = useState<TaskForm>(EMPTY_TASK)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TaskForm>(EMPTY_TASK)
  const [saving, setSaving] = useState(false)

  const subsections = allSections.filter(s => s.parentId === section.id).sort((a, b) => a.order - b.order)

  const sectionTasks = tasks
    .filter(t => t.sectionId === section.id)
    .sort((a, b) => {
      const order: Record<Status, number> = { "em-andamento": 0, pendente: 1, bloqueado: 2, concluido: 3 }
      if (a.status !== b.status) return order[a.status] - order[b.status]
      return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")
    })

  const doneCount = sectionTasks.filter(t => t.status === "concluido").length

  async function saveNewTask() {
    if (!taskForm.title.trim()) return
    setSaving(true)
    await onAddTask(section.id, taskForm)
    setTaskForm(EMPTY_TASK)
    setAddingTask(false)
    setSaving(false)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await onUpdateTask(id, editForm)
    setEditId(null)
    setSaving(false)
  }

  async function saveName() {
    if (nameVal.trim() && nameVal.trim() !== section.label) {
      await onRenameSection(section.id, nameVal.trim())
    }
    setEditingName(false)
  }

  const borderColor = nested ? `${COR}40` : COR

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 12,
      padding: nested ? "14px 16px" : "18px 20px",
      boxShadow: T.elevSm,
      marginLeft: nested ? 20 : 0,
    }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setNameVal(section.label); setEditingName(false) } }}
            onBlur={saveName}
            style={{ ...inputStyle, fontSize: 15, fontWeight: 700, flex: 1, maxWidth: 300 }}
          />
        ) : (
          <span style={{ fontSize: nested ? 13 : 15, fontWeight: 700, color: T.cardFg, flex: 1 }}>
            {section.label}
          </span>
        )}
        <span style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>
          {doneCount}/{sectionTasks.length}
        </span>
        {!editingName && (
          <button onClick={() => setEditingName(true)} style={{
            padding: "3px 6px", background: "transparent", color: T.mutedFg,
            border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer",
            display: "flex", alignItems: "center",
          }}>
            <Pencil size={11} />
          </button>
        )}
        <button onClick={() => onDeleteSection(section.id)} style={{
          padding: "3px 6px", background: "transparent", color: T.destructive,
          border: `1px solid ${T.destructive}40`, borderRadius: 5, cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <Trash2 size={11} />
        </button>
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {sectionTasks.map(task => {
          if (editId === task.id) {
            return (
              <div key={task.id} style={{
                padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                background: `${COR}05`, borderRadius: 6,
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <input
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    autoFocus
                    placeholder="Tarefa"
                    style={{ ...inputStyle, flex: "1 1 200px" }}
                  />
                  <input
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observação"
                    style={{ ...inputStyle, flex: "1 1 180px" }}
                  />
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    style={{ ...inputStyle, width: "auto" }}
                  />
                  <input
                    value={editForm.link}
                    onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))}
                    placeholder="Link (opcional)"
                    style={{ ...inputStyle, flex: "1 1 160px" }}
                  />
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Status }))}
                    style={{ ...inputStyle, width: "auto" }}
                  >
                    {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => saveEdit(task.id)} disabled={saving} style={{
                    padding: "5px 14px", background: COR, color: "#fff", border: "none",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                  }}>
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                  <button onClick={() => setEditId(null)} style={{
                    padding: "5px 12px", background: "transparent", color: T.mutedFg,
                    border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font,
                  }}>
                    Cancelar
                  </button>
                  <button onClick={() => onDeleteTask(task.id)} style={{
                    marginLeft: "auto", padding: "5px 8px", background: "transparent",
                    color: T.destructive, border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={task.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                opacity: task.status === "concluido" ? 0.55 : 1,
              }}
            >
              {/* Status */}
              <div style={{ flexShrink: 0, paddingTop: 1 }}>
                <StatusBadge
                  status={task.status}
                  onChange={s => onUpdateTask(task.id, { status: s })}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 13, color: T.cardFg, fontWeight: 500,
                    textDecoration: task.status === "concluido" ? "line-through" : "none",
                  }}>
                    {task.title}
                  </span>
                  {task.link && (
                    <a href={task.link} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: 11, color: COR, textDecoration: "none",
                    }}>
                      <Link2 size={10} /> link
                    </a>
                  )}
                </div>
                {task.notes && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: T.mutedFg }}>{task.notes}</p>
                )}
              </div>

              {/* Deadline */}
              {task.deadline && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 3,
                  fontSize: 11, color: T.mutedFg, whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  <Calendar size={10} /> {fmtDate(task.deadline)}
                </span>
              )}

              {/* Edit */}
              <button
                onClick={() => {
                  setEditId(task.id)
                  setEditForm({ title: task.title, notes: task.notes ?? "", deadline: task.deadline ?? "", link: task.link ?? "", status: task.status })
                }}
                style={{
                  padding: "3px 6px", background: "transparent", color: T.mutedFg,
                  border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer",
                  display: "flex", alignItems: "center", flexShrink: 0,
                }}
              >
                <Pencil size={11} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add task form */}
      {addingTask ? (
        <div style={{ padding: "12px 0 4px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <input
              value={taskForm.title}
              onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
              onKeyDown={e => e.key === "Enter" && saveNewTask()}
              placeholder="Nome da tarefa..."
              style={{ ...inputStyle, flex: "1 1 200px" }}
            />
            <input
              value={taskForm.notes}
              onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Observação (opcional)"
              style={{ ...inputStyle, flex: "1 1 180px" }}
            />
            <input
              type="date"
              value={taskForm.deadline}
              onChange={e => setTaskForm(f => ({ ...f, deadline: e.target.value }))}
              style={{ ...inputStyle, width: "auto" }}
            />
            <input
              value={taskForm.link}
              onChange={e => setTaskForm(f => ({ ...f, link: e.target.value }))}
              placeholder="Link (opcional)"
              style={{ ...inputStyle, flex: "1 1 140px" }}
            />
            <select
              value={taskForm.status}
              onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as Status }))}
              style={{ ...inputStyle, width: "auto" }}
            >
              {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveNewTask} disabled={saving || !taskForm.title.trim()} style={{
              padding: "6px 14px", background: COR, color: "#fff", border: "none",
              borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              opacity: !taskForm.title.trim() ? 0.5 : 1,
            }}>
              {saving ? "Salvando..." : "Adicionar"}
            </button>
            <button onClick={() => { setAddingTask(false); setTaskForm(EMPTY_TASK) }} style={{
              padding: "6px 12px", background: "transparent", color: T.mutedFg,
              border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font,
            }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAddingTask(true); setTaskForm(EMPTY_TASK); setEditId(null) }}
          style={{
            display: "flex", alignItems: "center", gap: 5, marginTop: sectionTasks.length > 0 ? 10 : 4,
            background: "transparent", border: "none", cursor: "pointer",
            color: T.mutedFg, fontSize: 12, fontFamily: T.font, padding: "4px 0",
          }}
        >
          <Plus size={12} /> Adicionar tarefa
        </button>
      )}

      {/* Sub-sections (children of this section) */}
      {subsections.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Sub-áreas
          </div>
          {subsections.map(sub => (
            <SectionCard
              key={sub.id}
              section={sub}
              tasks={tasks}
              allSections={allSections}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              nested
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function PlanoDeAcaoPage() {
  const [sections, setSections] = useState<PlanoSection[]>([])
  const [tasks, setTasks] = useState<PlanoTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionLabel, setNewSectionLabel] = useState("")
  const [newSectionParent, setNewSectionParent] = useState("")
  const [savingSection, setSavingSection] = useState(false)

  useEffect(() => {
    fetch("/api/vistas-plano")
      .then(r => r.json())
      .then(({ sections: s, tasks: t }) => {
        setSections(s ?? [])
        setTasks(t ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function addTask(sectionId: string, form: TaskForm) {
    const res = await fetch("/api/vistas-plano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addTask", sectionId, ...form }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
  }

  async function updateTask(id: string, updates: Partial<PlanoTask>) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await fetch("/api/vistas-plano", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateTask", id, ...updates }),
    })
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch("/api/vistas-plano", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteTask", id }),
    })
  }

  async function renameSection(id: string, label: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, label } : s))
    await fetch("/api/vistas-plano", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateSection", id, label }),
    })
  }

  async function deleteSection(id: string) {
    if (!confirm("Excluir esta sub-área e todas as suas tarefas?")) return
    setSections(prev => prev.filter(s => s.id !== id && s.parentId !== id))
    setTasks(prev => prev.filter(t => t.sectionId !== id))
    await fetch("/api/vistas-plano", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteSection", id }),
    })
  }

  async function addSection() {
    if (!newSectionLabel.trim()) return
    setSavingSection(true)
    const res = await fetch("/api/vistas-plano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addSection",
        label: newSectionLabel.trim(),
        parentId: newSectionParent || null,
      }),
    })
    const sec = await res.json()
    setSections(prev => [...prev, sec])
    setNewSectionLabel("")
    setNewSectionParent("")
    setShowAddSection(false)
    setSavingSection(false)
  }

  const rootSections = sections.filter(s => s.parentId === null).sort((a, b) => a.order - b.order)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === "concluido").length
  const inProgressTasks = tasks.filter(t => t.status === "em-andamento").length

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/vistas-hospedes" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} /> Vistas de Anitá
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Plano de Ação — To do&apos;s</span>
      </header>

      <main style={{ padding: "24px 24px 64px", maxWidth: 900, margin: "0 auto" }}>

        {/* KPI strip */}
        {!loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "Total de tarefas", value: String(totalTasks), color: T.cardFg },
              { label: "Em andamento", value: String(inProgressTasks), color: "#f59e0b" },
              { label: "Concluídas", value: `${doneTasks}/${totalTasks}`, color: "#10b981" },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: "10px 16px", boxShadow: T.elevSm, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600 }}>{kpi.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: kpi.color }}>{kpi.value}</span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.mutedFg, padding: 32 }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            Carregando plano...
          </div>
        ) : (
          <>
            {/* Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {rootSections.map(section => (
                <SectionCard
                  key={section.id}
                  section={section}
                  tasks={tasks}
                  allSections={sections}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onRenameSection={renameSection}
                  onDeleteSection={deleteSection}
                />
              ))}
            </div>

            {/* Add section */}
            <div style={{ marginTop: 20 }}>
              {showAddSection ? (
                <div style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: "16px 20px", boxShadow: T.elevSm,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.cardFg, margin: "0 0 12px" }}>
                    Nova sub-área
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <input
                      value={newSectionLabel}
                      onChange={e => setNewSectionLabel(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === "Enter" && addSection()}
                      placeholder="Nome da sub-área (ex: Email Marketing)"
                      style={{ ...inputStyle, flex: "1 1 200px" }}
                    />
                    <select
                      value={newSectionParent}
                      onChange={e => setNewSectionParent(e.target.value)}
                      style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}
                    >
                      <option value="">Sem parent (raiz)</option>
                      {rootSections.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addSection} disabled={savingSection || !newSectionLabel.trim()} style={{
                      padding: "6px 14px", background: COR, color: "#fff", border: "none",
                      borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                      opacity: !newSectionLabel.trim() ? 0.5 : 1,
                    }}>
                      {savingSection ? "Criando..." : "Criar sub-área"}
                    </button>
                    <button onClick={() => { setShowAddSection(false); setNewSectionLabel("") }} style={{
                      padding: "6px 12px", background: "transparent", color: T.mutedFg,
                      border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSection(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", background: T.card, border: `1px dashed ${T.border}`,
                    borderRadius: 10, cursor: "pointer", color: T.mutedFg,
                    fontSize: 13, fontFamily: T.font, fontWeight: 500,
                  }}
                >
                  <Plus size={14} /> Nova sub-área
                </button>
              )}
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap",
              padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600 }}>Status:</span>
              {(Object.keys(STATUS_LABELS) as Status[]).map(s => {
                const sc = STATUS_COLORS[s]
                return (
                  <span key={s} style={{
                    display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                  }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 20, background: sc.bg,
                      color: sc.fg, border: `1px solid ${sc.border}`, fontWeight: 700, fontSize: 10,
                    }}>{STATUS_LABELS[s]}</span>
                  </span>
                )
              })}
              <span style={{ fontSize: 11, color: T.mutedFg, marginLeft: "auto" }}>
                <Check size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                Clique no status para atualizar diretamente
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
