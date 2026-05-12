import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/app/social-midia/calendario-seazone/_lib/supabase';

export interface StoryLink {
  name: string;
  url: string;
}

export interface StoryVistas {
  id: string;
  date: string;
  name: string;
  links: StoryLink[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export function useStoriesVistas(year: number, month: number) {
  const [stories, setStories] = useState<StoryVistas[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const fetchStories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from('stories_vistas')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching stories_vistas:', error);
    } else {
      setStories((data as StoryVistas[]) ?? []);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const createStory = async (story: { date: string; name: string; links?: StoryLink[] }) => {
    const { data, error } = await getSupabase()
      .from('stories_vistas')
      .insert({ date: story.date, name: story.name, links: story.links ?? [], published: false })
      .select()
      .single();
    if (error) throw error;
    setStories((prev) => [...prev, data as StoryVistas]);
    return data as StoryVistas;
  };

  const togglePublished = async (id: string, published: boolean) => {
    const { data, error } = await getSupabase()
      .from('stories_vistas')
      .update({ published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setStories((prev) => prev.map((s) => (s.id === id ? (data as StoryVistas) : s)));
  };

  const deleteStory = async (id: string) => {
    const { error } = await getSupabase().from('stories_vistas').delete().eq('id', id);
    if (error) throw error;
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStory = async (id: string, updates: { name?: string; links?: StoryLink[]; date?: string }) => {
    const { data, error } = await getSupabase()
      .from('stories_vistas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const updated = data as StoryVistas;
    if (updated.date < startDate || updated.date > endDate) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    } else {
      setStories((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  return { stories, loading, fetchStories, createStory, togglePublished, deleteStory, updateStory };
}
