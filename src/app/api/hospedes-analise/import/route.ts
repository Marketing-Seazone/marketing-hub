import { NextResponse } from "next/server";
import {
  getRecords, saveRecords,
  getSpending, saveSpending,
} from "@/lib/hospedes-analise-db";
import type { DailyRecord, DailySpending } from "@/lib/hospedes-analise-db";

export async function POST(req: Request) {
  const body: { records?: DailyRecord[]; spending?: DailySpending[] } = await req.json();
  const incoming = body.records ?? [];
  const incomingSpending = body.spending ?? [];

  // Upsert records
  const existing = await getRecords();
  const idSet = new Set(existing.map((r) => r.id));
  for (const r of incoming) {
    if (idSet.has(r.id)) {
      const idx = existing.findIndex((e) => e.id === r.id);
      if (idx >= 0) existing[idx] = r;
    } else {
      existing.push(r);
    }
  }
  await saveRecords(existing);

  // Upsert spending
  const existingSp = await getSpending();
  const spIdSet = new Set(existingSp.map((s) => s.id));
  for (const s of incomingSpending) {
    if (spIdSet.has(s.id)) {
      const idx = existingSp.findIndex((e) => e.id === s.id);
      if (idx >= 0) existingSp[idx] = s;
    } else {
      existingSp.push(s);
    }
  }
  await saveSpending(existingSp);

  return NextResponse.json({
    imported: { records: incoming.length, spending: incomingSpending.length },
  });
}
