'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { T } from '@/lib/constants';
import { VISTAS_EDITORIALS, VISTAS_STATUSES } from './vistas-calendar-constants';
import type { Post, EditorialSlug, ContentFormat, ContentStatus } from '@/app/social-midia/calendario-seazone/_lib/types';

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'reels', label: 'Reels' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'stories', label: 'Stories' },
  { value: 'feed', label: 'Post no Feed' },
];

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

interface QuickCreateModalVistasProps {
  date: string;
  onClose: () => void;
  onCreate: (item: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'published_at'>) => Promise<Post>;
}

export function QuickCreateModalVistas({ date, onClose, onCreate }: QuickCreateModalVistasProps) {
  const draftKey = `vistas_draft_new_${date}`;

  const [title, setTitle] = useState('');
  const [editoria, setEditoria] = useState<EditorialSlug>(VISTAS_EDITORIALS[0].slug);
  const [formato, setFormato] = useState<ContentFormat>('reels');
  const [canal, setCanal] = useState('instagram');
  const [status, setStatus] = useState<ContentStatus>('ideia');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  // Carrega rascunho salvo ao abrir
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.editoria) setEditoria(d.editoria);
        if (d.formato) setFormato(d.formato);
        if (d.canal) setCanal(d.canal);
        if (d.status) setStatus(d.status);
        if (d.notas) setNotas(d.notas);
        if (d.title) setHasDraft(true);
      }
    } catch {}
  }, []);

  // Salva rascunho automaticamente a cada mudança
  useEffect(() => {
    try {
      if (title || notas) {
        localStorage.setItem(draftKey, JSON.stringify({ title, editoria, formato, canal, status, notas }));
      }
    } catch {}
  }, [title, editoria, formato, canal, status, notas]);

  const handleSave = async () => {
    if (!title.trim()) { setError('O título é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      await onCreate({
        title: title.trim(),
        editoria, formato, canal, status,
        scheduled_at: date,
        tema: null, estrutura: null, copy: null,
        notas: notas.trim() || null,
      });
      localStorage.removeItem(draftKey);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setTitle('');
    setEditoria(VISTAS_EDITORIALS[0].slug);
    setFormato('reels');
    setCanal('instagram');
    setStatus('ideia');
    setNotas('');
    setHasDraft(false);
  };

  const inputBase: React.CSSProperties = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '8px 10px', fontSize: 14, color: T.cinza700, background: T.card,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: T.cinza600, marginBottom: 4,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, background: T.card, borderRadius: 14, padding: 24, boxShadow: T.elevMd }} onClick={(e) => e.stopPropagation()}>

        {/* Banner de rascunho */}
        {hasDraft && (
          <div style={{ background: `${T.laranja500}15`, border: `1px solid ${T.laranja500}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: T.laranja500, fontWeight: 600 }}>📝 Rascunho não salvo restaurado</span>
            <button onClick={handleDiscardDraft} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.laranja500, fontWeight: 500, textDecoration: 'underline' }}>
              Descartar
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: 0 }}>Novo Post</h2>
            <p style={{ fontSize: 12, color: T.mutedFg, margin: '2px 0 0' }}>{date}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400 }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Título *</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Pôr do sol na varanda da cabana..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={inputBase} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Editoria</label>
          <select value={editoria} onChange={(e) => setEditoria(e.target.value as EditorialSlug)} style={inputBase}>
            {VISTAS_EDITORIALS.map((e) => (
              <option key={e.slug} value={e.slug}>{e.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Formato</label>
            <select value={formato} onChange={(e) => setFormato(e.target.value as ContentFormat)} style={inputBase}>
              {FORMAT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Canal</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value)} style={inputBase}>
              {CHANNEL_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} style={inputBase}>
            {VISTAS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Briefing, referências, observações..."
            rows={3}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {error && <p style={{ color: T.destructive, fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: T.mutedFg }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Salvando...' : 'Criar Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
