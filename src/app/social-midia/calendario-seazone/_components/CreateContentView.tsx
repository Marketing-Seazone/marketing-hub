"use client";

import { useState, useMemo } from 'react';
import { Sparkles, Loader2, Layers, Search } from 'lucide-react';
import { T } from '@/lib/constants';
import { EDITORIALS } from '../_lib/calendar-constants';
import { useContent } from '../_hooks/useContent';
import { BatchMode } from './BatchMode';
import { ResearchMode } from './ResearchMode';
import type { EditorialSlug, ContentFormat } from '../_lib/types';

type Mode = 'individual' | 'batch' | 'research';

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'reels', label: 'Reels' },
  { value: 'stories', label: 'Stories' },
  { value: 'feed', label: 'Post no Feed' },
];

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

async function generateContent(params: { editorial: string; format: string; channel?: string; topic?: string }) {
  const res = await fetch('/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<{ title: string; description: string }>;
}

interface CreateContentViewProps {
  onNavigate: (tab: string) => void;
}

export function CreateContentView({ onNavigate }: CreateContentViewProps) {
  const { createItem } = useContent();

  const [mode, setMode] = useState<Mode>('individual');
  const [editorials, setEditorials] = useState<EditorialSlug[]>([]);
  const [formats, setFormats] = useState<ContentFormat[]>([]);
  const [channels, setChannels] = useState<string[]>([]);

  const [topics, setTopics] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingCurrent, setGeneratingCurrent] = useState(0);
  const [generatingTotal, setGeneratingTotal] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const combinations = useMemo(() => {
    const combos: { editorial: EditorialSlug; format: ContentFormat; channel: string; key: string }[] = [];
    for (const ed of editorials) {
      for (const fmt of formats) {
        for (const ch of channels) {
          combos.push({ editorial: ed, format: fmt, channel: ch, key: `${ed}|${fmt}|${ch}` });
        }
      }
    }
    return combos;
  }, [editorials, formats, channels]);

  const canGenerate = combinations.length > 0;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setError('');
    setToast('');
    setGeneratingTotal(combinations.length);

    let savedCount = 0;

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      setGeneratingCurrent(i + 1);

      try {
        if (i > 0) await delay(500);

        const editorialObj = EDITORIALS.find((e) => e.slug === combo.editorial);
        const formatObj = FORMAT_OPTIONS.find((f) => f.value === combo.format);

        const res = await generateContent({
          editorial: editorialObj?.name ?? combo.editorial,
          format: formatObj?.label ?? combo.format,
          channel: combo.channel,
          topic: (topics[combo.key] || '').trim() || undefined,
        });

        await createItem({
          title: res.title,
          editoria: combo.editorial,
          formato: combo.format,
          canal: combo.channel,
          status: 'ideia',
          scheduled_at: null,
          tema: (topics[combo.key] || '').trim() || null,
          estrutura: null,
          copy: null,
          notas: res.description || null,
        });

        savedCount++;
      } catch (err) {
        setError((prev) =>
          prev
            ? `${prev}\n${combo.key}: ${err instanceof Error ? err.message : 'Erro'}`
            : `${combo.key}: ${err instanceof Error ? err.message : 'Erro'}`
        );
      }
    }

    setGenerating(false);

    if (savedCount > 0) {
      setToast(`${savedCount} post${savedCount > 1 ? 's' : ''} salvo${savedCount > 1 ? 's' : ''} no Backlog`);
      setTimeout(() => onNavigate('backlog'), 1500);
    }
  };

  const toggleEditorial = (slug: EditorialSlug) => {
    setEditorials((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const toggleFormat = (fmt: ContentFormat) => {
    setFormats((prev) => prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]);
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);
  };

  const setTopic = (key: string, value: string) => {
    setTopics((prev) => ({ ...prev, [key]: value }));
  };

  const getEditorialName = (slug: EditorialSlug) =>
    EDITORIALS.find((e) => e.slug === slug)?.name ?? slug;

  const getFormatLabel = (fmt: ContentFormat) =>
    FORMAT_OPTIONS.find((f) => f.value === fmt)?.label ?? fmt;

  const getChannelLabel = (ch: string) =>
    CHANNEL_OPTIONS.find((c) => c.value === ch)?.label ?? ch;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', gap: 8, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: 6, marginBottom: 16,
        }}>
          <button
            onClick={() => setMode('individual')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === 'individual' ? T.primary : 'transparent',
              color: mode === 'individual' ? T.primaryFg : T.mutedFg,
              boxShadow: mode === 'individual' ? T.elevSm : 'none',
            }}
          >
            <Sparkles size={18} />
            Individual
          </button>
          <button
            onClick={() => setMode('batch')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === 'batch' ? T.primary : 'transparent',
              color: mode === 'batch' ? T.primaryFg : T.mutedFg,
              boxShadow: mode === 'batch' ? T.elevSm : 'none',
            }}
          >
            <Layers size={18} />
            Em Lote
          </button>
          <button
            onClick={() => setMode('research')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === 'research' ? T.primary : 'transparent',
              color: mode === 'research' ? T.primaryFg : T.mutedFg,
              boxShadow: mode === 'research' ? T.elevSm : 'none',
            }}
          >
            <Search size={18} />
            Pesquisa
          </button>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Criar Conteudo</h2>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
          {mode === 'individual'
            ? 'Selecione editorias, formatos, canais e preencha os temas — o Claude gera a estrutura completa'
            : mode === 'batch'
            ? 'Gere varios posts de uma vez distribuidos por editorias e formatos'
            : 'Pesquise tendencias e noticias reais e gere posts baseados no que encontrar'}
        </p>
      </div>

      {mode === 'batch' ? (
        <BatchMode onNavigate={onNavigate} />
      ) : mode === 'research' ? (
        <ResearchMode />
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
          {/* Editorias */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Editorias</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {EDITORIALS.map((e) => (
                <button
                  key={e.slug}
                  onClick={() => toggleEditorial(e.slug)}
                  style={{
                    border: `2px solid ${editorials.includes(e.slug) ? e.color : T.border}`,
                    borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer',
                    background: T.card, boxShadow: editorials.includes(e.slug) ? T.elevSm : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', background: e.color, marginBottom: 4 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.cinza800 }}>{e.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formatos */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Formatos</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFormat(f.value)}
                  style={{
                    border: `2px solid ${formats.includes(f.value) ? T.primary : T.border}`,
                    borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer',
                    background: formats.includes(f.value) ? T.pendingBg : T.card,
                    boxShadow: formats.includes(f.value) ? T.elevSm : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.cinza800 }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Canais */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Canais</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => toggleChannel(ch.value)}
                  style={{
                    border: `1px solid ${channels.includes(ch.value) ? T.primary : T.border}`,
                    borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500,
                    background: channels.includes(ch.value) ? T.pendingBg : 'transparent',
                    color: channels.includes(ch.value) ? T.primary : T.mutedFg,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temas */}
          {combinations.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 4 }}>
                Tema / Briefing
              </label>
              <p style={{ fontSize: 12, color: T.cinza400, margin: '0 0 8px' }}>
                Opcional — sem tema, a IA escolhe o assunto
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {combinations.map((combo) => (
                  <div key={combo.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.mutedFg, marginBottom: 4 }}>
                      {getEditorialName(combo.editorial)} · {getFormatLabel(combo.format)} · {getChannelLabel(combo.channel)}
                    </label>
                    <textarea
                      value={topics[combo.key] || ''}
                      onChange={(e) => setTopic(combo.key, e.target.value)}
                      placeholder="Ex: Taxa de ocupacao em Floripa no verao 2026"
                      rows={2}
                      style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {combinations.length === 0 && (
            <div style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: '32px 24px', textAlign: 'center', fontSize: 14, color: T.cinza400, marginBottom: 20 }}>
              Selecione ao menos uma editoria, um formato e um canal para preencher os temas.
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12,
              padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: (generating || !canGenerate) ? 0.5 : 1,
            }}
          >
            {generating ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Gerando {generatingCurrent} de {generatingTotal}...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Gerar e Salvar no Backlog
              </>
            )}
          </button>

          {error && (
            <div style={{ marginTop: 16, whiteSpace: 'pre-line', background: T.statusErrBg, borderRadius: 12, padding: 16, fontSize: 14, color: T.destructive }}>
              {error}
            </div>
          )}

          {toast && (
            <div style={{ marginTop: 16, background: T.statusOkBg, borderRadius: 12, padding: 16, fontSize: 14, fontWeight: 500, color: T.statusOkFg }}>
              {toast}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
