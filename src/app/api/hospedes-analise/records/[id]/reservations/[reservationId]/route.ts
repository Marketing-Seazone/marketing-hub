import { NextResponse } from "next/server";
import { getRecords, saveRecords } from "@/lib/hospedes-analise-db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; reservationId: string }> },
) {
  const { id, reservationId } = await params;
  const records = await getRecords();
  const recordIndex = records.findIndex((r) => r.id === id);

  if (recordIndex < 0) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  const record = records[recordIndex];
  const filteredReservations = (record.reservations || []).filter(
    (r) => r.id !== reservationId,
  );

  records[recordIndex] = { ...record, reservations: filteredReservations };
  await saveRecords(records);

  return NextResponse.json({ ok: true, updated: records[recordIndex] });
}
