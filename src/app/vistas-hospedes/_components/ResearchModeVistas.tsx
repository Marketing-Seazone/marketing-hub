'use client';

import { useState } from 'react';
import { Search, Sparkles, Loader2, ChevronRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { T } from '@/lib/constants';
import { VISTAS_EDITORIALS, getVistaEditorial, matchVistaEditorialSlug } from './vistas-calendar-constants';
import { useContentVistas } from './useContentVistas';
import type { EditorialSlug } from '@/app/social-midia/calendario-seazone/_lib/types';

interface Insight {
  editoria: string;
  insight: string;
  angulo: string;
}

interface ResearchResult {
  query: string;
  resumo: string;
  insights: Insight[];
  searchResults?: string[];
}

interface GenerateResult {
  editoria: string;
  title: string;
  success: boolean;
  error?: string;
}

export function ResearchModeVistas() {
  const { createItem } = useContentVistas();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  const [generating, setGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<GenerateResult[]>([]);
  const [generateDone, setGenerateDone] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setResearch(null);
    setSearchError('');
    setGenerateResults([]);
    setGenerateDone(false);
    setSelectedIndexes(new Set());

    try {
      const res = await fetch('/api/pesquisa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          editorials: VISTAS_EDITORIALS.map(e => e.name),
          context: 'Vistas de Anitá — pousada rural na Serra Catarinense (Anitápolis). Hospedagem em cabanas, natureza, aventura, romance, famílias.',
        }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResearch(data);
      setSelectedIndexes(new Set(data.insights.map((_: Insight, i: number) => i)));
    } catch (err: any) {
      setSearchError(err.message ?? 'Erro na pesquisa');
    } finally {
      setSearching(false);
    }
  };

  const toggleInsight = (i: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const selectAll = () => { if (!research) return; setSelectedIndexes(new Set(research.insights.map((_, i) => i))); };
  const deselectAll = () => setSelectedIndexes(new Set());
  const allSelected = research ? selectedIndexes.size === research.insights.length : false;

  const handleGeneratePosts = async () => {
    if (!research || generating || selectedIndexes.size === 0) return;
    setGenerating(true);
    setGenerateResults([]);
    setGenerateDone(false);

    const toGenerate = research.insights.filter((_, i) => selectedIndexes.has(i));
    const results: GenerateResult[] = [];

    for (let i = 0; i < toGenerate.length; i++) {
      const insight = toGenerate[i];
      const slug = matchVistaEditorialSlug(insight.editoria);
      const editorial = slug ? getVistaEditorial(slug) : null;
      const editorialName = editorial?.name ?? insight.editoria;
      const researchContext = `Contexto: Vistas de Anitá — pousada rural na Serra Catarinense.\nResumo da pesquisa: ${research.resumo}\n\nInsight: ${insight.insight}\n\nÂngulo sugerido: ${insight.angulo}`;

      try {
        if (i > 0) await new Promise((r) => setTimeout(r, 1500));
        const res = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editorial: editorialName, format: 'reels', channel: 'instagram', topic: insight.angulo, researchContext }),
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (slug) {
          await createItem({
            title: data.title,
            editoria: slug,
            formato: 'reels',
            canal: 'instagram',
            status: 'ideia',
            scheduled_at: null,
            tema: insight.angulo,
            estrutura: null,
            copy: null,
            notas: `${data.description}\n\n[Pesquisa: ${research.query}]`,
          });
        }
        results.push({ editoria: editorialName, title: data.title, success: true });
      } catch (err: any) {
        results.push({ editoria: editorialName, title: '', success: false, error: err.message });
      }
      setGenerateResults([...results]);
    }

    setGenerating(false);
    setGenerateDone(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: '0 0 6px' }}>Pesquisa de tendências</h3>
        <p style={{ fontSize: 14, color: T.mutedFg, margin: '0 0 16px' }}>
          Busca notícias e tendências atuais e gera posts para cada editoria do Vistas de Anitá.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: tendências de turismo rural 2025, Serra Catarinense alta temporada..."
            style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleSearch} disabled={!query.trim() || searching}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: query.trim() && !searching ? 'pointer' : 'not-allowed', opacity: !query.trim() || searching ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            {searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {searching ? 'Pesquisando...' : 'Pesquisar'}
          </button>
        </div>
        {searchError && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: T.destructive, fontSize: 14 }}>
            <AlertCircle size={16} />{searchError}
          </div>
        )}
      </div>

      {research && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Resultado: "{research.query}"</h3>
              <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>{research.insights.length} editorias com insights relevantes</p>
            </div>
            <button onClick={handleSearch} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 13, color: T.cinza600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Refazer
            </button>
          </div>

          <div style={{ background: T.cinza50, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: T.cinza700, margin: 0, lineHeight: 1.6 }}>{research.resumo}</p>
          </div>

          {!generateDone && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: T.mutedFg }}>{selectedIndexes.size} de {research.insights.length} selecionados</span>
              <button onClick={allSelected ? deselectAll : selectAll} style={{ background: 'none', border: 'none', fontSize: 13, color: T.primary, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {research.insights.map((insight, i) => {
              const slug = matchVistaEditorialSlug(insight.editoria);
              const ed = slug ? getVistaEditorial(slug) : null;
              const isSelected = selectedIndexes.has(i);
              return (
                <div key={i} onClick={() => !generateDone && toggleInsight(i)}
                  style={{ border: `2px solid ${isSelected && !generateDone ? ed?.color ?? T.primary : T.border}`, borderRadius: 10, padding: 14, cursor: generateDone ? 'default' : 'pointer', background: isSelected && !generateDone ? `${ed?.color ?? T.primary}08` : T.card, transition: 'all 0.12s', opacity: !isSelected && !generateDone ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    {!generateDone && (
                      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${isSelected ? ed?.color ?? T.primary : T.border}`, background: isSelected ? ed?.color ?? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    )}
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: ed?.color ?? T.primary, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>{insight.editoria}</span>
                  </div>
                  <p style={{ fontSize: 13, color: T.cinza700, margin: '0 0 6px', lineHeight: 1.5, paddingLeft: generateDone ? 0 : 28 }}>{insight.insight}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: generateDone ? 0 : 28 }}>
                    <ChevronRight size={12} color={T.primary} />
                    <span style={{ fontSize: 12, color: T.primary, fontWeight: 500 }}>{insight.angulo}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {!generateDone && (
            <button onClick={handleGeneratePosts} disabled={generating || selectedIndexes.size === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: generating || selectedIndexes.size === 0 ? 'not-allowed' : 'pointer', opacity: generating || selectedIndexes.size === 0 ? 0.5 : 1 }}>
              {generating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
              {generating ? `Gerando post ${generateResults.length + 1} de ${selectedIndexes.size}...` : `Gerar ${selectedIndexes.size} post${selectedIndexes.size !== 1 ? 's' : ''} selecionado${selectedIndexes.size !== 1 ? 's' : ''}`}
            </button>
          )}

          {(generating || generateDone) && generateResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generateResults.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    {r.success ? <CheckCircle size={15} color={T.statusOkFg} /> : <AlertCircle size={15} color={T.destructive} />}
                    <span style={{ color: T.cinza600, minWidth: 180 }}>{r.editoria}</span>
                    {r.success ? <span style={{ color: T.cinza700, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span> : <span style={{ color: T.destructive }}>{r.error}</span>}
                  </div>
                ))}
              </div>
              {generateDone && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: T.statusOkBg, borderRadius: 10, fontSize: 14, color: T.statusOkFg, fontWeight: 600 }}>
                  {generateResults.filter(r => r.success).length} posts criados no backlog!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
