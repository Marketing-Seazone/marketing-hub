'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { T } from '@/lib/constants';
import { getVistaEditorial, VISTAS_STATUSES } from './vistas-calendar-constants';
import { getStatusTagVistas } from './ContentCardVistas';
import type { Post, ContentStatus, ContentFormat } from '@/app/social-midia/calendario-seazone/_lib/types';

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'feed', label: 'Post Fixo' },
  { value: 'reels', label: 'Reels' },
  { value: 'stories', label: 'Story' },
];

interface ContentModalVistasProps {
  item: Post;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Post>) => Promise<Post>;
  onDelete: (id: string) => Promise<void>;
}

export function ContentModalVistas({ item, onClose, onUpdate, onDelete }: ContentModalVistasProps) {
  const editorial = getVistaEditorial(item.editoria);
  const [title, setTitle] = useState(item.title);
  const [notas, setNotas] = useState(item.notas ?? '');
  const [tema, setTema] = useState(item.tema ?? '');
  const [copy, setCopy] = useState(item.copy ?? '');
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [formato, setFormato] = useState<ContentFormat>(item.formato);
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_at ?? '');
  const [saving, setSaving] = useState(false);

  const [copyPanelOpen, setCopyPanelOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [copyError, setCopyError] = useState('');
  const [copySaved, setCopySaved] = useState(false);

// Salva rascunho no localStorage
const draftKey = `vistas_draft_post_${item.id}`

useEffect(() => {
  localStorage.setItem(draftKey, JSON.stringify({ title, notas, tema, copy, status, formato, scheduledDate }))
}, [title, notas, tema, copy, status, formato, scheduledDate])

// Carrega rascunho salvo
useEffect(() => {
  try {
    const saved = localStorage.getItem(draftKey)
    if (saved) {
      const d = JSON.parse(saved)
      if (d.title !== undefined) setTitle(d.title)
      if (d.notas !== undefined) setNotas(d.notas)
      if (d.tema !== undefined) setTema(d.tema)
      if (d.copy !== undefined) setCopy(d.copy)
      if (d.status !== undefined) setStatus(d.status)
      if (d.formato !== undefined) setFormato(d.formato)
      if (d.scheduledDate !== undefined) setScheduledDate(d.scheduledDate)
    }
  } catch {}
}, [])

  const defaultPrompt = `Escreva a copy completa para o seguinte post do Vistas de Anitá:

Titulo: ${item.title}
Editoria: ${editorial?.name ?? item.editoria}
Formato: ${FORMAT_OPTIONS.find(f => f.value === item.formato)?.label ?? item.formato}
Canal: ${item.canal ?? 'Instagram'}${item.tema ? `\nTema: ${item.tema}` : ''}${item.notas ? `\nNotas: ${item.notas}` : ''}

Contexto: Contexto: Projetada para uma imersão completa na paisagem, esta cabana na Serra Catarinense é o seu camarote particular para a natureza. A parede de vidro do chão ao teto transforma a vista deslumbrante na principal decoração. Desfrute do conforto da cama queen-size, prepare uma refeição na cozinha completa ou simplesmente contemple o horizonte da sua varanda privativa. É o cenário perfeito para uma pausa inesquecível. Ideal para uma escapada romântica, esta cabana com hidromassagem combina o charme da serra com um toque de luxo. O destaque absoluto é a jacuzzi externa privativa, localizada na varanda, onde você pode relaxar sob as estrelas com uma vista incrível das montanhas. O interior aconchegante, com lareira e cozinha completa, cria o ambiente perfeito para desacelerar e se reconectar. Seu refúgio na Serra Catarinense espera por você. A apenas 97 km de Florianópolis, em meio às montanhas da Serra Catarinense, uma cabana no Vistas de Anitá é o convite para uma pausa real. O lugar onde a imensidão da natureza encontra o conforto do design, criando uma experiência de hospedagem única no sul do Brasil. Aqui, cada detalhe foi pensado para a sua reconexão. Na Serra Catarinense, você vai precisar de muito conforto e uma estrutura completa. Por isso, todas as nossas cabanas foram equipadas com o essencial para você não se preocupar com nada, apenas em relaxar.

Escreva a copy ideal para esse post.`;

  const handleGenerate = async () => {
    setGenerating(true);
    setCopyError('');
    setGeneratedCopy('');
    setCopySaved(false);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          editorial: editorial?.name ?? item.editoria,
          formato: FORMAT_OPTIONS.find(f => f.value === item.formato)?.label ?? item.formato,
          canal: item.canal ?? 'Instagram',
          tema: item.tema,
          notas: item.notas,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar');
      setGeneratedCopy(data.copy);
    } catch (err: any) {
      setCopyError(err.message ?? 'Erro ao gerar copy');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseCopy = async () => {
    setCopy(generatedCopy);
    try {
      await onUpdate(item.id, { copy: generatedCopy });
      setCopySaved(true);
      setTimeout(() => setCopySaved(false), 2000);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, { title, notas: notas || null, tema: tema || null, copy: copy || null, status, formato, scheduled_at: scheduledDate || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
      await onDelete(item.id);
      onClose();
    }
  };

  const tag = getStatusTagVistas(item.status);

  const inputBase: React.CSSProperties = {
    width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px',
    fontSize: 14, color: T.cinza700, background: T.card, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 580, background: T.card, borderRadius: 14, padding: 24, boxShadow: T.elevMd, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: editorial?.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: T.mutedFg }}>{editorial?.name}</span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>{FORMAT_OPTIONS.find((f) => f.value === item.formato)?.label ?? item.formato}</span>
            <span style={{ fontSize: 14, color: T.cinza400 }}>{item.canal}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400, flexShrink: 0 }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do post..."
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={{ ...inputBase, fontSize: 17, fontWeight: 700, color: T.cardFg }} />
          <span style={{ background: tag.bg, color: tag.fg, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{tag.label}</span>
        </div>

        <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>Tema</p>
          <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Adicionar tema..."
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={inputBase} />
        </div>

        <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>Notas</p>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Adicionar notas..." rows={3}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {copy && (
          <div style={{ background: T.cinza50, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.05em' }}>Copy</p>
            <textarea value={copy} onChange={(e) => setCopy(e.target.value)} rows={5}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
              style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        )}

        <div style={{ border: `1px solid ${copyPanelOpen ? T.primary : T.border}`, borderRadius: 10, marginBottom: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}>
          <button onClick={() => { setCopyPanelOpen((v) => !v); if (!customPrompt) setCustomPrompt(defaultPrompt); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: copyPanelOpen ? T.pendingBg : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={T.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: T.primary }}>Gerar Copy com IA</span>
            </div>
            {copyPanelOpen ? <ChevronUp size={16} color={T.mutedFg} /> : <ChevronDown size={16} color={T.mutedFg} />}
          </button>

          {copyPanelOpen && (
            <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, color: T.mutedFg, margin: '12px 0 8px' }}>Edite o prompt abaixo para personalizar o que o Claude vai gerar:</p>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={6}
                style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5, fontSize: 13, marginBottom: 12 }} />
              <button onClick={handleGenerate} disabled={generating}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, marginBottom: generatedCopy || copyError ? 16 : 0 }}>
                <Sparkles size={15} />
                {generating ? 'Gerando...' : 'Gerar'}
              </button>
              {copyError && <div style={{ background: T.statusErrBg, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: T.destructive }}>{copyError}</div>}
              {generatedCopy && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.05em' }}>Copy gerada</p>
                  <textarea value={generatedCopy} onChange={(e) => setGeneratedCopy(e.target.value)} rows={7}
                    style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6, fontSize: 13, marginBottom: 10, background: T.cinza50 }} />
                  <button onClick={handleUseCopy}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: copySaved ? T.statusOkFg : T.primary, color: T.primaryFg, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                    <Copy size={14} />{copySaved ? 'Copy salva!' : 'Usar essa copy'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
              {VISTAS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Formato</label>
            <select value={formato} onChange={(e) => setFormato(e.target.value as ContentFormat)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
              {FORMAT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 4 }}>Data agendada</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {item.status === 'agendado' && (
            <button onClick={async () => { setSaving(true); try { await onUpdate(item.id, { status: 'publicado' }); onClose(); } finally { setSaving(false); } }} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.statusOkFg, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              <CheckCircle size={16} /> Marcar como publicado
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={handleDelete}
            style={{ background: 'none', border: `1px solid ${T.statusErrBg}`, color: T.destructive, borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
