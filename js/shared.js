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

export async function loadProjects() {
  const response = await fetch("/data/projects-data.json");
  if (!response.ok) throw new Error("Unable to load project data");
  const projects = await response.json();
  return projects.filter((project) => project && project.published !== false);
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
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const text = [
    ...(project.locationIntel?.connectivity || []),
    ...(project.locationIntel?.social || []),
    ...(project.locationIntel?.infra || []),
    ...(project.locationIntel?.risks || []),
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

export function getFairEntry(project) {
  if (!project.priceSqft) return { low: 0, high: 0 };
  const high = Math.round(project.priceSqft);
  const low = Math.round(project.priceSqft * 0.98);
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
  return projects.find((project) => project.slug === slug) || null;
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
