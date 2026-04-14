import { NextRequest, NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { getSpending, saveSpending } from "@/lib/hospedes-analise-db";
import type { DailySpending } from "@/lib/hospedes-analise-db";

export const maxDuration = 60;

const NEKT_SPENDING_SQL = process.env.NEKT_SPENDING_SQL ?? "";

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function runSync(dateFrom: string, dateTo: string) {
  if (!NEKT_SPENDING_SQL) {
    return {
      ok: false as const,
      status: 503,
      body: {
        error: "config",
        message:
          "Query do Nekt não configurada. Defina NEKT_SPENDING_SQL nas variáveis de ambiente da Vercel com a query que retorna os gastos diários (colunas: date, google, meta, tiktok).",
      },
    };
  }

  const sql = NEKT_SPENDING_SQL.replace(/:date_from/g, `'${dateFrom}'`).replace(
    /:date_to/g,
    `'${dateTo}'`,
  );

  let nektResult;
  try {
    nektResult = await queryNekt(sql);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false as const, status: 500, body: { error: msg } };
  }

  const { rows } = nektResult;

  const synced: DailySpending[] = rows
    .filter((r) => r.date)
    .map((r) => {
      const date = String(r.date).slice(0, 10);
      const google = Number(r.google ?? 0);
      const meta = Number(r.meta ?? 0);
      const tiktok = Number(r.tiktok ?? 0);
      return {
        id: `nekt-sync-${date}`,
        date,
        google,
        meta,
        tiktok,
        meta565: meta,
        meta566: 0,
      };
    });

  // Upsert: mantém entradas manuais, substitui as do Nekt
  const existing = await getSpending();
  const manual = existing.filter((s) => !s.id.startsWith("nekt-sync-"));
  const syncedIds = new Set(synced.map((s) => s.id));
  const keepManual = manual.filter((s) => !syncedIds.has(s.id));

  await saveSpending([...keepManual, ...synced]);

  return {
    ok: true as const,
    body: { synced: synced.length, dateFrom, dateTo },
  };
}

// GET → chamado pelo cron da Vercel (todo dia às 8h BRT / 11h UTC)
export async function GET() {
  const result = await runSync(nDaysAgo(30), nDaysAgo(1));
  return NextResponse.json(result.body, { status: result.ok ? 200 : result.status ?? 500 });
}

// POST → chamado manualmente pelo botão na UI
export async function POST(req: NextRequest) {
  let dateFrom = nDaysAgo(30);
  let dateTo = nDaysAgo(1);

  try {
    const body = await req.json().catch(() => ({}));
    if (body.dateFrom) dateFrom = body.dateFrom;
    if (body.dateTo) dateTo = body.dateTo;
  } catch {
    // usa defaults
  }

  const result = await runSync(dateFrom, dateTo);
  return NextResponse.json(result.body, { status: result.ok ? 200 : result.status ?? 500 });
}
