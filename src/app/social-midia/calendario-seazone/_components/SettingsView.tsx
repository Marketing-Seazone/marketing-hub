"use client";

import { useState, useEffect } from 'react';
import { Save, Loader2, Play } from 'lucide-react';
import { T } from '@/lib/constants';
import { EDITORIALS, FORMATS, QUADROS_FIXOS, getEditorial } from '../_lib/calendar-constants';
import { useAgentPrompts } from '../_hooks/useAgentPrompts';
import type { EditorialSlug, ContentFormat } from '../_lib/types';

interface SettingsViewProps {
  onNavigate: (tab: string) => void;
}

export function SettingsView({ onNavigate }: SettingsViewProps) {
  const { prompts, upsertPrompt } = useAgentPrompts();

  const [editorial, setEditorial] = useState<EditorialSlug>('inteligencia_mercado');
  const [contentFormat, setContentFormat] = useState<ContentFormat>('carrossel');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = prompts.find(
      (p) => p.editorial === editorial && p.format === contentFormat
    );
    setSystemPrompt(existing?.system_prompt ?? '');
    setUserPromptTemplate(existing?.user_prompt_template ?? '');
    setSaved(false);
  }, [editorial, contentFormat, prompts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertPrompt({
        editorial,
        format: contentFormat,
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
      });
      setSaved(true);
    } catch (err) {
      console.error('Error saving prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedEditorial = EDITORIALS.find((e) => e.slug === editorial);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Configuracoes</h2>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Edite os prompts dos agentes por editoria e formato</p>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Editoria</label>
            <select
              value={editorial}
              onChange={(e) => setEditorial(e.target.value as EditorialSlug)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14 }}
            >
              {EDITORIALS.map((e) => (
                <option key={e.slug} value={e.slug}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>Formato</label>
            <select
              value={contentFormat}
              onChange={(e) => setContentFormat(e.target.value as ContentFormat)}
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 16px', fontSize: 14 }}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: selectedEditorial?.color }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T.cinza700 }}>{selectedEditorial?.name}</span>
          <span style={{ fontSize: 12, color: T.cinza400 }}>— {selectedEditorial?.audience}</span>
        </div>
        <p style={{ fontSize: 12, color: T.mutedFg, margin: '0 0 24px' }}>{selectedEditorial?.description}</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 8 }}>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => { setSystemPrompt(e.target.value); setSaved(false); }}
            rows={6}
            placeholder="Instrucoes de comportamento do agente (personalidade, tom, regras)..."
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: T.cinza700, marginBottom: 4 }}>User Prompt Template</label>
          <p style={{ fontSize: 12, color: T.cinza400, margin: '0 0 8px' }}>
            {'Variaveis disponiveis: {{editorial}}, {{formato}}, {{tema}}, {{audiencia}}, {{descricao_editorial}}'}
          </p>
          <textarea
            value={userPromptTemplate}
            onChange={(e) => { setUserPromptTemplate(e.target.value); setSaved(false); }}
            rows={10}
            placeholder={'Ex: Crie um {{formato}} sobre "{{tema}}" para a editoria {{editorial}}...'}
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: saved ? T.statusOkBg : T.primary,
            color: saved ? T.statusOkFg : T.primaryFg,
            border: 'none', borderRadius: 12, padding: '12px 24px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} />
              {saved ? 'Salvo!' : 'Salvar Prompt'}
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Quadros Fixos</h2>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            Conteudos recorrentes da equipe Seazone — clique para criar com o formulario pre-preenchido
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {QUADROS_FIXOS.map((quadro) => {
            const ed = getEditorial(quadro.editorial);
            const formatLabel = FORMATS.find((f) => f.value === quadro.format)?.label;

            return (
              <div
                key={quadro.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.elevMd; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      display: 'flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, fontSize: 14, fontWeight: 800, color: T.primaryFg, background: ed?.color,
                    }}>
                      {quadro.name.charAt(0)}
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>{quadro.name}</h3>
                      <span style={{ fontSize: 12, color: T.cinza400 }}>{ed?.name}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: T.cinza600, lineHeight: 1.5, margin: '0 0 16px' }}>
                  {quadro.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <span style={{ background: ed?.color, color: T.primaryFg, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                    {formatLabel}
                  </span>
                  <span style={{ background: T.cinza50, border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 500, color: T.cinza600 }}>
                    {quadro.audience}
                  </span>
                </div>

                <button
                  onClick={() => onNavigate('criar')}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: T.primary, color: T.primaryFg, border: 'none', borderRadius: 12,
                    padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Play size={15} />
                  Criar agora
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
