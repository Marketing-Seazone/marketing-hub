import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/app/social-midia/calendario-seazone/_lib/supabase';
import type { Post } from '@/app/social-midia/calendario-seazone/_lib/types';

export function useContentVistas() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from('posts_vistas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts_vistas:', error);
    } else {
      setItems((data as Post[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (item: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'published_at'>) => {
    const { data, error } = await getSupabase()
      .from('posts_vistas')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [data as Post, ...prev]);
    return data as Post;
  };

  const updateItem = async (id: string, updates: Partial<Post>) => {
    const { data, error } = await getSupabase()
      .from('posts_vistas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => prev.map((item) => (item.id === id ? (data as Post) : item)));
    return data as Post;
  };

  const deleteItem = async (id: string) => {
    const { error } = await getSupabase().from('posts_vistas').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, fetchItems, createItem, updateItem, deleteItem };
}
