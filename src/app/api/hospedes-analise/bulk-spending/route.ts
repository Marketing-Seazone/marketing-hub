import { NextRequest, NextResponse } from "next/server";
import { getSpending, saveSpending } from "@/lib/hospedes-analise-db";
import type { DailySpending } from "@/lib/hospedes-analise-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries: DailySpending[] = body.entries;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "entries deve ser um array" }, { status: 400 });
    }

    const existing = await getSpending();
    const existingIds = new Set(existing.map((s) => s.id));

    // Adiciona novos entries, mas não sobrescreve os que já existem
    const newEntries = entries.filter((e) => !existingIds.has(e.id));
    const merged = [...existing, ...newEntries];

    await saveSpending(merged);

    return NextResponse.json({
      saved: newEntries.length,
      total: merged.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}