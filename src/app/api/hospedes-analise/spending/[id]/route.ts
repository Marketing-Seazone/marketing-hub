import { NextResponse } from "next/server";
import { getSpending, saveSpending } from "@/lib/hospedes-analise-db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const spending = await getSpending();
  await saveSpending(spending.filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
