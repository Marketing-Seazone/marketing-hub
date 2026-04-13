import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 30

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN as string
const META_API_VERSION = "v20.0"

interface ThumbnailResult {
  ad_id: string
  thumbnail_url: string | null
  error?: string
}

/* ─────────────────────────────────────────────
   Busca thumbnails via Meta Graph API (batch)
   Endpoint: GET /v20.0/?ids={id1,id2}&fields=creative{thumbnail_url,video_id,object_type}
───────────────────────────────────────────── */
async function fetchMetaThumbnails(adIds: string[]): Promise<ThumbnailResult[]> {
  const batchSize = 20
  const results: ThumbnailResult[] = []

  for (let i = 0; i < adIds.length; i += batchSize) {
    const batch = adIds.slice(i, i + batchSize)
    const idsParam = batch.join(",")
    const url = `https://graph.facebook.com/${META_API_VERSION}/?ids=${idsParam}&fields=creative%7Bthumbnail_url%2Cvideo_id%2Cobject_type%7D&access_token=${META_ACCESS_TOKEN}`

    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.text()
      for (const id of batch) {
        results.push({ ad_id: id, thumbnail_url: null, error: `Meta API ${res.status}: ${err.slice(0, 120)}` })
      }
      continue
    }

    const data = await res.json() as Record<string, {
      creative?: { thumbnail_url?: string; video_id?: string; object_type?: string }
      error?: { message: string }
    }>

    for (const adId of batch) {
      const adData = data[adId]
      if (!adData || adData.error) {
        results.push({ ad_id: adId, thumbnail_url: null, error: adData?.error?.message })
      } else {
        results.push({
          ad_id: adId,
          thumbnail_url: adData.creative?.thumbnail_url ?? null,
        })
      }
    }
  }

  return results
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const { ad_ids } = await req.json() as { ad_ids: string[] }
    if (!ad_ids || !Array.isArray(ad_ids) || ad_ids.length === 0) {
      return NextResponse.json({ error: "Campo 'ad_ids' obrigatório." }, { status: 400 })
    }

    /* sem token → retorna vazio (análise visual pulada) */
    if (!META_ACCESS_TOKEN) {
      return NextResponse.json({
        results: [],
        meta: { skipped: true, reason: "META_ACCESS_TOKEN não configurado" },
      })
    }

    const results = await fetchMetaThumbnails(ad_ids.slice(0, 50))
    const valid = results.filter(r => r.thumbnail_url !== null)

    return NextResponse.json({ results: valid, meta: { total: ad_ids.length, fetched: valid.length } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
