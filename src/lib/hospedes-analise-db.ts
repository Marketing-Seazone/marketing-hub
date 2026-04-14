import { redis } from "./redis";

export interface ReservationDetail {
  id: string;
  source: string;
  utm: string;
  coupon: string;
  destination: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  type: string; // "midia-sem-atendimento" | "midia-com-atendimento" | "relatorio-newbyte"
  data: Record<string, string | number>;
  reservations: ReservationDetail[];
}

export interface DailySpending {
  id: string;
  date: string;
  google: number;
  meta: number;
  tiktok: number;
  meta565?: number;
  meta566?: number;
}

const RECORDS_KEY = "hospedes-analise:records";
const SPENDING_KEY = "hospedes-analise:spending";

export async function getRecords(): Promise<DailyRecord[]> {
  return (await redis.get<DailyRecord[]>(RECORDS_KEY)) ?? [];
}

export async function saveRecords(records: DailyRecord[]): Promise<void> {
  await redis.set(RECORDS_KEY, records);
}

export async function getSpending(): Promise<DailySpending[]> {
  return (await redis.get<DailySpending[]>(SPENDING_KEY)) ?? [];
}

export async function saveSpending(spending: DailySpending[]): Promise<void> {
  await redis.set(SPENDING_KEY, spending);
}
