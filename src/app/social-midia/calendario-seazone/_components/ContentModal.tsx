"use client";

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { T } from '@/lib/constants';
import { getEditorial, STATUSES } from '../_lib/calendar-constants';
import { getStatusTag } from './ContentCard';
import type { Post, ContentStatus, ContentFormat } from '../_lib/types';

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'feed', label: 'Post Fixo' },
  { value: 'reels', label: 'Reels' },
  { value: 'stories', label: 'Story' },
];

interface ContentModalProps {
  item: Post;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Post>) => Promise<Post>;
  onDelete: (id: string) => Promise<void>;
}

export function ContentModal({ item, onClose, onUpdate, onDelete }: ContentModalProps) {
  const editorial = getEditorial(item.editoria);
  const [title, setTitle] = useState(item.title);
  const [notas, setNotas] = useState(item.notas ?? '');
  const [tema, setTema] = useState(item.tema ?? '');
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [formato, setFormato] = useState<ContentFormat>(item.formato);
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_at ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, {
        title,
        notas: notas || null,
        tema: tema || null,
        status,
        formato,
        scheduled_at: scheduledDate || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este conteudo?')) {
      await onDelete(item.id);
      onClose();
    }
  };

  const tag = getStatusTag(item.status);

  const inputBase: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 14,
    color: T.cinza700,
    background: T.card,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: T.card,
          borderRadius: 14,
          padding: 24,
          boxShadow: T.elevMd,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: editorial?.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: T.mutedFg }}>{editorial?.name}</span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>
              {FORMAT_OPTIONS.find((f) => f.value === item.formato)?.label ?? item.formato}
            </span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>{item.canal}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400, flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Title — editable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo do post..."
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={{
              ...inputBase,
              fontSize: 17,
              fontWeight: 700,
              color: T.cardFg,
            }}
          />
          <span style={{ background: tag.bg, color: tag.fg, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {tag.label}
          </span>
        </div>

        {/* Tema — editable */}
        <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>Tema</p>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Adicionar tema..."
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={inputBase}
          />
        </div>

        {/* Notas — editable */}
        <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>Notas</p>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Adicionar notas..."
            rows={5}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={{
              ...inputBase,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Status / Formato / Data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Formato</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value as ContentFormat)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
            >
              {FORMAT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Data agendada</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {item.status === 'agendado' && (
            <button
              onClick={async () => {
                setSaving(true);
                try { await onUpdate(item.id, { status: 'publicado' }); onClose(); } finally { setSaving(false); }
              }}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: T.statusOkFg, color: T.primaryFg,
                border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', opacity: saving ? 0.5 : 1,
              }}
            >
              <CheckCircle size={16} />
              Marcar como publicado
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12,
              padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: 'none', border: `1px solid ${T.statusErrBg}`, color: T.destructive, borderRadius: 12,
              padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
