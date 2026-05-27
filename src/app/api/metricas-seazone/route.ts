import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660; // Seazone Instagram — destinoseazone

const METRICS = {
  followers_count: {
    id: '2934a81b-e593-47e5-a019-ee7242b6bc2e',
    reference_key: 'ig:followers_count',
    component: 'number_v1', metrics: ['followers'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  new_followers: {
    id: '6614f2ea-e008-4fd3-8e2e-ce40f3104514',
    reference_key: 'ig:new_followers_count',
    component: 'number_v1', metrics: ['new_followers'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: 'new_followers',
  },
  views: {
    id: 'ed7285e2-5353-4053-91fc-ba38bd71b991',
    reference_key: 'ig:views',
    component: 'number_v1', metrics: ['views'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: 'total_impressions',
  },
  profile_views: {
    id: '97087b86-40fb-4f03-8889-d953b5247c0e',
    reference_key: 'ig:profile_views',
    component: 'number_v1', metrics: ['profile_views'],
    dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  total_interactions_post: {
    id: '15f65020-0a42-4111-bbb3-d2e1345f43f7',
    reference_key: 'ig:post_total_interactions_count',
    component: 'number_v1', metrics: ['total_interactions'],
    dimensions: ['post'], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  followers_gender: {
    id: '18fc67c4-c9df-4973-835a-94e369f51783',
    reference_key: 'ig:followers_gender',
    component: 'chart_v1', metrics: ['followers'],
    dimensions: ['gender'], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
  followers_gender_age: {
    id: '6d29d27e-b234-44fe-bd9e-2f64a8803ad3',
    reference_key: 'ig:followers_gender_age',
    component: 'chart_v1', metrics: ['followers'],
    dimensions: ['age', 'gender'], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [],
  },
};

const vNum = (x: any): number | null => {
  if (x == null || x?.editingWarning || x?.warning) return null;
  const val = x.values;
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val !== '') return Number(val);
  if (Array.isArray(val) && val.length > 0) return typeof val[0] === 'number' ? val[0] : Number(val[0]);
  return null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoje = new Date().toISOString().split('T')[0];

    let inicio: string, fim: string;
    const startParam = searchParams.get('start');
    const endParam   = searchParams.get('end');
    if (startParam && endParam) {
      inicio = startParam; fim = endParam;
    } else {
      const dias = parseInt(searchParams.get('dias') ?? '7');
      fim    = hoje;
      inicio = new Date(Date.now() - dias * 86400000).toISOString().split('T')[0];
    }

    const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

    const res = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST', headers,
      body: JSON.stringify({
        start: inicio, end: fim,
        integration_id: INTEGRATION_ID,
        metrics: Object.values(METRICS),
      }),
    });
    const data = await res.json();
    const d = data?.data ?? {};

    // Gender: {labels: ["Male","Female","Unknown"], values: [{data: [n,n,n]}]}
    const genderRaw = d[METRICS.followers_gender.id];
    const followers_gender: { labels: string[]; data: number[] } | null =
      genderRaw?.labels
        ? { labels: genderRaw.labels as string[], data: (genderRaw.values?.[0]?.data ?? []) as number[] }
        : null;

    // Age+Gender: {labels: ["13-17",...], values: [{data: male[]}, {data: female[]}, {data: unknown[]}]}
    const ageGenderRaw = d[METRICS.followers_gender_age.id];
    const followers_gender_age: { labels: string[]; series: number[][] } | null =
      ageGenderRaw?.labels
        ? { labels: ageGenderRaw.labels as string[], series: (ageGenderRaw.values ?? []).map((s: any) => s.data as number[]) }
        : null;

    return NextResponse.json({
      periodo:           { inicio, fim },
      followers_count:   vNum(d[METRICS.followers_count.id]),
      new_followers:     vNum(d[METRICS.new_followers.id]),
      views:             vNum(d[METRICS.views.id]),
      profile_views:     vNum(d[METRICS.profile_views.id]),
      total_interactions: vNum(d[METRICS.total_interactions_post.id]),
      followers_gender,
      followers_gender_age,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
