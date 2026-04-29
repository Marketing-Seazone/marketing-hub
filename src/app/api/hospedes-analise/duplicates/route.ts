import { NextResponse } from "next/server";
import { getRecords } from "@/lib/hospedes-analise-db";

export async function GET() {
  const records = await getRecords();

  // Agrupa por date + type para encontrar duplicatas
  const groups: Record<string, { records: typeof records; count: number }> = {};
  for (const r of records) {
    const key = `${r.date}__${r.type}`;
    if (!groups[key]) groups[key] = { records: [], count: 0 };
    groups[key].records.push(r);
    groups[key].count++;
  }

  const duplicates = Object.entries(groups)
    .filter(([, g]) => g.count > 1)
    .map(([key, g]) => {
      const [date, type] = key.split("__");
      const ids = g.records.map((r) => r.id);
      // Mantém o mais recente (maior id lexical = mais recente)
      const keep = [...g.records].sort((a, b) => b.id.localeCompare(a.id))[0].id;
      const remove = ids.filter((id) => id !== keep);
      return { date, type, total: g.count, keep, remove };
    });

  const totalDuplicates = duplicates.reduce((s, d) => s + d.remove.length, 0);

  return NextResponse.json({ duplicates, totalDuplicates, totalRecords: records.length });
}

export async function DELETE(req: Request) {
  const { removeIds } = await req.json() as { removeIds: string[] };
  const records = await getRecords();
  const filtered = records.filter((r) => !removeIds.includes(r.id));

  const { saveRecords } = await import("@/lib/hospedes-analise-db");
  await saveRecords(filtered);

  return NextResponse.json({ deleted: removeIds.length, remaining: filtered.length });
}
