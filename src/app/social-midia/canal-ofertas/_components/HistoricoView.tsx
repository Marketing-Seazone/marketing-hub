"use client"

import { useState } from 'react'
import { Camera, MessageCircle, Copy, Check, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { T } from '@/lib/constants'
import { HISTORICO, MESES_ORDENADOS, type HistoricoEntry } from '../_data/historico'

const CUPOM_IG = 'OFERTASINSTA2026'
const CUPOM_WA = 'OFERTASWHATS2026'

function EntryCard({ entry }: { entry: HistoricoEntry }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'instagram' | 'whatsapp'>('instagram')
  const [copied, setCopied] = useState(false)
  const hasCopy = !!(entry.copyInstagram || entry.copyWhatsapp)

  async function copiar() {
    const text = tab === 'instagram' ? entry.copyInstagram : entry.copyWhatsapp
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentCopy = tab === 'instagram' ? entry.copyInstagram : entry.copyWhatsapp

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: T.elevSm,
    }}>
      {/* Row principal */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: hasCopy ? 'pointer' : 'default',
      }} onClick={() => hasCopy && setExpanded(p => !p)}>
        <code style={{
          fontSize: 12, fontWeight: 700, color: T.cardFg,
          background: T.muted, padding: '3px 8px', borderRadius: 6,
          letterSpacing: 0.3, flexShrink: 0,
        }}>
          {entry.codigo}
        </code>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.mutedFg }}>
          <Calendar size={12} />
          <span style={{ fontSize: 12 }}>{entry.dataPublicacao}</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasCopy ? (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: T.statusOkBg, color: T.statusOkDark,
            }}>
              Copy salva
            </span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: T.cinza50, color: T.cinza600,
            }}>
              Sem copy
            </span>
          )}
          {hasCopy && (
            <span style={{ color: T.mutedFg }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>
      </div>

      {/* Copy expandida */}
      {expanded && hasCopy && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 16px', background: '#fafafa' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 10 }}>
            {(['instagram', 'whatsapp'] as const).map(t => (
              <button key={t} onClick={(e) => { e.stopPropagation(); setTab(t) }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                background: tab === t ? T.primary : T.muted,
                color: tab === t ? T.primaryFg : T.mutedFg,
              }}>
                {t === 'instagram' ? <Camera size={11} /> : <MessageCircle size={11} />}
                {t === 'instagram' ? 'Instagram' : 'WhatsApp'}
              </button>
            ))}
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: tab === 'instagram' ? '#dbeafe' : '#dcfce7',
              color: tab === 'instagram' ? T.pendingFg : T.statusOkDark,
            }}>
              {tab === 'instagram' ? CUPOM_IG : CUPOM_WA}
            </span>
          </div>

          {currentCopy ? (
            <>
              <div style={{
                background: T.muted, borderRadius: 8, padding: '10px 12px',
                fontSize: 12, color: T.cardFg, lineHeight: 1.65,
                whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto',
                marginBottom: 8,
              }}>
                {currentCopy}
              </div>
              <button onClick={(e) => { e.stopPropagation(); copiar() }} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: copied ? T.statusOkBg : T.card,
                color: copied ? T.statusOkDark : T.cardFg, transition: 'all 0.15s',
              }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </>
          ) : (
            <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
              Copy não disponível para {tab === 'instagram' ? 'Instagram' : 'WhatsApp'}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function HistoricoView() {
  const [mesSelecionado, setMesSelecionado] = useState<string>(MESES_ORDENADOS[MESES_ORDENADOS.length - 1])

  const entriesDoMes = HISTORICO.filter(e => e.mes === mesSelecionado)
    .slice()
    .reverse()

  const totalComCopy = HISTORICO.filter(e => e.copyInstagram).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Histórico
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: 0 }}>
            Ofertas publicadas
          </p>
          <span style={{ fontSize: 13, color: T.mutedFg }}>
            {HISTORICO.length} imóveis · {totalComCopy} com copy salva
          </span>
        </div>
      </div>

      {/* Seletor de mês */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {MESES_ORDENADOS.map(mes => (
          <button key={mes} onClick={() => setMesSelecionado(mes)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            background: mesSelecionado === mes ? T.primary : T.cinza100,
            color: mesSelecionado === mes ? T.primaryFg : T.mutedFg,
          }}>
            {mes}
          </button>
        ))}
      </div>

      {/* Lista de entradas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entriesDoMes.length === 0 ? (
          <p style={{ fontSize: 13, color: T.mutedFg, textAlign: 'center', padding: 40 }}>
            Nenhum imóvel registrado neste mês.
          </p>
        ) : (
          entriesDoMes.map((entry, i) => (
            <EntryCard key={`${entry.codigo}-${i}`} entry={entry} />
          ))
        )}
      </div>

      <div style={{
        marginTop: 20, padding: '10px 14px', background: T.cinza50, borderRadius: 8,
        fontSize: 12, color: T.mutedFg,
      }}>
        Dados importados da planilha "Reservas - Canal de Ofertas.xlsx". Imóveis de março e abril não têm copy salva pois foram publicados antes do artefato existir.
      </div>
    </div>
  )
}
