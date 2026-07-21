"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatSurgicalMonthLabel,
  SURGEON_NAMES,
  type SurgeonName,
} from "@/lib/whCataractData";
import {
  computeSurgeonCaseTrend,
  HISTORICAL_FROM_MONTH,
  HISTORICAL_TO_MONTH,
  HISTORICAL_CASE_SOURCE,
  surgeonCaseTotals,
} from "@/lib/historicalCases";

const COLORS = {
  runningCataract: "#2563eb",
  runningCombined: "#e11d48",
  runningTotal: "#0d9488",
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-SG").format(n);
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-aia-navy">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function CaseCountView() {
  const [surgeon, setSurgeon] = useState<SurgeonName>(SURGEON_NAMES[0]);
  const trend = useMemo(() => computeSurgeonCaseTrend(surgeon), [surgeon]);
  const totals = useMemo(() => surgeonCaseTotals(surgeon), [surgeon]);

  const chartTicks = useMemo(() => {
    // Show roughly yearly tick marks for readability on long series.
    const years = new Set<string>();
    const ticks: string[] = [];
    for (const p of trend) {
      const yy = p.surgicalMonth.slice(0, 2);
      if (!years.has(yy)) {
        years.add(yy);
        ticks.push(p.surgicalMonth);
      }
    }
    if (trend.length && ticks[ticks.length - 1] !== trend[trend.length - 1].surgicalMonth) {
      ticks.push(trend[trend.length - 1].surgicalMonth);
    }
    return ticks;
  }, [trend]);

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-aia-red">AIA · WH cataract outcomes</p>
        <h1 className="mt-2 text-2xl font-semibold text-aia-navy">Case count</h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          Historical surgical volume for AIA panel surgeons from{" "}
          {formatSurgicalMonthLabel(HISTORICAL_FROM_MONTH)} to{" "}
          {formatSurgicalMonthLabel(HISTORICAL_TO_MONTH)}. Cases are coded as cataract surgery or
          combined cataract surgery and vitrectomy (VR takes precedence when both flags are set).
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block max-w-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Surgeon</span>
          <select
            value={surgeon}
            onChange={(e) => setSurgeon(e.target.value as SurgeonName)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
          >
            {SURGEON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-xs text-slate-500">
          Source: {HISTORICAL_CASE_SOURCE}. Dual-flag cases (Cataract=1 and VR=1) counted once as
          combined only.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-aia-navy">Lifetime totals ({surgeon})</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Cataract surgery"
            value={formatNumber(totals.cataract)}
            hint="Cataract=1 and VR ≠ 1"
          />
          <MetricCard
            label="Combined cataract + vitrectomy"
            value={formatNumber(totals.combined)}
            hint="VR=1 (includes dual-flag cases)"
          />
          <MetricCard label="All procedures" value={formatNumber(totals.total)} hint="No double counting" />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-aia-navy">Cumulative Case Count</h2>
        <p className="mb-4 text-sm text-slate-600">
          Cumulative volume from {formatSurgicalMonthLabel(HISTORICAL_FROM_MONTH)} onward.
        </p>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="surgicalMonth"
                ticks={chartTicks}
                tickFormatter={(v) => formatSurgicalMonthLabel(String(v))}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                labelFormatter={(v) => formatSurgicalMonthLabel(String(v))}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="runningCataract"
                name="Running cataract"
                stroke={COLORS.runningCataract}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="runningCombined"
                name="Running combined"
                stroke={COLORS.runningCombined}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="runningTotal"
                name="Running total"
                stroke={COLORS.runningTotal}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
