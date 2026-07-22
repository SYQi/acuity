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
import { SURGEON_NAMES, type SurgeonName } from "@/lib/whCataractData";
import { computeQualityIndicatorTrend } from "@/lib/whMetrics";

const COLORS = {
  slate: "#64748b",
  va612Line: "#D31145",
  va612Dot: "#D31145",
  seLine: "#2563eb",
  seDot: "#2563eb",
};

const LEGEND = {
  va612: "VA>=6/12",
  seWithin1D: "Spherical Equivalent +/- 1.0D",
} as const;

export function AggregateTrendView() {
  const [surgeon, setSurgeon] = useState<SurgeonName>(SURGEON_NAMES[0]);

  const trend = useMemo(() => computeQualityIndicatorTrend(surgeon), [surgeon]);

  const chartData = useMemo(
    () =>
      trend.map((p) => ({
        ...p,
        va612Plot: p.va612Rate ?? undefined,
        seWithin1DPlot: p.seWithin1DRate ?? undefined,
      })),
    [trend],
  );

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-aia-red">AIA · Cataract outcomes</p>
        <h1 className="mt-2 text-2xl font-semibold text-aia-navy">Aggregate quality trend</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Real clinical outcomes (Jun 2025 – Jun 2026). Monthly visual acuity and refractive accuracy rates
          for the selected surgeon.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <label className="block max-w-sm">
            <span className="mb-1 block text-xs font-medium text-slate-700">Surgeon</span>
            <select
              value={surgeon}
              onChange={(e) => setSurgeon(e.target.value as SurgeonName)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              {SURGEON_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-aia-navy">Quality Indicator Plot</h3>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 36, right: 24, bottom: 20, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: COLORS.slate, fontSize: 11 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={56}
                    label={{ value: "Surgical month", position: "bottom", fill: COLORS.slate, offset: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    tick={{ fill: COLORS.slate, fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                    label={{
                      value: "Percentage (%)",
                      angle: -90,
                      position: "insideLeft",
                      fill: COLORS.slate,
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]?.payload) return null;
                      const p = payload[0].payload as (typeof chartData)[0];
                      return (
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                          <p className="font-semibold text-aia-navy">{p.monthLabel}</p>
                          <p className="mt-1 text-slate-600">
                            Cases: {p.cases}
                          </p>
                          <p className="text-slate-600">
                            {LEGEND.va612}:{" "}
                            {p.va612Rate != null ? `${p.va612Rate.toFixed(1)}%` : "N/A"}
                          </p>
                          <p className="text-slate-600">
                            {LEGEND.seWithin1D}:{" "}
                            {p.seWithin1DRate != null ? `${p.seWithin1DRate.toFixed(1)}%` : "N/A"}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="va612Plot"
                    stroke={COLORS.va612Line}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: COLORS.va612Dot, stroke: "#fff", strokeWidth: 1.5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={LEGEND.va612}
                  />
                  <Line
                    type="monotone"
                    dataKey="seWithin1DPlot"
                    stroke={COLORS.seLine}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: COLORS.seDot, stroke: "#fff", strokeWidth: 1.5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={LEGEND.seWithin1D}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
