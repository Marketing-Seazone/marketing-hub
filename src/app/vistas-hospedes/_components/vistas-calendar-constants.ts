import type { Editorial, EditorialSlug, ContentFormat, ContentStatus } from '@/app/social-midia/calendario-seazone/_lib/types';
import { T } from '@/lib/constants';

export const VISTAS_EDITORIALS: Editorial[] = [
  {
    slug: 'destinos_seazone' as EditorialSlug,
    name: 'Sinta a Cabana',
    color: T.laranja500,
    audience: 'Casais, pessoas estressadas buscando descanso',
    description: 'Criar desejo visceral pela experiência — fazer o visitante sentir que precisa estar lá. Reels curtos com trilha ambiente, carrosséis sensoriais.',
  },
  {
    slug: 'resultados_reais' as EditorialSlug,
    name: 'Motivos para Ir',
    color: T.statusOkFg,
    audience: 'Todos os segmentos — casais, famílias, aventureiros, noivos, workation',
    description: 'Ampliar o público ativando os diferentes perfis de hóspede. Posts segmentados que fazem a pessoa pensar "esse conteúdo foi feito pra mim".',
  },
  {
    slug: 'dono_controle' as EditorialSlug,
    name: 'Dúvidas Reserva',
    color: T.primary,
    audience: 'Quem já segue ou já foi impactado — fundo de funil',
    description: 'Converter intenção em reserva. Quebra objeções, gera urgência e facilita o acesso. FAQ em Reels, carrosséis de "antes de reservar", posts de disponibilidade.',
  },
];

export const VISTAS_FORMATS: { value: ContentFormat; label: string }[] = [
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'reels', label: 'Reels' },
  { value: 'feed', label: 'Feed' },
  { value: 'stories', label: 'Stories' },
  { value: 'tiktok', label: 'TikTok' },
];

export const VISTAS_STATUSES: { value: ContentStatus; label: string; emoji: string }[] = [
  { value: 'ideia', label: 'Em aprovação', emoji: '💡' },
  { value: 'aprovado', label: 'Aprovado', emoji: '✅' },
  { value: 'producao', label: 'Em produção', emoji: '🎬' },
  { value: 'rascunho', label: 'Rascunho', emoji: '📝' },
  { value: 'gravacao', label: 'Gravação', emoji: '📹' },
  { value: 'edicao', label: 'Edição', emoji: '✂️' },
  { value: 'agendado', label: 'Agendado', emoji: '📅' },
  { value: 'publicado', label: 'Publicado', emoji: '✔' },
];

export function getVistaEditorial(slug: string): Editorial | undefined {
  return VISTAS_EDITORIALS.find((e) => e.slug === slug);
}

export function matchVistaEditorialSlug(name: string): EditorialSlug | null {
  const normalized = name.toLowerCase();
  for (const ed of VISTAS_EDITORIALS) {
    if (ed.name.toLowerCase().includes(normalized) || normalized.includes(ed.name.toLowerCase())) {
      return ed.slug;
    }
  }
  if (normalized.includes('sinta') || normalized.includes('cabana') || normalized.includes('sensorial')) return 'destinos_seazone' as EditorialSlug;
  if (normalized.includes('motivo') || normalized.includes('ir') || normalized.includes('perfil')) return 'resultados_reais' as EditorialSlug;
  if (normalized.includes('dúvida') || normalized.includes('reserva') || normalized.includes('obje') || normalized.includes('pensando')) return 'dono_controle' as EditorialSlug;
  return VISTAS_EDITORIALS[0].slug;
}
