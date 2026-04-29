"use client";

import React, { useState, useMemo } from "react";
import type { DailyRecord } from "@/lib/hospedes-analise-db";

interface MatchedReservation {
  date: string;
  reserva: string;
  effectivePrice: number;
  cleaningFee: number;
  fatSeazone: number;
  city: string;
  propertyCode: string;
}

interface ImportResult {
  total: number;
  matched: MatchedReservation[];
  notMatched: { date: string; reserva: string }[];
  matchedCount: number;
  notMatchedCount: number;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fmtCurrency(v: number) {
  if (!v) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

async function apiSaveRecord(record: DailyRecord): Promise<void> {
  await fetch("/api/hospedes-analise/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}

export default function NewbyteImportSection({ onSaved }: { onSaved?: () => void }) {
  const [pastedData, setPastedData] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleImport = async () => {
    if (!pastedData.trim()) return;
    setStatus("loading"); setErrorMsg(null); setResult(null);
    try {
      const res = await fetch("/api/hospedes-analise/import-newbyte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao importar");
      setResult(data); setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const byDate = useMemo(() => {
    if (!result?.matched) return new Map<string, MatchedReservation[]>();
    const map = new Map<string, MatchedReservation[]>();
    for (const m of result.matched) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    }
    return map;
  }, [result]);

  const handleSaveAll = async () => {
    if (!result?.matched.length) return;
    setSavingStatus("loading");
    try {
      for (const [date, items] of byDate) {
        const totalEff = items.reduce((s, i) => s + i.effectivePrice, 0);
        const totalCleaning = items.reduce((s, i) => s + i.cleaningFee, 0);
        const totalFatSz = items.reduce((s, i) => s + i.fatSeazone, 0);
        const reservations = items.map((i) => ({
          id: uid(),
          source: "newbyte",
          utm: "",
          coupon: "",
          destination: i.city,
          propertyCode: i.propertyCode,
        }));
        const record: DailyRecord = {
          id: uid(),
          date,
          type: "relatorio-newbyte",
          data: {
            tickets: 0,
            conversoes: items.length,
            fatEffective: Math.round(totalEff * 100) / 100,
            fatSeazone: Math.round(totalFatSz * 100) / 100,
            cleaningFee: Math.round(totalCleaning * 100) / 100,
          },
          reservations,
        };
        await apiSaveRecord(record);
      }
      setSavingStatus("done");
      onSaved?.();
      setTimeout(() => { setSavingStatus("idle"); setStatus("idle"); setResult(null); setPastedData(""); }, 1500);
    } catch {
      setSavingStatus("idle");
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #E8EEF8", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: "#7C3AED" }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "#00143D", margin: 0 }}>Importar Newbyte via Sheets</p>
      </div>
      <p style={{ fontSize: 12, color: "#7C7C7C", marginBottom: 12 }}>
        Cole os dados do Sheets (tab-separated) com colunas: <strong>DATA | CANAL | CIDADE | IMÓVEL | VALOR | DESCONTO | RESERVA | HÓSPEDE | ANALISTA</strong>.
      </p>
      <textarea
        value={pastedData}
        onChange={(e) => { setPastedData(e.target.value); setStatus("idle"); setResult(null); setErrorMsg(null); }}
        placeholder={"Cole aqui os dados do Sheets...\n\nExemplo:\n15/04\tCampanha VST\tAnitápolis - SC\tVST\tR$ 530,00\tS/ CUPOM\tJG212J\tPatrick Gabriel\tLaura"}
        rows={6}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E8EEF8", fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleImport} disabled={!pastedData.trim() || status === "loading"} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: !pastedData.trim() || status === "loading" ? "#E8EEF8" : "#7C3AED", color: !pastedData.trim() || status === "loading" ? "#7C7C7C" : "#fff", fontWeight: 700, fontSize: 12, cursor: !pastedData.trim() || status === "loading" ? "default" : "pointer" }}>
          {status === "loading" ? "⏳ Correlacionando..." : "🔍 Correlacionar com Metabase"}
        </button>
        {status === "done" && result && (
          <span style={{ fontSize: 11, color: result.matchedCount > 0 ? "#10B981" : "#FC6058" }}>
            {result.matchedCount}/{result.total} batidos{result.notMatchedCount > 0 && <span style={{ color: "#F59E0B" }}> · {result.notMatchedCount} não encontrados</span>}
          </span>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
          <p style={{ fontSize: 12, color: "#DC2626" }}>❌ {errorMsg}</p>
        </div>
      )}

      {status === "done" && result && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ background: "#ECFDF5", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#10B981", margin: 0 }}>{result.matchedCount}</p>
              <p style={{ fontSize: 11, color: "#7C7C7C", margin: 0 }}>Bateram</p>
            </div>
            <div style={{ background: "#FFFBEB", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B", margin: 0 }}>{result.notMatchedCount}</p>
              <p style={{ fontSize: 11, color: "#7C7C7C", margin: 0 }}>Não batem</p>
            </div>
            <div style={{ background: "#F5F3FF", borderRadius: 8, padding: 12, textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#7C3AED", margin: 0 }}>{fmtCurrency(result.matched.reduce((s, m) => s + m.fatSeazone, 0))}</p>
              <p style={{ fontSize: 11, color: "#7C7C7C", margin: 0 }}>Fat. Seazone</p>
            </div>
          </div>

          {result.matchedCount > 0 && (
            <button onClick={handleSaveAll} disabled={savingStatus === "loading"} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: savingStatus === "done" ? "#10B981" : "#7C3AED", color: "#fff", fontWeight: 700, fontSize: 13, cursor: savingStatus === "loading" ? "default" : "pointer" }}>
              {savingStatus === "loading" ? "⏳ Salvando..." : savingStatus === "done" ? "✓ Salvo! Recarregando..." : `💾 Salvar ${result.matchedCount} reserva(s) como Newbyte`}
            </button>
          )}

          {result.matched.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#7C7C7C", marginBottom: 6 }}>Reservas batidas ({result.matched.length})</p>
              <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #E8EEF8" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFF" }}>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#7C7C7C" }}>Data</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#7C7C7C" }}>Reserva</th>
                      <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#7C7C7C" }}>Fat. Eff.</th>
                      <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#7C7C7C" }}>Tx. Limp.</th>
                      <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#7C7C7C" }}>Fat. Sz</th>
                      <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#7C7C7C" }}>Cidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matched.map((m, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F0F3FA" }}>
                        <td style={{ padding: "5px 10px", color: "#00143D", fontWeight: 500 }}>{fmtDate(m.date)}</td>
                        <td style={{ padding: "5px 10px", color: "#0055FF", fontFamily: "monospace", fontSize: 11 }}>{m.reserva}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right" }}>{fmtCurrency(m.effectivePrice)}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right", color: "#94A3B8" }}>{fmtCurrency(m.cleaningFee)}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right", color: "#7C3AED", fontWeight: 600 }}>{fmtCurrency(m.fatSeazone)}</td>
                        <td style={{ padding: "5px 10px", color: "#00143D" }}>{m.city || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.notMatched.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#7C7C7C", marginBottom: 6 }}>Não encontrados ({result.notMatched.length})</p>
              <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "8px 12px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <tbody>
                    {result.notMatched.map((n, i) => (
                      <tr key={i}>
                        <td style={{ padding: "3px 0", color: "#92400E" }}>{fmtDate(n.date)}</td>
                        <td style={{ padding: "3px 0", color: "#92400E", fontFamily: "monospace" }}>{n.reserva}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}