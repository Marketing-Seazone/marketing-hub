'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../_lib/supabase';

export interface StoryLink {
  name: string;
  url: string;
}

export type StoryStatus =
  | 'backlog'
  | 'em_aprovacao'
  | 'em_producao'
  | 'aprovado'
  | 'agendado'
  | 'publicado';

export interface Story {
  id: string;
  date: string;
  name: string;
  links: StoryLink[];
  status: StoryStatus;
  published: boolean; // legado — mantido até a migração ser aplicada em todos os ambientes
  created_at: string;
  updated_at: string;
}

// Fallback caso o registro do banco ainda não tenha a coluna `status` populada
function normalizeStatus(row: { status?: StoryStatus | null; published?: boolean | null }): StoryStatus {
  if (row.status) return row.status;
  return row.published ? 'publicado' : 'backlog';
}

export function useStories(year: number, month: number) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const fetchStories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from('stories')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching stories:', error);
    } else {
      setStories(((data ?? []) as Story[]).map((s) => ({ ...s, status: normalizeStatus(s) })));
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const createStory = async (story: { date: string; name: string; links?: StoryLink[] }) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .insert({ date: story.date, name: story.name, links: story.links ?? [], status: 'backlog', published: false })
      .select()
      .single();
    if (error) throw error;
    const created = { ...(data as Story), status: normalizeStatus(data as Story) };
    setStories((prev) => [...prev, created]);
    return created;
  };

  const setStatus = async (id: string, status: StoryStatus) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .update({ status, published: status === 'publicado', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = { ...(data as Story), status: normalizeStatus(data as Story) };
    setStories((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const deleteStory = async (id: string) => {
    const { error } = await getSupabase().from('stories').delete().eq('id', id);
    if (error) throw error;
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStory = async (id: string, updates: { name?: string; links?: StoryLink[]; date?: string }) => {
    const { data, error } = await getSupabase()
      .from('stories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = { ...(data as Story), status: normalizeStatus(data as Story) };
    if (updated.date < startDate || updated.date > endDate) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    } else {
      setStories((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  return { stories, loading, fetchStories, createStory, setStatus, deleteStory, updateStory };
}
