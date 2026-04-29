import { NextResponse } from "next/server";

const METABASE_URL = "https://metabase.seazone.com.br";
const QUESTION_ID = 3335;

interface MetabaseRow {
  payment_date: string;
  reservation_code: string | null;
  effective_price: number;
  cleaning_fee: number;
  reservation_city: string | null;
  property_code: string | null;
}

interface PastedRow {
  date: string;
  reserva: string;
  effectivePrice: number;
  cleaningFee: number;
  fatSeazone: number;
  city: string;
  propertyCode: string;
  originalDate?: string;
}

interface DuplicateWarning {
  reserva: string;
  date: string;
  metabaseDate: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pastedData: string = body.pastedData;
    const existingReservationCodes: string[] = body.existingReservationCodes || [];

    if (!pastedData?.trim()) {
      return NextResponse.json({ error: "Nenhum dado colado" }, { status: 400 });
    }

    // Parse tab-separated pasted data
    const lines = pastedData.trim().split("\n");
    const parsed: { date: string; reserva: string; rawLine: string }[] = [];

    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 1) continue;

      const datePart = (parts[0] || "").trim();
      const reservaPart = (parts[6] || "").trim();

      if (!reservaPart) continue;

      // Parse date dd/mm/yyyy or dd/mm → yyyy-mm-dd
      let date = datePart;
      const dateMatch4 = datePart.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateMatch4) {
        date = `${dateMatch4[3]}-${dateMatch4[2]}-${dateMatch4[1]}`;
      } else {
        const dateMatch2 = datePart.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (dateMatch2) {
          const day = dateMatch2[1].padStart(2, "0");
          const month = dateMatch2[2].padStart(2, "0");
          const year = new Date().getFullYear();
          date = `${year}-${month}-${day}`;
        }
      }

      parsed.push({ date, reserva: reservaPart, rawLine: line });
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Nenhuma linha com código de reserva encontrada" }, { status: 400 });
    }

    // Fetch Metabase data
    const apiKey = process.env.METABASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "METABASE_API_KEY não configurada" }, { status: 500 });
    }

    const res = await fetch(`${METABASE_URL}/api/card/${QUESTION_ID}/query/json`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ parameters: [] }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Metabase retornou ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    let metabaseRows: MetabaseRow[] = [];
    try {
      metabaseRows = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Resposta do Metabase não é JSON válido" }, { status: 502 });
    }

    // Build lookup map - key by reservation code only (for date verification)
    const lookupByCode = new Map<string, MetabaseRow>();
    // Also build lookup by code+date (for correlation)
    const lookupByCodeAndDate = new Map<string, MetabaseRow>();

    for (const row of metabaseRows) {
      if (!row.reservation_code) continue;
      const metabaseDate = String(row.payment_date).slice(0, 10);
      const keyByCode = row.reservation_code;
      const keyByDate = `${row.reservation_code}::${metabaseDate}`;

      // Keep the most recent entry per code
      if (!lookupByCode.has(keyByCode)) {
        lookupByCode.set(keyByCode, row);
      }

      lookupByCodeAndDate.set(keyByDate, row);
    }

    // Check for duplicates and date mismatches
    const duplicateWarnings: DuplicateWarning[] = [];
    const dateMismatches: DuplicateWarning[] = [];

    for (const item of parsed) {
      // Check if reservation code already exists
      if (existingReservationCodes.includes(item.reserva)) {
        duplicateWarnings.push({
          reserva: item.reserva,
          date: item.date,
          metabaseDate: lookupByCode.get(item.reserva)?.payment_date?.slice(0, 10) || item.date,
        });
      }

      // Check if date matches Metabase
      const metabaseRow = lookupByCode.get(item.reserva);
      if (metabaseRow) {
        const metabaseDate = String(metabaseRow.payment_date).slice(0, 10);
        if (metabaseDate !== item.date) {
          dateMismatches.push({
            reserva: item.reserva,
            date: item.date,
            metabaseDate: metabaseDate,
          });
        }
      }
    }

    // Correlate - use exact match first, then fallback to any date for that reservation
    const matched: PastedRow[] = [];
    const notMatched: { date: string; reserva: string }[] = [];

    for (const item of parsed) {
      // First try exact match
      const exactKey = `${item.reserva}::${item.date}`;
      let metabaseRow = lookupByCodeAndDate.get(exactKey);

      // Fallback: use any date for this reservation
      if (!metabaseRow) {
        metabaseRow = lookupByCode.get(item.reserva);
      }

      if (metabaseRow) {
        const eff = metabaseRow.effective_price ?? 0;
        const cleaning = metabaseRow.cleaning_fee ?? 0;
        const fatSz = (eff - cleaning) * 0.24;
        const metabaseDate = String(metabaseRow.payment_date).slice(0, 10);
        matched.push({
          date: metabaseDate, // Use Metabase date
          reserva: item.reserva,
          effectivePrice: eff,
          cleaningFee: cleaning,
          fatSeazone: Math.round(fatSz * 100) / 100,
          city: metabaseRow.reservation_city ?? "",
          propertyCode: metabaseRow.property_code ?? "",
          originalDate: item.date, // Keep original date for reference
        });
      } else {
        notMatched.push({ date: item.date, reserva: item.reserva });
      }
    }

    return NextResponse.json({
      total: parsed.length,
      matched,
      notMatched,
      matchedCount: matched.length,
      notMatchedCount: notMatched.length,
      duplicateWarnings,
      dateMismatches,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erro interno: " + msg }, { status: 500 });
  }
}