import { NextResponse } from 'next/server';

const TOKEN = process.env.REPORTEI_TOKEN;
const BASE = 'https://app.reportei.com/api/v2';

export async function GET() {
  const resp = await fetch(
    `${BASE}/metrics?integration_slug=instagram_business&per_page=200`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const data = await resp.json();
  return NextResponse.json(
    data?.data?.map((m: any) => ({
      id: m.id,
      key: m.reference_key,
      metrics: m.metrics,
      component: m.component,
      custom: m.custom,
      type: m.type,
    }))
  );
}
