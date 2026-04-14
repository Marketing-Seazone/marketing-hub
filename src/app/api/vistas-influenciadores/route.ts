import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!
const TABLE = 'influencers_vistas'

async function query(method: string, body?: unknown, id?: string) {
  const url = id
    ? `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`
    : `${SUPABASE_URL}/rest/v1/${TABLE}?order=id`

  const res = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : []
}

export async function GET() {
  try {
    const data = await query('GET')
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const row = { ...body, id: body.id || Date.now().toString() }
    const data = await query('POST', row)
    return NextResponse.json(Array.isArray(data) ? data[0] : data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = await query('PATCH', rest, id)
    return NextResponse.json(Array.isArray(data) ? data[0] : data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    await query('DELETE', undefined, id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}