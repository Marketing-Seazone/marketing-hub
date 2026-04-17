import { NextResponse } from "next/server";
import { getSpending, saveSpending } from "@/lib/hospedes-analise-db";
import type { DailySpending } from "@/lib/hospedes-analise-db";

export async function GET() {
  const spending = await getSpending();
  return NextResponse.json(spending);
}

export async function POST(req: Request) {
  const body: DailySpending = await req.json();
  const spending = await getSpending();
  const existing = spending.findIndex((s) => s.id === body.id);
  if (existing >= 0) {
    spending[existing] = body;
  } else {
    spending.push(body);
  }
  await saveSpending(spending);
  return NextResponse.json(body);
}
