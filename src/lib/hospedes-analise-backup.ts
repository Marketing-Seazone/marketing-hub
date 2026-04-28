import fs from "fs";
import path from "path";
import type { DailyRecord, DailySpending, FormulaConfig } from "./hospedes-analise-db";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function exportRecordsToFile(records: DailyRecord[]): Promise<string> {
  ensureDataDir();
  const timestamp = new Date().toISOString().slice(0, 10);
  const filePath = path.join(DATA_DIR, `hospedes-analise-records-${timestamp}.json`);
  const data = {
    exportedAt: new Date().toISOString(),
    type: "records",
    count: records.length,
    records,
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export async function exportSpendingToFile(spending: DailySpending[]): Promise<string> {
  ensureDataDir();
  const timestamp = new Date().toISOString().slice(0, 10);
  const filePath = path.join(DATA_DIR, `hospedes-analise-spending-${timestamp}.json`);
  const data = {
    exportedAt: new Date().toISOString(),
    type: "spending",
    count: spending.length,
    spending,
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export async function exportFormulaConfigToFile(config: FormulaConfig): Promise<string> {
  ensureDataDir();
  const timestamp = new Date().toISOString().slice(0, 10);
  const filePath = path.join(DATA_DIR, `hospedes-analise-config-${timestamp}.json`);
  const data = {
    exportedAt: new Date().toISOString(),
    type: "formula-config",
    config,
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export async function exportAllToFiles(
  records: DailyRecord[],
  spending: DailySpending[],
  config: FormulaConfig
): Promise<{ recordsPath: string; spendingPath: string; configPath: string }> {
  const [recordsPath, spendingPath, configPath] = await Promise.all([
    exportRecordsToFile(records),
    exportSpendingToFile(spending),
    exportFormulaConfigToFile(config),
  ]);
  return { recordsPath, spendingPath, configPath };
}

export async function importRecordsFromFile(filePath: string): Promise<DailyRecord[] | null> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    return data.records || null;
  } catch {
    return null;
  }
}

export async function importSpendingFromFile(filePath: string): Promise<DailySpending[] | null> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    return data.spending || null;
  } catch {
    return null;
  }
}