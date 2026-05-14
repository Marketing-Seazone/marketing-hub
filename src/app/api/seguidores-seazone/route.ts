import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660;

const METRIC_TOTAL = {
  id: '60178778-58bd-4d79-85bb-f3b8b8a8ce5d',
  reference_key: 'ig:current_followers_count',
  component: 'number_v1', metrics: ['current_followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: { custom_period: '30ED' }, type: [],
};
const METRIC_NEW = {
  id: 'f4b55367-406e-4e81-ba6a-b22dac9e65f4',
  reference_key: 'ig:new_followers_count',
  component: 'number_v1', metrics: ['new_followers'],
  dimensions: [], filters: [], filter: null, sort: [],
  chart_type: null, custom: [], type: 'new_followers',
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
    const [resHoje, resMes] = await Promise.all([
      fetch(`${BASE}/metrics/get-data`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: ontem, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_TOTAL, METRIC_NEW] }),
      }),
      fetch(`${BASE}/metrics/get-data`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: inicioMes, end: hoje, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
      }),
    ]);

    const dataHoje = await resHoje.json();
    const dataMes = await resMes.json();

    const total_seguidores = v(dataHoje?.data?.['60178778-58bd-4d79-85bb-f3b8b8a8ce5d']);
    const ganho_hoje = v(dataHoje?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']);
    const ganho_mes = v(dataMes?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']);

    // Histórico dos últimos 30 dias — busca paralela no Reportei
    const dias: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dias.push(d.toISOString().split('T')[0]);
    }

    const historico = await Promise.all(
      dias.map(async (dia) => {
        try {
          const res = await fetch(`${BASE}/metrics/get-data`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: dia, end: dia, integration_id: INTEGRATION_ID, metrics: [METRIC_NEW] }),
          });
          const d = await res.json();
          const ganho_dia = v(d?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']) ?? 0;
          return { data: dia, ganho_dia, total_seguidores: null };
        } catch {
          return { data: dia, ganho_dia: 0, total_seguidores: null };
        }
      })
    );

    return NextResponse.json({ total_seguidores, ganho_hoje, ganho_mes, historico });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}