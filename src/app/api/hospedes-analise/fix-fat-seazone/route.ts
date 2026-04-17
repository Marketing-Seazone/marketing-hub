import { NextResponse } from "next/server";
import { getRecords, saveRecords } from "@/lib/hospedes-analise-db";

export async function POST() {
  const records = await getRecords();
  let updated = 0;

  for (const r of records) {
    if (r.type === "midia-sem-atendimento" || r.type === "midia-com-atendimento") {
      const fatEff = Number(r.data.fatEffective ?? 0);
      const cleaning = Number(r.data.cleaningFee ?? 0);
      const correct = (fatEff - cleaning) * 0.24;
      const current = Number(r.data.fatSeazone ?? 0);
      if (Math.abs(current - correct) > 0.01) {
        r.data.fatSeazone = Math.round(correct * 100) / 100;
        updated++;
      }
    }
  }

  if (updated > 0) await saveRecords(records);
  return NextResponse.json({ updated });
}
