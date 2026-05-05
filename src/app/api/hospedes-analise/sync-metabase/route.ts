import { NextResponse } from "next/server";
import { getRecords, saveRecords } from "@/lib/hospedes-analise-db";
import { exportRecordsToFile } from "@/lib/hospedes-analise-backup";
import type { DailyRecord, ReservationDetail } from "@/lib/hospedes-analise-db";

const METABASE_URL = "https://metabase.seazone.com.br";
const QUESTION_ID = 3335;

const PAID_SOURCES = ["googleads", "metaads", "tiktokads", "site__vistasdeanita"];
const PAID_PROMOS = ["vistas10", "cabana10"];

function isHospedadesCampaign(campaign: string): boolean {
  return campaign.includes("vistassc") || campaign.includes("hospedes");
}

interface MetabaseRow {
  payment_date: string;
  check_in_date: string;
  user_email: string;
  user_name: string;
  recurrence: number;
  promo_code: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  reservation_city: string | null;
  reservation_code: string | null;
  property_code: string | null;
  payment_method: string | null;
  days_between_payment_and_checkin: number | null;
  effective_price: number;
  cleaning_fee: number;
  commission_24_percent: number;
  user_phone: string | null;
}

function classifyRow(row: MetabaseRow): "midia-sem-atendimento" | "midia-com-atendimento" | null {
  const src = (row.utm_source ?? "").toLowerCase();
  const campaign = (row.utm_campaign ?? "").toLowerCase();
  const medium = (row.utm_medium ?? "").toLowerCase();
  const promo = (row.promo_code ?? "").toLowerCase();

  const isPaidSource = PAID_SOURCES.includes(src);
  const isPaidCampaign = isHospedadesCampaign(campaign);
  const isPaidPromo = PAID_PROMOS.includes(promo);
  if (!isPaidSource && !isPaidCampaign && !isPaidPromo) return null;

  const hasAtdUtm = src.includes("atd") || campaign.includes("atd") || medium.includes("atd");
  const hasAtdPromo = promo.includes("atd");
  const isNewbyteIa = campaign.includes("newbyte_ia");

  if (hasAtdUtm || hasAtdPromo || isNewbyteIa) return "midia-com-atendimento";
  return "midia-sem-atendimento";
}

function toDateStr(isoDatetime: string): string {
  return isoDatetime.split("T")[0];
}

function buildUtm(row: MetabaseRow): string {
  return [
    row.utm_source && `utm_source=${row.utm_source}`,
    row.utm_campaign && `utm_campaign=${row.utm_campaign}`,
    row.utm_medium && `utm_medium=${row.utm_medium}`,
  ].filter(Boolean).join("&");
}

export async function POST() {
  const apiKey = process.env.METABASE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "METABASE_API_KEY não configurada" }, { status: 500 });
  }

  // Busca até 01/01/2024 (limite da pergunta do Metabase)
  // Parâmetros de filtro de data para garantir range completo
  const res = await fetch(`${METABASE_URL}/api/card/${QUESTION_ID}/query/json`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ parameters: [] }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Metabase retornou ${res.status}` }, { status: 502 });
  }

  const rows: MetabaseRow[] = await res.json();

  type DayType = `${string}::${"midia-sem-atendimento" | "midia-com-atendimento"}`;
  const groups: Record<DayType, {
    type: "midia-sem-atendimento" | "midia-com-atendimento";
    date: string;
    reservas: number;
    fatEffective: number;
    fatSeazone: number;
    cleaningFee: number;
    reservations: ReservationDetail[];
  }> = {};

  for (const row of rows) {
    const type = classifyRow(row);
    if (!type) continue;

    const date = toDateStr(row.payment_date);
    const key: DayType = `${date}::${type}`;

    if (!groups[key]) {
      groups[key] = { type, date, reservas: 0, fatEffective: 0, fatSeazone: 0, cleaningFee: 0, reservations: [] };
    }

    const g = groups[key];
    const eff = row.effective_price ?? 0;
    const cleaning = row.cleaning_fee ?? 0;
    g.reservas += 1;
    g.fatEffective += eff;
    g.fatSeazone += (eff - cleaning) * 0.24;
    g.cleaningFee += cleaning;
    // ID estável: reservation_code quando disponível (único no Metabase). Fallback inclui o índice
    // do grupo para evitar colapso de reservas distintas no mesmo property/payment_date.
    const stableId = row.reservation_code
      ? `mb-${row.reservation_code}`
      : `mb-${row.property_code ?? "x"}-${row.payment_date}-${g.reservations.length}`;
    const reservation: ReservationDetail = {
      id: stableId,
      source: row.utm_source ?? "",
      utm: buildUtm(row),
      coupon: row.promo_code ?? "",
      destination: row.reservation_city ?? "",
      reservationCode: row.reservation_code ?? undefined,
      propertyCode: row.property_code ?? undefined,
    };
    g.reservations.push(reservation);
  }

  const existing = await getRecords();
  const manual = existing.filter((r) => !r.id.startsWith("mb-sync-"));

  const synced: DailyRecord[] = Object.values(groups).map((g) => ({
    id: `mb-sync-${g.date}-${g.type}`,
    date: g.date,
    type: g.type,
    data: {
      reservas: g.reservas,
      fatEffective: parseFloat(g.fatEffective.toFixed(2)),
      fatSeazone: parseFloat(g.fatSeazone.toFixed(2)),
      cleaningFee: parseFloat(g.cleaningFee.toFixed(2)),
    },
    reservations: g.reservations,
  }));

  await saveRecords([...manual, ...synced]);

  // Backup em arquivo
  try {
    const allRecords = await getRecords();
    const backupPath = await exportRecordsToFile(allRecords);
    console.log(`Backup salvo: ${backupPath}`);
  } catch (e) {
    console.error("Erro ao fazer backup:", e);
  }

  return NextResponse.json({
    synced: synced.length,
    dates: [...new Set(synced.map((r) => r.date))].length,
    breakdown: {
      semAtendimento: synced.filter((r) => r.type === "midia-sem-atendimento").length,
      comAtendimento: synced.filter((r) => r.type === "midia-com-atendimento").length,
    },
  });
}
