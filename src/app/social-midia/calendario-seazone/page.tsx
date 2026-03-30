"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, Lightbulb, PenTool, Settings } from 'lucide-react';
import { T } from '@/lib/constants';
import { CalendarView } from './_components/CalendarView';
import { BacklogView } from './_components/BacklogView';
import { CreateContentView } from './_components/CreateContentView';
import { SettingsView } from './_components/SettingsView';

type Tab = 'calendario' | 'backlog' | 'criar' | 'config';

const TABS: { id: Tab; icon: typeof Calendar; label: string }[] = [
  { id: 'calendario', icon: Calendar, label: 'Calendario' },
  { id: 'backlog', icon: Lightbulb, label: 'Backlog' },
  { id: 'criar', icon: PenTool, label: 'Criar Conteudo' },
  { id: 'config', icon: Settings, label: 'Configuracoes' },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('calendario');

  return (
    <div style={{ minHeight: '100vh', background: T.muted, fontFamily: T.font }}>
      {/* Header */}
      <header style={{
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: T.elevSm,
      }}>
        <Link href="/social-midia" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: 'none', fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Social Midia
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Calendario de Conteudo</span>

        <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: activeTab === id ? T.primary : 'transparent',
                color: activeTab === id ? T.primaryFg : T.mutedFg,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'calendario' && <CalendarView />}
        {activeTab === 'backlog' && <BacklogView />}
        {activeTab === 'criar' && <CreateContentView onNavigate={(tab) => setActiveTab(tab as Tab)} />}
        {activeTab === 'config' && <SettingsView onNavigate={(tab) => setActiveTab(tab as Tab)} />}
      </main>
    </div>
  );
}
