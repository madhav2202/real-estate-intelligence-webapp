import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js?v=20260522a";

const BUILDER_GRADES = {
  "dlf": "A+",
  "oberoi": "A+",
  "godrej": "A",
  "max": "A",
  "sobha": "A",
  "emaar": "A",
  "adani": "A",
  "birla": "A",
  "experion": "B",
  "shapoorji": "B",
  "eldeco": "B",
  "krisumi": "B",
  "aipl": "B",
  "conscient": "B",
  "ashiana": "B",
  "trehan": "B",
  "elan": "B",
  "m3m": "C",
  "signature global": "C",
  "smartworld": "C",
  "suncity": "C",
};

export const IS_GITHUB_PAGES =
  typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
export const REPO_BASE = IS_GITHUB_PAGES ? "/real-estate-intelligence-webapp" : "";
let currentDataSource = "local-json";
const SHORTLIST_STORAGE_KEY = "plinthProjectShortlist";

export function loadProjectShortlist() {
  if (typeof window === "undefined") return [];
  try {
    const values = JSON.parse(window.localStorage.getItem(SHORTLIST_STORAGE_KEY) || "[]");
    return Array.isArray(values) ? [...new Set(values.filter(Boolean).map(String))] : [];
  } catch {
    return [];
  }
}

export function saveProjectShortlist(slugs = []) {
  const normalized = [...new Set(slugs.filter(Boolean).map(String))];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent("plinth-shortlist-change", { detail: normalized }));
    } catch {
      return normalized;
    }
  }
  return normalized;
}

export function withBase(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${REPO_BASE}${normalized}`;
}

export function appViewUrl(view = "map", projectSlug = "") {
  const params = new URLSearchParams();
  if (view && view !== "map") params.set("view", view);
  if (projectSlug) params.set("project", projectSlug);
  const query = params.toString();
  return withBase(`/index.html${query ? `?${query}` : ""}`);
}

export function projectPageUrl(slug = "") {
  const params = new URLSearchParams();
  if (slug) params.set("slug", slug);
  const query = params.toString();
  return withBase(`/project.html${query ? `?${query}` : ""}`);
}

export function propertiesPageUrl() {
  return withBase("/properties.html");
}

export function commutePageUrl(slug = "") {
  const params = new URLSearchParams();
  if (slug) params.set("slug", slug);
  const query = params.toString();
  return withBase(`/commute-intelligence.html${query ? `?${query}` : ""}`);
}

export function recommendationPageUrl() {
  return withBase("/recommendation-onboarding.html");
}

export function getDataSourceMeta() {
  if (currentDataSource === "supabase") {
    return {
      key: "supabase",
      label: "Live source: Supabase",
      tone: "live",
    };
  }

  if (currentDataSource === "formsubmit") {
    return {
      key: "formsubmit",
      label: "Lead path: FormSubmit",
      tone: "soft",
    };
  }

  return {
    key: "local-json",
    label: "Fallback: Local JSON",
    tone: "soft",
  };
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

function mapSupabaseProject(row) {
  return {
    code: row.code,
    name: row.name,
    slug: row.slug,
    developer: row.developer,
    builderCode: row.builder_code,
    location: row.location,
    sector: row.sector,
    corridor: row.corridor,
    stage: row.stage,
    possession: row.possession,
    priceCr: row.price_cr,
    sqft: row.sqft,
    priceSqft: row.price_sqft,
    units: row.units,
    launched: row.launched,
    sold: row.sold,
    absorption: row.absorption,
    inventory: row.inventory,
    bestFor: row.best_for,
    image: row.image,
    latitude: row.latitude,
    longitude: row.longitude,
    published: row.published,
    reraNumber: row.rera_number,
    reraPossession: row.rera_possession,
    builderRiskScoreLabel: row.builder_risk_score_label,
    developerRisk: row.developer_risk || {},
    approvals: row.approvals || [],
    tracker: row.tracker || {},
    comps: row.comps || [],
    stack: row.stack || [],
    locationIntel: row.location_intel || {},
    reraDetails: row.rera_details || {},
    builderIntelligence: row.builder_intelligence || null,
    latestAbsorption: row.latest_absorption || null,
  };
}

function mergeProjectEnrichment(primary, backup) {
  if (!backup) return primary;
  const preferFresh = (current, fresh) => {
    if (fresh === undefined || fresh === null || fresh === "" || fresh === "Data pending") return current;
    if (current === undefined || current === null || current === "" || current === "Data pending") return fresh;
    return fresh;
  };
  const legacySlug =
    primary.slug && backup.slug && primary.slug !== backup.slug
      ? primary.slug
      : primary.legacySlug || backup.legacySlug || null;
  return {
    ...primary,
    code: backup.code || primary.code,
    name: backup.name || primary.name,
    slug: backup.slug || primary.slug,
    legacySlug,
    stage: preferFresh(primary.stage, backup.stage),
    units: preferFresh(primary.units, backup.units),
    launched: preferFresh(primary.launched, backup.launched),
    sold: preferFresh(primary.sold, backup.sold),
    absorption: preferFresh(primary.absorption, backup.absorption),
    inventory: preferFresh(primary.inventory, backup.inventory),
    reraNumber: preferFresh(primary.reraNumber, backup.reraNumber),
    reraPossession: preferFresh(primary.reraPossession, backup.reraPossession),
    latestAbsorption: backup.latestAbsorption || primary.latestAbsorption || null,
    builderIntelligence: primary.builderIntelligence || backup.builderIntelligence || null,
    reraDetails:
      primary.reraDetails && Object.keys(primary.reraDetails).length
        ? primary.reraDetails
        : backup.reraDetails || {},
    locationIntel:
      primary.locationIntel && Object.keys(primary.locationIntel).length
        ? primary.locationIntel
        : backup.locationIntel || {},
    tracker: primary.tracker && Object.keys(primary.tracker).length ? primary.tracker : backup.tracker || {},
    developerRisk:
      primary.developerRisk && Object.keys(primary.developerRisk).length
        ? primary.developerRisk
        : backup.developerRisk || {},
    approvals: primary.approvals?.length ? primary.approvals : backup.approvals || [],
    comps: primary.comps?.length ? primary.comps : backup.comps || [],
    stack: primary.stack?.length ? primary.stack : backup.stack || [],
    builderRiskScoreLabel: primary.builderRiskScoreLabel || backup.builderRiskScoreLabel || null,
  };
}

async function loadLocalProjects() {
  currentDataSource = "local-json";
  const response = await fetch(withBase("/data/projects-data.json"));
  if (!response.ok) throw new Error("Unable to load project data");
  const projects = await response.json();
  return projects.filter((project) => project && project.published !== false);
}

export async function submitLead(payload) {
  if (hasSupabaseConfig()) {
    const body = {
      project_code: payload.projectCode || null,
      project_name: payload.projectName || null,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      budget: payload.budget || null,
      timeline: payload.timeline || null,
      preferred_location: payload.preferredLocation || null,
      notes: payload.notes || null,
      source: "propspot_plinth",
    };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lead_requests`, {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Supabase lead insert failed");
    currentDataSource = "supabase";
    return { ok: true, mode: "supabase" };
  }

  if (IS_GITHUB_PAGES) {
    const response = await fetch("https://formsubmit.co/ajax/madhav.prakash@propertyspotters.in", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: (() => {
        const form = new FormData();
        form.append("name", payload.name || "");
        form.append("phone", payload.phone || "");
        form.append("email", payload.email || "");
        form.append("budget", payload.budget || "");
        form.append("timeline", payload.timeline || "");
        form.append("preferredLocation", payload.preferredLocation || "");
        form.append("notes", payload.notes || "");
        form.append("projectCode", payload.projectCode || "");
        form.append("projectName", payload.projectName || "");
        form.append("_subject", `New PropSpot Plinth lead for ${payload.projectName}`);
        form.append("_captcha", "false");
        form.append("_template", "table");
        return form;
      })(),
    });
    if (!response.ok) throw new Error("Lead request failed");
    currentDataSource = "formsubmit";
    return { ok: true, mode: "formsubmit" };
  }

  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Lead request failed");
  currentDataSource = "local-json";
  return { ok: true, mode: "local-api" };
}

export async function loadProjects() {
  if (hasSupabaseConfig()) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=*&published=eq.true&order=name.asc`,
        { headers: supabaseHeaders() }
      );
      if (response.ok) {
        const rows = await response.json();
        currentDataSource = "supabase";
        let localBySlug = new Map();
        let localByCode = new Map();
        try {
          const localProjects = await loadLocalProjects();
          localBySlug = new Map(localProjects.map((project) => [project.slug, project]));
          localByCode = new Map(localProjects.map((project) => [project.code, project]));
        } catch (error) {
          console.warn("Local enrichment merge skipped.", error);
        }
        const supabaseSlugs = new Set(rows.map((r) => r.slug));
        const supabaseCodes = new Set(rows.map((r) => r.code));
        const localOnlyProjects = [...localBySlug.values()].filter(
          (p) => !supabaseSlugs.has(p.slug) && !supabaseCodes.has(p.code)
        );
        return [
          ...rows
            .map(mapSupabaseProject)
            .map((project) =>
              mergeProjectEnrichment(
                project,
                localByCode.get(project.code) || localBySlug.get(project.slug)
              )
            ),
          ...localOnlyProjects,
        ].filter((project) => project && project.published !== false);
      }
    } catch (error) {
      console.warn("Supabase project load failed, falling back to local JSON.", error);
    }
  }

  return loadLocalProjects();
}

export function formatCr(value) {
  if (!value) return "Price on request";
  return `Rs ${Number(value).toFixed(2)} Cr`;
}

export function formatSqft(value, suffix = true) {
  if (!value) return "Price on request";
  const formatted = `Rs ${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
  return suffix ? `${formatted}/sqft` : formatted;
}

export function getBuilderGrade(project) {
  const developer = String(project.developer || "").toLowerCase();
  const match = Object.keys(BUILDER_GRADES).find((name) => developer.includes(name));
  return match ? BUILDER_GRADES[match] : "B";
}

export function getBuilderGradeScore(project) {
  if (Number.isFinite(project?.builderIntelligence?.financialStressScore)) {
    return Number(project.builderIntelligence.financialStressScore);
  }
  const grade = getBuilderGrade(project);
  if (grade === "A+") return 9.0;
  if (grade === "A") return 8.4;
  if (grade === "B") return 8.0;
  return 7.2;
}

export function getMedianMicroMarketPrice(projects, corridor) {
  const prices = projects
    .filter((project) => project.corridor === corridor && project.priceSqft)
    .map((project) => project.priceSqft)
    .sort((a, b) => a - b);
  if (!prices.length) return 0;
  const midpoint = Math.floor(prices.length / 2);
  if (prices.length % 2) return prices[midpoint];
  return Math.round((prices[midpoint - 1] + prices[midpoint]) / 2);
}

export function getLocationScore(project) {
  const numeric = Number(String(project.locationIntel?.score || "").split("/")[0]);
  if (Number.isFinite(numeric) && numeric > 0) return numeric > 10 ? Math.min(10, numeric / 10) : numeric;
  const text = [
    ...normalizeLocationRows(project.locationIntel?.connectivity),
    ...normalizeLocationRows(project.locationIntel?.social),
    ...normalizeLocationRows(project.locationIntel?.infra),
    ...normalizeLocationRows(project.locationIntel?.risks),
  ]
    .map((row) => row.join(" "))
    .join(" ");
  if (!text.trim()) return 8;
  let score = 8;
  ["Operational", "High Upside", "18 min", "12 min", "Improving"].forEach((term) => {
    if (text.includes(term)) score += 0.18;
  });
  ["Watch", "High", "Developing"].forEach((term) => {
    if (text.includes(term)) score -= 0.15;
  });
  return Math.max(7.2, Math.min(8.9, Number(score.toFixed(1))));
}

function normalizeLocationRows(value) {
  if (Array.isArray(value)) {
    return value.map((row) => (Array.isArray(row) ? row : ["Current view", String(row || "")])).filter((row) => row.some(Boolean));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, rowValue]) => [key, String(rowValue || "")]);
  }
  if (typeof value === "string" && value.trim() && value !== "Data pending") {
    return [["Current view", value]];
  }
  return [];
}

export function getFairEntry(project) {
  const livePrice = project.priceSqft || project.reraDetails?.currentPrice || project.reraDetails?.launchPrice || 0;
  if (!livePrice) return { low: 0, high: 0 };
  const high = Math.round(livePrice);
  const low = Math.round(livePrice * 0.98);
  return { low, high };
}

export function getPropSpotScore(project, projects) {
  const locationScore = getLocationScore(project) * 3.2;
  const builderScore = getBuilderGradeScore(project) * 2.8;
  const marketMedian = getMedianMicroMarketPrice(projects, project.corridor);
  let priceScore = 24;
  if (project.priceSqft && marketMedian) {
    const premium = ((project.priceSqft - marketMedian) / marketMedian) * 100;
    priceScore = Math.max(16, Math.min(30, 24 - premium * 0.9));
  }
  const total = Math.max(58, Math.min(95, Math.round(locationScore + builderScore + priceScore)));
  let label = "Worth a look";
  if (total >= 84) label = "Strong shortlist";
  else if (total >= 76) label = "Good shortlist";
  else if (total >= 68) label = "Compare before deciding";
  else label = "Needs more diligence";
  return { total, label, marketMedian };
}

export function getProjectBySlug(projects, slug) {
  return projects.find((project) => project.slug === slug || project.legacySlug === slug) || null;
}

export function getFilteredProjects(projects, filters = {}) {
  const term = String(filters.term || "").trim().toLowerCase();
  return projects.filter((project) => {
    const matchesTerm =
      !term ||
      [project.name, project.developer, project.corridor, project.sector, project.location]
        .join(" ")
        .toLowerCase()
        .includes(term);
    const matchesBudget =
      filters.budget === "all" ||
      !filters.budget ||
      (filters.budget === "under2" && project.priceCr < 2) ||
      (filters.budget === "2to4" && project.priceCr >= 2 && project.priceCr <= 4) ||
      (filters.budget === "above4" && project.priceCr > 4);
    const matchesStage = !filters.stage || filters.stage === "all" || project.stage === filters.stage;
    const matchesCorridor = !filters.corridor || filters.corridor === "all" || project.corridor === filters.corridor;
    return matchesTerm && matchesBudget && matchesStage && matchesCorridor;
  });
}

export function uniqueCorridors(projects) {
  return [...new Set(projects.map((project) => project.corridor).filter(Boolean))].sort();
}

export function getWhatsappUrl(project) {
  const message = encodeURIComponent(`Hi, I'm interested in ${project.name} on PropSpot Plinth. Please share more details.`);
  return `https://wa.me/919873886178?text=${message}`;
}

export function calculateEmi(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;
  if (!monthlyRate) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}
