"use client";

import { useState, useMemo, useCallback, type DragEvent } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameMonth, addMonths, subMonths, getDay, isToday, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { T } from '@/lib/constants';
import { useContent } from '../_hooks/useContent';
import { EDITORIALS } from '../_lib/calendar-constants';
import { ContentCard } from './ContentCard';
import { ContentModal } from './ContentModal';
import type { Post, EditorialSlug, ContentStatus } from '../_lib/types';

export function CalendarView() {
  const { items, loading, updateItem, deleteItem, fetchItems } = useContent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterEditorial, setFilterEditorial] = useState<EditorialSlug | ''>('');
  const [selectedItem, setSelectedItem] = useState<Post | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPad = getDay(start);
    const padDays = Array.from({ length: startPad }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (startPad - i));
      return d;
    });
    return [...padDays, ...allDays];
  }, [currentMonth]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!item.scheduled_at) return false;
      if (filterEditorial && item.editoria !== filterEditorial) return false;
      return true;
    });
  }, [items, filterEditorial]);

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    try {
      await updateItem(id, { status });
      await fetchItems();
      showToast(`Status atualizado para "${status}"`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Erro ao atualizar status');
    }
  };

  const getItemsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return filteredItems.filter(
      (item) => item.scheduled_at && item.scheduled_at.substring(0, 10) === dayStr
    );
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.scheduled_at === targetDate) return;

    try {
      await updateItem(itemId, { scheduled_at: targetDate });
      await fetchItems();
      const formattedDate = format(parseISO(targetDate), "d 'de' MMMM", { locale: ptBR });
      showToast(`"${item.title}" movido para ${formattedDate}`);
    } catch (err) {
      console.error('Error moving content:', err);
      showToast('Erro ao mover conteudo');
    }
  };

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: '0 0 4px' }}>Calendario</h2>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Visualize e gerencie seus conteudos agendados — arraste para reagendar</p>
        </div>
        <select
          value={filterEditorial}
          onChange={(e) => setFilterEditorial(e.target.value as EditorialSlug | '')}
          style={{ border: `1px solid ${T.border}`, borderRadius: 12, background: T.card, padding: '8px 16px', fontSize: 14 }}
        >
          <option value="">Todas editorias</option>
          {EDITORIALS.map((e) => (
            <option key={e.slug} value={e.slug}>{e.name}</option>
          ))}
        </select>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, padding: '16px 24px' }}>
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: T.mutedFg }}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: T.cardFg, margin: 0, textTransform: 'capitalize' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: T.mutedFg }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.cinza50}` }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.mutedFg }}>
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: T.cinza400 }}>
            Carregando...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, i) => {
              const dayItems = getItemsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dateStr = format(day, 'yyyy-MM-dd');
              const isDragOver = dragOverDate === dateStr;
              const today = isToday(day);

              return (
                <div
                  key={i}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  style={{
                    minHeight: 120,
                    borderBottom: `1px solid ${T.cinza50}`,
                    borderRight: `1px solid ${T.cinza50}`,
                    padding: 8,
                    transition: 'background 0.15s',
                    background: isDragOver ? '#EFF6FF' : today ? '#EFF6FF80' : !isCurrentMonth ? `${T.cinza50}80` : 'transparent',
                    boxShadow: isDragOver ? `inset 0 0 0 2px ${T.primary}60` : today ? `inset 0 0 0 2px ${T.primary}30` : 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', fontSize: 12, fontWeight: today ? 700 : 500, marginBottom: 4,
                      background: today ? T.primary : 'transparent',
                      color: today ? '#fff' : isCurrentMonth ? T.cinza700 : T.cinza200,
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayItems.slice(0, 3).map((item) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        compact
                        draggable
                        onClick={() => setSelectedItem(item)}
                        onStatusChange={handleStatusChange}
                        onUpdate={async (id, updates) => {
                          await updateItem(id, updates);
                          await fetchItems();
                        }}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <span style={{ fontSize: 12, color: T.cinza400 }}>+{dayItems.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <ContentModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.fg, borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 500, color: '#fff', boxShadow: T.elevMd,
        }}>
          <CheckCircle size={18} color="#4ADE80" />
          {toast}
        </div>
      )}
    </div>
  );
}
