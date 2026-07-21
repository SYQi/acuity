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
import { formatSurgicalMonthLabel, SURGEON_NAMES } from "@/lib/whCataractData";
import {
  caseCountDisplayName,
  caseCountTotals,
  computeCaseCountTrend,
  type CaseCountSelection,
} from "@/lib/historicalCases";

const COLORS = {
  runningCataract: "#2563eb",
  runningCombined: "#e11d48",
  runningTotal: "#0d9488",
};

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-SG").format(n);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-aia-navy">{value}</p>
    </div>
  );
}

export function CaseCountView() {
  const [selection, setSelection] = useState<CaseCountSelection>(SURGEON_NAMES[0]);
  const trend = useMemo(() => computeCaseCountTrend(selection), [selection]);
  const totals = useMemo(() => caseCountTotals(selection), [selection]);
  const displayName = caseCountDisplayName(selection);
  const showCombinedLine = selection !== "Dr Roy Tan";

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
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block max-w-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Surgeon</span>
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value as CaseCountSelection)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
          >
            {SURGEON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Combined">Combined</option>
          </select>
        </label>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-aia-navy">
          Total Surgical Volume ({displayName})
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Cataract surgery" value={formatNumber(totals.cataract)} />
          <MetricCard
            label="Combined Cataract Surgery and Vitrectomy"
            value={formatNumber(totals.combined)}
          />
          <MetricCard label="All procedures" value={formatNumber(totals.total)} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-aia-navy">Cumulative Case Count</h2>
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
                name="Cataract Surgery"
                stroke={COLORS.runningCataract}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              {showCombinedLine && (
                <Line
                  type="monotone"
                  dataKey="runningCombined"
                  name="Combined Cataract Surgery and Vitrectomy"
                  stroke={COLORS.runningCombined}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <Line
                type="monotone"
                dataKey="runningTotal"
                name="Total"
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
