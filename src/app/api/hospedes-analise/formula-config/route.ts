import { NextRequest, NextResponse } from "next/server";
import { getFormulaConfig, saveFormulaConfig, DEFAULT_FORMULA_CONFIG } from "@/lib/hospedes-analise-db";
import type { FormulaConfig } from "@/lib/hospedes-analise-db";

export async function GET() {
  const config = await getFormulaConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const config: FormulaConfig = {
    szBase: body.szBase === "fat-effective" ? "fat-effective" : "fat-liquido",
    szTaxa: typeof body.szTaxa === "number" ? body.szTaxa : DEFAULT_FORMULA_CONFIG.szTaxa,
    liqSubtrairLimpeza: body.liqSubtrairLimpeza !== false,
    roiNumerador: (["fat-seazone", "fat-liquido", "fat-effective"] as const).includes(body.roiNumerador)
      ? body.roiNumerador : DEFAULT_FORMULA_CONFIG.roiNumerador,
    roiDenominador: (["gasto-total", "gasto-google", "gasto-meta"] as const).includes(body.roiDenominador)
      ? body.roiDenominador : DEFAULT_FORMULA_CONFIG.roiDenominador,
    crNumerador: (["gasto-total", "gasto-google", "gasto-meta"] as const).includes(body.crNumerador)
      ? body.crNumerador : DEFAULT_FORMULA_CONFIG.crNumerador,
  };
  await saveFormulaConfig(config);
  return NextResponse.json({ ok: true });
}
