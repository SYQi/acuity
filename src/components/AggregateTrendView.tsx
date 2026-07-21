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
import { hasComplicationData, surgeonsForRiskGroup, type RiskGroup, type SurgeonName } from "@/lib/whCataractData";
import {
  computeMonthlyTrend,
  DEFAULT_WEIGHTS,
  MIN_SURGEON_MONTHLY_CASES,
  redistributeWeights,
  type QualityConfig,
  type VaStandard,
  type RefractiveStandard,
} from "@/lib/whMetrics";

const COLORS = {
  slate: "#64748b",
  qualityLine: "#000000",
  qualityDot: "#D31145",
  preOpLine: "#16a34a",
  preOpDot: "#16a34a",
  surgeonLine: "#2563eb",
  surgeonDot: "#2563eb",
};

const LEGEND = {
  quality: "Surgical Outcomes Quality Indicator",
  preOpVa: "Pre-operative VA 6/15 or worse",
} as const;

const NO_SURGEON = "";

export function AggregateTrendView() {
  const [risk, setRisk] = useState<RiskGroup>("Standard Risk");
  const [surgeon, setSurgeon] = useState<SurgeonName | typeof NO_SURGEON>(NO_SURGEON);
  const [qualityConfig, setQualityConfig] = useState<QualityConfig>({
    vaStandard: "va-612",
    refractiveStandard: "se-10",
    weights: DEFAULT_WEIGHTS,
  });

  const surgeonsForRisk = useMemo(() => surgeonsForRiskGroup(risk), [risk]);

  function handleRiskChange(nextRisk: RiskGroup) {
    setRisk(nextRisk);
    if (surgeon && !surgeonsForRiskGroup(nextRisk).includes(surgeon)) {
      setSurgeon(NO_SURGEON);
    }
  }

  const complicationDataAvailable = hasComplicationData();
  const selectedSurgeon = surgeon || undefined;

  const trend = useMemo(
    () => computeMonthlyTrend(risk, qualityConfig, selectedSurgeon),
    [risk, qualityConfig, selectedSurgeon],
  );

  const surgeonLegendLabel = selectedSurgeon ? `${selectedSurgeon} — quality indicator` : "";

  const chartData = useMemo(
    () =>
      trend.map((p) => ({
        ...p,
        qualityPlot: p.quality ?? undefined,
        preOpVa612WorsePlot: p.preOpVa612WorseRate ?? undefined,
        // null gaps are bridged by the surgeon line (connectNulls); dots only where quality is computed
        surgeonQualityPlot:
          selectedSurgeon && p.surgeonQuality != null ? p.surgeonQuality : null,
        surgeonHasPlottedPoint:
          selectedSurgeon &&
          p.surgeonQuality != null &&
          p.surgeonCases >= MIN_SURGEON_MONTHLY_CASES,
      })),
    [trend, selectedSurgeon],
  );

  const totalWeight =
    qualityConfig.weights.visual +
    qualityConfig.weights.refractive +
    qualityConfig.weights.proms +
    qualityConfig.weights.complications;

  const weightControls = (
    [
      { key: "visual", label: "Visual acuity weightage" },
      { key: "refractive", label: "Refractive outcomes weightage" },
      { key: "proms", label: "PROMS weightage" },
      ...(complicationDataAvailable
        ? [{ key: "complications" as const, label: "Complications weightage" }]
        : []),
    ] as const
  );

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-aia-red">AIA · Cataract outcomes</p>
        <h1 className="mt-2 text-2xl font-semibold text-aia-navy">Aggregate quality trend</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Real clinical outcomes (Jun 2025 – Mar 2026). Monthly quality indicator for the selected risk group,
          weighted from domain scores in the spreadsheet.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="block min-w-44">
              <span className="mb-1 block text-xs font-medium text-slate-700">Risk group</span>
              <select
                value={risk}
                onChange={(e) => handleRiskChange(e.target.value as RiskGroup)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="Standard Risk">Standard Risk</option>
                <option value="High Risk">High Risk</option>
              </select>
            </label>
            <label className="block min-w-56">
              <span className="mb-1 block text-xs font-medium text-slate-700">Surgeon overlay (optional)</span>
              <select
                value={surgeon}
                onChange={(e) => setSurgeon(e.target.value as SurgeonName | typeof NO_SURGEON)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value={NO_SURGEON}>None — hide surgeon line</option>
                {surgeonsForRisk.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Only surgeons with cases in the selected risk group are listed. The surgeon line uses a
                smooth curve across months with no cases or fewer than {MIN_SURGEON_MONTHLY_CASES}{" "}
                cases; dots appear only where a monthly quality score is computed.
              </p>
            </label>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-aia-navy">Quality indicator &amp; pre-op VA over time</h3>
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
                            {LEGEND.quality}:{" "}
                            {p.quality != null ? `${p.quality.toFixed(1)}%` : "N/A"}
                          </p>
                          <p className="text-slate-600">
                            {LEGEND.preOpVa}:{" "}
                            {p.preOpVa612WorseRate != null ? `${p.preOpVa612WorseRate.toFixed(1)}%` : "N/A"}
                          </p>
                          {selectedSurgeon && (
                            <p className="text-slate-600">
                              {surgeonLegendLabel}:{" "}
                              {p.surgeonCases === 0
                                ? "No cases this month"
                                : p.surgeonCases < MIN_SURGEON_MONTHLY_CASES
                                  ? `Only ${p.surgeonCases} case(s) — not plotted (< ${MIN_SURGEON_MONTHLY_CASES})`
                                  : p.surgeonQuality != null
                                    ? `${p.surgeonQuality.toFixed(1)}% (n=${p.surgeonCases})`
                                    : "Insufficient outcome data"}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" height={selectedSurgeon ? 48 : 32} />
                  <Line
                    type="monotone"
                    dataKey="qualityPlot"
                    stroke={COLORS.qualityLine}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: COLORS.qualityDot, stroke: "#fff", strokeWidth: 1.5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={LEGEND.quality}
                  />
                  <Line
                    type="monotone"
                    dataKey="preOpVa612WorsePlot"
                    stroke={COLORS.preOpLine}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: COLORS.preOpDot, stroke: "#fff", strokeWidth: 1.5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                    name={LEGEND.preOpVa}
                  />
                  {selectedSurgeon && (
                    <Line
                      type="monotone"
                      dataKey="surgeonQualityPlot"
                      stroke={COLORS.surgeonLine}
                      strokeWidth={2.5}
                      connectNulls
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (
                          cx == null ||
                          cy == null ||
                          !payload?.surgeonHasPlottedPoint
                        ) {
                          return <></>;
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={COLORS.surgeonDot}
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                        );
                      }}
                      activeDot={{ r: 6, fill: COLORS.surgeonDot, stroke: "#fff", strokeWidth: 1.5 }}
                      isAnimationActive={false}
                      name={surgeonLegendLabel}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-aia-navy">Quality indicator controls</h3>
            <p className="mt-1 text-xs text-slate-600">
              Domain scores use spreadsheet fields; undefined (9) values are excluded. Refractive
              outcomes are calculated among patients with a measured post-op VA (not undefined).
              Complication rates use the separate complications register against the clinical cohort
              for each month and risk group. When a surgeon overlay is shown, complications are
              matched to that surgeon only.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">Visual acuity outcomes</span>
                <select
                  value={qualityConfig.vaStandard}
                  onChange={(e) =>
                    setQualityConfig((prev) => ({ ...prev, vaStandard: e.target.value as VaStandard }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="va-612">VA &gt;= 6/12</option>
                  <option value="va-69">VA &gt;= 6/9</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">Refractive outcomes</span>
                <select
                  value={qualityConfig.refractiveStandard}
                  onChange={(e) =>
                    setQualityConfig((prev) => ({
                      ...prev,
                      refractiveStandard: e.target.value as RefractiveStandard,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="se-10">SE +/- 1.0D</option>
                  <option value="se-05">SE +/- 0.5D</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-700">PROMS</span>
                <select
                  value="catprom5"
                  disabled
                  className="w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-700"
                >
                  <option value="catprom5">Cat-PROM5</option>
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-700">Total weightage: {totalWeight}%</p>
                <button
                  type="button"
                  onClick={() => setQualityConfig((prev) => ({ ...prev, weights: { ...DEFAULT_WEIGHTS } }))}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {complicationDataAvailable ? "Reset to 25% each" : "Reset default weights"}
                </button>
              </div>
              {weightControls.map((item) => (
                <label key={item.key} className="block">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>{item.label}</span>
                    <span>{qualityConfig.weights[item.key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={qualityConfig.weights[item.key]}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value);
                      setQualityConfig((prev) => ({
                        ...prev,
                        weights: redistributeWeights(prev.weights, item.key, nextValue),
                      }));
                    }}
                    className="w-full accent-aia-red"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
