"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GroupSummary } from "@/lib/whMetrics";

const COLORS = {
  accent: "#D31145",
  standardRisk: "#0d9488",
  slate: "#64748b",
  refractive: "#6366f1",
};

const CHART_MARGIN = { top: 8, right: 8, left: 28, bottom: 8 };
const Y_AXIS_WIDTH = 48;
const PLOT_INSET_LEFT = CHART_MARGIN.left + Y_AXIS_WIDTH;
const PLOT_INSET_RIGHT = CHART_MARGIN.right;
const PLOT_HEIGHT = 248;

function formatPct(n: number) {
  return `${n.toFixed(1)}%`;
}

function yAxisTitle(value: string, fontSize = 11) {
  return {
    value,
    angle: -90,
    position: "insideLeft" as const,
    fill: COLORS.slate,
    style: { fontSize, textAnchor: "middle" as const },
  };
}

function PlotAxisLegend({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex justify-center pt-1"
      style={{ marginLeft: PLOT_INSET_LEFT, marginRight: PLOT_INSET_RIGHT }}
    >
      {children}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function RiskGroupChart({
  data,
  dataKey,
  legendLabel,
  color,
  yTitle,
  domain = [0, 100] as [number | string, number | string],
}: {
  data: GroupSummary[];
  dataKey: keyof GroupSummary;
  legendLabel: string;
  color: string;
  yTitle: string;
  domain?: [number | string, number | string];
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="w-full shrink-0" style={{ height: PLOT_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="riskGroup" tick={{ fill: COLORS.slate, fontSize: 11 }} />
            <YAxis
              tick={{ fill: COLORS.slate, fontSize: 11 }}
              domain={domain}
              width={Y_AXIS_WIDTH}
              tickFormatter={(v) => `${v}%`}
              label={yAxisTitle(yTitle)}
            />
            <Tooltip formatter={(v: number) => [formatPct(v), "Rate"]} />
            <Bar dataKey={dataKey} name={legendLabel} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PlotAxisLegend>
        <LegendSwatch color={color} label={legendLabel} />
      </PlotAxisLegend>
    </div>
  );
}

export function MonthlyBreakdownCharts({
  groupSummaries,
  showComplications = true,
}: {
  groupSummaries: GroupSummary[];
  showComplications?: boolean;
}) {
  return (
    <section className="mb-12 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-aia-navy">Risk-group comparison</h2>
      <div className={`grid gap-8 ${showComplications ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {showComplications && (
          <RiskGroupChart
            data={groupSummaries}
            dataKey="complicationRate"
            legendLabel="Complication %"
            color={COLORS.accent}
            yTitle="Complication Rate"
            domain={[0, "auto"]}
          />
        )}
        <RiskGroupChart
          data={groupSummaries}
          dataKey="goodVisionRate"
          legendLabel="6/12+ %"
          color={COLORS.standardRisk}
          yTitle="Post-op VA"
        />
        <RiskGroupChart
          data={groupSummaries}
          dataKey="refractiveWithin1DRate"
          legendLabel="Within ±1D %"
          color={COLORS.refractive}
          yTitle="Post-op Refraction"
        />
      </div>
    </section>
  );
}
