import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../_lib/supabase';
import type { AgentPrompt } from '../_lib/types';

const LS_KEY = 'seazone_agent_prompts';

function readLocalStorage(): AgentPrompt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(prompts: AgentPrompt[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(prompts));
}

export function useAgentPrompts() {
  const [prompts, setPrompts] = useState<AgentPrompt[]>(readLocalStorage);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('agent_prompts')
        .select('*')
        .order('editorial');

      if (!error && data && data.length > 0) {
        const typed = data as AgentPrompt[];
        setPrompts(typed);
        writeLocalStorage(typed);
      }
    } catch {
      // Supabase unavailable — localStorage is the fallback
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const upsertPrompt = async (prompt: Omit<AgentPrompt, 'id' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const key = `${prompt.editorial}__${prompt.format}`;

    setPrompts((prev) => {
      const idx = prev.findIndex(
        (p) => p.editorial === prompt.editorial && p.format === prompt.format
      );
      const entry: AgentPrompt = {
        id: idx >= 0 ? prev[idx].id : key,
        ...prompt,
        updated_at: now,
      };
      const next = idx >= 0 ? prev.map((p, i) => (i === idx ? entry : p)) : [...prev, entry];
      writeLocalStorage(next);
      return next;
    });

    try {
      await getSupabase()
        .from('agent_prompts')
        .upsert(prompt, { onConflict: 'editorial,format' })
        .select()
        .single();
    } catch {
      // localStorage already saved — Supabase sync is best-effort
    }
  };

  return { prompts, loading, fetchPrompts, upsertPrompt };
}
