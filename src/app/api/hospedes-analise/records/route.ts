import { NextResponse } from "next/server";
import { getRecords, saveRecords } from "@/lib/hospedes-analise-db";
import type { DailyRecord } from "@/lib/hospedes-analise-db";

export async function GET() {
  const records = await getRecords();
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const body: DailyRecord = await req.json();
  const records = await getRecords();
  const existing = records.findIndex((r) => r.id === body.id);
  if (existing >= 0) {
    records[existing] = body;
  } else {
    records.push(body);
  }
  await saveRecords(records);
  return NextResponse.json(body);
}
