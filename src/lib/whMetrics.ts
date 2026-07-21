import {
  countComplicationEvents,
  filterRecords,
  formatSurgicalMonthLabel,
  hasComplicationData,
  SURGICAL_MONTHS,
  type RiskGroup,
  type SurgeonName,
  type TriState,
  type WhCataractRecord,
} from "@/lib/whCataractData";

export type VaStandard = "va-612" | "va-69";
export type RefractiveStandard = "se-10" | "se-05";

export type DomainWeights = {
  visual: number;
  refractive: number;
  proms: number;
  complications: number;
};

export type QualityConfig = {
  vaStandard: VaStandard;
  refractiveStandard: RefractiveStandard;
  weights: DomainWeights;
};

export const DEFAULT_WEIGHTS: DomainWeights = hasComplicationData()
  ? { visual: 25, refractive: 25, proms: 25, complications: 25 }
  : { visual: 34, refractive: 33, proms: 33, complications: 0 };

export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  vaStandard: "va-612",
  refractiveStandard: "se-10",
  weights: DEFAULT_WEIGHTS,
};

export type DomainScores = {
  visual: number | null;
  refractive: number | null;
  proms: number | null;
  complications: number | null;
  quality: number | null;
  cases: number;
};

export type MonthlyTrendPoint = {
  surgicalMonth: string;
  monthLabel: string;
  monthIndex: number;
  cases: number;
  quality: number | null;
  /** % with pre-op VA >= 6/12 = No (2) — worse baseline VA; undefined (9) excluded. */
  preOpVa612WorseRate: number | null;
  /** Surgeon-specific quality when a surgeon filter is active; null = not plotted for that month. */
  surgeonQuality: number | null;
  surgeonCases: number;
  domains: DomainScores;
};

export type GroupSummary = {
  riskGroup: RiskGroup;
  cases: number;
  complicationRate: number;
  goodVisionRate: number;
  refractiveWithin1DRate: number;
};

export type MonthlyMetrics = {
  surgicalMonth: string;
  monthLabel: string;
  totalCases: number;
  highRiskShare: number;
  qualityScore: number | null;
  successWithoutComplicationRate: number | null;
  va612Rate: number | null;
  refractiveWithin1DRate: number | null;
  promsDoublingRate: number | null;
  promsEligibleCases: number;
  promsSummary: PromsMonthlySummary;
  groupSummaries: GroupSummary[];
  domains: DomainScores;
};

export type PromsMonthlySummary = {
  eligibleCases: number;
  doublingRate: number | null;
  meanPreOp: number | null;
  meanPostOp: number | null;
  pairs: { preOp: number; postOp: number }[];
};

type WeightKey = keyof DomainWeights;

const WEIGHT_KEYS: WeightKey[] = ["visual", "refractive", "proms", "complications"];

/** Minimum monthly surgeon caseload before plotting surgeon-specific quality (avoids unstable small-n estimates). */
export const MIN_SURGEON_MONTHLY_CASES = 3;

function isDefinedTri(v: TriState | null | undefined): v is 1 | 2 {
  return v === 1 || v === 2;
}

function isUndefinedTri(v: TriState | null | undefined): boolean {
  return v === 9 || v === null || v === undefined;
}

function vaFieldForConfig(config: QualityConfig) {
  return config.vaStandard === "va-612"
    ? (r: WhCataractRecord) => r.postOpVa612
    : (r: WhCataractRecord) => r.postOpVa69;
}

function refractiveFieldForConfig(config: QualityConfig) {
  return config.refractiveStandard === "se-10"
    ? (r: WhCataractRecord) => r.postOpSe10
    : (r: WhCataractRecord) => r.postOpSe05;
}

/** % with value 2 (No) among rows where field is 1 or 2; undefined (9) excluded. */
function noRate(rows: WhCataractRecord[], value: (r: WhCataractRecord) => TriState | null): number | null {
  const valid = rows.filter((r) => isDefinedTri(value(r)));
  if (valid.length === 0) return null;
  return (valid.filter((r) => value(r) === 2).length / valid.length) * 100;
}

/** % with value 1 (Yes) among rows where field is 1 or 2; undefined (9) excluded. */
function yesRate(rows: WhCataractRecord[], value: (r: WhCataractRecord) => TriState | null): number | null {
  const valid = rows.filter((r) => isDefinedTri(value(r)));
  if (valid.length === 0) return null;
  return (valid.filter((r) => value(r) === 1).length / valid.length) * 100;
}

/**
 * Refractive % aligned with Excel pivot tables: exclude patients whose selected post-op VA
 * outcome is undefined (9). Those rows often carry SE = No but were not refractively assessed.
 * Denominator = measured refractive outcome (1 or 2) among VA-defined patients only.
 */
function refractiveYesRate(rows: WhCataractRecord[], config: QualityConfig): number | null {
  const vaField = vaFieldForConfig(config);
  const refractiveField = refractiveFieldForConfig(config);
  const cohort = rows.filter((r) => !isUndefinedTri(vaField(r)));
  const valid = cohort.filter((r) => isDefinedTri(refractiveField(r)));
  if (valid.length === 0) return null;
  return (valid.filter((r) => refractiveField(r) === 1).length / valid.length) * 100;
}

function cohortRiskGroup(rows: WhCataractRecord[]): RiskGroup | undefined {
  if (rows.length === 0) return undefined;
  const groups = new Set(rows.map((r) => r.riskGroup));
  return groups.size === 1 ? [...groups][0] : undefined;
}

function cohortSurgeon(rows: WhCataractRecord[]): SurgeonName | undefined {
  if (rows.length === 0) return undefined;
  const surgeons = new Set(
    rows.map((r) => r.surgeon).filter((s): s is SurgeonName => s != null),
  );
  return surgeons.size === 1 ? [...surgeons][0] : undefined;
}

/** Complication rate from complications register vs clinical cohort size. */
function complicationRate(rows: WhCataractRecord[]): number | null {
  if (!hasComplicationData() || rows.length === 0) return null;
  const surgicalMonth = rows[0]?.surgicalMonth;
  if (!surgicalMonth) return null;
  const riskGroup = cohortRiskGroup(rows);
  const surgeon = cohortSurgeon(rows);
  const compCount = countComplicationEvents({ surgicalMonth, riskGroup, surgeon });
  return (Math.min(compCount, rows.length) / rows.length) * 100;
}

function complicationsFreeRate(rows: WhCataractRecord[]): number | null {
  const rate = complicationRate(rows);
  if (rate == null) return null;
  return 100 - rate;
}

function promsDoublingRate(rows: WhCataractRecord[]): number | null {
  const valid = rows.filter(
    (r) => r.preOpProm != null && r.postOpProm != null && r.preOpProm > 0,
  );
  if (valid.length === 0) return null;
  return (
    (valid.filter((r) => (r.postOpProm as number) >= 2 * (r.preOpProm as number)).length / valid.length) *
    100
  );
}

export function computeDomainScores(rows: WhCataractRecord[], config: QualityConfig): DomainScores {
  if (rows.length === 0) {
    return { visual: null, refractive: null, proms: null, complications: null, quality: null, cases: 0 };
  }

  const visualField = vaFieldForConfig(config);

  const visual = yesRate(rows, visualField);
  const refractive = refractiveYesRate(rows, config);
  const proms = promsDoublingRate(rows);
  const complications = complicationsFreeRate(rows);
  const quality = weightedQuality({ visual, refractive, proms, complications }, config.weights);

  return { visual, refractive, proms, complications, quality, cases: rows.length };
}

export function weightedQuality(
  domains: Pick<DomainScores, "visual" | "refractive" | "proms" | "complications">,
  weights: DomainWeights,
): number | null {
  const entries: { score: number; weight: number }[] = [];
  if (domains.visual != null) entries.push({ score: domains.visual, weight: weights.visual });
  if (domains.refractive != null) entries.push({ score: domains.refractive, weight: weights.refractive });
  if (domains.proms != null) entries.push({ score: domains.proms, weight: weights.proms });
  if (domains.complications != null) entries.push({ score: domains.complications, weight: weights.complications });
  if (entries.length === 0) return null;
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) return null;
  const sum = entries.reduce((s, e) => s + e.score * (e.weight / totalWeight), 0);
  return Math.round(sum * 10) / 10;
}

export function computeMonthlyTrend(
  riskGroup: RiskGroup,
  config: QualityConfig,
  surgeon?: SurgeonName,
): MonthlyTrendPoint[] {
  return SURGICAL_MONTHS.map((surgicalMonth, monthIndex) => {
    const rows = filterRecords({ riskGroup, surgicalMonth });
    const surgeonRows = surgeon ? filterRecords({ riskGroup, surgicalMonth, surgeon }) : [];
    const domains = computeDomainScores(rows, config);
    const surgeonCases = surgeon ? surgeonRows.length : 0;
    const surgeonDomains =
      surgeon && surgeonCases >= MIN_SURGEON_MONTHLY_CASES
        ? computeDomainScores(surgeonRows, config)
        : null;

    return {
      surgicalMonth,
      monthLabel: formatSurgicalMonthLabel(surgicalMonth),
      monthIndex,
      cases: rows.length,
      quality: domains.quality,
      preOpVa612WorseRate: noRate(rows, (r) => r.preOpVa612),
      surgeonQuality: surgeon ? (surgeonDomains?.quality ?? null) : null,
      surgeonCases,
      domains,
    };
  });
}

export function computePromsMonthlySummary(rows: WhCataractRecord[]): PromsMonthlySummary {
  const eligible = rows.filter(
    (r) => r.preOpProm != null && r.postOpProm != null && r.preOpProm > 0,
  );
  const pairs = eligible.map((r) => ({
    preOp: r.preOpProm as number,
    postOp: r.postOpProm as number,
  }));

  if (pairs.length === 0) {
    return {
      eligibleCases: 0,
      doublingRate: null,
      meanPreOp: null,
      meanPostOp: null,
      pairs: [],
    };
  }

  const meanPreOp = pairs.reduce((s, p) => s + p.preOp, 0) / pairs.length;
  const meanPostOp = pairs.reduce((s, p) => s + p.postOp, 0) / pairs.length;
  const doublingRate =
    (pairs.filter((p) => p.postOp >= 2 * p.preOp).length / pairs.length) * 100;

  return {
    eligibleCases: pairs.length,
    doublingRate,
    meanPreOp: Math.round(meanPreOp * 10) / 10,
    meanPostOp: Math.round(meanPostOp * 10) / 10,
    pairs,
  };
}

export function computeMonthlyMetrics(
  surgicalMonth: string,
  config: QualityConfig = DEFAULT_QUALITY_CONFIG,
): MonthlyMetrics {
  const rows = filterRecords({ surgicalMonth });
  const domains = computeDomainScores(rows, config);
  const totalCases = rows.length;
  const highRiskCases = rows.filter((r) => r.riskGroup === "High Risk").length;
  const highRiskShare = totalCases > 0 ? (highRiskCases / totalCases) * 100 : 0;

  const groups: RiskGroup[] = ["High Risk", "Standard Risk"];
  const groupSummaries: GroupSummary[] = groups.map((riskGroup) => {
    const gRows = rows.filter((r) => r.riskGroup === riskGroup);
    const cases = gRows.length;
    const vaValid = gRows.filter((r) => isDefinedTri(r.postOpVa612));
    return {
      riskGroup,
      cases,
      complicationRate: complicationRate(gRows) ?? 0,
      goodVisionRate:
        vaValid.length > 0 ? (vaValid.filter((r) => r.postOpVa612 === 1).length / vaValid.length) * 100 : 0,
      refractiveWithin1DRate: refractiveYesRate(gRows, DEFAULT_QUALITY_CONFIG) ?? 0,
    };
  });

  const promsSummary = computePromsMonthlySummary(rows);

  return {
    surgicalMonth,
    monthLabel: formatSurgicalMonthLabel(surgicalMonth),
    totalCases,
    highRiskShare,
    qualityScore: domains.quality,
    successWithoutComplicationRate: domains.complications,
    va612Rate: yesRate(rows, (r) => r.postOpVa612),
    refractiveWithin1DRate: refractiveYesRate(rows, config),
    promsDoublingRate: promsSummary.doublingRate,
    promsEligibleCases: promsSummary.eligibleCases,
    promsSummary,
    groupSummaries,
    domains,
  };
}

export function redistributeWeights(
  weights: DomainWeights,
  changedKey: WeightKey,
  targetValueRaw: number,
): DomainWeights {
  const targetValue = Math.max(0, Math.min(100, Math.round(targetValueRaw)));
  const otherKeys = WEIGHT_KEYS.filter((k) => k !== changedKey);
  const remaining = Math.max(0, 100 - targetValue);
  const otherSum = otherKeys.reduce((sum, k) => sum + weights[k], 0);

  if (otherKeys.length === 0) return { ...weights, [changedKey]: 100 };

  if (otherSum <= 0) {
    const even = Math.floor(remaining / otherKeys.length);
    const out = { ...weights, [changedKey]: targetValue };
    let used = 0;
    otherKeys.forEach((k, idx) => {
      const v = idx === otherKeys.length - 1 ? remaining - used : even;
      out[k] = v;
      used += v;
    });
    return out;
  }

  const out = { ...weights, [changedKey]: targetValue };
  let allocated = 0;
  otherKeys.forEach((k, idx) => {
    if (idx === otherKeys.length - 1) {
      out[k] = remaining - allocated;
      return;
    }
    const proportion = weights[k] / otherSum;
    const v = Math.round(remaining * proportion);
    out[k] = v;
    allocated += v;
  });
  return out;
}
