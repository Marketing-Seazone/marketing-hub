'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Loader2, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { T } from '@/lib/constants';
import { VISTAS_EDITORIALS, VISTAS_FORMATS, getVistaEditorial } from './vistas-calendar-constants';
import { useContentVistas } from './useContentVistas';
import type { EditorialSlug, ContentFormat } from '@/app/social-midia/calendario-seazone/_lib/types';

interface BatchItem {
  editorial: EditorialSlug;
  format: ContentFormat;
  topic: string;
}

type BatchStatus = 'idle' | 'generating' | 'done';

interface BatchResult {
  index: number;
  title: string;
  editorial: EditorialSlug;
  format: ContentFormat;
  success: boolean;
  error?: string;
}

async function generateContent(params: { editorial: string; format: string; channel?: string; topic?: string }) {
  const res = await fetch('/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<{ title: string; description: string }>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BatchModeVistasProps {
  onNavigate: (tab: string) => void;
}

export function BatchModeVistas({ onNavigate }: BatchModeVistasProps) {
  const { createItem } = useContentVistas();
  const [postCount, setPostCount] = useState(6);
  const [selectedEditorias, setSelectedEditorias] = useState<EditorialSlug[]>(
    VISTAS_EDITORIALS.map((e) => e.slug)
  );
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>(['reels']);
  const [generalTopic, setGeneralTopic] = useState('');

  const [status, setStatus] = useState<BatchStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState('');

  const toggleEditorial = (slug: EditorialSlug) => {
    setSelectedEditorias((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const toggleFormat = (fmt: ContentFormat) => {
    setSelectedFormats((prev) => prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]);
  };

  const selectAllEditorias = () => {
    if (selectedEditorias.length === VISTAS_EDITORIALS.length) {
      setSelectedEditorias([]);
    } else {
      setSelectedEditorias(VISTAS_EDITORIALS.map((e) => e.slug));
    }
  };

  const plan = useMemo((): BatchItem[] => {
    if (selectedEditorias.length === 0 || selectedFormats.length === 0) return [];
    const items: BatchItem[] = [];
    for (let i = 0; i < postCount; i++) {
      const ed = selectedEditorias[i % selectedEditorias.length];
      const fmt = selectedFormats[i % selectedFormats.length];
      const editorial = getVistaEditorial(ed);
      const formatLabel = VISTAS_FORMATS.find((f) => f.value === fmt)?.label ?? fmt;
      const topic = generalTopic
        ? `${generalTopic} — foco na editoria ${editorial?.name}`
        : `Conteúdo ${formatLabel} para a editoria ${editorial?.name}: ${editorial?.description}`;
      items.push({ editorial: ed, format: fmt, topic });
    }
    return items;
  }, [postCount, selectedEditorias, selectedFormats, generalTopic]);

  const handleGenerate = async () => {
    if (plan.length === 0 || status === 'generating') return;
    setStatus('generating');
    setResults([]);
    setError('');
    setCurrentIndex(0);

    const batchResults: BatchResult[] = [];

    for (let i = 0; i < plan.length; i++) {
      setCurrentIndex(i);
      const item = plan[i];
      try {
        if (i > 0) await delay(2000);
        const res = await generateContent({
          editorial: getVistaEditorial(item.editorial)?.name ?? item.editorial,
          format: VISTAS_FORMATS.find((f) => f.value === item.format)?.label ?? item.format,
          channel: 'instagram',
          topic: item.topic,
        });
        await createItem({
          title: res.title,
          editoria: item.editorial,
          formato: item.format,
          canal: 'instagram',
          status: 'ideia',
          scheduled_at: null,
          tema: item.topic || null,
          estrutura: null,
          copy: null,
          notas: res.description || null,
        });
        batchResults.push({ index: i, title: res.title, editorial: item.editorial, format: item.format, success: true });
      } catch (err) {
        batchResults.push({ index: i, title: `Post ${i + 1}`, editorial: item.editorial, format: item.format, success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
      }
      setResults([...batchResults]);
    }
    setStatus('done');
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const progressPercent = plan.length > 0 ? ((currentIndex + (status === 'done' ? 1 : 0)) / plan.length) * 100 : 0;

  if (status === 'done') {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.statusOkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={32} color={T.statusOkFg} />
          </div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 8px' }}>
          {successCount} {successCount === 1 ? 'post criado' : 'posts criados'} com sucesso!
        </h2>
        {failCount > 0 && <p style={{ fontSize: 14, color: T.destructive, margin: '0 0 16px' }}>{failCount} {failCount === 1 ? 'post falhou' : 'posts falharam'}</p>}
        <div style={{ maxWidth: 500, margin: '0 auto 24px' }}>
          <div style={{ maxHeight: 256, overflowY: 'auto', background: T.cinza50, borderRadius: 8, padding: 12 }}>
            {results.map((r) => {
              const ed = getVistaEditorial(r.editorial);
              const fmtLabel = VISTAS_FORMATS.find((f) => f.value === r.format)?.label;
              return (
                <div key={r.index} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.border}`, padding: '8px 0' }}>
                  {r.success ? <CheckCircle size={16} color={T.statusOkFg} /> : <AlertCircle size={16} color={T.statusErr} />}
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: ed?.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: T.cinza700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  <span style={{ background: T.cinza50, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: T.cinza600, flexShrink: 0 }}>{fmtLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => onNavigate('calendario')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Calendar size={16} /> Ver no Calendário
          </button>
          <button onClick={() => { setStatus('idle'); setResults([]); setCurrentIndex(0); }} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, color: T.cinza600, cursor: 'pointer' }}>
            Criar mais
          </button>
        </div>
      </div>
    );
  }

  if (status === 'generating') {
    const currentItem = plan[currentIndex];
    const currentEd = getVistaEditorial(currentItem?.editorial ?? VISTAS_EDITORIALS[0].slug);
    const currentFmt = VISTAS_FORMATS.find((f) => f.value === currentItem?.format)?.label;
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Loader2 size={32} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Gerando post {currentIndex + 1} de {plan.length}...</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: currentEd?.color }} />
            <span style={{ fontSize: 14, color: T.mutedFg }}>{currentEd?.name} — {currentFmt}</span>
          </div>
        </div>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.mutedFg, marginBottom: 8 }}>
            <span>Progresso</span><span>{Math.round(progressPercent)}%</span>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: T.cinza50, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 6, background: T.primary, transition: 'width 0.5s', width: `${progressPercent}%` }} />
          </div>
        </div>
        {results.length > 0 && (
          <div style={{ maxWidth: 400, margin: '24px auto 0' }}>
            <div style={{ maxHeight: 160, overflowY: 'auto', background: T.cinza50, borderRadius: 8, padding: 12 }}>
              {results.map((r) => {
                const ed = getVistaEditorial(r.editorial);
                return (
                  <div key={r.index} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14 }}>
                    {r.success ? <CheckCircle size={14} color={T.statusOkFg} /> : <AlertCircle size={14} color={T.statusErr} />}
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ed?.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.cinza600 }}>{r.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Quantos posts?</label>
          <input type="number" min={1} max={20} value={postCount} onChange={(e) => setPostCount(Math.min(20, Math.max(1, Number(e.target.value))))}
            style={{ width: 128, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: T.cinza700 }}>Editorias</label>
            <button onClick={selectAllEditorias} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 500, color: T.primary, cursor: 'pointer' }}>
              {selectedEditorias.length === VISTAS_EDITORIALS.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VISTAS_EDITORIALS.map((e) => {
              const selected = selectedEditorias.includes(e.slug);
              return (
                <button key={e.slug} onClick={() => toggleEditorial(e.slug)}
                  style={{ border: `2px solid ${selected ? e.color : T.border}`, borderRadius: 12, padding: 12, textAlign: 'left', cursor: 'pointer', background: T.card, opacity: selected ? 1 : 0.5, boxShadow: selected ? T.elevSm : 'none', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.cinza800 }}>{e.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.mutedFg }}>{e.description.substring(0, 80)}...</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Formatos</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VISTAS_FORMATS.map((f) => {
              const selected = selectedFormats.includes(f.value);
              return (
                <button key={f.value} onClick={() => toggleFormat(f.value)}
                  style={{ border: `1px solid ${selected ? T.primary : T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, background: selected ? T.pendingBg : T.card, color: selected ? T.primary : T.cinza600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Tema geral (opcional)</label>
          <textarea value={generalTopic} onChange={(e) => setGeneralTopic(e.target.value)}
            placeholder='Ex: "Conteúdo para o feriado de Páscoa na Serra Catarinense"'
            rows={2} style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, resize: 'vertical' }} />
        </div>
      </div>

      {plan.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: '0 0 16px' }}>Preview — {plan.length} {plan.length === 1 ? 'post' : 'posts'}</h3>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.cinza50 }}>
                  <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: T.mutedFg }}>#</th>
                  <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: T.mutedFg }}>Editoria</th>
                  <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: T.mutedFg }}>Formato</th>
                  <th style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: T.mutedFg }}>Tema sugerido</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((item, i) => {
                  const ed = getVistaEditorial(item.editorial);
                  const fmtLabel = VISTAS_FORMATS.find((f) => f.value === item.format)?.label;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.cinza50}` }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: T.cinza400 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: ed?.color }} />
                          <span style={{ fontSize: 14, color: T.cinza700 }}>{ed?.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: T.cinza50, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: T.cinza600 }}>{fmtLabel}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: T.mutedFg, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {error && <div style={{ marginTop: 16, background: T.statusErrBg, borderRadius: 12, padding: 16, fontSize: 14, color: T.destructive }}>{error}</div>}
          <button onClick={handleGenerate} disabled={selectedEditorias.length === 0 || selectedFormats.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: (selectedEditorias.length === 0 || selectedFormats.length === 0) ? 0.5 : 1 }}>
            <Sparkles size={18} /> Gerar todos com IA
          </button>
        </div>
      )}

      {plan.length === 0 && (selectedEditorias.length === 0 || selectedFormats.length === 0) && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center', fontSize: 14, color: T.cinza400 }}>
          Selecione pelo menos uma editoria e um formato para ver o preview
        </div>
      )}
    </>
  );
}
