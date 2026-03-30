import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../_lib/supabase';
import type { Post, ContentStatus } from '../_lib/types';

export function useContent() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
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
      .from('posts')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [data as Post, ...prev]);
    return data as Post;
  };

  const updateItem = async (id: string, updates: Partial<Post>) => {
    const { data, error } = await getSupabase()
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => prev.map((item) => (item.id === id ? (data as Post) : item)));
    return data as Post;
  };

  const deleteItem = async (id: string) => {
    const { error } = await getSupabase().from('posts').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, fetchItems, createItem, updateItem, deleteItem };
}
