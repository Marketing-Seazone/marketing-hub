import { NextResponse } from 'next/server';
const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';
const INTEGRATION_ID = 2505660;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dias = parseInt(searchParams.get('dias') ?? '7');
    const hoje = new Date().toISOString().split('T')[0];
    const inicio = new Date(Date.now() - dias * 86400000).toISOString().split('T')[0];

    const resp = await fetch(`${BASE}/metrics/get-data`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: inicio, end: hoje, integration_id: INTEGRATION_ID,
        metrics: [
          { id: '4ae20a6f-6a90-4784-8434-31cd0315f992', reference_key: 'ig:post_total_interactions_count', component: 'datatable_v1', metrics: ['total_interactions'], dimensions: ['post'], filters: [], filter: null, sort: [{ field: 'total_interactions', direction: 'desc' }], chart_type: null, custom: [], type: [] },
          { id: '555e60e2-2a60-4a4f-b2c3-623b1b0d41f6', reference_key: 'ig:reels_total', component: 'datatable_v1', metrics: ['reach'], dimensions: ['reel'], filters: [], filter: null, sort: [{ field: 'reach', direction: 'desc' }], chart_type: null, custom: [], type: [] },
          { id: 'bffca06-66b7-4bfc-a2a5-68111d8008d6', reference_key: 'ig:stories_views', component: 'datatable_v1', metrics: ['views'], dimensions: ['story'], filters: [], filter: null, sort: [{ field: 'views', direction: 'desc' }], chart_type: null, custom: [], type: [] },
          { id: 'a1b2c3d4-0001-4000-8000-000000000001', reference_key: 'ig:profile_views', component: 'number_v1', metrics: ['profile_views'], dimensions: [], filters: [], filter: null, sort: [], chart_type: null, custom: [], type: [] },
        ],
      }),
    });

    const data = await resp.json();
    const d = data?.data ?? {};

    const v = (x: any): number | null => {
      if (!x || x?.editingWarning || x?.warning) return null;
      if (typeof x?.values === 'number') return x.values;
      if (Array.isArray(x?.values)) return x.values[0] ?? null;
      return null;
    };

    return NextResponse.json({
      periodo: { inicio, fim: hoje, dias },
      interacoes_posts: v(d['4ae20a6f-6a90-4784-8434-31cd0315f992']),
      alcance_reels:    v(d['555e60e2-2a60-4a4f-b2c3-623b1b0d41f6']),
      views_stories:    v(d['bffca06-66b7-4bfc-a2a5-68111d8008d6']),
      visitas_perfil:   v(d['a1b2c3d4-0001-4000-8000-000000000001']),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}