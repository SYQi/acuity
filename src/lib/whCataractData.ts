import recordsJson from "@/lib/whCataractRecords.json";
import complicationEventsJson from "@/lib/whComplicationEvents.json";

export type RiskGroup = "High Risk" | "Standard Risk";
export type TriState = 1 | 2 | 9;

/** AIA prototype: outcomes shown for these two surgeons only. */
export const SURGEON_NAMES = ["Dr Roy Tan", "Dr Soh Yu Qiang"] as const;

export type SurgeonName = (typeof SURGEON_NAMES)[number];

export type WhCataractRecord = {
  id: string;
  riskGroup: RiskGroup;
  /** YYMM e.g. 2506 = June 2025 */
  surgicalMonth: string;
  /** Pre-op VA >= 6/12: 1 = Yes, 2 = No, 9 = undefined */
  preOpVa612: TriState | null;
  preOpVa69: TriState | null;
  postOpVa612: TriState | null;
  postOpVa69: TriState | null;
  postOpSe05: TriState | null;
  postOpSe10: TriState | null;
  preOpProm: number | null;
  postOpProm: number | null;
  surgeon: SurgeonName | null;
};

export type WhComplicationEvent = {
  id: string;
  /** YYMM e.g. 2506 = June 2025 */
  surgicalMonth: string;
  riskGroup: RiskGroup;
  surgeon: SurgeonName | null;
  /** Always 1 for events in the complications spreadsheet */
  complication: 1;
};

/** Reporting window shown in dashboards: Jun 2025 – Jun 2026. */
export const SURGICAL_MONTHS = [
  "2506",
  "2507",
  "2508",
  "2509",
  "2510",
  "2511",
  "2512",
  "2601",
  "2602",
  "2603",
  "2604",
  "2605",
  "2606",
] as const;

export type SurgicalMonthCode = (typeof SURGICAL_MONTHS)[number];

export const whCataractRecords = recordsJson as WhCataractRecord[];
export const whComplicationEvents = complicationEventsJson as WhComplicationEvent[];

export function hasComplicationData(): boolean {
  return whComplicationEvents.length > 0;
}

export function countComplicationEvents(opts: {
  surgicalMonth: string;
  riskGroup?: RiskGroup;
  surgeon?: SurgeonName;
}): number {
  return whComplicationEvents.filter((event) => {
    if (event.surgicalMonth !== opts.surgicalMonth) return false;
    if (opts.riskGroup && event.riskGroup !== opts.riskGroup) return false;
    if (opts.surgeon && event.surgeon !== opts.surgeon) return false;
    return true;
  }).length;
}

export function surgeonsInDataset(): SurgeonName[] {
  const present = new Set(
    whCataractRecords
      .map((r) => r.surgeon)
      .filter((s): s is SurgeonName => Boolean(s)),
  );
  return SURGEON_NAMES.filter((name) => present.has(name));
}

export function surgeonsForRiskGroup(riskGroup: RiskGroup): SurgeonName[] {
  const present = new Set(
    whCataractRecords
      .filter((r) => r.riskGroup === riskGroup)
      .map((r) => r.surgeon)
      .filter((s): s is SurgeonName => Boolean(s)),
  );
  return SURGEON_NAMES.filter((name) => present.has(name));
}

export function formatSurgicalMonthLabel(code: string): string {
  if (code.length !== 4) return code;
  const yy = Number(code.slice(0, 2));
  const mm = Number(code.slice(2, 4));
  const year = 2000 + yy;
  const month = new Date(year, mm - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
  return month;
}

export function surgicalMonthToInput(code: string): string {
  if (code.length !== 4) return "";
  return `20${code.slice(0, 2)}-${code.slice(2, 4)}`;
}

export function parseSurgicalMonthInput(value: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const yy = m[1].slice(2);
  return `${yy}${m[2]}`;
}

export function filterRecords(opts: {
  surgicalMonth?: string;
  riskGroup?: RiskGroup;
  surgeon?: SurgeonName;
}): WhCataractRecord[] {
  return whCataractRecords.filter((r) => {
    if (!(SURGICAL_MONTHS as readonly string[]).includes(r.surgicalMonth)) return false;
    if (opts.surgicalMonth && r.surgicalMonth !== opts.surgicalMonth) return false;
    if (opts.riskGroup && r.riskGroup !== opts.riskGroup) return false;
    if (opts.surgeon && r.surgeon !== opts.surgeon) return false;
    return true;
  });
}
