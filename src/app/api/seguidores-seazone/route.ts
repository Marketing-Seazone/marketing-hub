import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660;

/* Nº total atual de seguidores */
const METRIC_TOTAL = {
  id: '2934a81b-e593-47e5-a019-ee7242b6bc2e',
  reference_key: 'ig:followers_count',
  component: 'number_v1', metrics: ['followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: [], type: [],
};

/* Novos seguidores — agregado para ganho_hoje e ganho_mes */
const METRIC_NEW = {
  id: '6614f2ea-e008-4fd3-8e2e-ce40f3104514',
  reference_key: 'ig:new_followers_count',
  component: 'number_v1', metrics: ['new_followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: [], type: 'new_followers',
};

/* Série diária de novos seguidores — chart_v1 com dimensão de data */
const METRIC_NEW_CHART = {
  id: 'c3f7a8e2-9d14-4b56-a031-7e8f92b1d045',
  reference_key: 'ig:new_followers_count',
  component: 'chart_v1', metrics: ['new_followers'],
  dimensions: ['date'],
  filters: [], filter: null, sort: [], chart_type: null, custom: [], type: 'new_followers',
};

/** Converte qualquer formato de data para YYYY-MM-DD */
function toIso(d: string): string {
  if (!d) return '';
  // ISO timestamp: "2026-04-28T00:00:00.000Z" → "2026-04-28"
  if (/^\d{4}-\d{2}-\d{2}T/.test(d)) return d.slice(0, 10);
  // Já está no formato certo: "2026-04-28"
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // Formato brasileiro: "28/04/2026"
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, mon, yr] = d.split('/');
    return `${yr}-${mon}-${day}`;
  }
  return d;
}

/** Parser robusto: lida com number, string e array */
const v = (x: any): number | null => {
  if (x == null || x?.editingWarning || x?.warning) return null;
  const val = x.values;
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val !== '') return Number(val);
  if (Array.isArray(val) && val.length > 0) return typeof val[0] === 'string' ? Number(val[0]) : val[0];
  return null;
};

export async function GET() {
  try {
    const hoje  = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const inicioMes = hoje.slice(0, 7) + '-01';
    const inicio30  = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];

    const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

    /* 3 chamadas paralelas em vez de 31 */
    const [resHoje, resMes, resChart] = await Promise.all([
      fetch(`${BASE}/metrics/get-data`, {
        method: 'POST', headers,
        body: JSON.stringify({ start: ontem, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_TOTAL, METRIC_NEW] }),
      }),
      fetch(`${BASE}/metrics/get-data`, {
        method: 'POST', headers,
        body: JSON.stringify({ start: inicioMes, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
      }),
      fetch(`${BASE}/metrics/get-data`, {
        method: 'POST', headers,
        body: JSON.stringify({ start: inicio30, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW_CHART] }),
      }),
    ]);

    const dataHoje  = await resHoje.json();
    const dataMes   = await resMes.json();
    const dataChart = await resChart.json();

    const total_seguidores = v(dataHoje?.data?.[METRIC_TOTAL.id]);
    const ganho_hoje       = v(dataHoje?.data?.[METRIC_NEW.id]);
    const ganho_mes        = v(dataMes?.data?.[METRIC_NEW.id]);

    /* Monta histórico a partir do chart_v1 */
    const chartRaw = dataChart?.data?.[METRIC_NEW_CHART.id];
    let historico: { data: string; ganho_dia: number }[] = [];

    if (Array.isArray(chartRaw?.labels) && chartRaw.labels.length > 0) {
      const dataArr: any[] = chartRaw.values?.[0]?.data ?? [];
      historico = (chartRaw.labels as string[]).map((label, i) => ({
        data: toIso(label),
        ganho_dia: typeof dataArr[i] === 'number' ? dataArr[i]
          : typeof dataArr[i] === 'string' ? Number(dataArr[i]) || 0
          : 0,
      }));
    }

    /* Fallback: se chart_v1 não retornar dados, faz queries por dia */
    if (historico.length === 0) {
      const dias: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dias.push(d.toISOString().split('T')[0]);
      }
      historico = await Promise.all(
        dias.map(async (dia) => {
          try {
            const res = await fetch(`${BASE}/metrics/get-data`, {
              method: 'POST', headers,
              body: JSON.stringify({ start: dia, end: dia, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
            });
            const d = await res.json();
            return { data: dia, ganho_dia: v(d?.data?.[METRIC_NEW.id]) ?? 0 };
          } catch {
            return { data: dia, ganho_dia: 0 };
          }
        })
      );
    }

    return NextResponse.json({ total_seguidores, ganho_hoje, ganho_mes, historico });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
