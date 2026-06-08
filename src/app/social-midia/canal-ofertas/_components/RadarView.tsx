"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ExternalLink, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, MapPin, Calendar, Search } from 'lucide-react'
import { T } from '@/lib/constants'
import { HISTORICO } from '../_data/historico'
import type { ImovelData } from './ImovelCard'

const RADAR_URL = 'https://rm-sirius-otas.lovable.app/radar'

type ImovelSugestao = {
  codigo: string
  cidade: string
  estado: string
  ativacao: string
}

type RadarData = {
  uti: ImovelSugestao[]
  novos: ImovelSugestao[]
}

function getWeekKey(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  const year = d.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7)
  return `canal-ofertas-${year}-W${weekNum.toString().padStart(2, '0')}`
}

function getAllUsedCodes(): Set<string> {
  const codes = new Set<string>()
  HISTORICO.forEach(e => { if (e.codigo) codes.add(e.codigo.toUpperCase()) })
  if (typeof window !== 'undefined') {
    const pattern = /^canal-ofertas-\d{4}-W\d{2}$/
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && pattern.test(key)) {
        try {
          const data: ImovelData[] = JSON.parse(localStorage.getItem(key) || '[]')
          if (Array.isArray(data)) data.forEach(item => { if (item?.codigo) codes.add(item.codigo.toUpperCase()) })
        } catch { /* ignore */ }
      }
    }
  }
  return codes
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: T.mutedFg, marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: 0.4,
}

const card: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`,
  borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: T.elevSm,
}

type Props = { onConfirmar: () => void }

export function RadarView({ onConfirmar }: Props) {
  const [data, setData] = useState<RadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set())
  const [codigos, setCodigos] = useState(['', '', ''])
  const [confirmed, setConfirmed] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'uti' | 'novos'>('uti')
  const [busca, setBusca] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/canal-ofertas/radar')
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const json: RadarData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar imóveis')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setUsedCodes(getAllUsedCodes())
    const selecaoKey = `canal-ofertas-selecao-${getWeekKey()}`
    const saved = localStorage.getItem(selecaoKey)
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 3) setCodigos(parsed)
      } catch { /* ignore */ }
    }
    fetchData()
  }, [fetchData])

  function selecionarImovel(codigo: string) {
    // Preenche o primeiro slot vazio; se tudo preenchido, substitui o último
    const idx = codigos.findIndex(c => !c.trim())
    if (idx !== -1) {
      const next = [...codigos]
      next[idx] = codigo.toUpperCase()
      setCodigos(next)
    } else {
      const next = [...codigos]
      next[2] = codigo.toUpperCase()
      setCodigos(next)
    }
  }

  function removerSlot(i: number) {
    const next = [...codigos]
    next[i] = ''
    setCodigos(next)
  }

  function confirmar() {
    const cleaned = codigos.map(c => c.trim().toUpperCase())
    localStorage.setItem(`canal-ofertas-selecao-${getWeekKey()}`, JSON.stringify(cleaned))
    const weekKey = getWeekKey()
    const semanaData = localStorage.getItem(weekKey)
    if (semanaData) {
      try {
        const parsed: ImovelData[] = JSON.parse(semanaData)
        const isEmpty = parsed.every(p => !p.nome && !p.copyInstagram)
        if (isEmpty) localStorage.removeItem(weekKey)
      } catch { /* ignore */ }
    }
    setConfirmed(true)
    setTimeout(() => { setConfirmed(false); onConfirmar() }, 700)
  }

  const isRepeat = (code: string) => code.trim().length > 0 && usedCodes.has(code.trim().toUpperCase())
  const allFilled = codigos.every(c => c.trim().length > 0)
  const hasRepeat = codigos.some(isRepeat)
  const canConfirm = allFilled && !hasRepeat

  const listaCompleta: ImovelSugestao[] = data ? data[activeFilter] : []
  const lista = useMemo(() => {
    if (!busca.trim()) return listaCompleta
    const q = busca.trim().toLowerCase()
    return listaCompleta.filter(i =>
      i.codigo.toLowerCase().includes(q) ||
      i.cidade.toLowerCase().includes(q) ||
      i.estado.toLowerCase().includes(q)
    )
  }, [listaCompleta, busca])

  return (
    <div>
      {/* Seleção atual — 3 slots sempre visíveis no topo */}
      <div style={card}>
        <p style={{ ...label, marginBottom: 12 }}>Imóveis selecionados esta semana</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {codigos.map((code, i) => {
            const repeat = isRepeat(code)
            const filled = code.trim().length > 0
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                border: `1.5px solid ${repeat ? T.statusErr : filled ? T.statusOk : T.border}`,
                background: repeat ? T.statusErrBg : filled ? T.statusOkBg : T.muted,
                minWidth: 160, flex: 1,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: filled ? (repeat ? T.statusErr : T.statusOk) : T.cinza200,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: filled ? '#fff' : T.mutedFg, flexShrink: 0,
                }}>{i + 1}</span>
                {filled ? (
                  <>
                    <code style={{ fontSize: 13, fontWeight: 700, color: repeat ? T.statusErrDark : T.statusOkDark, letterSpacing: 0.5, flex: 1 }}>
                      {code}
                    </code>
                    {repeat && <AlertTriangle size={13} color={T.statusErr} />}
                    <button onClick={() => removerSlot(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: T.mutedFg, fontSize: 14, lineHeight: 1, padding: '0 2px',
                    }}>×</button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: T.mutedFg, flex: 1 }}>Vazio — clique num imóvel</span>
                )}
              </div>
            )
          })}
        </div>

        {hasRepeat && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 12,
            background: T.statusErrBg, border: `1px solid ${T.statusErr}44`,
            fontSize: 12, color: T.statusErrDark,
          }}>
            Um ou mais imóveis já foram usados em semanas anteriores.
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={!canConfirm}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            background: confirmed ? T.statusOk : canConfirm ? T.primary : T.cinza100,
            color: confirmed ? '#fff' : canConfirm ? T.primaryFg : T.mutedFg,
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
        >
          {confirmed
            ? <><CheckCircle2 size={15} /> Seleção confirmada!</>
            : <><ArrowRight size={15} /> Confirmar e ir para Esta Semana</>}
        </button>
      </div>

      {/* Lista de imóveis sugeridos */}
      <div style={card}>
        {/* Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {(['uti', 'novos'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: activeFilter === f ? T.primary : T.cinza100,
              color: activeFilter === f ? T.primaryFg : T.mutedFg,
            }}>
              {f === 'uti' ? 'Imóveis na UTI' : 'Imóveis Novos'}
              {data && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 10,
                  background: activeFilter === f ? 'rgba(255,255,255,0.25)' : T.cinza200,
                  color: activeFilter === f ? '#fff' : T.cinza700,
                }}>
                  {data[f].length}
                </span>
              )}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={RADAR_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600,
              color: T.mutedFg, textDecoration: 'none', background: T.card,
            }}>
              <ExternalLink size={12} /> Radar
            </a>
            <button onClick={fetchData} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
              cursor: loading ? 'not-allowed' : 'pointer', background: T.card,
              fontSize: 12, fontWeight: 600, color: T.mutedFg,
            }}>
              <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Buscando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Descrição + campo de busca */}
        <p style={{ fontSize: 12, color: T.mutedFg, margin: '0 0 12px', lineHeight: 1.5 }}>
          {activeFilter === 'uti'
            ? 'Imóveis ativos sem nenhuma reserva nos próximos 60 dias — candidatos ideais para impulsionar vendas.'
            : 'Imóveis ativados nos últimos 90 dias — recém-chegados que precisam de exposição.'}
        </p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.mutedFg, pointerEvents: 'none' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por código, cidade ou estado..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 10px 8px 32px',
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontSize: 13, color: T.cardFg, background: T.muted,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          {busca && (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.mutedFg }}>
              {lista.length} de {listaCompleta.length}
            </span>
          )}
        </div>

        {/* Estado de loading / erro */}
        {loading && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: T.mutedFg }}>Buscando imóveis no Nekt...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: T.statusErrBg, border: `1px solid ${T.statusErr}44`, fontSize: 13, color: T.statusErrDark }}>
            {error}
          </div>
        )}

        {/* Total */}
        {!loading && !error && listaCompleta.length > 0 && !busca && (
          <p style={{ fontSize: 12, color: T.mutedFg, margin: '0 0 10px' }}>
            {listaCompleta.length} imóveis encontrados
          </p>
        )}

        {/* Lista */}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 460, overflowY: 'auto' }}>
            {lista.length === 0 ? (
              <p style={{ fontSize: 13, color: T.mutedFg, textAlign: 'center', padding: 24 }}>
                Nenhum imóvel encontrado nesta categoria.
              </p>
            ) : lista.map(imovel => {
              const jaUsado = usedCodes.has(imovel.codigo.toUpperCase())
              const jaSelecionado = codigos.includes(imovel.codigo.toUpperCase())
              return (
                <div
                  key={imovel.codigo}
                  onClick={() => !jaSelecionado && selecionarImovel(imovel.codigo)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 9,
                    border: `1.5px solid ${jaSelecionado ? T.statusOk : T.border}`,
                    background: jaSelecionado ? T.statusOkBg : T.card,
                    cursor: jaSelecionado ? 'default' : 'pointer',
                    transition: 'all 0.12s',
                    opacity: jaUsado && !jaSelecionado ? 0.5 : 1,
                  }}
                >
                  <code style={{
                    fontSize: 13, fontWeight: 700, color: T.cardFg,
                    background: T.muted, padding: '3px 8px', borderRadius: 6,
                    letterSpacing: 0.4, flexShrink: 0, minWidth: 80, textAlign: 'center',
                  }}>
                    {imovel.codigo}
                  </code>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.mutedFg }}>
                      <MapPin size={11} />
                      <span>{imovel.cidade} — {imovel.estado}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.cinza400, marginTop: 2 }}>
                      <Calendar size={10} />
                      <span>Ativo desde {new Date(imovel.ativacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {jaUsado && !jaSelecionado && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: T.cinza100, color: T.cinza600 }}>
                        Já usado
                      </span>
                    )}
                    {jaSelecionado ? (
                      <CheckCircle2 size={16} color={T.statusOk} />
                    ) : (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                        border: `1px solid ${T.border}`, color: T.mutedFg, background: T.muted,
                      }}>
                        Selecionar
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
