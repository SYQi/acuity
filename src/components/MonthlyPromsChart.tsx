"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { PromsMonthlySummary } from "@/lib/whMetrics";

const COLORS = {
  slate: "#64748b",
  preOp: "#00205B",
  postOp: "#16a34a",
  scatter: "#D31145",
};

/** Shared plot frame — identical on both charts so x-axes sit at the same level. */
const PLOT_HEIGHT = 288;
const CHART_MARGIN = { top: 16, right: 20, left: 48, bottom: 48 };
const Y_AXIS_WIDTH = 40;
const PLOT_INSET_LEFT = CHART_MARGIN.left + Y_AXIS_WIDTH;
const PLOT_INSET_RIGHT = CHART_MARGIN.right;
const TICK_STYLE = { fill: COLORS.slate, fontSize: 11 };
const AXIS_LABEL_STYLE = { fontSize: 11, fill: COLORS.slate };

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

function PromsLegend() {
  return (
    <div className="flex items-center gap-5">
      <LegendSwatch color={COLORS.preOp} label="Pre-op mean" />
      <LegendSwatch color={COLORS.postOp} label="Post-op mean" />
    </div>
  );
}

export function MonthlyPromsChart({ summary }: { summary: PromsMonthlySummary }) {
  if (summary.eligibleCases === 0) {
    return (
      <div className="flex h-[384px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No pre/post CAT-PROM5 pairs recorded for this surgical month.
      </div>
    );
  }

  const meanBarData = [
    {
      label: "Monthly mean",
      preOp: summary.meanPreOp ?? 0,
      postOp: summary.meanPostOp ?? 0,
    },
  ];

  const scatterData = summary.pairs.map((p, i) => ({
    id: i + 1,
    preOp: p.preOp,
    postOp: p.postOp,
  }));

  const axisMax = Math.max(
    100,
    ...summary.pairs.flatMap((p) => [p.preOp, p.postOp]),
    summary.meanPreOp ?? 0,
    summary.meanPostOp ?? 0,
  );
  const axisDomain: [number, number] = [0, Math.ceil(axisMax / 10) * 10];

  const panelClass = "flex min-w-0 flex-col";
  const titleClass = "mb-2 min-h-[2.5rem] text-sm font-medium leading-5 text-aia-navy";
  const plotClass = "w-full shrink-0";
  const footerClass = "mt-2 flex min-h-[3rem] flex-col justify-start gap-1";

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className={panelClass}>
        <p className={titleClass}>Mean pre-op vs post-op score</p>
        <div className={plotClass} style={{ height: PLOT_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={meanBarData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: COLORS.slate }}
                height={36}
                label={{
                  value: "\u00A0",
                  position: "insideBottom",
                  offset: -4,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                domain={axisDomain}
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: COLORS.slate }}
                width={Y_AXIS_WIDTH}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  v.toFixed(1),
                  name === "preOp" ? "Pre-op mean" : "Post-op mean",
                ]}
              />
              <Bar dataKey="preOp" name="Pre-op mean" fill={COLORS.preOp} radius={[4, 4, 0, 0]} />
              <Bar dataKey="postOp" name="Post-op mean" fill={COLORS.postOp} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={footerClass}>
          <PlotAxisLegend>
            <PromsLegend />
          </PlotAxisLegend>
        </div>
      </div>

      <div className={panelClass}>
        <p className={titleClass}>Patient-level pre-op vs post-op</p>
        <div className={plotClass} style={{ height: PLOT_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="preOp"
                name="Pre-op"
                domain={axisDomain}
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: COLORS.slate }}
                height={36}
                label={{
                  value: "Pre-op",
                  position: "insideBottom",
                  offset: -4,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                type="number"
                dataKey="postOp"
                name="Post-op"
                domain={axisDomain}
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: COLORS.slate }}
                width={Y_AXIS_WIDTH}
                label={{
                  value: "Post-op",
                  angle: -90,
                  position: "insideLeft",
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <ZAxis range={[80, 80]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(v: number) => v.toFixed(1)}
                labelFormatter={() => ""}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]?.payload) return null;
                  const p = payload[0].payload as { preOp: number; postOp: number };
                  return (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p>Pre-op: {p.preOp.toFixed(1)}</p>
                      <p>Post-op: {p.postOp.toFixed(1)}</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: axisMax, y: axisMax * 2 },
                ]}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
              <Scatter data={scatterData} fill={COLORS.scatter} name="Patients" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className={footerClass}>
          <PlotAxisLegend>
            <LegendSwatch color={COLORS.scatter} label="Patients" />
          </PlotAxisLegend>
          <PlotAxisLegend>
            <p className="text-center text-xs text-slate-500">
              Dashed line: post-op = 2× pre-op threshold. n = {summary.eligibleCases} (all risk groups).
            </p>
          </PlotAxisLegend>
        </div>
      </div>
    </div>
  );
}
