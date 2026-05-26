import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 3573142;

const METRIC_NEW = { id: '5d397be5-60ef-42d1-973e-919998ffb96d', reference_key: 'ig:new_followers_count', component: 'number_v1', metrics: ['new_followers'], dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: 'new_followers' };

const v = (x: any) =>
  typeof x?.values === 'number' ? x.values
  : Array.isArray(x?.values) ? x.values[0]
  : null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');       // formato: "2026-02"
    const start = searchParams.get('start');   // formato: "2026-02-01"
    const end = searchParams.get('end');       // formato: "2026-02-28"

    let inicio: string
    let fim: string

    if (mes) {
      const [ano, m] = mes.split('-');
      inicio = `${mes}-01`;
      const ultimoDia = new Date(Number(ano), Number(m), 0).getDate();
      fim = `${mes}-${String(ultimoDia).padStart(2, '0')}`;
    } else if (start && end) {
      inicio = start;
      fim = end;
    } else {
      return NextResponse.json({ error: 'Informe mes ou start+end' }, { status: 400 });
    }

    const resp = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: inicio,
        end: fim,
        integration_id: INTEGRATION_ID,
        metrics: [METRIC_NEW],
      }),
    });

    const data = await resp.json();
    if (data?.data?.exception || data?.code === 'integration_expired') {
      return NextResponse.json({
        error: data?.data?.exception?.message ?? 'Integração do Instagram (Vistas) expirou no Reportei. Reautorize em app.reportei.com.',
        code: data?.code ?? 'reportei_error',
      }, { status: 502 });
    }
    const ganho = v(data?.data?.['5d397be5-60ef-42d1-973e-919998ffb96d']);

    return NextResponse.json({ ganho, inicio, fim });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}