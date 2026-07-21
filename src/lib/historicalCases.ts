import historicalJson from "@/lib/historicalCaseCounts.json";
import type { SurgeonName } from "@/lib/whCataractData";
import { formatSurgicalMonthLabel, SURGEON_NAMES } from "@/lib/whCataractData";

export type ProcedureKind = "cataract" | "combined";

export type HistoricalMonthlyPoint = {
  surgicalMonth: string;
  surgeon: SurgeonName;
  cataract: number;
  combined: number;
  total: number;
};

type HistoricalFile = {
  source: string;
  fromMonth: string;
  toMonth: string;
  notes: string[];
  monthly: HistoricalMonthlyPoint[];
};

const data = historicalJson as HistoricalFile;

export const HISTORICAL_CASE_SOURCE = data.source;
export const HISTORICAL_FROM_MONTH = data.fromMonth;
export const HISTORICAL_TO_MONTH = data.toMonth;
export const HISTORICAL_NOTES = data.notes;

export const historicalMonthlyPoints: HistoricalMonthlyPoint[] = data.monthly.filter((p) =>
  (SURGEON_NAMES as readonly string[]).includes(p.surgeon),
);

export function listHistoricalMonths(): string[] {
  return Array.from(new Set(historicalMonthlyPoints.map((p) => p.surgicalMonth))).sort();
}

export type CaseCountTrendPoint = {
  surgicalMonth: string;
  monthLabel: string;
  cataract: number;
  combined: number;
  total: number;
  runningCataract: number;
  runningCombined: number;
  runningTotal: number;
};

export function computeSurgeonCaseTrend(surgeon: SurgeonName): CaseCountTrendPoint[] {
  const months = listHistoricalMonths();
  const byMonth = new Map(
    historicalMonthlyPoints.filter((p) => p.surgeon === surgeon).map((p) => [p.surgicalMonth, p]),
  );

  let runningCataract = 0;
  let runningCombined = 0;
  const points: CaseCountTrendPoint[] = [];

  for (const surgicalMonth of months) {
    const row = byMonth.get(surgicalMonth);
    const cataract = row?.cataract ?? 0;
    const combined = row?.combined ?? 0;
    const total = cataract + combined;
    runningCataract += cataract;
    runningCombined += combined;
    points.push({
      surgicalMonth,
      monthLabel: formatSurgicalMonthLabel(surgicalMonth),
      cataract,
      combined,
      total,
      runningCataract,
      runningCombined,
      runningTotal: runningCataract + runningCombined,
    });
  }

  return points;
}

export function surgeonCaseTotals(surgeon: SurgeonName): {
  cataract: number;
  combined: number;
  total: number;
} {
  const rows = historicalMonthlyPoints.filter((p) => p.surgeon === surgeon);
  const cataract = rows.reduce((s, r) => s + r.cataract, 0);
  const combined = rows.reduce((s, r) => s + r.combined, 0);
  return { cataract, combined, total: cataract + combined };
}
