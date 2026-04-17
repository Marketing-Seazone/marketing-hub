import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 3313610;

const METRICS = [
  {
    id: '371e93e0-f0a9-403d-8ada-0da32d72b917',
    reference_key: 'ig:followers_count',
    component: 'number_v1',
    metrics: ['followers'],
    dimensions: [],
    filters: [],
    filter: null,
    sort: [],
    chart_type: null,
    custom: [],
    type: [],
  },
  {
    id: '5d397be5-60ef-42d1-973e-919998ffb96d',
    reference_key: 'ig:new_followers_count',
    component: 'number_v1',
    metrics: ['new_followers'],
    dimensions: [],
    filters: [],
    filter: null,
    sort: [],
    chart_type: null,
    custom: [],
    type: 'new_followers',
  },
];

export async function GET() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const resp = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: ontem,
        end: hoje,
        integration_id: INTEGRATION_ID,
        metrics: METRICS,
      }),
    });

    const data = await resp.json();

    return NextResponse.json({
      total_seguidores: data?.data?.['371e93e0-f0a9-403d-8ada-0da32d72b917']?.values ?? null,
      ganho_hoje: data?.data?.['5d397be5-60ef-42d1-973e-919998ffb96d']?.values ?? null,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}