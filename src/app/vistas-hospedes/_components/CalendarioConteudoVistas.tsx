'use client';

import { useState } from 'react';
import { Calendar, Film, Lightbulb, PenTool } from 'lucide-react';
import { T } from '@/lib/constants';
import { CalendarViewVistas } from './CalendarViewVistas';
import { StoriesViewVistas } from './StoriesViewVistas';
import { BacklogViewVistas } from './BacklogViewVistas';
import { CreateContentViewVistas } from './CreateContentViewVistas';

type Tab = 'calendario' | 'stories' | 'criar' | 'backlog';

const TABS: { id: Tab; icon: typeof Calendar; label: string }[] = [
  { id: 'calendario', icon: Calendar, label: 'Calendário' },
  { id: 'stories', icon: Film, label: 'Stories' },
  { id: 'criar', icon: PenTool, label: 'Criar Conteúdo' },
  { id: 'backlog', icon: Lightbulb, label: 'Backlog' },
];

export function CalendarioConteudoVistas() {
  const [activeTab, setActiveTab] = useState<Tab>('calendario');

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: '8px 8px 0 0',
              fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: activeTab === id ? T.card : 'transparent',
              color: activeTab === id ? T.primary : T.mutedFg,
              borderBottom: activeTab === id ? `2px solid ${T.primary}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        {activeTab === 'calendario' && <CalendarViewVistas />}
        {activeTab === 'stories' && <StoriesViewVistas />}
        {activeTab === 'criar' && <CreateContentViewVistas onNavigate={(tab) => setActiveTab(tab as Tab)} />}
        {activeTab === 'backlog' && <BacklogViewVistas />}
      </div>
    </div>
  );
}
