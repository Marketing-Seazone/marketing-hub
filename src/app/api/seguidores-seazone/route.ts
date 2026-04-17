import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660;

export async function GET() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const body = JSON.stringify({
      start: ontem,
      end: hoje,
      integration_id: INTEGRATION_ID,
      metrics: [
        {
          id: '60178778-58bd-4d79-85bb-f3b8b8a8ce5d',
          reference_key: 'ig:current_followers_count',
          component: 'number_v1',
          metrics: ['current_followers'],
          dimensions: [],
          filters: [],
          filter: null,
          sort: [],
          chart_type: null,
          custom: { custom_period: '30ED' },
          type: []
        },
        {
          id: 'f4b55367-406e-4e81-ba6a-b22dac9e65f4',
          reference_key: 'ig:new_followers_count',
          component: 'number_v1',
          metrics: ['new_followers'],
          dimensions: [],
          filters: [],
          filter: null,
          sort: [],
          chart_type: null,
          custom: [],
          type: 'new_followers'
        }
      ]
    });

    const resp = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await resp.json();
    const v = (x: any) =>
      typeof x?.values === 'number'
        ? x.values
        : Array.isArray(x?.values)
        ? x.values[0]
        : null;

    return NextResponse.json({
      total_seguidores: v(data?.data?.['60178778-58bd-4d79-85bb-f3b8b8a8ce5d']),
      ganho_hoje: v(data?.data?.['f4b55367-406e-4e81-ba6a-b22dac9e65f4']),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
