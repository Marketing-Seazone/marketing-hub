import { NextRequest, NextResponse } from "next/server";
import { queryNekt } from "@/lib/nekt";
import { getSpending, saveSpending } from "@/lib/hospedes-analise-db";
import { exportSpendingToFile } from "@/lib/hospedes-analise-backup";
import type { DailySpending } from "@/lib/hospedes-analise-db";

export const maxDuration = 60;

const NEKT_SPENDING_SQL = `
SELECT date, ROUND(SUM(google_spend), 2) AS google, ROUND(SUM(meta_spend), 2) AS meta
FROM (
  SELECT CAST(date AS DATE) AS date, cost AS google_spend, 0.0 AS meta_spend
  FROM nekt_service.google_ads_geral_utilizacao
  WHERE LOWER(campaign_name) LIKE '%[szh]%'
    AND CAST(date AS DATE) BETWEEN DATE :date_from AND DATE :date_to
  UNION ALL
  SELECT date, 0.0 AS google_spend, spend AS meta_spend
  FROM nekt_silver.ads_unificado_historico
  WHERE LOWER(campaign_name) LIKE '%vista%'
    AND LOWER(campaign_name) LIKE '%[sh]%'
    AND date BETWEEN DATE :date_from AND DATE :date_to
) t
GROUP BY date
ORDER BY date
`.trim();

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function runSync(dateFrom: string, dateTo: string) {
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
      // Preserva o tiktok existente (manual ou não) para não apagar
      const existingEntry = existing.find((e) => e.id === `nekt-sync-${date}`);
      const tiktok = existingEntry?.tiktok ?? 0;
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

  // Sempre preserva entradas MANUAIS (que não são nekt-sync)
  // Nekt sincroniza só as suas próprias entradas
  const existing = await getSpending();
  const manualEntries = existing.filter((s) => !s.id.startsWith("nekt-sync-"));
  const otherNektEntries = existing.filter((s) => s.id.startsWith("nekt-sync-") && !synced.find((n) => n.id === s.id));

  await saveSpending([...manualEntries, ...otherNektEntries, ...synced]);

  // Backup em arquivo
  try {
    const allSpending = await getSpending();
    const backupPath = await exportSpendingToFile(allSpending);
    console.log(`Backup salvo: ${backupPath}`);
  } catch (e) {
    console.error("Erro ao fazer backup:", e);
  }

  return {
    ok: true as const,
    body: { synced: synced.length, dateFrom, dateTo },
  };
}

// GET → chamado pelo cron da Vercel (todo dia às 8h BRT / 11h UTC)
export async function GET() {
  const result = await runSync(nDaysAgo(365), nDaysAgo(1));
  return NextResponse.json(result.body, { status: result.ok ? 200 : result.status ?? 500 });
}

// POST → chamado manualmente pelo botão na UI
export async function POST(req: NextRequest) {
  let dateFrom = nDaysAgo(365);
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
