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
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [formato, setFormato] = useState<ContentFormat>(item.formato);
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_at ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, { status, formato, scheduled_at: scheduledDate || null });
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

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 520, background: T.card, borderRadius: 14, padding: 24, boxShadow: T.elevMd }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: editorial?.color }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: T.mutedFg }}>{editorial?.name}</span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>
              {FORMAT_OPTIONS.find((f) => f.value === item.formato)?.label ?? item.formato}
            </span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>{item.canal}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: 0 }}>{item.title}</h2>
          <span style={{ background: tag.bg, color: tag.fg, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
            {tag.label}
          </span>
        </div>

        {item.tema && (
          <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 4px' }}>Tema</p>
            <p style={{ fontSize: 14, color: T.cinza700, margin: 0 }}>{item.tema}</p>
          </div>
        )}

        {item.notas && (
          <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 4px' }}>Notas</p>
            <p style={{ fontSize: 14, color: T.cinza700, margin: 0 }}>{item.notas}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
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
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
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
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {item.status === 'agendado' && (
            <button
              onClick={async () => {
                setSaving(true);
                try { await onUpdate(item.id, { status: 'publicado' }); onClose(); } finally { setSaving(false); }
              }}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff',
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
              background: 'none', border: `1px solid #FCA5A5`, color: T.destructive, borderRadius: 12,
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
