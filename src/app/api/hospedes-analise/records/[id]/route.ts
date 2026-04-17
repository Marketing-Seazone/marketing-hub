import { NextResponse } from "next/server";
import { getRecords, saveRecords } from "@/lib/hospedes-analise-db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const records = await getRecords();
  await saveRecords(records.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
