"use client";

import { useState, type DragEvent } from 'react';
import { T } from '@/lib/constants';
import { getEditorial } from '../_lib/calendar-constants';
import type { Post, ContentStatus, ContentFormat } from '../_lib/types';

const STATUS_OPTIONS: { value: ContentStatus; label: string; bg: string; fg: string }[] = [
  { value: 'ideia', label: 'Em aprovacao', bg: '#FEF9C3', fg: '#A16207' },
  { value: 'aprovado', label: 'Aprovado', bg: '#F3E8FF', fg: '#7C3AED' },
  { value: 'producao', label: 'Em producao', bg: '#FFEDD5', fg: '#EA580C' },
  { value: 'agendado', label: 'Agendado', bg: '#DBEAFE', fg: '#2563EB' },
  { value: 'publicado', label: 'Publicado', bg: '#DCFCE7', fg: '#16A34A' },
  { value: 'rascunho', label: 'Rascunho', bg: '#F3F4F6', fg: '#6B7280' },
  { value: 'gravacao', label: 'Gravacao', bg: '#F3F4F6', fg: '#6B7280' },
  { value: 'edicao', label: 'Edicao', bg: '#F3F4F6', fg: '#6B7280' },
];

export function getStatusTag(status: ContentStatus) {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  return option
    ? { label: option.label, bg: option.bg, fg: option.fg }
    : { label: status, bg: T.cinza50, fg: T.cinza600 };
}

const FORMAT_OPTIONS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'feed', label: 'Post Fixo' },
  { value: 'reels', label: 'Reels' },
  { value: 'stories', label: 'Story' },
];

interface ContentCardProps {
  item: Post;
  compact?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onStatusChange?: (id: string, status: ContentStatus) => void;
  onUpdate?: (id: string, updates: Partial<Post>) => void;
}

export function ContentCard({ item, compact, onClick, draggable, onStatusChange, onUpdate }: ContentCardProps) {
  const editorial = getEditorial(item.editoria);
  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === item.formato)?.label ?? item.formato;
  const tag = getStatusTag(item.status);
  const [editingField, setEditingField] = useState<'title' | 'notas' | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLDivElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.opacity = '1';
  };

  return (
    <div
      onClick={editingField ? undefined : onClick}
      draggable={draggable && !editingField}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: compact ? 8 : 12,
        cursor: draggable && !editingField ? 'grab' : 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.elevMd; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: editorial?.color, flexShrink: 0 }} />
        {!compact && (
          <span style={{ fontSize: 12, fontWeight: 500, color: T.mutedFg }}>{editorial?.name}</span>
        )}
        {onStatusChange ? (
          <select
            value={item.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); onStatusChange(item.id, e.target.value as ContentStatus); }}
            style={{
              background: tag.bg,
              color: tag.fg,
              border: `1px solid ${tag.bg}`,
              borderRadius: 6,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <span style={{ background: tag.bg, color: tag.fg, borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>
            {tag.label}
          </span>
        )}
      </div>

      {onUpdate && editingField === 'title' ? (
        <input
          autoFocus
          defaultValue={item.title}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val && val !== item.title) onUpdate(item.id, { title: val });
            setEditingField(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={{
            width: '100%',
            border: `1px solid ${T.primary}`,
            borderRadius: 6,
            padding: '2px 4px',
            fontSize: compact ? 12 : 14,
            fontWeight: 600,
            color: T.cardFg,
            outline: 'none',
          }}
        />
      ) : (
        <p
          style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: T.cardFg, margin: 0, lineHeight: 1.3, cursor: onUpdate ? 'text' : undefined }}
          onClick={onUpdate ? (e) => { e.stopPropagation(); setEditingField('title'); } : undefined}
        >
          {item.title}
        </p>
      )}

      {compact && (editorial?.name || formatLabel) && (
        <p style={{ fontSize: 12, color: T.mutedFg, margin: '2px 0 0' }}>
          <span style={{ fontWeight: 700, color: editorial?.color }}>{editorial?.name}</span>
          {editorial?.name && formatLabel ? ' · ' : ''}
          {formatLabel}
        </p>
      )}

      {onUpdate && editingField === 'notas' ? (
        <textarea
          autoFocus
          defaultValue={item.notas || ''}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val !== (item.notas || '')) onUpdate(item.id, { notas: val || null });
            setEditingField(null);
          }}
          rows={2}
          style={{
            width: '100%',
            border: `1px solid ${T.primary}`,
            borderRadius: 6,
            padding: '2px 4px',
            fontSize: 12,
            color: T.mutedFg,
            outline: 'none',
            resize: 'vertical',
            marginTop: 4,
          }}
        />
      ) : (item.notas || onUpdate) ? (
        <p
          style={{ fontSize: 12, color: T.mutedFg, margin: '4px 0 0', cursor: onUpdate ? 'text' : undefined }}
          onClick={onUpdate ? (e) => { e.stopPropagation(); setEditingField('notas'); } : undefined}
        >
          {item.notas || 'Adicionar descricao...'}
        </p>
      ) : null}

      {(!compact || onUpdate) && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {onUpdate ? (
            <select
              value={item.formato}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onUpdate(item.id, { formato: e.target.value as ContentFormat }); }}
              style={{
                background: T.cinza50,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
                color: T.cinza600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <span style={{ background: T.cinza50, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: T.cinza600 }}>
              {formatLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
