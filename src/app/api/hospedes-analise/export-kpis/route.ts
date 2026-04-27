import { NextRequest, NextResponse } from "next/server";
import { getRecords, getSpending } from "@/lib/hospedes-analise-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom") || "2024-01-01";
  const dateTo = searchParams.get("dateTo") || "2026-04-27";
  const format = searchParams.get("format") || "json";

  const records = await getRecords();
  const spending = await getSpending();

  // Filter by date range
  const filteredRecords = records.filter((r) => r.date >= dateFrom && r.date <= dateTo);
  const filteredSpending = spending.filter((s) => s.date >= dateFrom && s.date <= dateTo);

  // Build KPI table data
  type DayType = {
    date: string;
    sem?: { reservas: number; fatEff: number; cleaning: number; fatSz: number };
    com?: { reservas: number; fatEff: number; cleaning: number; fatSz: number };
    nb?: { tickets: number; conversoes: number; fatEff: number; fatSz: number };
    gasto: { google: number; meta: number; tiktok: number; total: number };
  };

  const map = new Map<string, DayType>();

  for (const r of filteredRecords) {
    if (!map.has(r.date)) {
      map.set(r.date, { date: r.date, gasto: { google: 0, meta: 0, tiktok: 0, total: 0 } });
    }
    const d = map.get(r.date)!;

    if (r.type === "midia-sem-atendimento") {
      d.sem = {
        reservas: Number(r.data.reservas) || 0,
        fatEff: Number(r.data.fatEffective) || 0,
        cleaning: Number(r.data.cleaningFee) || 0,
        fatSz: Number(r.data.fatSeazone) || 0,
      };
    } else if (r.type === "midia-com-atendimento") {
      d.com = {
        reservas: Number(r.data.reservas) || 0,
        fatEff: Number(r.data.fatEffective) || 0,
        cleaning: Number(r.data.cleaningFee) || 0,
        fatSz: Number(r.data.fatSeazone) || 0,
      };
    } else if (r.type === "relatorio-newbyte") {
      d.nb = {
        tickets: Number(r.data.tickets) || 0,
        conversoes: Number(r.data.conversoes) || 0,
        fatEff: Number(r.data.fatEffective) || 0,
        fatSz: Number(r.data.fatSeazone) || 0,
      };
    }
  }

  for (const s of filteredSpending) {
    if (!map.has(s.date)) {
      map.set(s.date, { date: s.date, gasto: { google: 0, meta: 0, tiktok: 0, total: 0 } });
    }
    const d = map.get(s.date)!;
    d.gasto.google += s.google;
    d.gasto.meta += s.meta;
    d.gasto.tiktok += s.tiktok;
    d.gasto.total += s.google + s.meta + s.tiktok;
  }

  const tableData = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));

  if (format === "csv") {
    const header = "Data,Sem-Reservas,Sem-FatEff,Sem-TxLimp,Sem-FatSz,Com-Reservas,Com-FatEff,Com-TxLimp,Com-FatSz,NB-Tickets,NB-Conversoes,NB-FatEff,NB-FatSz,Gasto-Google,Gasto-Meta,Gasto-TikTok,Gasto-Total";
    const rows = tableData.map((d) => {
      return [
        d.date,
        d.sem?.reservas ?? "",
        d.sem?.fatEff ?? "",
        d.sem?.cleaning ?? "",
        d.sem?.fatSz ?? "",
        d.com?.reservas ?? "",
        d.com?.fatEff ?? "",
        d.com?.cleaning ?? "",
        d.com?.fatSz ?? "",
        d.nb?.tickets ?? "",
        d.nb?.conversoes ?? "",
        d.nb?.fatEff ?? "",
        d.nb?.fatSz ?? "",
        d.gasto.google,
        d.gasto.meta,
        d.gasto.tiktok,
        d.gasto.total,
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="kpis-export-${dateFrom}-${dateTo}.csv"`,
      },
    });
  }

  return NextResponse.json({
    dateFrom,
    dateTo,
    totalDays: tableData.length,
    data: tableData,
  });
}