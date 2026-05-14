'use client';

import { useEffect, useState } from 'react';
import { TeamLayout } from '@/components/team-layout';
import { T } from '@/lib/constants';
import { Pencil, Check, Loader2 } from 'lucide-react';

const COR = '#7C3AED';
const META_DEFAULT = 15000;

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('pt-BR');
}

type Periodo = 7 | 14 | 30;

const MESES_PT: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

export default function Page() {
  const [total, setTotal] = useState<number | null>(null);
  const [ganhoHoje, setGanhoHoje] = useState<number | null>(null);
  const [ganhoMes, setGanhoMes] = useState<number | null>(null);
  const [historico, setHistorico] = useState<{ data: string; ganho_dia: number }[]>([]);
  const [loadingSeguidores, setLoadingSeguidores] = useState(true);
  const [erroSeguidores, setErroSeguidores] = useState<string | null>(null);

  const [periodoGrafico, setPeriodoGrafico] = useState<7 | 14 | 30 | 'mes'>('mes');
  const [filterMes, setFilterMes] = useState<string | null>(null);
  const [ganhoPeriodoReportei, setGanhoPeriodoReportei] = useState<number | null>(null);
  const [loadingGanho, setLoadingGanho] = useState(false);
  const [tooltip, setTooltip] = useState<{ idx: number; x: number } | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>(7);
  const [metricas, setMetricas] = useState<any>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const [metaMes, setMetaMes] = useState<number>(META_DEFAULT);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('seazone_meta_mensal_seguidores');
      if (saved) setMetaMes(Number(saved));
    } catch {}
  }, []);

  function salvarMeta() {
    const n = parseInt(metaInput.replace(/\D/g, ''));
    if (!isNaN(n) && n > 0) {
      setMetaMes(n);
      try { localStorage.setItem('seazone_meta_mensal_seguidores', String(n)); } catch {}
    }
    setEditandoMeta(false);
  }

  const faltam = ganhoMes !== null ? Math.max(0, metaMes - ganhoMes) : null;
  const progresso = ganhoMes !== null ? Math.min(100, (ganhoMes / metaMes) * 100) : 0;

  // Busca dados principais do Reportei
  useEffect(() => {
    fetch('/api/seguidores-seazone')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErroSeguidores(data.error); return; }
        setTotal(typeof data.total_seguidores === 'number' ? data.total_seguidores : null);
        setGanhoHoje(typeof data.ganho_hoje === 'number' ? data.ganho_hoje : null);
        setGanhoMes(typeof data.ganho_mes === 'number' ? data.ganho_mes : null);
        setHistorico(Array.isArray(data.historico) ? data.historico : []);
      })
      .catch(e => setErroSeguidores(e.message))
      .finally(() => setLoadingSeguidores(false));
  }, []);

  // Busca ganho do Reportei para períodos/meses alternativos
  useEffect(() => {
    if (periodoGrafico === 'mes' && !filterMes) {
      setGanhoPeriodoReportei(null);
      return;
    }
    setLoadingGanho(true);
    setGanhoPeriodoReportei(null);

    let url: string;
    if (filterMes) {
      url = `/api/seguidores-seazone-mensal?mes=${filterMes}`;
    } else {
      const fim = new Date().toISOString().split('T')[0];
      const ini = new Date();
      ini.setDate(ini.getDate() - (periodoGrafico as number));
      url = `/api/seguidores-seazone-mensal?start=${ini.toISOString().split('T')[0]}&end=${fim}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(d => setGanhoPeriodoReportei(d.ganho ?? null))
      .catch(() => setGanhoPeriodoReportei(null))
      .finally(() => setLoadingGanho(false));
  }, [periodoGrafico, filterMes]);

  // Métricas do período
  useEffect(() => {
    setLoadingMetricas(true);
    fetch(`/api/metricas-seazone?dias=${periodo}`)
      .then(r => r.json())
      .then(data => setMetricas(data))
      .catch(() => setMetricas(null))
      .finally(() => setLoadingMetricas(false));
  }, [periodo]);

  // Ganho exibido: mês atual usa ganhoMes da rota principal, demais usam Reportei
  const ganhoPeriodo = (!filterMes && periodoGrafico === 'mes') ? ganhoMes : ganhoPeriodoReportei;

  // Filtra histórico conforme período/mês selecionado
  const historicoFiltrado = (() => {
    if (filterMes) return historico.filter(d => d.data.slice(0, 7) === filterMes);
    if (periodoGrafico === 'mes') {
      const inicioMes = new Date().toISOString().slice(0, 7) + '-01';
      return historico.filter(d => d.data >= inicioMes);
    }
    const corte = new Date();
    corte.setDate(corte.getDate() - (periodoGrafico as number));
    return historico.filter(d => d.data >= corte.toISOString().split('T')[0]);
  })();

  // Meses disponíveis no histórico
  const mesesDisponiveis = Array.from(new Set(historico.map(d => d.data.slice(0, 7)))).sort();

  const periodoLabel = (() => {
    if (filterMes) return `${MESES_PT[filterMes.slice(5)]}/${filterMes.slice(2, 4)}`;
    const hoje = new Date();
    const fmt2 = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (periodoGrafico === 'mes') {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return `${fmt2(ini)} — ${fmt2(hoje)}`;
    }
    const ini = new Date();
    ini.setDate(hoje.getDate() - (periodoGrafico as number));
    return `${fmt2(ini)} — ${fmt2(hoje)}`;
  })();

  const W = 680, H = 140, PL = 36, PB = 28, PT = 8, PR = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxGanho = Math.max(...historicoFiltrado.map(d => d.ganho_dia || 0), 1);
  const n = historicoFiltrado.length;
  const barW = n > 1 ? Math.max(6, (cW / n) - 3) : 20;
  const xs = (i: number) => n > 1 ? PL + (i / (n - 1)) * cW : PL + cW / 2;
  const ys = (val: number) => PT + cH - (val / maxGanho) * cH;

  const periodosGrafico: { label: string; val: 7 | 14 | 30 | 'mes' }[] = [
    { label: 'Mês atual', val: 'mes' },
    { label: '7 dias', val: 7 },
    { label: '14 dias', val: 14 },
    { label: '30 dias', val: 30 },
  ];

  function MetCard({ label, value, color, icon }: { label: string; value: number | null; color: string; icon: string }) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: 0, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</p>
        </div>
        {loadingMetricas
          ? <p style={{ fontSize: 20, color: T.mutedFg, margin: 0 }}>...</p>
          : <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{fmt(value)}</p>
        }
      </div>
    );
  }

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: 1 }}>INSTAGRAM</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: 0 }}>@destinoseazone — Métricas</h2>
        </div>

        {/* Seguidores */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: '0 0 16px' }}>Seguidores</p>
          {loadingSeguidores && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.mutedFg, fontSize: 13 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando dados do Reportei...
            </div>
          )}
          {erroSeguidores && <p style={{ color: '#EF4444', fontSize: 13 }}>Erro: {erroSeguidores}</p>}
          {!loadingSeguidores && !erroSeguidores && (
            <div>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Total de Seguidores</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: COR, margin: 0 }}>{fmt(total)}</p>
                </div>
                <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Ganho Hoje</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#16A34A', margin: 0 }}>{ganhoHoje != null ? `+${fmt(ganhoHoje)}` : '—'}</p>
                </div>
                <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: 0, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Meta Mensal</p>
                    {!editandoMeta && (
                      <button onClick={() => { setMetaInput(String(metaMes)); setEditandoMeta(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.mutedFg, padding: 0, display: 'flex', alignItems: 'center' }}>
                        <Pencil size={11} />
                      </button>
                    )}
                  </div>
                  {editandoMeta ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input autoFocus value={metaInput} onChange={e => setMetaInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarMeta(); if (e.key === 'Escape') setEditandoMeta(false); }}
                        style={{ width: '100%', fontSize: 16, fontWeight: 700, color: '#D97706', background: 'transparent', border: 'none', borderBottom: `2px solid ${COR}`, outline: 'none', padding: '2px 0' }} />
                      <button onClick={salvarMeta} style={{ background: COR, border: 'none', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <Check size={11} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#D97706', margin: 0 }}>+{fmt(metaMes)}</p>
                  )}
                </div>
                <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Ganho no Mês</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: COR, margin: 0 }}>{ganhoMes != null ? `+${fmt(ganhoMes)}` : '—'}</p>
                </div>
                <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Falta para Meta</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: faltam === 0 ? '#16A34A' : '#DC2626', margin: 0 }}>
                    {faltam != null ? (faltam === 0 ? '✔ Batida!' : fmt(faltam)) : '—'}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Progresso para meta de +{fmt(metaMes)} no mês</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: progresso >= 100 ? '#16A34A' : COR, margin: 0 }}>{progresso.toFixed(1)}%</p>
                </div>
                <div style={{ background: T.border, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${progresso}%`, height: '100%', background: progresso >= 100 ? '#16A34A' : `linear-gradient(90deg, ${COR}, #A855F7)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Gráfico */}
              <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Ganho diário</p>
                    <div style={{ background: `${COR}12`, border: `1px solid ${COR}30`, borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: T.mutedFg }}>{periodoLabel}:</span>
                      {loadingGanho
                        ? <Loader2 size={13} color={COR} style={{ animation: 'spin 1s linear infinite' }} />
                        : <span style={{ fontSize: 14, fontWeight: 800, color: COR }}>{ganhoPeriodo != null ? `+${fmt(ganhoPeriodo)}` : '—'}</span>
                      }
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {/* Filtro por mês */}
                    {mesesDisponiveis.length > 1 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, justifyContent: 'flex-end' }}>
                        {mesesDisponiveis.map(m => {
                          const [ano, mes] = m.split('-');
                          const label = `${MESES_PT[mes]}/${ano.slice(2)}`;
                          const ativo = filterMes === m;
                          return (
                            <button key={m} onClick={() => { setFilterMes(ativo ? null : m); setTooltip(null); }}
                              style={{ padding: '3px 9px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${ativo ? COR : T.border}`, background: ativo ? COR : 'transparent', color: ativo ? '#fff' : T.mutedFg, transition: 'all 0.12s' }}>
                              {label}
                            </button>
                          );
                        })}
                        {filterMes && (
                          <button onClick={() => { setFilterMes(null); setTooltip(null); }}
                            style={{ padding: '3px 7px', fontSize: 11, borderRadius: 6, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.mutedFg }}>
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                    {/* Filtro por período */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {periodosGrafico.map(p => (
                        <button key={String(p.val)} onClick={() => { setPeriodoGrafico(p.val); setFilterMes(null); setTooltip(null); }}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${!filterMes && periodoGrafico === p.val ? COR : T.border}`, background: !filterMes && periodoGrafico === p.val ? COR : 'transparent', color: !filterMes && periodoGrafico === p.val ? '#fff' : T.mutedFg }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {historicoFiltrado.length === 0
                  ? <p style={{ fontSize: 12, color: T.mutedFg, fontStyle: 'italic', textAlign: 'center' as const, padding: '16px 0' }}>Sem dados para o período.</p>
                  : (
                    <div style={{ overflow: 'hidden', position: 'relative' }} onMouseLeave={() => setTooltip(null)}>
                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}
                        onMouseMove={e => {
                          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                          const mx = ((e.clientX - rect.left) / rect.width) * W;
                          let closest = 0; let minD = Infinity;
                          historicoFiltrado.forEach((_, i) => { const d = Math.abs(xs(i) - mx); if (d < minD) { minD = d; closest = i; } });
                          if (minD < barW * 2) setTooltip({ idx: closest, x: xs(closest) });
                          else setTooltip(null);
                        }}>
                        <defs><clipPath id="seazone-clip"><rect x={PL} y={PT} width={cW} height={cH} /></clipPath></defs>
                        {[0, Math.round(maxGanho / 2), maxGanho].map(val => (
                          <g key={val}>
                            <line x1={PL} x2={W - PR} y1={ys(val)} y2={ys(val)} stroke={T.border} strokeWidth={0.5} />
                            <text x={PL - 4} y={ys(val) + 4} fontSize={9} fill={T.mutedFg ?? '#888'} textAnchor="end">{val}</text>
                          </g>
                        ))}
                        <g clipPath="url(#seazone-clip)">
                          {historicoFiltrado.map((d, i) => {
                            const ganho = d.ganho_dia || 0;
                            const bh = Math.max(2, (ganho / maxGanho) * cH);
                            const isHoje = d.data === new Date().toISOString().split('T')[0];
                            return (
                              <rect key={d.data} x={xs(i) - barW / 2} y={ys(ganho)} width={barW} height={bh}
                                fill={tooltip?.idx === i ? '#5B21B6' : isHoje ? COR : `${COR}60`} rx={2} style={{ transition: 'fill 0.1s' }} />
                            );
                          })}
                        </g>
                        {tooltip && <line x1={xs(tooltip.idx)} x2={xs(tooltip.idx)} y1={PT} y2={H - PB} stroke={COR} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />}
                        {historicoFiltrado.length <= 20
                          ? historicoFiltrado.map((d, i) => (
                            <text key={d.data} x={xs(i)} y={H - 6} fontSize={9} fill={tooltip?.idx === i ? COR : T.mutedFg ?? '#888'} fontWeight={tooltip?.idx === i ? 700 : 400} textAnchor="middle">{d.data.slice(8)}</text>
                          ))
                          : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1].map(i => (
                            <text key={i} x={xs(i)} y={H - 6} fontSize={9} fill={T.mutedFg ?? '#888'} textAnchor="middle">
                              {historicoFiltrado[i]?.data.slice(8)}/{historicoFiltrado[i]?.data.slice(5, 7)}
                            </text>
                          ))
                        }
                      </svg>
                      {tooltip && (() => {
                        const d = historicoFiltrado[tooltip.idx];
                        const ganho = d?.ganho_dia || 0;
                        const dataFmt = d?.data.split('-').reverse().join('/') ?? '';
                        const isHoje = d?.data === new Date().toISOString().split('T')[0];
                        return (
                          <div style={{ position: 'absolute', top: 4, left: `${(xs(tooltip.idx) / W) * 100}%`, transform: tooltip.idx > n * 0.65 ? 'translateX(-110%)' : 'translateX(10px)', background: T.card, border: `1.5px solid ${COR}50`, borderRadius: 10, padding: '10px 14px', pointerEvents: 'none' as const, zIndex: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.15)', minWidth: 150 }}>
                            <p style={{ margin: '0 0 6px', fontSize: 11, color: T.mutedFg, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {dataFmt}
                              {isHoje && <span style={{ background: COR, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>hoje</span>}
                            </p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COR, lineHeight: 1 }}>+{ganho.toLocaleString('pt-BR')}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.mutedFg }}>seguidores ganhos</p>
                          </div>
                        );
                      })()}
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </div>

        {/* Métricas do Período */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', boxShadow: T.elevSm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Métricas do Período</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {([7, 14, 30] as Periodo[]).map(d => (
                <button key={d} onClick={() => setPeriodo(d)} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${periodo === d ? COR : T.border}`, background: periodo === d ? COR : T.card, color: periodo === d ? '#fff' : T.mutedFg, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{d}d</button>
              ))}
            </div>
          </div>
          {metricas && (
            <p style={{ fontSize: 11, color: T.mutedFg, margin: '0 0 16px' }}>
              {metricas.periodo?.inicio} → {metricas.periodo?.fim}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <MetCard label="Interações Posts"  value={metricas?.interacoes_posts ?? null} color="#10B981" icon="❤️" />
            <MetCard label="Alcance Reels"     value={metricas?.alcance_reels ?? null}    color="#F59E0B" icon="🎬" />
            <MetCard label="Views Stories"     value={metricas?.views_stories ?? null}    color="#EC4899" icon="📷" />
            <MetCard label="Visitas ao Perfil" value={metricas?.visitas_perfil ?? null}   color={COR}     icon="👁️" />
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </TeamLayout>
  );
}