import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2484978; // Seazone YouTube — UCfg66poKH681dEyOXt1xZEw

const METRICS = {
  views: {
    id: 'a191d747-1df4-448f-a2c2-ef823c744181',
    reference_key: 'youtube:views',
    component: 'number_v1', metrics: ['views'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  watch_time: {
    id: '00ea4872-b112-4707-9c03-60aeb823d05d',
    reference_key: 'youtube:estimated_minutes_watched',
    component: 'number_v1', metrics: ['estimatedMinutesWatched'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  avg_view_pct: {
    id: '423ad295-b39b-4077-9995-ad87c408b080',
    reference_key: 'youtube:average_view_percentage',
    component: 'number_v1', metrics: ['averageViewPercentage'],
    dimensions: ['channel'], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  subscribers_gained: {
    id: '156b0a09-6a04-44bf-8bf3-8a835904e780',
    reference_key: 'youtube:subscribers_gained',
    component: 'number_v1', metrics: ['subscribersGained'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: ['new_followers'],
  },
  likes: {
    id: '23a9d3b8-9d90-457e-a4b6-0d0921b563a4',
    reference_key: 'youtube:likes',
    component: 'number_v1', metrics: ['likes'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  shares: {
    id: 'fb15eb3b-4e67-42a2-9ae0-159ac58a8de7',
    reference_key: 'youtube:shares',
    component: 'number_v1', metrics: ['shares'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  dislikes: {
    id: 'cea95959-0f68-46aa-8bf5-044bbbf7a002',
    reference_key: 'youtube:dislikes',
    component: 'number_v1', metrics: ['dislikes'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  subscriber_count: {
    id: '2f132ff5-6406-4af8-b7cb-fb55db259809',
    reference_key: 'youtube:subscriber_count',
    component: 'number_v1', metrics: ['subscriberCount'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
};

const v = (x: any) => {
  if (x == null) return null;
  const val = x.values;
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val !== '') return Number(val);
  if (Array.isArray(val) && val.length > 0) return typeof val[0] === 'string' ? Number(val[0]) : val[0];
  return null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') ?? '';
  const end   = searchParams.get('end')   ?? '';

  if (!start || !end) {
    return NextResponse.json({ error: 'Parâmetros start e end são obrigatórios' }, { status: 400 });
  }

  try {
    const inicio = start;
    const fim    = end;

    const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

    const allMetrics = Object.values(METRICS);

    const res = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST', headers,
      body: JSON.stringify({ start: inicio, end: fim, integration_id: INTEGRATION_ID, metrics: allMetrics }),
    });

    const data = await res.json();
    const avgPctRaw = v(data?.data?.[METRICS.avg_view_pct.id]);

    return NextResponse.json({
      periodo:            { inicio, fim },
      views:              v(data?.data?.[METRICS.views.id]),
      watch_time:         v(data?.data?.[METRICS.watch_time.id]),
      avg_view_pct:       avgPctRaw !== null ? Math.round(avgPctRaw * 10) / 10 : null,
      subscribers_gained: v(data?.data?.[METRICS.subscribers_gained.id]),
      likes:              v(data?.data?.[METRICS.likes.id]),
      shares:             v(data?.data?.[METRICS.shares.id]),
      dislikes:           v(data?.data?.[METRICS.dislikes.id]),
      subscriber_count:   v(data?.data?.[METRICS.subscriber_count.id]),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
