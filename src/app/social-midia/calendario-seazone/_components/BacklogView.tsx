"use client";

import { useState, useMemo, useRef } from 'react';
import { Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { T } from '@/lib/constants';
import { useContent } from '../_hooks/useContent';
import { EDITORIALS, getEditorial } from '../_lib/calendar-constants';
import { getStatusTag } from './ContentCard';
import type { EditorialSlug, ContentFormat } from '../_lib/types';

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'feed', label: 'Post Fixo' },
  { value: 'reels', label: 'Reels' },
  { value: 'stories', label: 'Story' },
];

export function BacklogView() {
  const { items, loading, updateItem, deleteItem } = useContent();
  const [filterEditorial, setFilterEditorial] = useState<EditorialSlug | ''>('');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveDate, setApproveDate] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const backlogItems = useMemo(() => {
    let filtered = items.filter((item) => item.status === 'ideia' && !item.scheduled_at);
    if (filterEditorial) {
      filtered = filtered.filter((item) => item.editoria === filterEditorial);
    }
    return filtered;
  }, [items, filterEditorial]);

  const handleApprove = async () => {
    if (!approveId || !approveDate) return;
    await updateItem(approveId, { status: 'ideia', scheduled_at: approveDate });
    setApproveId(null);
    setApproveDate('');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Backlog</h2>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Posts em aprovacao — priorize e aprove para agendar</p>
        </div>
        <select
          value={filterEditorial}
          onChange={(e) => setFilterEditorial(e.target.value as EditorialSlug | '')}
          style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.card, padding: '8px 16px', fontSize: 14 }}
        >
          <option value="">Todas editorias</option>
          {EDITORIALS.map((e) => (
            <option key={e.slug} value={e.slug}>{e.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: T.cinza400 }}>Carregando...</div>
      ) : backlogItems.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '80px 24px', textAlign: 'center', color: T.cinza400 }}>
          Nenhum post em aprovacao. Crie conteudo na aba "Criar Conteudo".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {backlogItems.map((item) => {
            const editorial = getEditorial(item.editoria);
            const formatLabel = FORMAT_OPTIONS.find((f) => f.value === item.formato)?.label ?? item.formato;
            const tag = getStatusTag(item.status);
            return (
              <div
                key={item.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.elevSm; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 4, color: T.cinza400 }}>
                      <ChevronUp size={16} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.cinza700 }}>-</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 4, color: T.cinza400 }}>
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: editorial?.color }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: T.mutedFg }}>{editorial?.name}</span>
                      <select
                        value={item.formato}
                        onChange={async (e) => { await updateItem(item.id, { formato: e.target.value as ContentFormat }); }}
                        style={{ background: T.cinza50, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: T.cinza600, cursor: 'pointer' }}
                      >
                        {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span style={{ background: tag.bg, color: tag.fg, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                        {tag.label}
                      </span>
                    </div>
                    {editingField === `title-${item.id}` ? (
                      <input
                        ref={(el) => { editRef.current = el; }}
                        autoFocus
                        defaultValue={item.title}
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val && val !== item.title) await updateItem(item.id, { title: val });
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        style={{ width: '100%', border: `1px solid ${T.primary}`, borderRadius: 8, padding: '4px 8px', fontSize: 14, fontWeight: 600, color: T.cardFg, outline: 'none' }}
                      />
                    ) : (
                      <h3
                        style={{ fontSize: 14, fontWeight: 600, color: T.cardFg, margin: 0, cursor: 'text' }}
                        onClick={() => setEditingField(`title-${item.id}`)}
                      >
                        {item.title}
                      </h3>
                    )}
                    {editingField === `notas-${item.id}` ? (
                      <textarea
                        ref={(el) => { editRef.current = el; }}
                        autoFocus
                        defaultValue={item.notas || ''}
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val !== (item.notas || '')) await updateItem(item.id, { notas: val || null });
                          setEditingField(null);
                        }}
                        rows={2}
                        style={{ width: '100%', border: `1px solid ${T.primary}`, borderRadius: 8, padding: '4px 8px', fontSize: 14, color: T.mutedFg, outline: 'none', resize: 'vertical', marginTop: 4 }}
                      />
                    ) : (
                      <p
                        style={{ fontSize: 14, color: T.mutedFg, margin: '4px 0 0', cursor: 'text', minHeight: 20 }}
                        onClick={() => setEditingField(`notas-${item.id}`)}
                      >
                        {item.notas || 'Adicionar descricao...'}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => { setApproveId(item.id); setApproveDate(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff',
                        border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Check size={14} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: T.cinza400 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {approveId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setApproveId(null)}
        >
          <div
            style={{ width: '100%', maxWidth: 380, background: T.card, borderRadius: 14, padding: 24, boxShadow: T.elevMd }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: 0 }}>Aprovar para calendario</h3>
              <button onClick={() => setApproveId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400 }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: T.mutedFg, margin: '0 0 16px' }}>
              Escolha a data de publicacao para aprovar este conteudo.
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: T.cinza700, marginBottom: 6 }}>Data de publicacao</label>
              <input
                type="date"
                value={approveDate}
                onChange={(e) => setApproveDate(e.target.value)}
                autoFocus
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleApprove}
                disabled={!approveDate}
                style={{
                  flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12,
                  padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: approveDate ? 1 : 0.4,
                }}
              >
                Aprovar para calendario
              </button>
              <button
                onClick={() => setApproveId(null)}
                style={{ flex: 1, background: 'none', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 0', fontSize: 14, fontWeight: 600, color: T.cinza600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
