"use client";

import { useState, useMemo, useCallback, type DragEvent } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameMonth, addMonths, subMonths, getDay, isToday, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle, Plus, X } from 'lucide-react';
import { T } from '@/lib/constants';
import { useContent } from '../_hooks/useContent';
import { EDITORIALS } from '../_lib/calendar-constants';
import { ContentCard } from './ContentCard';
import { ContentModal } from './ContentModal';
import { QuickCreateModal } from './QuickCreateModal';
import type { Post, EditorialSlug, ContentStatus } from '../_lib/types';

// Modal com todos os posts do dia
interface DayModalProps {
  date: string;
  items: Post[];
  onClose: () => void;
  onSelectItem: (item: Post) => void;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onDuplicate: (item: Post) => void;
  onUpdate: (id: string, updates: Partial<Post>) => Promise<void>;
}

function DayModal({ date, items, onClose, onSelectItem, onStatusChange, onDuplicate, onUpdate }: DayModalProps) {
  const [d, m, y] = [
    parseInt(date.substring(8, 10)),
    parseInt(date.substring(5, 7)) - 1,
    parseInt(date.substring(0, 4)),
  ];
  const displayDate = format(new Date(y, m, d), "d 'de' MMMM yyyy", { locale: ptBR });

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 520, background: T.card, borderRadius: 14,
          padding: 24, boxShadow: T.elevMd, maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: '0 0 2px', textTransform: 'capitalize' }}>
              {displayDate}
            </h3>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
              {items.length} {items.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.cinza400 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              compact={false}
              onClick={() => { onClose(); onSelectItem(item); }}
              onStatusChange={onStatusChange}
              onDuplicate={onDuplicate}
              onUpdate={async (id, updates) => { await onUpdate(id, updates); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarView() {
  const { items, loading, updateItem, deleteItem, fetchItems, createItem } = useContent();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterEditorial, setFilterEditorial] = useState<EditorialSlug | ''>('');
  const [selectedItem, setSelectedItem] = useState<Post | null>(null);
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

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

  const handleDuplicate = async (item: Post) => {
    try {
      await createItem({
        title: `${item.title} (copia)`,
        editoria: item.editoria,
        formato: item.formato,
        canal: item.canal,
        status: 'ideia',
        scheduled_at: item.scheduled_at,
        tema: item.tema,
        estrutura: item.estrutura,
        copy: item.copy,
        notas: item.notas,
      });
      await fetchItems();
      showToast('Post duplicado!');
    } catch {
      showToast('Erro ao duplicar');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => setDragOverDate(null);

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item || item.scheduled_at === targetDate) return;
    try {
      await updateItem(itemId, { scheduled_at: targetDate });
      await fetchItems();
      const formattedDate = format(parseISO(targetDate), "d 'de' MMMM", { locale: ptBR });
      showToast(`"${item.title}" movido para ${formattedDate}`);
    } catch {
      showToast('Erro ao mover conteudo');
    }
  };

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const dayModalItems = useMemo(() => {
    if (!dayModalDate) return [];
    return filteredItems.filter(
      (item) => item.scheduled_at && item.scheduled_at.substring(0, 10) === dayModalDate
    );
  }, [dayModalDate, filteredItems]);

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

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '130px' }}>
            {days.map((day, i) => {
              const dayItems = getItemsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dateStr = format(day, 'yyyy-MM-dd');
              const isDragOver = dragOverDate === dateStr;
              const today = isToday(day);
              const isHovered = hoveredDate === dateStr;
              const hasMore = dayItems.length > 2;

              return (
                <div
                  key={i}
                  onMouseEnter={() => isCurrentMonth && setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  style={{
                    height: 130, overflow: 'hidden',
                    borderBottom: `1px solid ${T.cinza50}`,
                    borderRight: `1px solid ${T.cinza50}`,
                    padding: 8,
                    transition: 'background 0.15s',
                    background: isDragOver
                      ? T.pendingBg
                      : today
                        ? `${T.pendingBg}80`
                        : !isCurrentMonth
                          ? `${T.cinza50}80`
                          : 'transparent',
                    boxShadow: isDragOver
                      ? `inset 0 0 0 2px ${T.primary}60`
                      : today
                        ? `inset 0 0 0 2px ${T.primary}30`
                        : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    {/* Numero do dia — clicavel para abrir modal do dia */}
                    <span
                      onClick={() => isCurrentMonth && dayItems.length > 0 && setDayModalDate(dateStr)}
                      style={{
                        display: 'inline-flex', width: 24, height: 24,
                        alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', fontSize: 12, fontWeight: today ? 700 : 500,
                        background: today ? T.primary : 'transparent',
                        color: today ? T.primaryFg : isCurrentMonth ? T.cinza700 : T.cinza200,
                        flexShrink: 0,
                        cursor: isCurrentMonth && dayItems.length > 0 ? 'pointer' : 'default',
                      }}
                    >
                      {format(day, 'd')}
                    </span>
                    {isCurrentMonth && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuickCreateDate(dateStr); }}
                        title="Adicionar post"
                        style={{
                          background: 'none', border: `1px solid ${T.border}`, cursor: 'pointer',
                          color: T.cinza400, padding: '1px 4px', borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                    {dayItems.slice(0, 2).map((item) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        compact
                        draggable
                        onClick={() => setSelectedItem(item)}
                        onStatusChange={handleStatusChange}
                        onDuplicate={handleDuplicate}
                        onUpdate={async (id, updates) => {
                          await updateItem(id, updates);
                          await fetchItems();
                        }}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => setDayModalDate(dateStr)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: T.primary, fontWeight: 600,
                          padding: '1px 2px', textAlign: 'left',
                        }}
                      >
                        +{dayItems.length - 2} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal do dia */}
      {dayModalDate && (
        <DayModal
          date={dayModalDate}
          items={dayModalItems}
          onClose={() => setDayModalDate(null)}
          onSelectItem={(item) => { setDayModalDate(null); setSelectedItem(item); }}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          onUpdate={async (id, updates) => { await updateItem(id, updates); await fetchItems(); }}
        />
      )}

      {selectedItem && (
        <ContentModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      )}

      {quickCreateDate && (
        <QuickCreateModal
          date={quickCreateDate}
          onClose={() => setQuickCreateDate(null)}
          onCreate={async (item) => {
            const created = await createItem(item);
            showToast('Post criado com sucesso!');
            return created;
          }}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.fg, borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 500, color: T.primaryFg, boxShadow: T.elevMd,
        }}>
          <CheckCircle size={18} color={T.statusOk} />
          {toast}
        </div>
      )}
    </div>
  );
}
