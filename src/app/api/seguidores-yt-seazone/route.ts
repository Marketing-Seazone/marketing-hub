import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2484978; // Seazone YouTube — UCfg66poKH681dEyOXt1xZEw

const METRIC_TOTAL: Record<string, any> = {
  id: '2f132ff5-6406-4af8-b7cb-fb55db259809',
  reference_key: 'youtube:subscriber_count',
  component: 'number_v1', metrics: ['subscriberCount'],
  dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
};

const METRIC_NEW: Record<string, any> = {
  id: '156b0a09-6a04-44bf-8bf3-8a835904e780',
  reference_key: 'youtube:subscribers_gained',
  component: 'number_v1', metrics: ['subscribersGained'],
  dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: ['new_followers'],
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
    const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
    const body = (start: string, end: string, metrics: any[]) =>
      JSON.stringify({ start, end, integration_id: INTEGRATION_ID, metrics });

    const [resHoje, resMes] = await Promise.all([
      fetch(`${BASE}/metrics/get-data`, { method: 'POST', headers, body: body(ontem, hoje, [METRIC_TOTAL, METRIC_NEW]) }),
      fetch(`${BASE}/metrics/get-data`, { method: 'POST', headers, body: body(inicioMes, hoje, [METRIC_NEW]) }),
    ]);

    const dataHoje = await resHoje.json();
    const dataMes = await resMes.json();

    const total_inscritos = v(dataHoje?.data?.[METRIC_TOTAL.id]);
    const ganho_hoje      = v(dataHoje?.data?.[METRIC_NEW.id]);
    const ganho_mes       = v(dataMes?.data?.[METRIC_NEW.id]);

    // Histórico últimos 30 dias
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
            method: 'POST', headers,
            body: body(dia, dia, [METRIC_NEW]),
          });
          const d = await res.json();
          return { data: dia, ganho_dia: v(d?.data?.[METRIC_NEW.id]) ?? 0 };
        } catch {
          return { data: dia, ganho_dia: 0 };
        }
      })
    );

    return NextResponse.json({ total_inscritos, ganho_hoje, ganho_mes, historico });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
