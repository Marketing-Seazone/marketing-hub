"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Area, Legend,
} from "recharts";
import type { DailyRecord, DailySpending, ReservationDetail } from "@/lib/hospedes-analise-db";

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtCurrency(v: number) {
  if (!v) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtNum(v: number | undefined) {
  if (v == null || v === 0) return "—";
  return v.toLocaleString("pt-BR");
}

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function parseMoneyValue(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const raw = String(value).trim();
  const norm = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(norm);
  return Number.isFinite(parsed) ? parsed : 0;
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiGetRecords(): Promise<DailyRecord[]> {
  const r = await fetch("/api/hospedes-analise/records");
  return r.json();
}

async function apiSaveRecord(record: DailyRecord): Promise<void> {
  await fetch("/api/hospedes-analise/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}

async function apiDeleteRecord(id: string): Promise<void> {
  await fetch(`/api/hospedes-analise/records/${id}`, { method: "DELETE" });
}

async function apiGetSpending(): Promise<DailySpending[]> {
  const r = await fetch("/api/hospedes-analise/spending");
  return r.json();
}

async function apiSaveSpending(entry: DailySpending): Promise<void> {
  await fetch("/api/hospedes-analise/spending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

async function apiDeleteSpending(id: string): Promise<void> {
  await fetch(`/api/hospedes-analise/spending/${id}`, { method: "DELETE" });
}

// ─── useAnalysis hook ─────────────────────────────────────────────────────────

type AnalysisRow = {
  date: string;
  gastoGoogle: number; gastoMeta: number; gastoTiktok: number; gastoTotal: number;
  fatSzTotal: number; fatEffTotal: number; cleaningTotal: number; reservasTotal: number;
  fatLiquido: number; roi: number; conversoesNB: number; ticketsNB: number;
};

function buildAnalysisData(
  records: DailyRecord[],
  spending: DailySpending[],
  source: string,
  startDate: string,
  endDate: string,
): AnalysisRow[] {
  const map: Record<string, {
    date: string;
    gastoGoogle: number; gastoMeta: number; gastoTiktok: number; gastoTotal: number;
    fatSzSem: number; fatSzCom: number; fatSzNB: number;
    fatEffSem: number; fatEffCom: number; fatEffNB: number;
    cleaningSem: number; cleaningCom: number; cleaningNB: number;
    reservasSem: number; reservasCom: number; reservasNB: number;
    ticketsNB: number; conversoesNB: number;
  }> = {};

  const ensure = (d: string) => {
    if (!map[d]) map[d] = {
      date: d,
      gastoGoogle: 0, gastoMeta: 0, gastoTiktok: 0, gastoTotal: 0,
      fatSzSem: 0, fatSzCom: 0, fatSzNB: 0,
      fatEffSem: 0, fatEffCom: 0, fatEffNB: 0,
      cleaningSem: 0, cleaningCom: 0, cleaningNB: 0,
      reservasSem: 0, reservasCom: 0, reservasNB: 0,
      ticketsNB: 0, conversoesNB: 0,
    };
    return map[d];
  };

  spending.forEach((s) => {
    const row = ensure(s.date);
    row.gastoGoogle += s.google;
    row.gastoMeta += s.meta;
    row.gastoTiktok += s.tiktok;
    row.gastoTotal += s.google + s.meta + s.tiktok;
  });

  records.forEach((r) => {
    const row = ensure(r.date);
    const fatEff = parseMoneyValue(r.data.fatEffective);
    const cleaning = parseMoneyValue(r.data.cleaningFee);
    const fatSz = r.type === "relatorio-newbyte"
      ? parseMoneyValue(r.data.fatSeazone)
      : (fatEff - cleaning) * 0.24;
    let reservas = parseMoneyValue(r.data.reservas);

    if (r.type === "midia-sem-atendimento") {
      row.fatSzSem += fatSz; row.fatEffSem += fatEff; row.cleaningSem += cleaning; row.reservasSem += reservas;
    } else if (r.type === "midia-com-atendimento") {
      row.fatSzCom += fatSz; row.fatEffCom += fatEff; row.cleaningCom += cleaning; row.reservasCom += reservas;
    } else if (r.type === "relatorio-newbyte") {
      row.fatSzNB += fatSz; row.fatEffNB += fatEff; row.cleaningNB += cleaning;
      row.ticketsNB += parseMoneyValue(r.data.tickets);
      const conv = parseMoneyValue(r.data.conversoes);
      row.conversoesNB += conv;
      reservas = conv;
    }
  });

  let data = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  if (startDate) data = data.filter((d) => d.date >= startDate);
  if (endDate) data = data.filter((d) => d.date <= endDate);

  return data.map((row) => {
    let fatSz = row.fatSzSem + row.fatSzCom + row.fatSzNB;
    let fatEff = row.fatEffSem + row.fatEffCom + row.fatEffNB;
    let cleaning = row.cleaningSem + row.cleaningCom + row.cleaningNB;
    let reservas = row.reservasSem + row.reservasCom + row.reservasNB;
    if (source === "sem-atendimento") { fatSz = row.fatSzSem; fatEff = row.fatEffSem; cleaning = row.cleaningSem; reservas = row.reservasSem; }
    else if (source === "com-atendimento") { fatSz = row.fatSzCom; fatEff = row.fatEffCom; cleaning = row.cleaningCom; reservas = row.reservasCom; }
    else if (source === "newbyte") { fatSz = row.fatSzNB; fatEff = row.fatEffNB; cleaning = row.cleaningNB; reservas = row.conversoesNB; }
    const fatLiquido = fatEff - cleaning;
    const roi = row.gastoTotal > 0 ? (fatSz - row.gastoTotal) / row.gastoTotal : 0;
    return {
      date: row.date,
      gastoGoogle: row.gastoGoogle, gastoMeta: row.gastoMeta, gastoTiktok: row.gastoTiktok, gastoTotal: row.gastoTotal,
      fatSzTotal: fatSz, fatEffTotal: fatEff, cleaningTotal: cleaning, reservasTotal: reservas,
      fatLiquido, roi, conversoesNB: row.conversoesNB, ticketsNB: row.ticketsNB,
    };
  });
}

// ─── MonthlyRoiTable ──────────────────────────────────────────────────────────

function MonthlyRoiTable({
  records,
  spending,
  source,
}: {
  records: DailyRecord[];
  spending: DailySpending[];
  source: string;
}) {
  const monthlyData = useMemo(() => {
    const daily = buildAnalysisData(records, spending, source, "", "");
    const map: Record<string, {
      month: string;
      gastoTotal: number;
      fatEffTotal: number;
      fatSzTotal: number;
      cleaningTotal: number;
      fatLiquido: number;
      reservasTotal: number;
    }> = {};

    for (const d of daily) {
      const month = d.date.slice(0, 7);
      if (!map[month]) {
        map[month] = { month, gastoTotal: 0, fatEffTotal: 0, fatSzTotal: 0, cleaningTotal: 0, fatLiquido: 0, reservasTotal: 0 };
      }
      map[month].gastoTotal += d.gastoTotal;
      map[month].fatEffTotal += d.fatEffTotal;
      map[month].fatSzTotal += d.fatSzTotal;
      map[month].cleaningTotal += d.cleaningTotal;
      map[month].fatLiquido += d.fatLiquido;
      map[month].reservasTotal += d.reservasTotal;
    }

    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
      ...m,
      roi: m.gastoTotal > 0 ? (m.fatSzTotal - m.gastoTotal) / m.gastoTotal : 0,
    }));
  }, [records, spending, source]);

  if (monthlyData.length === 0) return null;

  const totals = monthlyData.reduce(
    (acc, m) => {
      acc.gastoTotal += m.gastoTotal;
      acc.fatEffTotal += m.fatEffTotal;
      acc.fatSzTotal += m.fatSzTotal;
      acc.cleaningTotal += m.cleaningTotal;
      acc.fatLiquido += m.fatLiquido;
      acc.reservasTotal += m.reservasTotal;
      return acc;
    },
    { gastoTotal: 0, fatEffTotal: 0, fatSzTotal: 0, cleaningTotal: 0, fatLiquido: 0, reservasTotal: 0 }
  );
  const totalRoi = totals.gastoTotal > 0 ? (totals.fatSzTotal - totals.gastoTotal) / totals.gastoTotal : 0;

  const fmtMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(mo, 10) - 1]}/${y.slice(2)}`;
  };

  const thS: React.CSSProperties = { padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#7C7C7C", textAlign: "right", background: "#F8FAFF", borderBottom: "1px solid #E8EEF8", whiteSpace: "nowrap" };
  const tdS: React.CSSProperties = { padding: "7px 12px", fontSize: 12, textAlign: "right", borderBottom: "1px solid #F0F3FA", whiteSpace: "nowrap" };

  return (
    <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F3FA", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: "#0055FF" }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", margin: 0 }}>ROI Mensal — Visão Consolidada</p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thS, textAlign: "left" }}>Mês</th>
              <th style={thS}>Gasto Total</th>
              <th style={thS}>Fat. Effective</th>
              <th style={thS}>Fat. Seazone</th>
              <th style={thS}>Tx. Limpeza</th>
              <th style={thS}>Fat. Líquido</th>
              <th style={thS}>Reservas</th>
              <th style={{ ...thS, color: "#0055FF" }}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m) => (
              <tr key={m.month}>
                <td style={{ ...tdS, textAlign: "left", fontWeight: 600, color: "#00143D" }}>{fmtMonth(m.month)}</td>
                <td style={{ ...tdS, color: "#FC6058" }}>{fmtCurrency(m.gastoTotal)}</td>
                <td style={tdS}>{fmtCurrency(m.fatEffTotal)}</td>
                <td style={{ ...tdS, color: "#0055FF" }}>{fmtCurrency(m.fatSzTotal)}</td>
                <td style={{ ...tdS, color: "#94A3B8" }}>{fmtCurrency(m.cleaningTotal)}</td>
                <td style={{ ...tdS, color: "#0EA5E9" }}>{fmtCurrency(m.fatLiquido)}</td>
                <td style={tdS}>{m.reservasTotal > 0 ? m.reservasTotal.toFixed(0) : "—"}</td>
                <td style={{ ...tdS, fontWeight: 700, color: m.roi >= 0 ? "#10B981" : "#FC6058" }}>
                  {m.gastoTotal > 0 ? `${(m.roi * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#F8FAFF" }}>
              <td style={{ ...tdS, textAlign: "left", fontWeight: 700, color: "#00143D", borderTop: "2px solid #E8EEF8" }}>Total</td>
              <td style={{ ...tdS, fontWeight: 700, color: "#FC6058", borderTop: "2px solid #E8EEF8" }}>{fmtCurrency(totals.gastoTotal)}</td>
              <td style={{ ...tdS, fontWeight: 700, borderTop: "2px solid #E8EEF8" }}>{fmtCurrency(totals.fatEffTotal)}</td>
              <td style={{ ...tdS, fontWeight: 700, color: "#0055FF", borderTop: "2px solid #E8EEF8" }}>{fmtCurrency(totals.fatSzTotal)}</td>
              <td style={{ ...tdS, fontWeight: 700, color: "#94A3B8", borderTop: "2px solid #E8EEF8" }}>{fmtCurrency(totals.cleaningTotal)}</td>
              <td style={{ ...tdS, fontWeight: 700, color: "#0EA5E9", borderTop: "2px solid #E8EEF8" }}>{fmtCurrency(totals.fatLiquido)}</td>
              <td style={{ ...tdS, fontWeight: 700, borderTop: "2px solid #E8EEF8" }}>{totals.reservasTotal > 0 ? totals.reservasTotal.toFixed(0) : "—"}</td>
              <td style={{ ...tdS, fontWeight: 700, color: totalRoi >= 0 ? "#10B981" : "#FC6058", borderTop: "2px solid #E8EEF8" }}>
                {totals.gastoTotal > 0 ? `${(totalRoi * 100).toFixed(1)}%` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── ResultadosTab ────────────────────────────────────────────────────────────

function ResultadosTab({ records, spending, onRecordsChange }: { records: DailyRecord[]; spending: DailySpending[]; onRecordsChange: (r: DailyRecord[]) => void }) {
  const [source, setSource] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [metrics, setMetrics] = useState<string[]>(["fatSzTotal", "reservasTotal"]);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{ updated: number } | null>(null);

  const handleFixFatSeazone = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const res = await fetch("/api/hospedes-analise/fix-fat-seazone", { method: "POST" });
      const json = await res.json();
      setFixResult(json);
      const updated = await fetch("/api/hospedes-analise/records").then((r) => r.json());
      onRecordsChange(updated);
    } finally {
      setFixing(false);
    }
  };

  const data = useMemo(
    () => buildAnalysisData(records, spending, source, startDate, endDate),
    [records, spending, source, startDate, endDate]
  );

  const summary = useMemo(() => {
    const totalGasto = data.reduce((s, d) => s + d.gastoTotal, 0);
    const totalFatSz = data.reduce((s, d) => s + d.fatSzTotal, 0);
    const totalFatEff = data.reduce((s, d) => s + d.fatEffTotal, 0);
    const totalCleaning = data.reduce((s, d) => s + d.cleaningTotal, 0);
    const totalReservas = data.reduce((s, d) => s + d.reservasTotal, 0);
    const totalFatLiquido = data.reduce((s, d) => s + d.fatLiquido, 0);
    const roi = totalGasto > 0 ? (totalFatSz - totalGasto) / totalGasto : 0;
    const custoReserva = totalReservas > 0 ? totalGasto / totalReservas : 0;
    return { totalGasto, totalFatSz, totalFatEff, totalCleaning, totalFatLiquido, totalReservas, roi, custoReserva };
  }, [data]);

  const ALL_METRICS = [
    { key: "fatSzTotal", label: "Fat. Seazone", color: "#0055FF" },
    { key: "fatEffTotal", label: "Fat. Effective", color: "#7C3AED" },
    { key: "gastoTotal", label: "Gasto Total", color: "#FC6058" },
    { key: "reservasTotal", label: "Reservas", color: "#10B981" },
    { key: "gastoGoogle", label: "Gasto Google", color: "#0EA5E9" },
    { key: "gastoMeta", label: "Gasto Meta", color: "#6366F1" },
    { key: "gastoTiktok", label: "Gasto TikTok", color: "#EC4899" },
  ];

  const toggleMetric = (key: string) =>
    setMetrics((prev) => prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]);

  const chartData = data.map((d) => ({ ...d, date: fmtDate(d.date) }));
  const hasData = data.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "#00143D", borderRadius: 16, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,85,255,0.12), transparent)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 40, height: 3, background: "#0055FF", borderRadius: 2, marginBottom: 12 }} />
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>Resultados — Mídia Paga Hóspedes</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Acompanhamento de performance cruzando métricas, reservas e gastos</p>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: "#00143D", marginBottom: 12 }}>Filtros</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Frente</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13, background: "#fff" }}>
              <option value="all">Todas as frentes</option>
              <option value="sem-atendimento">Mídia paga (s/ atend.)</option>
              <option value="com-atendimento">Mídia paga (c/ atend.)</option>
              <option value="newbyte">Newbyte</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 }}>De</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13, background: "#fff" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Até</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13, background: "#fff" }} />
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0F3FA", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleFixFatSeazone} disabled={fixing} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E8EEF8", background: fixing ? "#F0F3FA" : "#fff", fontSize: 12, cursor: fixing ? "not-allowed" : "pointer", color: "#0055FF", fontWeight: 600 }}>
            {fixing ? "Corrigindo..." : "Corrigir Fat. Seazone nos dados"}
          </button>
          {fixResult && <span style={{ fontSize: 12, color: "#10B981" }}>{fixResult.updated} registro(s) corrigido(s)</span>}
        </div>
      </div>

      {hasData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Fat. Seazone (24%)", value: fmtCurrency(summary.totalFatSz), color: "#0055FF", title: "" },
            { label: "Fat. Effective", value: fmtCurrency(summary.totalFatEff), color: "#7C3AED", title: "" },
            { label: "Tx. Limpeza", value: fmtCurrency(summary.totalCleaning), color: "#94A3B8", title: "" },
            { label: "Fat. Líquido", value: fmtCurrency(summary.totalFatLiquido), color: "#0EA5E9", title: "Fat. Effective - Tx. Limpeza" },
            { label: "Gasto Total", value: fmtCurrency(summary.totalGasto), color: "#FC6058", title: "" },
            { label: "Reservas", value: summary.totalReservas.toFixed(0), color: "#10B981", title: "" },
            { label: "ROI", value: `${(summary.roi * 100).toFixed(1)}%`, color: summary.roi >= 0 ? "#10B981" : "#FC6058", title: "(Fat. Seazone - Gasto) / Gasto" },
            { label: "Custo/Reserva", value: fmtCurrency(summary.custoReserva), color: "#F59E0B", title: "" },
          ].map((kpi) => (
            <div key={kpi.label} title={kpi.title} style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: "#7C7C7C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{kpi.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#7C7C7C", marginBottom: 10 }}>Selecionar métricas no gráfico</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_METRICS.map((m) => {
              const active = metrics.includes(m.key);
              return (
                <button key={m.key} onClick={() => toggleMetric(m.key)} style={{ padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${active ? m.color : "#E8EEF8"}`, background: active ? `${m.color}18` : "#fff", color: active ? m.color : "#7C7C7C", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer" }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasData && metrics.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7C7C7C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#7C7C7C" }} width={60} />
              <Tooltip contentStyle={{ background: "#00143D", border: "none", borderRadius: 10, fontSize: 12, color: "#fff" }} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {ALL_METRICS.filter((m) => metrics.includes(m.key)).map((m) => (
                <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} opacity={0.85} radius={[3, 3, 0, 0]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hasData && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#7C7C7C" }}>
          <p style={{ fontSize: 36 }}>📊</p>
          <p style={{ marginTop: 8 }}>Nenhum dado encontrado. Preencha registros na aba Preenchimento.</p>
        </div>
      )}

      {hasData && <MonthlyRoiTable records={records} spending={spending} source={source} />}
    </div>
  );
}

// ─── PreenchimentoTab ─────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "midia-sem-atendimento", label: "Sem atendimento", emoji: "📊", desc: "Mídia paga direta" },
  { value: "midia-com-atendimento", label: "Com atendimento", emoji: "🤝", desc: "Mídia + atend." },
  { value: "relatorio-newbyte", label: "Newbyte", emoji: "📋", desc: "Relatório IA" },
];

function emptyReservation(): ReservationDetail {
  return { id: uid(), source: "", utm: "", coupon: "", destination: "" };
}

function PreenchimentoTab({ records, spending, onRecordsChange, onSpendingChange }: { records: DailyRecord[]; spending: DailySpending[]; onRecordsChange: (r: DailyRecord[]) => void; onSpendingChange: (s: DailySpending[]) => void }) {
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reservations, setReservations] = useState<ReservationDetail[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [spDate, setSpDate] = useState(todayStr());
  const [spGoogle, setSpGoogle] = useState("");
  const [spMeta, setSpMeta] = useState("");
  const [spTiktok, setSpTiktok] = useState("");
  const [spEditId, setSpEditId] = useState<string | null>(null);
  const [spSaved, setSpSaved] = useState(false);

  const resetForm = () => { setFormData({}); setReservations([]); setSaved(false); setEditingId(null); };

  const calcFatSeazone = () => {
    const ep = parseMoneyValue(formData.fatEffective);
    const cf = parseMoneyValue(formData.cleaningFee);
    setFormData((prev) => ({ ...prev, fatSeazone: ((ep - cf) * 0.24).toFixed(2) }));
  };

  const handleSave = async () => {
    if (!selectedType || !selectedDate) return;
    const record: DailyRecord = { id: editingId || uid(), date: selectedDate, type: selectedType, data: Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])), reservations };
    const updated = editingId ? records.map((r) => (r.id === editingId ? record : r)) : [...records, record];
    await apiSaveRecord(record);
    onRecordsChange(updated);
    setSaved(true);
    setTimeout(() => { resetForm(); setSelectedType(""); }, 1500);
  };

  const handleSaveSpending = async () => {
    if (!spDate) return;
    const metaTotal = Number(spMeta) || 0;
    const entry: DailySpending = { id: spEditId || uid(), date: spDate, google: Number(spGoogle) || 0, meta: metaTotal, tiktok: Number(spTiktok) || 0, meta565: metaTotal, meta566: 0 };
    const updated = spEditId ? spending.map((s) => (s.id === spEditId ? entry : s)) : [...spending, entry];
    await apiSaveSpending(entry);
    onSpendingChange(updated);
    setSpSaved(true);
    setSpEditId(null);
    setTimeout(() => { setSpGoogle(""); setSpMeta(""); setSpTiktok(""); setSpSaved(false); }, 1500);
  };

  const handleEditRecord = (r: DailyRecord) => { setSelectedType(r.type); setSelectedDate(r.date); setFormData(Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, String(v)]))); setReservations(r.reservations); setEditingId(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleDeleteRecord = async (id: string) => { await apiDeleteRecord(id); onRecordsChange(records.filter((r) => r.id !== id)); };
  const handleEditSpending = (s: DailySpending) => { setSpDate(s.date); setSpGoogle(String(s.google || "")); setSpMeta(String(s.meta || "")); setSpTiktok(String(s.tiktok || "")); setSpEditId(s.id); };
  const handleDeleteSpending = async (id: string) => { await apiDeleteSpending(id); onSpendingChange(spending.filter((s) => s.id !== id)); };

  const isNewbyte = selectedType === "relatorio-newbyte";
  const fieldStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13, background: "#fff", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 12 }}>Tipo de relatório</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TYPE_OPTIONS.map((t) => (
            <button key={t.value} onClick={() => { setSelectedType(t.value); resetForm(); }} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${selectedType === t.value ? "#0055FF" : "#E8EEF8"}`, background: selectedType === t.value ? "#0055FF12" : "#fff", color: selectedType === t.value ? "#0055FF" : "#00143D", fontWeight: selectedType === t.value ? 700 : 400, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{t.emoji}</span> {t.label} <span style={{ fontSize: 11, color: "#7C7C7C", fontWeight: 400 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 16 }}>{editingId ? "Editando registro" : "Novo registro"}</p>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Data</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={fieldStyle} /></div>
          {!isNewbyte && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Reservas</label><input type="number" placeholder="0" value={formData.reservas || ""} onChange={(e) => setFormData((p) => ({ ...p, reservas: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Fat. Effective (R$)</label><input type="number" placeholder="0" value={formData.fatEffective || ""} onChange={(e) => setFormData((p) => ({ ...p, fatEffective: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Tx. Limpeza (R$)</label><input type="number" placeholder="0" value={formData.cleaningFee || ""} onChange={(e) => setFormData((p) => ({ ...p, cleaningFee: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Fat. Seazone (R$)</label><div style={{ display: "flex", gap: 6 }}><input type="number" placeholder="0" value={formData.fatSeazone || ""} onChange={(e) => setFormData((p) => ({ ...p, fatSeazone: e.target.value }))} style={{ ...fieldStyle, flex: 1 }} /><button onClick={calcFatSeazone} title="Calcular automaticamente" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #E8EEF8", background: "#F0F3FA", fontSize: 12, cursor: "pointer" }}>⚡</button></div></div>
            </div>
          )}
          {isNewbyte && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Tickets</label><input type="number" placeholder="0" value={formData.tickets || ""} onChange={(e) => setFormData((p) => ({ ...p, tickets: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Reservas (conversões)</label><input type="number" placeholder="0" value={formData.conversoes || ""} onChange={(e) => setFormData((p) => ({ ...p, conversoes: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Fat. Effective (R$)</label><input type="number" placeholder="0" value={formData.fatEffective || ""} onChange={(e) => setFormData((p) => ({ ...p, fatEffective: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Fat. Seazone (R$)</label><input type="number" placeholder="0" value={formData.fatSeazone || ""} onChange={(e) => setFormData((p) => ({ ...p, fatSeazone: e.target.value }))} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Canal</label><select value={formData.canal || ""} onChange={(e) => setFormData((p) => ({ ...p, canal: e.target.value }))} style={fieldStyle}><option value="">Selecione</option><option value="meta">Meta Ads</option><option value="tiktok">TikTok</option></select></div>
            </div>
          )}
          {!isNewbyte && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Detalhes de reservas</label>
                <button onClick={() => setReservations((p) => [...p, emptyReservation()])} style={{ fontSize: 12, color: "#0055FF", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Adicionar reserva</button>
              </div>
              {reservations.map((res, i) => (
                <div key={res.id} style={{ border: "1px solid #E8EEF8", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#00143D" }}>Reserva {i + 1}{res.destination && ` — ${res.destination}`}</span><button onClick={() => setReservations((p) => p.filter((_, j) => j !== i))} style={{ fontSize: 12, color: "#FC6058", background: "none", border: "none", cursor: "pointer" }}>✕</button></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><label style={labelStyle}>Fonte</label><select value={res.source} onChange={(e) => setReservations((p) => p.map((r, j) => j === i ? { ...r, source: e.target.value } : r))} style={fieldStyle}><option value="">—</option><option value="Google">Google</option><option value="Meta Ads">Meta Ads</option><option value="TikTok">TikTok</option></select></div>
                    <div><label style={labelStyle}>Destino</label><input type="text" placeholder="Florianópolis" value={res.destination} onChange={(e) => setReservations((p) => p.map((r, j) => j === i ? { ...r, destination: e.target.value } : r))} style={fieldStyle} /></div>
                    <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>UTMs</label><input type="text" placeholder="utm_source=google&utm_medium=cpc" value={res.utm} onChange={(e) => setReservations((p) => p.map((r, j) => j === i ? { ...r, utm: e.target.value } : r))} style={fieldStyle} /></div>
                    <div><label style={labelStyle}>Cupom</label><input type="text" placeholder="PRAIA10" value={res.coupon} onChange={(e) => setReservations((p) => p.map((r, j) => j === i ? { ...r, coupon: e.target.value } : r))} style={fieldStyle} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saved} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: saved ? "#10B981" : "#0055FF", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saved ? "✓ Salvo!" : editingId ? "Salvar edição" : "Salvar registro"}</button>
            {editingId && <button onClick={resetForm} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #E8EEF8", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancelar</button>}
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 16 }}>Gastos diários de mídia</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Data</label><input type="date" value={spDate} onChange={(e) => setSpDate(e.target.value)} style={fieldStyle} /></div>
          <div><label style={labelStyle}>Google Ads (R$)</label><input type="number" placeholder="0" value={spGoogle} onChange={(e) => setSpGoogle(e.target.value)} style={fieldStyle} /></div>
          <div><label style={labelStyle}>Meta Ads (R$)</label><input type="number" placeholder="0" value={spMeta} onChange={(e) => setSpMeta(e.target.value)} style={fieldStyle} /></div>
          <div><label style={labelStyle}>TikTok Ads (R$)</label><input type="number" placeholder="0" value={spTiktok} onChange={(e) => setSpTiktok(e.target.value)} style={fieldStyle} /></div>
        </div>
        <button onClick={handleSaveSpending} disabled={spSaved} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: spSaved ? "#10B981" : "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{spSaved ? "✓ Salvo!" : spEditId ? "Salvar edição" : "Salvar gastos"}</button>
        {spending.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#7C7C7C", marginBottom: 8 }}>Registros de gastos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...spending].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F8FAFF", borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "#00143D" }}>{fmtDate(s.date)}</span>
                  <span style={{ color: "#7C7C7C" }}>Google: {fmtCurrency(s.google)} | Meta: {fmtCurrency(s.meta)} | TikTok: {fmtCurrency(s.tiktok)}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleEditSpending(s)} style={{ fontSize: 12, color: "#0055FF", background: "none", border: "none", cursor: "pointer" }}>✏</button>
                    <button onClick={() => handleDeleteSpending(s.id)} style={{ fontSize: 12, color: "#FC6058", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {records.filter((r) => r.date === todayStr()).length > 0 && (
        <div style={{ background: "#F0F3FA", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#7C7C7C", marginBottom: 8 }}>Registros de hoje</p>
          {records.filter((r) => r.date === todayStr()).map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#fff", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              <span>{TYPE_OPTIONS.find((t) => t.value === r.type)?.emoji} {TYPE_OPTIONS.find((t) => t.value === r.type)?.label}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => handleEditRecord(r)} style={{ fontSize: 12, color: "#0055FF", background: "none", border: "none", cursor: "pointer" }}>✏ Editar</button>
                <button onClick={() => handleDeleteRecord(r.id)} style={{ fontSize: 12, color: "#FC6058", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TabelaTab (unchanged from original) ──────────────────────────────────────

function TabelaTab({ records, spending, onRecordsChange, onSpendingChange }: { records: DailyRecord[]; spending: DailySpending[]; onRecordsChange: (r: DailyRecord[]) => void; onSpendingChange: (s: DailySpending[]) => void }) {
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  type DateColumn = { date: string; sem?: DailyRecord; com?: DailyRecord; nb?: DailyRecord; spending?: { google: number; meta: number; tiktok: number; total: number }; reservations: ReservationDetail[] };

  const columns = useMemo(() => {
    const map: Record<string, DateColumn> = {};
    records.forEach((r) => { if (!map[r.date]) map[r.date] = { date: r.date, reservations: [] }; if (r.type === "midia-sem-atendimento") map[r.date].sem = r; else if (r.type === "midia-com-atendimento") map[r.date].com = r; else if (r.type === "relatorio-newbyte") map[r.date].nb = r; map[r.date].reservations.push(...r.reservations); });
    spending.forEach((s) => { if (!map[s.date]) map[s.date] = { date: s.date, reservations: [] }; const ex = map[s.date].spending || { google: 0, meta: 0, tiktok: 0, total: 0 }; ex.google += s.google; ex.meta += s.meta; ex.tiktok += s.tiktok; ex.total += s.google + s.meta + s.tiktok; map[s.date].spending = ex; });
    let cols = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
    if (filterFrom) cols = cols.filter((c) => c.date >= filterFrom);
    if (filterTo) cols = cols.filter((c) => c.date <= filterTo);
    return cols;
  }, [records, spending, filterFrom, filterTo]);

  const handleDeleteDate = async (date: string) => { const delRecs = records.filter((r) => r.date === date); const delSp = spending.filter((s) => s.date === date); for (const r of delRecs) await apiDeleteRecord(r.id); for (const s of delSp) await apiDeleteSpending(s.id); onRecordsChange(records.filter((r) => r.date !== date)); onSpendingChange(spending.filter((s) => s.date !== date)); };
  const getVal = (rec: DailyRecord | undefined, key: string) => { if (!rec) return undefined; const v = rec.data[key]; return v != null ? Number(v) : undefined; };
  const fmtVal = (v: number | undefined, fmt: "currency" | "number") => { if (v == null || v === 0) return <span style={{ color: "#ccc" }}>—</span>; return fmt === "currency" ? fmtCurrency(v) : fmtNum(v); };

  const totals = useMemo(() => columns.reduce((acc, c) => { acc.google += c.spending?.google || 0; acc.meta += c.spending?.meta || 0; acc.tiktok += c.spending?.tiktok || 0; acc.total += c.spending?.total || 0; acc.fatSzSem += parseMoneyValue(c.sem?.data.fatSeazone); acc.fatSzCom += parseMoneyValue(c.com?.data.fatSeazone); acc.fatSzNB += parseMoneyValue(c.nb?.data.fatSeazone); acc.fatEffSem += parseMoneyValue(c.sem?.data.fatEffective); acc.fatEffCom += parseMoneyValue(c.com?.data.fatEffective); acc.fatEffNB += parseMoneyValue(c.nb?.data.fatEffective); acc.cleaningSem += parseMoneyValue(c.sem?.data.cleaningFee); acc.cleaningCom += parseMoneyValue(c.com?.data.cleaningFee); acc.resSem += getVal(c.sem, "reservas") || 0; acc.resCom += getVal(c.com, "reservas") || 0; acc.resNB += getVal(c.nb, "conversoes") || 0; return acc; }, { google: 0, meta: 0, tiktok: 0, total: 0, fatSzSem: 0, fatSzCom: 0, fatSzNB: 0, fatEffSem: 0, fatEffCom: 0, fatEffNB: 0, cleaningSem: 0, cleaningCom: 0, resSem: 0, resCom: 0, resNB: 0 }), [columns]);

  const thStyle: React.CSSProperties = { padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#7C7C7C", textAlign: "center", whiteSpace: "nowrap", background: "#F8FAFF", borderBottom: "1px solid #E8EEF8" };
  const tdStyle: React.CSSProperties = { padding: "6px 10px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #F0F3FA", whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 }}>De</label><input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13 }} /></div>
        <div><label style={{ fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Até</label><input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13 }} /></div>
        {(filterFrom || filterTo) && <button onClick={() => { setFilterFrom(""); setFilterTo(""); }} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E8EEF8", background: "#fff", fontSize: 12, cursor: "pointer" }}>Limpar</button>}
      </div>
      {columns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#7C7C7C" }}><p style={{ fontSize: 32 }}>📋</p><p style={{ marginTop: 8 }}>Nenhum dado. Preencha registros na aba Preenchimento.</p></div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #E8EEF8" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left", position: "sticky", left: 0, zIndex: 2 }}>Data</th>
                <th style={{ ...thStyle, background: "#EBF2FF" }} colSpan={4}>Sem atend.</th>
                <th style={{ ...thStyle, background: "#ECFDF5" }} colSpan={4}>Com atend.</th>
                <th style={{ ...thStyle, background: "#F5F3FF" }} colSpan={4}>Newbyte</th>
                <th style={{ ...thStyle, background: "#FFFBEB" }} colSpan={4}>Gastos</th>
                <th style={thStyle}>Res.</th>
                <th style={thStyle}>Ações</th>
              </tr>
              <tr>
                <th style={{ ...thStyle, textAlign: "left", position: "sticky", left: 0, zIndex: 2 }}></th>
                <th style={{ ...thStyle, background: "#EBF2FF" }}>Res.</th><th style={{ ...thStyle, background: "#EBF2FF" }}>Fat. Eff.</th><th style={{ ...thStyle, background: "#EBF2FF" }}>Tx. Limp.</th><th style={{ ...thStyle, background: "#EBF2FF" }}>Fat. Sz</th>
                <th style={{ ...thStyle, background: "#ECFDF5" }}>Res.</th><th style={{ ...thStyle, background: "#ECFDF5" }}>Fat. Eff.</th><th style={{ ...thStyle, background: "#ECFDF5" }}>Tx. Limp.</th><th style={{ ...thStyle, background: "#ECFDF5" }}>Fat. Sz</th>
                <th style={{ ...thStyle, background: "#F5F3FF" }}>Tickets</th><th style={{ ...thStyle, background: "#F5F3FF" }}>Conv.</th><th style={{ ...thStyle, background: "#F5F3FF" }}>Fat. Eff.</th><th style={{ ...thStyle, background: "#F5F3FF" }}>Fat. Sz</th>
                <th style={{ ...thStyle, background: "#FFFBEB" }}>Google</th><th style={{ ...thStyle, background: "#FFFBEB" }}>Meta</th><th style={{ ...thStyle, background: "#FFFBEB" }}>TikTok</th><th style={{ ...thStyle, background: "#FFFBEB" }}>Total</th>
                <th style={thStyle}>Det.</th><th style={thStyle}></th>
              </tr>
              <tr style={{ background: "#F8FAFF", fontWeight: 700 }}>
                <td style={{ ...tdStyle, textAlign: "left", position: "sticky", left: 0, background: "#F8FAFF", fontWeight: 700, fontSize: 11 }}>TOTAL</td>
                <td style={tdStyle}>{totals.resSem || "—"}</td><td style={tdStyle}>{fmtCurrency(totals.fatEffSem)}</td><td style={tdStyle}>{fmtCurrency(totals.cleaningSem)}</td><td style={tdStyle}>{fmtCurrency(totals.fatSzSem)}</td>
                <td style={tdStyle}>{totals.resCom || "—"}</td><td style={tdStyle}>{fmtCurrency(totals.fatEffCom)}</td><td style={tdStyle}>{fmtCurrency(totals.cleaningCom)}</td><td style={tdStyle}>{fmtCurrency(totals.fatSzCom)}</td>
                <td style={tdStyle}>—</td><td style={tdStyle}>{totals.resNB || "—"}</td><td style={tdStyle}>{fmtCurrency(totals.fatEffNB)}</td><td style={tdStyle}>{fmtCurrency(totals.fatSzNB)}</td>
                <td style={tdStyle}>{fmtCurrency(totals.google)}</td><td style={tdStyle}>{fmtCurrency(totals.meta)}</td><td style={tdStyle}>{fmtCurrency(totals.tiktok)}</td><td style={{ ...tdStyle, fontWeight: 700, color: "#FC6058" }}>{fmtCurrency(totals.total)}</td>
                <td style={tdStyle}>—</td><td style={tdStyle}></td>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <React.Fragment key={col.date}>
                <tr style={{ borderBottom: "1px solid #F0F3FA" }}>
                  <td style={{ ...tdStyle, textAlign: "left", position: "sticky", left: 0, background: "#fff", fontWeight: 600, color: "#00143D" }}>{fmtDate(col.date)}</td>
                  <td style={tdStyle}>{fmtVal(getVal(col.sem, "reservas"), "number")}</td><td style={tdStyle}>{fmtVal(getVal(col.sem, "fatEffective"), "currency")}</td><td style={tdStyle}>{fmtVal(getVal(col.sem, "cleaningFee"), "currency")}</td><td style={tdStyle}>{fmtVal(getVal(col.sem, "fatSeazone"), "currency")}</td>
                  <td style={tdStyle}>{fmtVal(getVal(col.com, "reservas"), "number")}</td><td style={tdStyle}>{fmtVal(getVal(col.com, "fatEffective"), "currency")}</td><td style={tdStyle}>{fmtVal(getVal(col.com, "cleaningFee"), "currency")}</td><td style={tdStyle}>{fmtVal(getVal(col.com, "fatSeazone"), "currency")}</td>
                  <td style={tdStyle}>{fmtVal(getVal(col.nb, "tickets"), "number")}</td><td style={tdStyle}>{fmtVal(getVal(col.nb, "conversoes"), "number")}</td><td style={tdStyle}>{fmtVal(getVal(col.nb, "fatEffective"), "currency")}</td><td style={tdStyle}>{fmtVal(getVal(col.nb, "fatSeazone"), "currency")}</td>
                  <td style={tdStyle}>{fmtVal(col.spending?.google, "currency")}</td><td style={tdStyle}>{fmtVal(col.spending?.meta, "currency")}</td><td style={tdStyle}>{fmtVal(col.spending?.tiktok, "currency")}</td><td style={{ ...tdStyle, fontWeight: 600 }}>{fmtVal(col.spending?.total, "currency")}</td>
                  <td style={tdStyle}>{col.reservations.length > 0 ? <button onClick={() => setExpandedDate(expandedDate === col.date ? null : col.date)} style={{ fontSize: 11, color: "#0055FF", background: "#EBF2FF", padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600 }}>{col.reservations.length} {expandedDate === col.date ? "▲" : "▼"}</button> : <span style={{ color: "#ccc" }}>—</span>}</td>
                  <td style={tdStyle}><button onClick={() => { if (confirm(`Deletar todos os registros de ${fmtDate(col.date)}?`)) handleDeleteDate(col.date); }} style={{ fontSize: 11, color: "#FC6058", background: "none", border: "none", cursor: "pointer" }}>✕</button></td>
                </tr>
                {expandedDate === col.date && col.reservations.length > 0 && (
                  <tr><td colSpan={19} style={{ padding: "0 0 8px 0", background: "#F8FAFF" }}><div style={{ padding: "12px 16px" }}><p style={{ fontSize: 11, fontWeight: 700, color: "#7C7C7C", textTransform: "uppercase", marginBottom: 8 }}>Reservas de {fmtDate(col.date)} ({col.reservations.length})</p><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr>{["utm_source","utm_campaign","utm_medium","promo_code","Destino","Imóvel"].map((h) => <th key={h} style={{ padding: "4px 10px", textAlign: "left", color: "#7C7C7C", fontWeight: 600, borderBottom: "1px solid #E8EEF8", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{col.reservations.map((res, i) => { const utmParams = Object.fromEntries((res.utm || "").split("&").filter(Boolean).map((p) => p.split("=") as [string, string])); const src = res.source || utmParams["utm_source"] || "—"; const campaign = utmParams["utm_campaign"] || "—"; const medium = utmParams["utm_medium"] || "—"; const promo = res.coupon || "—"; const dest = res.destination || "—"; const prop = (res as any).propertyCode || "—"; return (<tr key={res.id || i} style={{ borderBottom: "1px solid #F0F3FA" }}><td style={{ padding: "5px 10px", color: "#0055FF", fontWeight: 500 }}>{src}</td><td style={{ padding: "5px 10px", color: "#00143D", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={campaign}>{campaign}</td><td style={{ padding: "5px 10px", color: "#7C7C7C" }}>{medium}</td><td style={{ padding: "5px 10px", color: "#7C3AED", fontWeight: promo !== "—" ? 600 : 400 }}>{promo}</td><td style={{ padding: "5px 10px", color: "#00143D" }}>{dest}</td><td style={{ padding: "5px 10px", color: "#7C7C7C", fontFamily: "monospace" }}>{prop}</td></tr>); })}</tbody></table></div></td></tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── DestinosTab ──────────────────────────────────────────────────────────────

function DestinosTab({ records }: { records: DailyRecord[] }) {
  const paidRecords = records.filter((r) => r.type === "midia-sem-atendimento" || r.type === "midia-com-atendimento");
  const cityMap: Record<string, { reservas: number; fatSz: number }> = {};
  const propMap: Record<string, { reservas: number; fatSz: number }> = {};

  for (const r of paidRecords) {
    for (const res of r.reservations) {
      const dest = res.destination?.trim() || "Não informado";
      if (!cityMap[dest]) cityMap[dest] = { reservas: 0, fatSz: 0 };
      cityMap[dest].reservas += 1;
      const prop = (res as any).propertyCode?.trim() || "Não informado";
      if (!propMap[prop]) propMap[prop] = { reservas: 0, fatSz: 0 };
      propMap[prop].reservas += 1;
    }
    const fatSzPerRes = r.reservations.length > 0 ? parseMoneyValue(r.data.fatSeazone) / r.reservations.length : 0;
    for (const res of r.reservations) {
      const dest = res.destination?.trim() || "Não informado";
      if (cityMap[dest]) cityMap[dest].fatSz += fatSzPerRes;
      const prop = (res as any).propertyCode?.trim() || "Não informado";
      if (propMap[prop]) propMap[prop].fatSz += fatSzPerRes;
    }
  }

  const cities = Object.entries(cityMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.reservas - a.reservas);
  const props = Object.entries(propMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.reservas - a.reservas);
  const totalRes = cities.reduce((s, c) => s + c.reservas, 0);
  const barStyle = (pct: number, color: string): React.CSSProperties => ({ height: 6, borderRadius: 3, background: color, width: `${Math.max(pct * 100, 2)}%` });

  if (paidRecords.length === 0) return <div style={{ textAlign: "center", padding: "60px 20px", color: "#7C7C7C" }}><p style={{ fontSize: 32 }}>📍</p><p style={{ marginTop: 8 }}>Faça um Sync Metabase para ver os destinos.</p></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 16 }}>Cidades mais reservadas</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cities.slice(0, 15).map((c) => (<div key={c.name}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "#00143D", fontWeight: 500 }}>{c.name}</span><span style={{ fontSize: 12, color: "#7C7C7C" }}>{c.reservas} res · {fmtCurrency(c.fatSz)}</span></div><div style={{ background: "#F0F3FA", borderRadius: 3, height: 6 }}><div style={barStyle(totalRes > 0 ? c.reservas / totalRes : 0, "#0055FF")} /></div></div>))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 16 }}>Imóveis mais reservados</p>
          {props.filter((p) => p.name !== "Não informado").length === 0 ? <p style={{ fontSize: 12, color: "#7C7C7C" }}>Dados de imóvel disponíveis após o próximo Sync Metabase.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {props.filter((p) => p.name !== "Não informado").slice(0, 15).map((p) => (<div key={p.name}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "#00143D", fontWeight: 500 }}>{p.name}</span><span style={{ fontSize: 12, color: "#7C7C7C" }}>{p.reservas} res · {fmtCurrency(p.fatSz)}</span></div><div style={{ background: "#F0F3FA", borderRadius: 3, height: 6 }}><div style={barStyle(totalRes > 0 ? p.reservas / totalRes : 0, "#7C3AED")} /></div></div>))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NektExplorerTab ──────────────────────────────────────────────────────────

const NEKT_PRESET_QUERIES = [
  { label: "Listar tabelas", sql: `SELECT table_schema, table_name\nFROM information_schema.tables\nWHERE table_schema NOT IN ('information_schema', 'pg_catalog')\nORDER BY 1, 2\nLIMIT 100` },
  { label: "Colunas de uma tabela", sql: `SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = 'NOME_DA_TABELA'\nORDER BY ordinal_position` },
  { label: "Prévia (5 linhas)", sql: `SELECT *\nFROM SCHEMA.TABELA\nLIMIT 5` },
  { label: "Template gastos (Meta + Google)", sql: `-- Adapte os nomes de tabela e coluna\n-- Colunas obrigatórias: date, google, meta, tiktok\nSELECT\n  data_referencia::DATE                                    AS date,\n  SUM(CASE WHEN canal = 'google' THEN gasto ELSE 0 END)   AS google,\n  SUM(CASE WHEN canal = 'meta'   THEN gasto ELSE 0 END)   AS meta,\n  0                                                        AS tiktok\nFROM marketing_hub.gastos_hospedes\nWHERE data_referencia BETWEEN :date_from AND :date_to\nGROUP BY 1\nORDER BY 1` },
];

function NektExplorerTab({ onSpendingChange }: { onSpendingChange: (s: DailySpending[]) => void }) {
  const [sql, setSql] = useState(NEKT_PRESET_QUERIES[0].sql);
  const [queryStatus, setQueryStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: Record<string, string | number | null>[] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [syncResult, setSyncResult] = useState<{ synced: number; dateFrom: string; dateTo: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncFrom, setSyncFrom] = useState("");
  const [syncTo, setSyncTo] = useState("");

  const runQuery = async () => {
    setQueryStatus("loading"); setQueryError(null); setQueryResult(null);
    try {
      const res = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sql }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar Nekt");
      setQueryResult(data); setQueryStatus("done");
    } catch (err) { setQueryError(err instanceof Error ? err.message : String(err)); setQueryStatus("error"); }
  };

  const handleSync = async () => {
    setSyncStatus("loading"); setSyncResult(null); setSyncError(null);
    try {
      const body: Record<string, string> = {};
      if (syncFrom) body.dateFrom = syncFrom;
      if (syncTo) body.dateTo = syncTo;
      const res = await fetch("/api/hospedes-analise/sync-nekt-spending", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Erro");
      setSyncResult(data); setSyncStatus("done");
      const fresh = await fetch("/api/hospedes-analise/spending").then((r) => r.json());
      onSpendingChange(fresh);
      setTimeout(() => setSyncStatus("idle"), 6000);
    } catch (err) { setSyncError(err instanceof Error ? err.message : String(err)); setSyncStatus("error"); setTimeout(() => setSyncStatus("idle"), 5000); }
  };

  const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#7C7C7C", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 };
  const inputS: React.CSSProperties = { padding: "7px 10px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 13, background: "#fff" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#00143D", borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,85,255,0.12), transparent)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 40, height: 3, background: "#0055FF", borderRadius: 2, marginBottom: 12 }} />
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Nekt Explorer</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Explore as tabelas do hub de marketing e configure a sincronização automática de gastos</p>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 4 }}>Sincronização automática de gastos</p>
        <p style={{ fontSize: 12, color: "#7C7C7C", marginBottom: 16 }}>Cron ativo: todo dia às <strong>8h BRT</strong> (11h UTC) chama <code style={{ fontFamily: "monospace", background: "#F0F3FA", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>/api/hospedes-analise/sync-nekt-spending</code>. Busca os últimos 30 dias e preenche a tabela de gastos automaticamente.</p>
        <div style={{ padding: 14, background: "#ECFDF5", borderRadius: 8, borderLeft: "3px solid #10B981", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>✓ Sincronização ativa</p>
          <p style={{ fontSize: 12, color: "#065F46", margin: 0 }}>Busca Google Ads (<code style={{ fontFamily: "monospace", background: "#D1FAE5", padding: "1px 5px", borderRadius: 4 }}>[SZH] Vistas</code>) e Meta Ads (<code style={{ fontFamily: "monospace", background: "#D1FAE5", padding: "1px 5px", borderRadius: 4 }}>[SH] Vista</code>) automaticamente. TikTok deve ser preenchido manualmente.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div><label style={labelS}>De (opcional)</label><input type="date" value={syncFrom} onChange={(e) => setSyncFrom(e.target.value)} style={inputS} /></div>
          <div><label style={labelS}>Até (opcional)</label><input type="date" value={syncTo} onChange={(e) => setSyncTo(e.target.value)} style={inputS} /></div>
          <button onClick={handleSync} disabled={syncStatus === "loading"} style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${syncStatus === "done" ? "#10B981" : syncStatus === "error" ? "#FC6058" : "#0055FF"}`, background: syncStatus === "done" ? "#ECFDF5" : syncStatus === "error" ? "#FEF2F2" : "#EBF2FF", color: syncStatus === "done" ? "#10B981" : syncStatus === "error" ? "#FC6058" : "#0055FF", fontWeight: 600, fontSize: 12, cursor: syncStatus === "loading" ? "default" : "pointer", whiteSpace: "nowrap" }}>
            {syncStatus === "loading" ? "⏳ Sincronizando..." : syncStatus === "done" ? "✓ Sincronizado!" : syncStatus === "error" ? "❌ Erro" : "🔄 Sincronizar agora"}
          </button>
          {syncResult && <span style={{ fontSize: 11, color: "#10B981" }}>{syncResult.synced} dias importados · {syncResult.dateFrom} → {syncResult.dateTo}</span>}
        </div>
        {syncError && <div style={{ marginTop: 10, padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}><p style={{ fontSize: 12, color: "#DC2626", fontFamily: "monospace" }}>{syncError}</p></div>}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 12 }}>Consultar Nekt</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {NEKT_PRESET_QUERIES.map((p) => (<button key={p.label} onClick={() => { setSql(p.sql); setQueryStatus("idle"); setQueryResult(null); setQueryError(null); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${sql === p.sql ? "#0055FF" : "#E8EEF8"}`, background: sql === p.sql ? "#EBF2FF" : "#F8FAFF", color: sql === p.sql ? "#0055FF" : "#7C7C7C", fontSize: 11, fontWeight: sql === p.sql ? 600 : 400, cursor: "pointer" }}>{p.label}</button>))}
        </div>
        <textarea value={sql} onChange={(e) => { setSql(e.target.value); setQueryStatus("idle"); }} style={{ width: "100%", height: 160, padding: "10px 12px", borderRadius: 8, border: "1px solid #E8EEF8", fontFamily: "monospace", fontSize: 12, background: "#F8FAFF", color: "#00143D", resize: "vertical", boxSizing: "border-box" }} placeholder="SELECT * FROM tabela LIMIT 10" spellCheck={false} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <button onClick={runQuery} disabled={queryStatus === "loading" || !sql.trim()} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: !sql.trim() || queryStatus === "loading" ? "#E8EEF8" : "#0055FF", color: !sql.trim() || queryStatus === "loading" ? "#7C7C7C" : "#fff", fontWeight: 700, fontSize: 13, cursor: !sql.trim() || queryStatus === "loading" ? "default" : "pointer" }}>
            {queryStatus === "loading" ? "Executando..." : "Executar query"}
          </button>
          {queryStatus === "done" && queryResult && <span style={{ fontSize: 12, color: "#10B981" }}>✓ {queryResult.rows.length} linha(s)</span>}
        </div>
        {queryStatus === "error" && queryError && <div style={{ marginTop: 12, padding: 12, background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}><p style={{ fontSize: 12, color: "#DC2626", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{queryError}</p></div>}
        {queryStatus === "done" && queryResult && queryResult.rows.length > 0 && (
          <div style={{ marginTop: 16, overflowX: "auto", border: "1px solid #E8EEF8", borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: "#7C7C7C", padding: "6px 12px", borderBottom: "1px solid #F0F3FA" }}>Colunas: <strong>{queryResult.columns.join(", ")}</strong></p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{queryResult.columns.map((col) => <th key={col} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: "#7C7C7C", background: "#F8FAFF", borderBottom: "1px solid #E8EEF8", whiteSpace: "nowrap" }}>{col}</th>)}</tr></thead>
              <tbody>{queryResult.rows.slice(0, 100).map((row, i) => <tr key={i} style={{ borderBottom: "1px solid #F0F3FA" }}>{queryResult.columns.map((col) => <td key={col} style={{ padding: "6px 12px", color: "#00143D", whiteSpace: "nowrap", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>{row[col] === null ? <span style={{ color: "#ccc" }}>null</span> : String(row[col])}</td>)}</tr>)}</tbody>
            </table>
            {queryResult.rows.length > 100 && <p style={{ padding: "8px 12px", fontSize: 11, color: "#7C7C7C", borderTop: "1px solid #F0F3FA" }}>Mostrando 100 de {queryResult.rows.length} linhas.</p>}
          </div>
        )}
        {queryStatus === "done" && queryResult && queryResult.rows.length === 0 && <p style={{ marginTop: 12, fontSize: 12, color: "#7C7C7C" }}>Query executada sem resultados.</p>}
      </div>
    </div>
  );
}

// ─── SyncMetabaseButton ───────────────────────────────────────────────────────

function SyncMetabaseButton({ onSynced }: { onSynced: (records: DailyRecord[]) => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ synced: number; dates: number; breakdown: { semAtendimento: number; comAtendimento: number } } | null>(null);

  const handleSync = async () => {
    setStatus("loading"); setResult(null);
    try {
      const res = await fetch("/api/hospedes-analise/sync-metabase", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data); setStatus("done");
      const fresh = await apiGetRecords();
      onSynced(fresh);
      setTimeout(() => setStatus("idle"), 4000);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 3000); }
  };

  const color = status === "done" ? "#10B981" : status === "error" ? "#FC6058" : "#7C3AED";
  const bg = status === "done" ? "#ECFDF5" : status === "error" ? "#FEF2F2" : "#F5F3FF";
  const border = status === "done" ? "#10B981" : status === "error" ? "#FC6058" : "#7C3AED";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={handleSync} disabled={status === "loading"} style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 600, fontSize: 12, cursor: status === "loading" ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        {status === "loading" ? "⏳ Sincronizando..." : status === "done" ? "✓ Sincronizado!" : status === "error" ? "❌ Erro" : "🔄 Sync Metabase"}
      </button>
      {status === "done" && result && <span style={{ fontSize: 11, color: "#10B981" }}>{result.dates} dias · {result.breakdown.semAtendimento}s/ + {result.breakdown.comAtendimento}c/</span>}
    </div>
  );
}

// ─── ImportModal ──────────────────────────────────────────────────────────────

const EXPORT_SNIPPET = `copy(JSON.stringify({records:JSON.parse(localStorage.getItem('preenchimento-daily-data')||'[]'),spending:JSON.parse(localStorage.getItem('preenchimento-spending-data')||'[]')}))`;

function ImportModal({ onImported }: { onImported: (records: DailyRecord[], spending: DailySpending[]) => void }) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: { records: number; spending: number } } | null>(null);
  const [copied, setCopied] = useState(false);

  const copySnippet = () => { navigator.clipboard.writeText(EXPORT_SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleImport = async () => {
    setStatus("loading");
    try {
      const parsed = JSON.parse(json);
      const res = await fetch("/api/hospedes-analise/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      if (!res.ok) throw new Error("Erro no servidor");
      const data = await res.json();
      setResult(data); setStatus("done");
      const [newRecords, newSpending] = await Promise.all([apiGetRecords(), apiGetSpending()]);
      onImported(newRecords, newSpending);
    } catch { setStatus("error"); }
  };

  if (!open) return <button onClick={() => setOpen(true)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #F59E0B", background: "#FFFBEB", color: "#92400E", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>📥 Importar dados do Lovable</button>;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><h2 style={{ fontSize: 16, fontWeight: 700, color: "#00143D", margin: 0 }}>Importar dados do Lovable</h2><p style={{ fontSize: 13, color: "#7C7C7C", marginTop: 4 }}>Migra todos os seus registros sem perder nada</p></div>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7C7C7C" }}>✕</button>
        </div>
        {status !== "done" && (<>
          <div style={{ background: "#F0F3FA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 8 }}>Passo 1 — Exporte os dados do Lovable</p>
            <ol style={{ fontSize: 13, color: "#7C7C7C", paddingLeft: 20, margin: "0 0 12px" }}><li>Abra <strong>analise-dados-midia-paga-hospedes.lovable.app</strong></li><li>Aperte <strong>F12</strong> para abrir o DevTools</li><li>Clique na aba <strong>Console</strong></li><li>Cole o comando abaixo e pressione Enter</li></ol>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <code style={{ flex: 1, fontSize: 11, background: "#00143D", color: "#7FDBFF", padding: "8px 12px", borderRadius: 8, display: "block", overflow: "auto", whiteSpace: "nowrap" }}>{EXPORT_SNIPPET}</code>
              <button onClick={copySnippet} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E8EEF8", background: "#fff", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600, color: copied ? "#10B981" : "#00143D" }}>{copied ? "✓ Copiado!" : "Copiar"}</button>
            </div>
            <p style={{ fontSize: 12, color: "#7C7C7C", marginTop: 8 }}>O comando copia automaticamente o JSON para sua área de transferência.</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", marginBottom: 8 }}>Passo 2 — Cole o JSON aqui</p>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder='{"records":[...],"spending":[...]}' rows={6} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          {status === "error" && <p style={{ fontSize: 12, color: "#FC6058", marginBottom: 12 }}>❌ JSON inválido ou erro no servidor. Verifique se o conteúdo está correto.</p>}
          <button onClick={handleImport} disabled={!json.trim() || status === "loading"} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: !json.trim() ? "#E8EEF8" : "#0055FF", color: !json.trim() ? "#7C7C7C" : "#fff", fontWeight: 700, fontSize: 14, cursor: json.trim() ? "pointer" : "default" }}>{status === "loading" ? "Importando..." : "Importar dados"}</button>
        </>)}
        {status === "done" && result && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ fontSize: 40 }}>✅</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#00143D", marginTop: 12 }}>Importação concluída!</p>
            <p style={{ fontSize: 13, color: "#7C7C7C", marginTop: 8 }}>{result.imported.records} registros e {result.imported.spending} entradas de gastos importados com sucesso.</p>
            <button onClick={() => { setOpen(false); setJson(""); setStatus("idle"); setResult(null); }} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none", background: "#0055FF", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Ver meus dados</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnaliseMidiaPagaHospedesPage() {
  const [tab, setTab] = useState<"resultados" | "preenchimento" | "tabela" | "destinos" | "nekt">("resultados");
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [spending, setSpending] = useState<DailySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGetRecords(), apiGetSpending()]).then(([r, s]) => { setRecords(r); setSpending(s); setLoading(false); });
  }, []);

  const tabs: { id: "resultados" | "preenchimento" | "tabela" | "destinos" | "nekt"; label: string; emoji: string }[] = [
    { id: "resultados", label: "Resultados", emoji: "📈" },
    { id: "preenchimento", label: "Preenchimento", emoji: "📝" },
    { id: "tabela", label: "Tabela KPIs", emoji: "📋" },
    { id: "destinos", label: "Destinos", emoji: "📍" },
    { id: "nekt", label: "Nekt", emoji: "🔍" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7C7C7C" }}>
          <Link href="/vistas-hospedes" style={{ color: "#7C7C7C", textDecoration: "none" }}>Hóspedes</Link>
          <span>›</span>
          <span style={{ color: "#00143D", fontWeight: 600 }}>Análise Mídia Paga</span>
        </div>
        {!loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <SyncMetabaseButton onSynced={(r) => setRecords(r)} />
            <ImportModal onImported={(r, s) => { setRecords(r); setSpending(s); }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F0F3FA", borderRadius: 12, padding: 4 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 16px", borderRadius: 9, border: "none", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#00143D" : "#7C7C7C", fontWeight: tab === t.id ? 700 : 400, fontSize: 13, cursor: "pointer", boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#7C7C7C" }}><p>Carregando dados...</p></div>
      ) : (<>
        {tab === "resultados" && <ResultadosTab records={records} spending={spending} onRecordsChange={setRecords} />}
        {tab === "preenchimento" && <PreenchimentoTab records={records} spending={spending} onRecordsChange={setRecords} onSpendingChange={setSpending} />}
        {tab === "tabela" && <TabelaTab records={records} spending={spending} onRecordsChange={setRecords} onSpendingChange={setSpending} />}
        {tab === "destinos" && <DestinosTab records={records} />}
        {tab === "nekt" && <NektExplorerTab onSpendingChange={setSpending} />}
      </>)}
    </div>
  );
}
