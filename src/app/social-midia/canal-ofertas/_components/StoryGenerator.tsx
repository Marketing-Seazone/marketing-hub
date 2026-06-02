"use client"

import { useState, useRef, useEffect } from 'react'
import { Upload, Download, RefreshCw, X, ImageIcon } from 'lucide-react'
import { T } from '@/lib/constants'
import { saveStory, loadStory } from '../_lib/story-db'

const STORY_W = 1080
const STORY_H = 1920

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = img.width * scale
  const sh = img.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh)
  ctx.restore()
}

type SlotProps = {
  label: string
  url: string | null
  onChange: (url: string) => void
  onRemove: () => void
}

function PhotoSlot({ label, url, onChange, onRemove }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </span>

      {url ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1/1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick={onRemove}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}
          >
            <X size={13} />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              padding: '4px 8px', borderRadius: 6,
              background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <RefreshCw size={10} /> Trocar
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            aspectRatio: '1/1', borderRadius: 8, border: `2px dashed ${T.border}`,
            background: T.muted, cursor: 'pointer', width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: T.mutedFg, transition: 'all 0.15s',
          }}
        >
          <Upload size={20} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>Clique para enviar</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

type Props = {
  nomeImovel: string
  storyKey: string
}

export function StoryGenerator({ nomeImovel, storyKey }: Props) {
  const [urls, setUrls] = useState<[string | null, string | null]>([null, null])
  const [storyUrl, setStoryUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingStory, setLoadingStory] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  // Carrega story salvo do IndexedDB ao montar
  useEffect(() => {
    loadStory(storyKey)
      .then(url => { if (url) setStoryUrl(url) })
      .catch(() => {})
      .finally(() => setLoadingStory(false))
  }, [storyKey])

  // Limpa object URLs ao desmontar
  useEffect(() => {
    return () => {
      urls.forEach(u => { if (u) URL.revokeObjectURL(u) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setUrl(index: 0 | 1, newUrl: string) {
    setUrls(prev => {
      if (prev[index]) URL.revokeObjectURL(prev[index]!)
      const next: [string | null, string | null] = [prev[0], prev[1]]
      next[index] = newUrl
      return next
    })
    setStoryUrl(null)
  }

  function removeUrl(index: 0 | 1) {
    setUrls(prev => {
      if (prev[index]) URL.revokeObjectURL(prev[index]!)
      const next: [string | null, string | null] = [prev[0], prev[1]]
      next[index] = null
      return next
    })
    setStoryUrl(null)
  }

  async function gerar() {
    if (!urls[0] || !urls[1] || !canvasRef.current) return
    setGenerating(true)
    try {
      const [img1, img2] = await Promise.all([loadImage(urls[0]), loadImage(urls[1])])
      const canvas = canvasRef.current
      canvas.width = STORY_W
      canvas.height = STORY_H
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, STORY_W, STORY_H)
      drawCover(ctx, img1, 0, 0, STORY_W, STORY_H / 2)
      drawCover(ctx, img2, 0, STORY_H / 2, STORY_W, STORY_H / 2)
      const url = canvas.toDataURL('image/jpeg', 0.85)
      setStoryUrl(url)
      await saveStory(storyKey, url)
    } finally {
      setGenerating(false)
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return
      setStoryUrl(dataUrl)
      await saveStory(storyKey, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function baixar() {
    if (!storyUrl) return
    const slug = (nomeImovel || 'imovel').replace(/\s+/g, '-').toLowerCase()
    const a = document.createElement('a')
    a.href = storyUrl
    a.download = `story-${slug}.jpg`
    a.click()
  }

  const bothLoaded = !!urls[0] && !!urls[1]

  const PREV_W = 120
  const PREV_H = Math.round(PREV_W / (STORY_W / STORY_H))

  if (loadingStory) return (
    <div style={{
      marginTop: 12, background: '#f8faff', border: `1px solid ${T.cinza100}`,
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 8, color: T.mutedFg, fontSize: 12,
    }}>
      <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
      Carregando story...
    </div>
  )

  return (
    <div style={{
      marginTop: 12, background: '#f8faff',
      border: `1px solid ${T.cinza100}`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <ImageIcon size={14} color={T.primary} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.cardFg }}>
          Gerador de Story · 1080×1920px
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Upload das fotos */}
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          <PhotoSlot
            label="Foto superior"
            url={urls[0]}
            onChange={u => setUrl(0, u)}
            onRemove={() => removeUrl(0)}
          />
          <PhotoSlot
            label="Foto inferior"
            url={urls[1]}
            onChange={u => setUrl(1, u)}
            onRemove={() => removeUrl(1)}
          />
        </div>

        {/* Preview do story gerado */}
        {storyUrl && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Preview
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storyUrl}
              alt="Story gerado"
              width={PREV_W}
              height={PREV_H}
              style={{ borderRadius: 6, boxShadow: T.elevMd, objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={gerar}
          disabled={!bothLoaded || generating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            cursor: bothLoaded && !generating ? 'pointer' : 'not-allowed',
            background: bothLoaded && !generating ? T.primary : T.cinza100,
            color: bothLoaded && !generating ? T.primaryFg : T.mutedFg,
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          {generating
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
            : <><ImageIcon size={13} /> {storyUrl ? 'Regenerar story' : 'Gerar story'}</>
          }
        </button>

        <span style={{ fontSize: 11, color: T.mutedFg }}>ou</span>

        <button
          onClick={() => uploadInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
            cursor: 'pointer', background: T.card, color: T.mutedFg,
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <Upload size={13} /> Subir imagem pronta
        </button>

        {storyUrl && (
          <button
            onClick={baixar}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.primary}`,
              cursor: 'pointer', background: T.card, color: T.primary,
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            <Download size={13} /> Baixar .jpg
          </button>
        )}
      </div>

      {/* Canvas oculto — superfície de renderização */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
    </div>
  )
}
