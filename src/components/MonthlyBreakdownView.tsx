"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSurgicalMonthLabel, hasComplicationData, SURGICAL_MONTHS } from "@/lib/whCataractData";
import { computeMonthlyMetrics, DEFAULT_QUALITY_CONFIG } from "@/lib/whMetrics";
import { MonthlyBreakdownCharts } from "@/components/MonthlyBreakdownCharts";
import { MonthlyPromsChart } from "@/components/MonthlyPromsChart";

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-SG").format(n);
}

function formatPct(n: number | null) {
  return n != null ? `${n.toFixed(1)}%` : "N/A";
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

function ChartsLoading() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-hidden>
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="h-[260px] animate-pulse rounded-lg bg-slate-100" />
        <div className="h-[260px] animate-pulse rounded-lg bg-slate-100" />
        <div className="h-[260px] animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

function monthNameOnly(code: string): string {
  const mm = Number(code.slice(2, 4));
  return new Date(2000, mm - 1, 1).toLocaleDateString("en-GB", { month: "long" });
}

const MONTHS_BY_YEAR = (() => {
  const map: Record<string, string[]> = {};
  for (const code of SURGICAL_MONTHS) {
    const year = `20${code.slice(0, 2)}`;
    if (!map[year]) map[year] = [];
    map[year].push(code);
  }
  return map;
})();

const REPORT_YEARS = Object.keys(MONTHS_BY_YEAR).sort();

export function MonthlyBreakdownView() {
  const defaultMonth = SURGICAL_MONTHS[SURGICAL_MONTHS.length - 1];
  const [surgicalMonth, setSurgicalMonth] = useState<string>(defaultMonth);
  const [chartsMounted, setChartsMounted] = useState(false);

  const selectedYear = `20${surgicalMonth.slice(0, 2)}`;
  const monthsForYear = MONTHS_BY_YEAR[selectedYear] ?? [];

  useEffect(() => {
    setChartsMounted(true);
  }, []);

  function handleYearChange(year: string) {
    const months = MONTHS_BY_YEAR[year];
    if (!months?.length) return;
    setSurgicalMonth(months[months.length - 1]);
  }

  const m = useMemo(
    () => computeMonthlyMetrics(surgicalMonth, DEFAULT_QUALITY_CONFIG),
    [surgicalMonth],
  );
  const showComplications = hasComplicationData();

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-aia-red">AIA · WH cataract outcomes</p>
        <h1 className="mt-2 text-2xl font-semibold text-aia-navy">Monthly breakdown</h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          Clinical outcomes for Dr Roy Tan and Dr Soh Yu Qiang by surgical month (Jun 2025 – Mar 2026).
          Quality score uses default weights (25% each domain when complications data is available) with
          VA ≥ 6/12 and SE ± 1.0D.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block min-w-[7rem]">
            <span className="mb-1 block text-xs font-medium text-slate-700">Year</span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
            >
              {REPORT_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-[10rem]">
            <span className="mb-1 block text-xs font-medium text-slate-700">Month</span>
            <select
              value={surgicalMonth}
              onChange={(e) => setSurgicalMonth(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
            >
              {monthsForYear.map((code) => (
                <option key={code} value={code}>
                  {monthNameOnly(code)}
                </option>
              ))}
            </select>
          </label>
          <p className="pb-2 text-sm text-slate-600">{formatSurgicalMonthLabel(surgicalMonth)}</p>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-aia-navy">Reporting window</p>
          <p className="mt-1">Surgeries performed in {m.monthLabel}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-aia-navy">Monthly clinical indicators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Total cases" value={formatNumber(m.totalCases)} hint="All cases in month" />
          <MetricCard
            label="Quality score"
            value={m.qualityScore != null ? m.qualityScore.toFixed(1) : "N/A"}
            hint="Weighted composite (default 25% per domain)"
          />
          {showComplications && (
            <MetricCard
              label="Surgery without complications"
              value={formatPct(m.successWithoutComplicationRate)}
              hint="100% − complication rate (complications register vs clinical cohort)"
            />
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Post-op VA ≥ 6/12" value={formatPct(m.va612Rate)} hint="Month 1 post-op" />
          <MetricCard
            label="Refractive accuracy within ±1.0D"
            value={formatPct(m.refractiveWithin1DRate)}
            hint="Month 1 post-op SE among patients with measured post-op VA (excludes VA undefined)"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-aia-navy">PROMS (CAT-PROM5)</h2>
        <p className="mb-4 text-sm text-slate-600">All risk groups combined — no risk-group split for PROMs.</p>
        <div className="mb-6 max-w-md">
          <MetricCard
            label="≥2× pre-op score"
            value={formatPct(m.promsSummary.doublingRate)}
            hint={
              m.promsSummary.eligibleCases > 0
                ? `${m.promsSummary.eligibleCases} patient(s) with paired pre/post scores`
                : "No pre/post PROM pairs in this month"
            }
          />
        </div>
        {chartsMounted ? (
          <MonthlyPromsChart summary={m.promsSummary} />
        ) : (
          <div className="h-[280px] animate-pulse rounded-lg bg-slate-100" aria-hidden />
        )}
      </section>

      {chartsMounted ? (
        <MonthlyBreakdownCharts groupSummaries={m.groupSummaries} showComplications={showComplications} />
      ) : (
        <ChartsLoading />
      )}
    </div>
  );
}
