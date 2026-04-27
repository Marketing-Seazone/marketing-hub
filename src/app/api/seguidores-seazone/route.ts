import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const METRIC_TOTAL = {
  id: '60178778-58bd-4d79-85bb-f3b8b8a8ce5d',
  reference_key: 'ig:current_followers_count',
  component: 'number_v1', metrics: ['current_followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: { custom_period: '30ED' }, type: []
};
const METRIC_NEW = {
  id: 'f4b55367-406e-4e81-ba6a-b22dac9e65f4',
  reference_key: 'ig:new_followers_count',
  component: 'number_v1', metrics: ['new_followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: [], type: 'new_followers'
};

const v = (x: any) =>
  typeof x?.values === 'number' ? x.values
  : Array.isArray(x?.values) ? x.values[0]
  : null;

export async function GET() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const inicioMes = hoje.slice(0, 7) + '-01';

    // Total + ganho hoje
    const respHoje = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: ontem, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_TOTAL, METRIC_NEW] }),
    });
    const dataHoje = await respHoje.json();
    const total_seguidores = v(dataHoje?.data?.['60178778-58bd-4d79-85bb-f3b8b8a8ce5d']);
    const ganho_hoje = v(dataHoje?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']);

    // Ganho acumulado do mês
    const respMes = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: inicioMes, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
    });
    const dataMes = await respMes.json();
    const ganho_mes = v(dataMes?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']);

    // Salva hoje
    if (total_seguidores !== null && ganho_hoje !== null) {
      await supabase.from('seguidores_seazone_historico').upsert(
        { data: hoje, total_seguidores, ganho_dia: ganho_hoje },
        { onConflict: 'data' }
      );
    }

    // Preenche dias faltando nos últimos 30 dias
    const data30 = new Date(); data30.setDate(data30.getDate() - 30);
    const inicioJanela = data30.toISOString().split('T')[0];
    const { data: existentes } = await supabase
      .from('seguidores_seazone_historico').select('data').gte('data', inicioJanela);
    const datasExistentes = new Set((existentes || []).map((r: any) => r.data));
    const diasFaltando: string[] = [];
    for (let i = 29; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (!datasExistentes.has(iso)) diasFaltando.push(iso);
    }
    for (const dia of diasFaltando) {
      try {
        const resp = await fetch(`${BASE}/metrics/get-data`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: dia, end: dia, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
        });
        const d = await resp.json();
        const ganho = v(d?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']);
        if (ganho !== null) {
          await supabase.from('seguidores_seazone_historico').upsert(
            { data: dia, ganho_dia: ganho }, { onConflict: 'data' }
          );
        }
      } catch {}
    }

    // Retorna histórico
    const { data: historico } = await supabase
      .from('seguidores_seazone_historico').select('data, total_seguidores, ganho_dia')
      .gte('data', inicioJanela).order('data', { ascending: true });

    return NextResponse.json({ total_seguidores, ganho_hoje, ganho_mes, historico: historico || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}