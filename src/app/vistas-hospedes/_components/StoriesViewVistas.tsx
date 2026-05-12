'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, ExternalLink, X, Check, Pencil, GripVertical, MoreVertical, Copy } from 'lucide-react';
import { T } from '@/lib/constants';
import { useStoriesVistas, type StoryLink, type StoryVistas } from './useStoriesVistas';

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function displayDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

interface StoryModalProps {
  date: string;
  initial?: { name: string; links: StoryLink[] };
  onClose: () => void;
  onSave: (name: string, links: StoryLink[]) => Promise<void>;
  mode: 'add' | 'edit';
}

function StoryModal({ date, initial, onClose, onSave, mode }: StoryModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [links, setLinks] = useState<StoryLink[]>(
    initial?.links && initial.links.length > 0 ? initial.links : [{ name: '', url: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addLink = () => setLinks((prev) => [...prev, { name: '', url: '' }]);
  const updateLink = (i: number, field: keyof StoryLink, value: string) =>
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome do story é obrigatório'); return; }
    setSaving(true);
    try {
      const validLinks = links.filter((l) => l.url.trim());
      await onSave(name.trim(), validLinks);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '8px 12px', fontSize: 13, background: T.card,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: T.elevMd, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: 0 }}>{mode === 'add' ? 'Adicionar Story' : 'Editar Story'}</h3>
            <p style={{ fontSize: 12, color: T.mutedFg, margin: '2px 0 0' }}>{displayDateStr(date)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.mutedFg }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.cinza700, marginBottom: 6 }}>Nome do story *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pôr do sol no mirante" autoFocus
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: T.cardFg, background: T.muted, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.cinza700 }}>Links de direcionamento</label>
            <button onClick={addLink} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 10px', fontSize: 12, color: T.mutedFg, cursor: 'pointer' }}>
              <Plus size={12} /> Adicionar link
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {links.map((link, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: T.muted, borderRadius: 10, padding: 12, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg }}>Link {i + 1}</span>
                  {links.length > 1 && (
                    <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400, padding: 2 }}><X size={12} /></button>
                  )}
                </div>
                <input value={link.name} onChange={(e) => updateLink(i, 'name', e.target.value)} placeholder="Nome do link (ex: Reservas, WhatsApp)" style={inputStyle} />
                <input value={link.url} onChange={(e) => updateLink(i, 'url', e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, background: T.statusErrBg, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: T.destructive }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 500, color: T.mutedFg, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ background: T.primary, border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, color: T.primaryFg, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StoriesViewVistas() {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<StoryVistas | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [dragStoryId, setDragStoryId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const { stories, loading, createStory, togglePublished, deleteStory, updateStory } = useStoriesVistas(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalDays = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const getStoriesForDate = (dateStr: string) => stories.filter((s) => s.date === dateStr);

  const handleSaveStory = async (name: string, links: StoryLink[]) => {
    if (!addingDate) return;
    await createStory({ date: addingDate, name, links });
  };

  const handleEditStory = async (name: string, links: StoryLink[]) => {
    if (!editingStory) return;
    await updateStory(editingStory.id, { name, links });
  };

  const handleDuplicateStory = async (story: StoryVistas) => {
    await createStory({ date: story.date, name: story.name, links: story.links });
  };

  const handleDragStart = (e: React.DragEvent, storyId: string) => {
    setDragStoryId(storyId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', storyId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!dragStoryId) return;
    const story = stories.find(s => s.id === dragStoryId);
    if (!story || story.date === targetDate) { setDragStoryId(null); return; }
    await updateStory(dragStoryId, { date: targetDate } as any);
    if (selectedDate === story.date) setSelectedDate(targetDate);
    setDragStoryId(null);
  };

  const selectedStories = selectedDate ? getStoriesForDate(selectedDate) : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Stories</h2>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Planeje e acompanhe os stories — clique em um dia para ver o checklist, arraste para mover</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDate ? '1fr 360px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Calendário */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: T.mutedFg }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.cardFg }}>{MONTHS_PT[month]} {year}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: T.mutedFg }}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS_PT.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.mutedFg, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayOffset = i - firstDayOfMonth;
              const isCurrentMonth = dayOffset >= 0 && dayOffset < daysInMonth;
              const dayNum = isCurrentMonth ? dayOffset + 1 : dayOffset < 0 ? daysInPrevMonth + dayOffset + 1 : dayOffset - daysInMonth + 1;
              const dateStr = isCurrentMonth ? formatDate(year, month, dayNum) : null;
              const dayStories = dateStr ? getStoriesForDate(dateStr) : [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isDragOver = dateStr === dragOverDate;

              if (!isCurrentMonth) {
                return <div key={i} style={{ minHeight: 72, borderRadius: 10, background: 'transparent', border: '1px solid transparent', pointerEvents: 'none' }} />;
              }

              return (
                <div key={i}
                  onClick={() => dateStr && setSelectedDate(isSelected ? null : dateStr)}
                  onDragOver={(e) => dateStr && handleDragOver(e, dateStr)}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={(e) => dateStr && handleDrop(e, dateStr)}
                  style={{
                    minHeight: 72, borderRadius: 10, padding: '6px 8px', cursor: 'pointer',
                    background: isDragOver ? T.pendingBg : isSelected ? T.pendingBg : 'transparent',
                    border: isDragOver ? `2px dashed ${T.primary}` : isSelected ? `2px solid ${T.primary}` : isToday ? `2px solid ${T.primary}` : '1px solid transparent',
                    transition: 'all 0.12s', position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? T.primary : T.cardFg, marginBottom: 4, width: 22, height: 22, borderRadius: '50%', background: isToday ? T.pendingBg : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {dayNum}
                  </div>

                  {dayStories.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayStories.slice(0, 3).map((s) => (
                        <div key={s.id} draggable
                          onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, s.id); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 10, fontWeight: 500, color: s.published ? T.statusOkFg : T.cinza700, background: s.published ? T.statusOkBg : T.cinza50, borderRadius: 4, padding: '1px 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, cursor: 'grab', opacity: dragStoryId === s.id ? 0.4 : 1 }}>
                          <GripVertical size={7} style={{ flexShrink: 0 }} />
                          {s.published && <Check size={8} />}
                          {s.name}
                        </div>
                      ))}
                      {dayStories.length > 3 && <div style={{ fontSize: 10, color: T.mutedFg }}>+{dayStories.length - 3} mais</div>}
                    </div>
                  )}

                  {dateStr && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddingDate(dateStr); }}
                      title="Adicionar story"
                      style={{ position: 'absolute', bottom: 4, right: 4, background: T.primary, border: 'none', cursor: 'pointer', color: T.primaryFg, padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.1s' }}
                      className="cell-add-btn-vistas"
                    >
                      <Plus size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <style>{`div:hover > .cell-add-btn-vistas { opacity: 1 !important; }`}</style>
        </div>

        {/* Painel lateral */}
        {selectedDate && (() => {
          const total = selectedStories.length;
          const done = selectedStories.filter((s) => s.published).length;
          return (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: '0 0 2px' }}>{displayDateStr(selectedDate)}</h3>
                  {total > 0 && <span style={{ fontSize: 12, color: T.mutedFg }}>{done}/{total} publicados</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAddingDate(selectedDate)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.primary, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.primaryFg, cursor: 'pointer' }}>
                    <Plus size={14} /> Adicionar
                  </button>
                  <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.mutedFg }}><X size={16} /></button>
                </div>
              </div>

              {total > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 6, borderRadius: 3, background: T.cinza50, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: done === total ? T.statusOkFg : T.primary, width: `${(done / total) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {loading ? (
                <p style={{ fontSize: 13, color: T.mutedFg, textAlign: 'center', padding: '20px 0' }}>Carregando...</p>
              ) : selectedStories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 13, color: T.cinza400, margin: '0 0 12px' }}>Nenhum story para este dia</p>
                  <button onClick={() => setAddingDate(selectedDate)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.primary, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: T.primaryFg, cursor: 'pointer' }}>
                    <Plus size={14} /> Adicionar story
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedStories.map((story) => (
                    <div key={story.id} draggable onDragStart={(e) => handleDragStart(e, story.id)}
                      style={{ background: story.published ? T.statusOkBg : T.muted, borderRadius: 12, padding: '12px 14px', border: `1px solid ${story.published ? T.statusOkFg + '40' : T.border}`, transition: 'all 0.15s', opacity: dragStoryId === story.id ? 0.4 : 1, cursor: 'grab' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ color: T.cinza400, paddingTop: 2, flexShrink: 0 }}><GripVertical size={14} /></div>
                        <button onClick={() => togglePublished(story.id, !story.published)}
                          style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${story.published ? T.statusOkFg : T.border}`, background: story.published ? T.statusOkFg : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          {story.published && <Check size={12} color="white" strokeWidth={3} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: story.published ? T.statusOkFg : T.cardFg, textDecoration: story.published ? 'line-through' : 'none' }}>{story.name}</p>
                          {story.links && story.links.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {story.links.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.primary, textDecoration: 'none', background: T.card, borderRadius: 6, padding: '3px 8px', border: `1px solid ${T.border}`, width: 'fit-content' }}>
                                  <ExternalLink size={10} />
                                  {link.name || link.url.replace(/^https?:\/\//, '').substring(0, 35)}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Menu flutuante */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === story.id ? null : story.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400, padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                            <MoreVertical size={15} />
                          </button>
                          {menuOpenId === story.id && (
                            <>
                              <div onClick={() => setMenuOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                              <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 50, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: T.elevMd, minWidth: 150, overflow: 'hidden' }}>
                                <button onClick={() => { togglePublished(story.id, false); setMenuOpenId(null); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: !story.published ? T.pendingBg : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: !story.published ? T.primary : T.cardFg, textAlign: 'left' }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.cinza400, flexShrink: 0 }} /> Backlog
                                </button>
                                <button onClick={() => { togglePublished(story.id, true); setMenuOpenId(null); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: story.published ? T.statusOkBg : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: story.published ? T.statusOkFg : T.cardFg, textAlign: 'left' }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.statusOkFg, flexShrink: 0 }} /> Publicado
                                </button>
                                <div style={{ height: 1, background: T.border }} />
                                <button onClick={() => { handleDuplicateStory(story); setMenuOpenId(null); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.cardFg, textAlign: 'left' }}>
                                  <Copy size={13} /> Duplicar
                                </button>
                                <button onClick={() => { setEditingStory(story); setMenuOpenId(null); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.cardFg, textAlign: 'left' }}>
                                  <Pencil size={13} /> Editar
                                </button>
                                <button onClick={() => { deleteStory(story.id); setMenuOpenId(null); }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: T.destructive, textAlign: 'left' }}>
                                  <Trash2 size={13} /> Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {addingDate && (
        <StoryModal mode="add" date={addingDate} onClose={() => setAddingDate(null)} onSave={handleSaveStory} />
      )}
      {editingStory && (
        <StoryModal mode="edit" date={editingStory.date} initial={{ name: editingStory.name, links: editingStory.links }} onClose={() => setEditingStory(null)} onSave={handleEditStory} />
      )}
    </div>
  );
}
