"use client";

import { useState } from "react";
import { AggregateTrendView } from "@/components/AggregateTrendView";
import { CaseCountView } from "@/components/CaseCountView";
import { MonthlyBreakdownView } from "@/components/MonthlyBreakdownView";

type AppView = "aggregate" | "monthly" | "cases";

const NAV: { id: AppView; label: string; description: string }[] = [
  { id: "aggregate", label: "Aggregate Trend", description: "Monthly quality indicator over time" },
  { id: "monthly", label: "Monthly Breakdown", description: "Per-month clinical indicators and risk groups" },
  {
    id: "cases",
    label: "Case Count",
    description: "Historical cataract vs combined volume by surgeon",
  },
];

export function Dashboard() {
  const [activeView, setActiveView] = useState<AppView>("aggregate");
  const activeMeta = NAV.find((n) => n.id === activeView);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/90 px-4 py-5 backdrop-blur-xl lg:block">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-aia-navy to-[#0d2f78] p-4 text-white shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200">AIA</p>
          <h1 className="mt-1 text-lg font-semibold">Acuity</h1>
          <p className="mt-2 text-xs text-slate-200/90">
            Private insurer prototype · Dr Roy Tan &amp; Dr Soh Yu Qiang
          </p>
        </div>

        <nav className="mt-5">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Views
          </p>
          <ul className="space-y-1.5">
            {NAV.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                    activeView === item.id
                      ? "border-aia-navy/20 bg-aia-navy text-white shadow-md shadow-aia-navy/20"
                      : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      activeView === item.id ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <label className="text-xs font-medium text-slate-600">View</label>
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value as AppView)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
          >
            {NAV.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-6 rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-aia-red">
              AIA · WH Dashboard
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-aia-navy">{activeMeta?.label}</h2>
                <p className="text-sm text-slate-600">{activeMeta?.description}</p>
              </div>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                AIA panel · 2 surgeons
              </span>
            </div>
          </header>

          {activeView === "aggregate" && <AggregateTrendView />}
          {activeView === "monthly" && <MonthlyBreakdownView />}
          {activeView === "cases" && <CaseCountView />}

          <footer className="mt-10 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500">
            Acuity · Cataract Clinical Outcomes for AIA · Woodlands Hospital · {new Date().getFullYear()}
          </footer>
        </main>
      </div>
    </div>
  );
}
