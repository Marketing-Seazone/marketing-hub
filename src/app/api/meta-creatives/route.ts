import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 45

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN as string
const META_API_VERSION = "v20.0"
const BASE = `https://graph.facebook.com/${META_API_VERSION}`

export interface CreativeResult {
  ad_id: string
  object_type?: string      // 'VIDEO' | 'PHOTO' | 'SHARE' etc.
  headline?: string         // copy: título/headline direto da API Meta
  body?: string             // copy: texto principal direto da API Meta
  thumbnail_url?: string    // thumbnail principal (fallback)
  image_url?: string        // imagem estática em maior qualidade
  video_frames?: string[]   // 3–5 frames distribuídos ao longo do vídeo
  error?: string
}

/* Busca thumbnails do vídeo (frames em diferentes momentos) */
async function fetchVideoFrames(videoId: string): Promise<string[]> {
  try {
    const url = `${BASE}/${videoId}/thumbnails?access_token=${META_ACCESS_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json() as {
      data?: Array<{ uri?: string; time_offset?: number }>
    }
    const thumbs = (data.data ?? [])
      .filter(t => t.uri)
      .sort((a, b) => (a.time_offset ?? 0) - (b.time_offset ?? 0))

    if (thumbs.length === 0) return []

    // Seleciona até 5 frames distribuídos (início, 25%, 50%, 75%, fim)
    const want = Math.min(5, thumbs.length)
    const selected = new Set<string>()
    for (let i = 0; i < want; i++) {
      const idx = Math.round((i / (want - 1 || 1)) * (thumbs.length - 1))
      const uri = thumbs[idx]?.uri
      if (uri) selected.add(uri)
    }
    return [...selected]
  } catch {
    return []
  }
}

/* Passo 1: extrai creative IDs a partir dos ad IDs */
async function fetchCreativeIds(adIds: string[]): Promise<Record<string, string>> {
  // ad_id → creative_id
  const idsParam = adIds.join(",")
  const url = `${BASE}/?ids=${idsParam}&fields=creative%7Bid%7D&access_token=${META_ACCESS_TOKEN}`
  const res = await fetch(url)
  if (!res.ok) return {}

  const data = await res.json() as Record<string, {
    creative?: { id?: string }
    error?: { message: string }
  }>

  const map: Record<string, string> = {}
  for (const adId of adIds) {
    const creativeId = data[adId]?.creative?.id
    if (creativeId) map[adId] = creativeId
  }
  return map
}

/* Passo 2: busca dados completos consultando os creatives diretamente por ID
   — body, title, video_id só retornam ao consultar o creative diretamente */
async function fetchCreativeData(
  adToCreative: Record<string, string>
): Promise<CreativeResult[]> {
  const adIds = Object.keys(adToCreative)
  const creativeIds = Object.values(adToCreative)
  if (creativeIds.length === 0) return []

  const idsParam = creativeIds.join(",")
  const fields = encodeURIComponent("id,body,title,image_url,thumbnail_url,video_id,object_type")
  const url = `${BASE}/?ids=${idsParam}&fields=${fields}&access_token=${META_ACCESS_TOKEN}`

  const res = await fetch(url)
  if (!res.ok) {
    return adIds.map(adId => ({ ad_id: adId, error: `Meta API ${res.status}` }))
  }

  const data = await res.json() as Record<string, {
    id?: string
    body?: string
    title?: string
    image_url?: string
    thumbnail_url?: string
    video_id?: string
    object_type?: string
    error?: { message: string }
  }>

  // Constrói reverse map: creative_id → ad_id
  const creativeToAd: Record<string, string> = {}
  for (const [adId, creativeId] of Object.entries(adToCreative)) {
    creativeToAd[creativeId] = adId
  }

  const partials: CreativeResult[] = []

  for (const creativeId of creativeIds) {
    const adId = creativeToAd[creativeId]
    const c = data[creativeId]
    if (!c || c.error) {
      partials.push({ ad_id: adId, error: c?.error?.message ?? "Creative não encontrado" })
      continue
    }
    partials.push({
      ad_id: adId,
      object_type: c.object_type,
      headline: c.title && c.title.trim() ? c.title.trim() : undefined,
      body: c.body && c.body.trim() ? c.body.trim() : undefined,
      thumbnail_url: c.thumbnail_url || undefined,
      image_url: c.image_url || undefined,
    })
  }

  // Busca frames de vídeo em paralelo para ads com video_id
  await Promise.allSettled(
    partials.map(async r => {
      if (r.error) return
      const creativeId = adToCreative[r.ad_id]
      const videoId = data[creativeId]?.video_id
      if (videoId) {
        r.video_frames = await fetchVideoFrames(videoId)
      }
    })
  )

  return partials
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { ad_ids } = await req.json() as { ad_ids: string[] }
    if (!ad_ids || !Array.isArray(ad_ids) || ad_ids.length === 0) {
      return NextResponse.json({ error: "Campo 'ad_ids' obrigatório." }, { status: 400 })
    }

    if (!META_ACCESS_TOKEN) {
      return NextResponse.json({
        results: [],
        meta: { skipped: true, reason: "META_ACCESS_TOKEN não configurado" },
      })
    }

    const topIds = ad_ids.slice(0, 20)

    // Passo 1: pega creative IDs
    const adToCreative = await fetchCreativeIds(topIds)

    // Passo 2: busca dados completos dos creatives diretamente
    const results = await fetchCreativeData(adToCreative)

    // Inclui resultados com qualquer dado útil
    const valid = results.filter(r =>
      r.thumbnail_url || r.image_url || (r.video_frames?.length ?? 0) > 0 || r.headline || r.body
    )

    return NextResponse.json({
      results: valid,
      meta: {
        total: ad_ids.length,
        fetched: valid.length,
        hasVideos: valid.some(r => (r.video_frames?.length ?? 0) > 0),
        hasImages: valid.some(r => r.image_url || r.thumbnail_url),
        hasCopy: valid.some(r => r.body || r.headline),
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
