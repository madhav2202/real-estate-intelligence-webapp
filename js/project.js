import {
  loadProjects,
  getProjectBySlug,
  getFairEntry,
  getPropSpotScore,
  formatCr,
  formatSqft,
  getBuilderGrade,
  getBuilderGradeScore,
  getLocationScore,
  getWhatsappUrl,
  calculateEmi,
  getDataSourceMeta,
  submitLead,
  commutePageUrl,
  loadProjectShortlist,
  saveProjectShortlist,
} from "./shared.js?v=20260522a";

const formatter = new Intl.NumberFormat("en-IN");

const elements = {
  projectImage: document.querySelector("#projectImage"),
  projectCode: document.querySelector("#projectCode"),
  projectName: document.querySelector("#projectName"),
  projectMeta: document.querySelector("#projectMeta"),
  projectWhatsapp: document.querySelector("#projectWhatsapp"),
  projectCommute: document.querySelector("#projectCommute"),
  projectCommuteNav: document.querySelector("#projectCommuteNav"),
  projectShortlistButton: document.querySelector("#projectShortlistButton"),
  builderPrice: document.querySelector("#builderPrice"),
  builderPriceSubtext: document.querySelector("#builderPriceSubtext"),
  heroAbsorption: document.querySelector("#heroAbsorption"),
  heroAbsorptionSubtext: document.querySelector("#heroAbsorptionSubtext"),
  heroUnits: document.querySelector("#heroUnits"),
  heroUnitsSubtext: document.querySelector("#heroUnitsSubtext"),
  absorptionQuarter: document.querySelector("#absorptionQuarter"),
  absorptionHeadline: document.querySelector("#absorptionHeadline"),
  absorptionNarrative: document.querySelector("#absorptionNarrative"),
  absorptionFill: document.querySelector("#absorptionFill"),
  absorptionOrb: document.querySelector("#absorptionOrb"),
  absorptionOrbValue: document.querySelector("#absorptionOrbValue"),
  absorptionSold: document.querySelector("#absorptionSold"),
  absorptionAvailable: document.querySelector("#absorptionAvailable"),
  absorptionTotal: document.querySelector("#absorptionTotal"),
  priceContextSignal: document.querySelector("#priceContextSignal"),
  priceContextNarrative: document.querySelector("#priceContextNarrative"),
  priceContextProject: document.querySelector("#priceContextProject"),
  priceContextOverall: document.querySelector("#priceContextOverall"),
  priceContextMicroLabel: document.querySelector("#priceContextMicroLabel"),
  priceContextMicro: document.querySelector("#priceContextMicro"),
  priceContextBars: document.querySelector("#priceContextBars"),
  projectStage: document.querySelector("#projectStage"),
  snapshotGrid: document.querySelector("#snapshotGrid"),
  registryGrid: document.querySelector("#registryGrid"),
  sourceLinkRow: document.querySelector("#sourceLinkRow"),
  downPaymentInput: document.querySelector("#downPaymentInput"),
  interestRateInput: document.querySelector("#interestRateInput"),
  tenureInput: document.querySelector("#tenureInput"),
  downPaymentRange: document.querySelector("#downPaymentRange"),
  interestRateRange: document.querySelector("#interestRateRange"),
  tenureRange: document.querySelector("#tenureRange"),
  emiValue: document.querySelector("#emiValue"),
  emiNote: document.querySelector("#emiNote"),
  emiPrincipal: document.querySelector("#emiPrincipal"),
  emiDownPaymentBar: document.querySelector("#emiDownPaymentBar"),
  emiLoanBar: document.querySelector("#emiLoanBar"),
  emiDownPaymentValue: document.querySelector("#emiDownPaymentValue"),
  emiLoanValue: document.querySelector("#emiLoanValue"),
  emiMetrics: document.querySelector("#emiMetrics"),
  locationScore: document.querySelector("#locationScore"),
  locationIntelLink: document.querySelector("#locationIntelLink"),
  locationHeroScore: document.querySelector("#locationHeroScore"),
  locationHeadline: document.querySelector("#locationHeadline"),
  locationSubline: document.querySelector("#locationSubline"),
  locationSpectrum: document.querySelector("#locationSpectrum"),
  commuteValue: document.querySelector("#commuteValue"),
  maturityValue: document.querySelector("#maturityValue"),
  connectivityList: document.querySelector("#connectivityList"),
  socialList: document.querySelector("#socialList"),
  infraList: document.querySelector("#infraList"),
  riskList: document.querySelector("#riskList"),
  trackerSignal: document.querySelector("#trackerSignal"),
  trackerList: document.querySelector("#trackerList"),
  trackerSummary: document.querySelector("#trackerSummary"),
  trackerChips: document.querySelector("#trackerChips"),
  builderGrade: document.querySelector("#builderGrade"),
  builderGradeCopy: document.querySelector("#builderGradeCopy"),
  builderRiskScore: document.querySelector("#builderRiskScore"),
  builderRiskList: document.querySelector("#builderRiskList"),
  builderRiskSummary: document.querySelector("#builderRiskSummary"),
  builderRiskChips: document.querySelector("#builderRiskChips"),
  builderFinanceGrid: document.querySelector("#builderFinanceGrid"),
  builderSourceRow: document.querySelector("#builderSourceRow"),
  inventoryPressure: document.querySelector("#inventoryPressure"),
  paymentInventoryList: document.querySelector("#paymentInventoryList"),
  paymentSummary: document.querySelector("#paymentSummary"),
  paymentChips: document.querySelector("#paymentChips"),
  compareCount: document.querySelector("#compareCount"),
  compareSelect1: document.querySelector("#compareSelect1"),
  compareSelect2: document.querySelector("#compareSelect2"),
  compareSelect3: document.querySelector("#compareSelect3"),
  compareTable: document.querySelector("#compareTable"),
  analystAnswer: document.querySelector("#analystAnswer"),
  analystForm: document.querySelector("#analystForm"),
  analystQuestion: document.querySelector("#analystQuestion"),
  projectBrief: document.querySelector("#projectBrief"),
  copyBriefButton: document.querySelector("#copyBriefButton"),
  leadForm: document.querySelector("#leadForm"),
  leadStatus: document.querySelector("#leadStatus"),
  sidebarWhatsapp: document.querySelector("#sidebarWhatsapp"),
  dataSourceBadge: document.querySelector("#dataSourceBadge"),
};

const state = {
  projects: [],
  project: null,
  compareSlugs: [null, null, null],
};

function getSlugFromPath() {
  const querySlug = new URLSearchParams(window.location.search).get("slug");
  if (querySlug) return querySlug;
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "projects" && parts[1]) return parts[1];
  return null;
}

function getLocationCommute(project) {
  const value = project.locationIntel?.commute;
  if (value && value !== "Data pending") return value;
  const text = normalizeRows(project.locationIntel?.connectivity).map((row) => row.join(" ")).join(" ");
  if (!text.trim()) return "Good";
  if (/8 min|10 min|12 min|18 min/.test(text)) return "Strong";
  if (/28 min|35 min|45 min/.test(text)) return "Balanced";
  return "Good";
}

function getLocationMaturity(project) {
  const value = project.locationIntel?.livability;
  if (value && value !== "Data pending") return value;
  const text = [
    ...normalizeRows(project.locationIntel?.social),
    ...normalizeRows(project.locationIntel?.infra),
    ...normalizeRows(project.locationIntel?.risks),
  ]
    .map((row) => row.join(" "))
    .join(" ");
  if (!text.trim()) return "Good";
  if (text.includes("Improving") || text.includes("Operational")) return "Maturing";
  if (text.includes("Developing") || text.includes("Watch")) return "Emerging";
  return "Good";
}

function scoreLocationBucket(rows, positiveTerms, cautionTerms, base = 8) {
  const text = normalizeRows(rows).map((row) => row.join(" ")).join(" ").toLowerCase();
  let score = base;
  positiveTerms.forEach((term) => {
    if (text.includes(term)) score += 0.35;
  });
  cautionTerms.forEach((term) => {
    if (text.includes(term)) score -= 0.35;
  });
  return Math.max(6.2, Math.min(9.4, Number(score.toFixed(1))));
}

function getLocationSpectrum(project) {
  return [
    [
      "Connectivity",
      scoreLocationBucket(project.locationIntel?.connectivity, ["airport", "metro", "operational"], ["35 min", "45 min"], 8.2),
    ],
    [
      "Social infra",
      scoreLocationBucket(project.locationIntel?.social, ["hospital", "school", "mall"], ["limited", "building"], 8.0),
    ],
    [
      "Infra upside",
      scoreLocationBucket(project.locationIntel?.infra, ["upside", "operational"], ["watch"], 8.1),
    ],
    [
      "Risk drag",
      10 - scoreLocationBucket(project.locationIntel?.risks, ["improving"], ["high", "dust", "traffic"], 2.2),
    ],
  ].map(([label, value]) => [label, Number(value.toFixed(1))]);
}

function getApprovalScore(project) {
  return 8;
}

function getCanonicalPriceSqft(project) {
  return project.priceSqft || project.reraDetails?.currentPrice || project.reraDetails?.launchPrice || 0;
}

function median(values) {
  const nums = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : Math.round((nums[mid - 1] + nums[mid]) / 2);
}

function getProjectPrices(projects) {
  return projects.map((project) => getCanonicalPriceSqft(project)).filter((value) => Number.isFinite(value) && value > 0);
}

function sameTextValue(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function getMicroMarketProjects(project, projects) {
  const peers = projects.filter((candidate) => candidate.slug !== project.slug);
  const corridorPeers = peers.filter((candidate) => project.corridor && sameTextValue(candidate.corridor, project.corridor));
  if (corridorPeers.length >= 3) return corridorPeers;

  const sectorPeers = peers.filter((candidate) => project.sector && sameTextValue(candidate.sector, project.sector));
  if (sectorPeers.length >= 3) return sectorPeers;

  const locationKey = String(project.location || "").trim().toLowerCase();
  const locationPeers = peers.filter((candidate) => locationKey && String(candidate.location || "").toLowerCase().includes(locationKey));
  return locationPeers.length >= 3 ? locationPeers : corridorPeers.concat(sectorPeers, locationPeers);
}

function getPriceContext(project, projects) {
  const projectPrice = getCanonicalPriceSqft(project);
  const overallMedian = median(getProjectPrices(projects));
  const microPeers = getMicroMarketProjects(project, projects);
  const microMedian = median(getProjectPrices(microPeers)) || overallMedian;
  const microLabel = project.corridor || project.sector || project.location || "Micro-market";
  return { projectPrice, overallMedian, microMedian, microLabel };
}

function getPriceDelta(value, baseline) {
  if (!value || !baseline) return null;
  return ((value - baseline) / baseline) * 100;
}

function formatDelta(delta) {
  if (!Number.isFinite(delta)) return "Benchmark pending";
  if (Math.abs(delta) < 1) return "In line";
  return `${delta > 0 ? "+" : "-"}${Math.abs(delta).toFixed(1)}%`;
}

function getPricePositionText(delta) {
  if (!Number.isFinite(delta)) return "Market benchmark pending";
  if (Math.abs(delta) < 1) return "In line with micro-market";
  return delta > 0 ? "Above micro-market" : "Below micro-market";
}

function renderPriceContext(project, projects) {
  const context = getPriceContext(project, projects);
  const { projectPrice, overallMedian, microMedian, microLabel } = context;
  const microDelta = getPriceDelta(projectPrice, microMedian);
  const marketDelta = getPriceDelta(projectPrice, overallMedian);
  const maxValue = Math.max(projectPrice, overallMedian, microMedian, 1);
  const bars = [
    ["Project price", projectPrice, "project"],
    ["Median market price", overallMedian, "overall"],
    [`${microLabel} median`, microMedian, "micro"],
  ];

  elements.priceContextProject.textContent = projectPrice ? formatSqft(projectPrice) : "Price on request";
  elements.priceContextOverall.textContent = overallMedian ? formatSqft(overallMedian) : "Data pending";
  elements.priceContextMicroLabel.textContent = `${microLabel} Price`;
  elements.priceContextMicro.textContent = microMedian ? formatSqft(microMedian) : "Data pending";
  elements.priceContextSignal.textContent = getPricePositionText(microDelta);
  elements.priceContextNarrative.textContent = projectPrice
    ? `${project.name} is ${formatDelta(microDelta).toLowerCase()} versus the ${microLabel} median and ${formatDelta(marketDelta).toLowerCase()} versus the overall tracked Gurgaon market median.`
    : `Project pricing is still pending; the page will compare it with the ${microLabel} median and Gurgaon market median once a tracked price is available.`;
  elements.priceContextBars.innerHTML = bars
    .map(([label, value, tone]) => {
      const width = Math.max(6, Math.min(100, (value / maxValue) * 100));
      return `
        <div class="price-context-bar-row price-context-bar-row--${tone}">
          <span>${label}</span>
          <div class="price-context-track"><i style="width:${width}%"></i></div>
          <strong>${value ? formatSqft(value, false) : "--"}</strong>
        </div>
      `;
    })
    .join("");
}

function getBestFit(project) {
  if (project.bestFor && project.bestFor !== "Data pending") return project.bestFor;
  if ((project.priceCr || 0) >= 5) return "End-use + capital preservation";
  if (project.stage === "New Launch") return "Investment + early entry";
  if (project.stage === "Under Construction") return "End-use + long-horizon";
  return "Balanced shortlist";
}

function getDisclosureFallback(field) {
  const map = {
    units: "Unit count not publicly matched yet",
    land: "Land disclosure not publicly matched yet",
    towers: "Tower count not publicly matched yet",
    floors: "Floor count not publicly matched yet",
    sizes: "Mixed unit range",
  };
  return map[field] || "Not publicly matched yet";
}

function getDeliveryScore(project) {
  const text = (project.tracker?.rows || []).map((row) => row[1]).join(" ");
  if (text.includes("Data pending")) return 8;
  if (text.includes("6-9")) return 5.9;
  if (text.includes("3-6")) return 6.9;
  if (text.includes("0-3")) return 8.2;
  return 7.1;
}

function getDisplayedBuilderRiskScore(project) {
  if (Number.isFinite(project.builderIntelligence?.financialStressScore)) {
    return Number(project.builderIntelligence.financialStressScore);
  }
  if (hasBuilderRiskData(project)) return getBuilderGradeScore(project);
  return 8.0;
}

function getAbsorptionScore(project) {
  if (!project.launched || !project.sold) return 8;
  const ratio = project.sold / project.launched;
  return Math.max(4.5, Math.min(9.4, ratio * 10.2));
}

function getInventoryPressure(project) {
  if (!project.launched) return project.stage === "New Launch" ? "Release visibility early" : "Inventory visibility limited";
  const unsold = project.launched - project.sold;
  const ratio = unsold / project.launched;
  if (ratio > 0.45) return "High pressure";
  if (ratio > 0.22) return "Medium pressure";
  return "Low pressure";
}

function getSupplyPressure(project) {
  const text = normalizeRows(project.locationIntel?.risks).map((row) => row.join(" ")).join(" ");
  if (text.includes("Competing supply")) return "High";
  if (text.includes("Watch")) return "Medium";
  return "Balanced";
}

function normalizeRows(value) {
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

function hasBuilderRiskData(project) {
  return (project.developerRisk?.rows || []).some((row) => !String(row[1] || "").includes("Data pending"));
}

function getBuilderRiskRows(project) {
  if (hasBuilderRiskData(project)) return project.developerRisk.rows;
  return [
    ["Current view", "Proxy-based read"],
    ["Builder bucket", `${getBuilderGrade(project)} grade`],
  ];
}

function getTrackerRows(project) {
  if (project.tracker?.rows?.length && !project.tracker.rows.every((row) => String(row[1] || "").includes("Data pending"))) {
    return project.tracker.rows;
  }
  const fallbackStage = project.stage === "New Launch" ? "Launch documentation in progress" : project.stage === "Under Construction" ? "Construction underway" : "Project live";
  return [
    ["Current stage", fallbackStage],
    ["Launch progress", project.stage === "New Launch" ? "Early visibility" : "On track"],
  ];
}

function getAbsorptionLabel(project) {
  if (project.absorption && project.absorption !== "Data pending") return project.absorption;
  if (project.stage === "New Launch") return "Early bookings stage";
  if (project.stage === "Under Construction") return "Mid-cycle visibility";
  return "Visibility building";
}

function getAbsorptionPercent(project) {
  const raw = project.latestAbsorption?.cumulativeAbsorptionPct || project.absorption;
  const parsed = Number(String(raw || "").replace("%", "").trim());
  if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, parsed));
  if (project.launched && project.sold) return Math.max(0, Math.min(100, (project.sold / project.launched) * 100));
  return null;
}

function absorptionTone(percent) {
  if (!Number.isFinite(percent)) return "Data visibility still building";
  if (percent >= 80) return "High buyer uptake";
  if (percent >= 55) return "Healthy absorption";
  if (percent >= 25) return "Steady absorption";
  return "Early absorption";
}

function renderAbsorptionDashboard(project, rera) {
  const percent = getAbsorptionPercent(project);
  const totalUnits = rera.totalUnits || project.units || project.launched || 0;
  const soldUnits = project.latestAbsorption?.cumulativeSold || project.sold || rera.unitsSold || 0;
  const availableUnits = totalUnits && Number.isFinite(soldUnits) ? Math.max(totalUnits - soldUnits, 0) : rera.unitsAvailable;
  const pctText = Number.isFinite(percent) ? `${percent.toFixed(2)}%` : "Data pending";
  const width = Number.isFinite(percent) ? `${percent}%` : "0%";
  const quarterText = project.latestAbsorption?.quarterLabel
    ? `${project.latestAbsorption.quarterLabel} ${project.latestAbsorption.quarterEndDate || ""}`.trim()
    : "Latest quarter pending";

  elements.absorptionQuarter.textContent = quarterText;
  elements.absorptionHeadline.textContent = pctText;
  elements.absorptionOrbValue.textContent = Number.isFinite(percent) ? `${Math.round(percent)}%` : "--";
  elements.absorptionFill.style.width = width;
  elements.absorptionOrb.style.setProperty("--absorption-pct", width);
  elements.absorptionSold.textContent = Number.isFinite(soldUnits) ? formatter.format(soldUnits) : "--";
  elements.absorptionAvailable.textContent = Number.isFinite(availableUnits) ? formatter.format(availableUnits) : "--";
  elements.absorptionTotal.textContent = totalUnits ? formatter.format(totalUnits) : "--";
  elements.absorptionNarrative.textContent = Number.isFinite(percent) && totalUnits
    ? `${absorptionTone(percent)}: ${formatter.format(soldUnits)} of ${formatter.format(totalUnits)} units are absorbed as per the latest matched quarterly data.`
    : "Absorption percentage will show here once this project has a verified quarterly RERA match.";
}

function getScoreBreakdown(project, projects) {
  const score = getPropSpotScore(project, projects);
  const marketMedian = score.marketMedian;
  const livePrice = getCanonicalPriceSqft(project);
  const priceDiff = livePrice && marketMedian ? ((livePrice - marketMedian) / marketMedian) * 100 : 0;
  const priceAttractiveness = Math.max(4.5, Math.min(9.5, 8.1 - priceDiff * 0.12));
  return [
    ["Price attractiveness", priceAttractiveness],
    ["Builder risk", getDisplayedBuilderRiskScore(project)],
    ["Approval readiness", getApprovalScore(project)],
    ["Location maturity", getLocationScore(project)],
    ["Absorption", getAbsorptionScore(project)],
    ["Delivery confidence", getDeliveryScore(project)],
  ];
}

function getEntrySignal(project, projects) {
  const fair = getFairEntry(project);
  const livePrice = getCanonicalPriceSqft(project);
  if (!livePrice || !fair.low) return "Builder price pending";
  if (livePrice > fair.high) return "Avoid at ask";
  if (livePrice < fair.low) return "Attractive entry";
  return "Fair entry";
}

function renderSimpleList(target, rows) {
  target.innerHTML = rows
    .map(([label, value]) => `<li><span>${label}</span><strong>${value || "Not surfaced yet"}</strong></li>`)
    .join("");
}

function renderChipRow(target, chips) {
  target.innerHTML = chips
    .filter(Boolean)
    .map((chip) => `<span class="info-chip${chip.soft ? " info-chip--soft" : ""}">${chip.label}</span>`)
    .join("");
}

function renderMiniStatGrid(target, items) {
  target.innerHTML = items
    .filter((item) => item && item.value)
    .map(
      (item) => `
        <div class="finance-stat">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          ${item.note ? `<em>${item.note}</em>` : ""}
        </div>
      `,
    )
    .join("");
}

function renderRegistryGrid(target, items) {
  target.innerHTML = items
    .filter((item) => item && item.value)
    .map(
      (item) => `
        <div class="registry-item">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          ${item.note ? `<em>${item.note}</em>` : ""}
        </div>
      `,
    )
    .join("");
}

function renderSourceLinks(target, links) {
  target.innerHTML = links
    .filter((link) => link?.href)
    .map((link) => `<a class="source-link" href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`)
    .join("");
}

function renderPriceVisual(project, score, fair) {
  const builder = getCanonicalPriceSqft(project);
  const fairLow = fair.low || 0;
  const median = score.marketMedian || 0;
  const points = [
    { label: "Fair floor", value: fairLow, cls: "fair", position: "bottom", note: "Current working entry floor" },
    { label: "Builder ask", value: builder, cls: "builder", position: "top", note: "Tracked live project price" },
  ];
  if (median) {
    points.push({ label: "Corridor median", value: median, cls: "median", position: "bottom", note: "Current micro-market reference" });
  }

  const values = points.map((point) => point.value).filter(Boolean);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, Math.round(maxValue * 0.08), 1000);
  const rangeStart = Math.max(0, minValue - Math.round(spread * 0.35));
  const rangeEnd = maxValue + Math.round(spread * 0.35);
  const toPercent = (value) => ((value - rangeStart) / Math.max(rangeEnd - rangeStart, 1)) * 100;
  const fillLeft = toPercent(fairLow);
  const fillRight = toPercent(builder);

  return `
    <div class="price-visual">
      <div class="price-scale">
        <div class="price-scale-axis">
          <div class="price-scale-fill" style="left:${Math.min(fillLeft, fillRight)}%; width:${Math.abs(fillRight - fillLeft)}%;"></div>
          ${points
            .map((point) => {
              const pct = toPercent(point.value);
              return `
                <div class="price-scale-marker price-scale-marker--${point.cls}" style="left:${pct}%;">
                  <div class="price-scale-label price-scale-label--${point.position}">
                    <span>${point.label}</span>
                    <strong>${formatSqft(point.value, false)}</strong>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
      <div class="price-metric-grid">
        ${points
          .map(
            (point) => `
              <div class="price-metric">
                <span>${point.label}</span>
                <strong>${formatSqft(point.value)}</strong>
                <em>${point.note}</em>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function getLocationNarrative(project) {
  const score = getLocationScore(project);
  const commute = getLocationCommute(project);
  const maturity = getLocationMaturity(project);
  if (score >= 8.5) {
    return {
      headline: "Location already reads like a serious shortlist.",
      subline: `${project.corridor} is already showing a stronger mix of commute convenience, social usability, and corridor upside than the median launch catchment.`,
    };
  }
  if (score >= 7.8) {
    return {
      headline: "Location is compelling, with a few things still maturing.",
      subline: `${commute} connectivity and ${maturity.toLowerCase()} livability make this a practical end-user location, even if the broader corridor story is still filling out.`,
    };
  }
  return {
    headline: "Location has upside, but still needs context.",
    subline: `The current on-ground read is usable, though this remains more corridor-driven than fully matured at the project micro-location level.`,
  };
}

function getBuilderRiskSummary(project) {
  if (project.builderIntelligence?.summary) return project.builderIntelligence.summary;
  const grade = getBuilderGrade(project);
  const scoreText = hasBuilderRiskData(project) ? `${getBuilderGradeScore(project).toFixed(1)}/10` : "8.0/10";
  const tone =
    grade === "A+"
      ? "top-tier brand confidence with stronger execution comfort"
      : grade === "A"
        ? "established execution confidence and better buyer trust than the median launch set"
        : grade === "B"
          ? "credible execution, but still worth comparing carefully on delivery updates and price discipline"
          : "more price-sensitive execution confidence, so ongoing launch updates matter more";
  return `${project.developer} currently sits in the ${grade} bucket and reads at ${scoreText}. For ${project.name}, that points to ${tone}.`;
}

function getBuilderFinanceStats(project) {
  const metrics = project.builderIntelligence?.metrics || {};
  const listed = project.builderIntelligence?.listed;
  const fallback = "Not surfaced in current market summary";
  if (listed) {
    return [
      { label: "Market cap", value: metrics.marketCap || fallback, note: "Current public-market scale" },
      { label: "Revenue", value: metrics.revenue || fallback, note: "Latest summarized top line" },
      { label: "Profit", value: metrics.profit || fallback, note: "Latest summarized profit line" },
      {
        label: "Promoter holding",
        value: metrics.promoterHolding || fallback,
        note: "Ownership confidence proxy",
      },
    ];
  }
  return [
    { label: "Market status", value: "Private / unlisted", note: "No direct public-market summary available" },
    { label: "Read type", value: "Proxy based", note: "Using builder bucket and project footprint" },
    { label: "Builder bucket", value: `${getBuilderGrade(project)} grade`, note: "Current Plinth builder bucket" },
  ];
}

function getRegistryFacts(project) {
  const rera = project.reraDetails || {};
  const canonicalPrice = getCanonicalPriceSqft(project);
  return [
    { label: "RERA number", value: project.reraNumber || null, note: "Project registration reference" },
    { label: "RERA possession", value: project.reraPossession || null, note: "Current registered handover timing" },
    {
      label: "Tracked price",
      value: canonicalPrice ? formatSqft(canonicalPrice) : null,
      note: "Canonical project price used across Plinth",
    },
    { label: "Configurations", value: rera.configurations || null, note: "Current unit mix" },
    { label: "Construction start", value: rera.startDate || null, note: "RERA-linked start date" },
    { label: "Project type", value: rera.projectType || null, note: "Matched registration stage" },
  ];
}

function getTrackerSummary(project) {
  const trackerSignal =
    project.tracker?.signal && project.tracker.signal !== "Data pending"
      ? project.tracker.signal
      : project.stage === "New Launch"
        ? "Launch phase"
        : project.stage === "Under Construction"
          ? "Construction underway"
          : "Project live";
  const inventoryNote = project.launched && project.sold ? `${project.sold} sold out of ${project.launched} launched` : "inventory still early in the current dataset";
  return `${project.name} is currently in the ${project.stage.toLowerCase()} stage with possession marked for ${project.possession}. The live tracker signal is ${trackerSignal}, and the launch picture currently shows ${inventoryNote}.`;
}

function getPaymentSummary(project) {
  const paymentPlan =
    (project.approvals || []).find((row) => row[0] === "Payment plan")?.[1] ||
    (project.stage === "New Launch" ? "Builder plan not publicly disclosed yet" : "Builder-specific plan still being verified");
  const entrySignal = getEntrySignal(project, state.projects).toLowerCase();
  const unsold = project.launched ? `${Math.max(project.launched - project.sold, 0)} units visible in the released set` : "release visibility still early";
  return `Current pricing for ${project.name} is reading as ${entrySignal}. Payment visibility is ${paymentPlan.toLowerCase()}, absorption reads ${getAbsorptionLabel(project).toLowerCase()}, and there are ${unsold}.`;
}

function renderCompare() {
  const options = state.projects.map((project) => `<option value="${project.slug}">${project.name}</option>`).join("");
  [elements.compareSelect1, elements.compareSelect2, elements.compareSelect3].forEach((select, index) => {
    select.innerHTML = `<option value="">Select project</option>${options}`;
    if (state.compareSlugs[index]) select.value = state.compareSlugs[index];
  });

  const selected = state.compareSlugs
    .map((slug) => state.projects.find((project) => project.slug === slug))
    .filter(Boolean);
  elements.compareCount.textContent = `${selected.length} selected`;
  elements.compareTable.innerHTML = selected
    .map((project) => {
      return `
        <tr>
          <td>${project.name}</td>
          <td>${formatCr(project.priceCr)}</td>
          <td>${formatSqft(getCanonicalPriceSqft(project))}</td>
          <td>${getAbsorptionLabel(project)}</td>
          <td>${getLocationScore(project).toFixed(1)}/10</td>
          <td>${getBuilderGrade(project)} grade</td>
        </tr>
      `;
    })
    .join("");
}

function getAnalystResponse(project, question) {
  const lower = question.toLowerCase();
  if (lower.includes("approval")) {
    return `Approvals are not being shown on the live page right now because the matched approval records are still being expanded. For the current live view, approval readiness is being held at 8/10 until the deeper approval layer is sourced project by project.`;
  }
  if (lower.includes("compare")) {
    return `${project.name} should mainly be compared on builder price, absorption, total units, builder grade, approval readiness, and location maturity rather than brochure-level positioning.`;
  }
  if (lower.includes("price") || lower.includes("entry")) {
    return `${project.name} is showing builder price at ${formatSqft(getCanonicalPriceSqft(project))}. The live page now uses one canonical tracked project price alongside absorption and registered project facts.`;
  }
  return `${project.name} currently shows ${getAbsorptionLabel(project).toLowerCase()} absorption, ${project.stage.toLowerCase()} stage, ${formatCr(project.priceCr)} ticket size, and ${getBuilderGrade(project)} grade builder context. The strongest current signals are absorption, builder quality, location maturity, and the registered project facts surfaced on this page.`;
}

function getProjectBrief(project) {
  const rera = project.reraDetails || {};
  return [
    `${project.name} | ${project.location}`,
    `Builder Current Sale Price: ${formatSqft(getCanonicalPriceSqft(project))}`,
    `Absorption: ${getAbsorptionLabel(project)}`,
    `Total Units: ${rera.totalUnits ? formatter.format(rera.totalUnits) : project.units ? formatter.format(project.units) : "Data pending"}`,
    `Builder Grade: ${getBuilderGrade(project)}`,
    `Location Maturity: ${getLocationScore(project).toFixed(1)}/10 | Commute ${getLocationCommute(project)} | Maturity ${getLocationMaturity(project)}`,
    `Approval Readiness: ${getApprovalScore(project).toFixed(1)}/10`,
    `Registered Facts: ${project.reraNumber ? `RERA ${project.reraNumber}` : "RERA match partial"} | Possession ${project.reraPossession || project.possession}`,
    `Best Fit: ${getBestFit(project)}`,
  ].join("\n");
}

function renderProject() {
  const project = state.project;
  const rera = project.reraDetails || {};
  const marketGap = getCanonicalPriceSqft(project)
    ? "Canonical tracked project price"
    : "Builder price pending";

  document.title = `${project.name} | PropSpot Plinth`;
  elements.projectImage.src = project.image;
  elements.projectImage.alt = `${project.name} image`;
  elements.projectCode.textContent = project.code;
  elements.projectName.textContent = project.name;
  elements.projectMeta.textContent = `${project.developer} | ${project.location} | ${project.stage} | ${project.possession}`;
  elements.projectWhatsapp.href = getWhatsappUrl(project);
  elements.sidebarWhatsapp.href = getWhatsappUrl(project);
  elements.projectCommute.href = commutePageUrl(project.slug);
  elements.projectCommuteNav.href = commutePageUrl(project.slug);
  elements.locationIntelLink.href = commutePageUrl(project.slug);
  updateShortlistButton();

  elements.builderPrice.textContent = formatSqft(getCanonicalPriceSqft(project));
  elements.builderPriceSubtext.textContent = marketGap;
  elements.heroAbsorption.textContent = getAbsorptionLabel(project);
  elements.heroAbsorptionSubtext.textContent = project.latestAbsorption?.quarterLabel
    ? `${project.latestAbsorption.quarterLabel} ${project.latestAbsorption.quarterEndDate || ""}`.trim()
    : "Latest available data";
  const displayUnits = rera.totalUnits || project.units;
  elements.heroUnits.textContent = displayUnits ? formatter.format(displayUnits) : "Data pending";
  elements.heroUnitsSubtext.textContent = rera.totalFloors ? `${formatter.format(rera.totalFloors)} floors` : "Matched project record";
  renderAbsorptionDashboard(project, rera);
  renderPriceContext(project, state.projects);
  elements.projectStage.textContent = project.stage;

  const snapshotRows = [
    ["Ticket", formatCr(project.priceCr)],
    ["Stage", project.stage],
    ["Launched / Sold", project.launched ? `${project.sold}/${project.launched}` : "EOI"],
    ["Possession", project.possession],
    ["Builder Grade", getBuilderGrade(project)],
    ["Total Units", rera.totalUnits ? formatter.format(rera.totalUnits) : project.units ? formatter.format(project.units) : getDisclosureFallback("units")],
    ["Land Bank", rera.landArea || rera.totalLicensedLand || getDisclosureFallback("land")],
    ["Total Towers", rera.totalTowers ? formatter.format(rera.totalTowers) : getDisclosureFallback("towers")],
    ["Floors", rera.totalFloors ? formatter.format(rera.totalFloors) : getDisclosureFallback("floors")],
    ["Sizes", rera.sizes || (project.sqft ? `${formatter.format(project.sqft)} sq.ft. reference` : getDisclosureFallback("sizes"))],
    ["Best For", getBestFit(project)],
  ];
  elements.snapshotGrid.innerHTML = snapshotRows
    .map(([label, value]) => `<div class="snapshot-item"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
  renderRegistryGrid(elements.registryGrid, getRegistryFacts(project));
  renderSourceLinks(elements.sourceLinkRow, [
    project.reraDetails?.sourceUrl ? { label: "Open project source", href: project.reraDetails.sourceUrl } : null,
  ]);

  elements.locationScore.textContent = `${getLocationScore(project).toFixed(1)}/10`;
  elements.locationHeroScore.textContent = `${getLocationScore(project).toFixed(1)}`;
  const locationNarrative = getLocationNarrative(project);
  elements.locationHeadline.textContent = locationNarrative.headline;
  elements.locationSubline.textContent = locationNarrative.subline;
  elements.locationSpectrum.innerHTML = getLocationSpectrum(project)
    .map(([label, value]) => {
      const width = Math.max(16, Math.min(100, value * 10));
      return `
        <div class="location-spectrum-row">
          <span>${label}</span>
          <div class="location-spectrum-track"><i style="width:${width}%"></i></div>
          <strong>${value.toFixed(1)}</strong>
        </div>
      `;
    })
    .join("");
  elements.commuteValue.textContent = getLocationCommute(project);
  elements.maturityValue.textContent = getLocationMaturity(project);
  const connectivityRows = normalizeRows(project.locationIntel?.connectivity);
  const socialRows = normalizeRows(project.locationIntel?.social);
  const infraRows = normalizeRows(project.locationIntel?.infra);
  const riskRows = normalizeRows(project.locationIntel?.risks);
  renderSimpleList(elements.connectivityList, connectivityRows.length ? connectivityRows : [["Current view", "Corridor connected"], ["Metro / roads", "Daily movement viable"]]);
  renderSimpleList(elements.socialList, socialRows.length ? socialRows : [["Current view", "Livability catchment building"], ["Daily access", "Usable social spine"]]);
  renderSimpleList(elements.infraList, infraRows.length ? infraRows : [["Current view", "Infra story still positive"], ["Future upside", "Corridor watchlist positive"]]);
  renderSimpleList(elements.riskList, riskRows.length ? riskRows : [["Current view", "Execution risk manageable"], ["Area risk", "Still worth monitoring"]]);

  elements.builderGrade.textContent = `${getBuilderGrade(project)} grade`;
  elements.builderGradeCopy.textContent = `Current PropSpot builder bucket for ${project.developer}. This is a temporary live proxy until deeper builder diligence fields are added.`;
  elements.builderRiskScore.textContent = `${getDisplayedBuilderRiskScore(project).toFixed(1)}/10`;
  elements.builderRiskSummary.textContent = getBuilderRiskSummary(project);
  renderChipRow(elements.builderRiskChips, [
    { label: `${getBuilderGrade(project)} grade builder` },
    { label: `${getDisplayedBuilderRiskScore(project).toFixed(1)}/10 confidence` },
    { label: project.stage, soft: true },
  ]);
  renderMiniStatGrid(elements.builderFinanceGrid, getBuilderFinanceStats(project));
  renderSimpleList(elements.builderRiskList, getBuilderRiskRows(project));
  renderSourceLinks(elements.builderSourceRow, [
    project.builderIntelligence?.financeUrl ? { label: "Open market source", href: project.builderIntelligence.financeUrl } : null,
  ]);

  elements.trackerSignal.textContent =
    project.tracker?.signal && project.tracker.signal !== "Data pending"
      ? project.tracker.signal
      : project.stage === "New Launch"
        ? "Launch phase"
        : "Construction underway";
  elements.trackerSummary.textContent = getTrackerSummary(project);
  renderChipRow(elements.trackerChips, [
    { label: project.stage },
    { label: project.possession, soft: true },
    { label: elements.trackerSignal.textContent },
  ]);
  renderSimpleList(elements.trackerList, getTrackerRows(project));

  elements.inventoryPressure.textContent = getInventoryPressure(project);
  elements.paymentSummary.textContent = getPaymentSummary(project);
  renderChipRow(elements.paymentChips, [
    { label: getEntrySignal(project, state.projects) },
    { label: getAbsorptionLabel(project), soft: true },
    { label: getInventoryPressure(project) },
  ]);
  renderSimpleList(elements.paymentInventoryList, [
    ["Payment plan", (project.approvals || []).find((row) => row[0] === "Payment plan")?.[1] || (project.stage === "New Launch" ? "Plan not publicly disclosed yet" : "Builder-specific plan still being verified")],
    ["Inventory released", project.launched ? `${project.launched} launched` : "Release visibility still early"],
    ["Absorption", getAbsorptionLabel(project)],
    ["Available signal", project.launched ? `${project.launched - project.sold} unsold` : "Inventory disclosure still early"],
    ["Supply pressure", getSupplyPressure(project)],
  ]);

  const maxDownPayment = Math.max(1, Number((project.priceCr || 1).toFixed(1)));
  elements.downPaymentInput.max = String(maxDownPayment);
  elements.downPaymentRange.max = String(maxDownPayment);
  if (Number(elements.downPaymentInput.value) > maxDownPayment) {
    elements.downPaymentInput.value = String(maxDownPayment);
    elements.downPaymentRange.value = String(maxDownPayment);
  }

  elements.analystAnswer.innerHTML = `<p>${getAnalystResponse(project, "Should I enter now?")}</p>`;
  elements.projectBrief.textContent = getProjectBrief(project);

  updateEmi();
  renderCompare();
}

function updateShortlistButton() {
  if (!elements.projectShortlistButton || !state.project) return;
  const shortlist = loadProjectShortlist();
  const shortlisted = shortlist.includes(state.project.slug);
  elements.projectShortlistButton.textContent = shortlisted ? "Shortlisted" : "Add to Shortlist";
  elements.projectShortlistButton.classList.toggle("is-active", shortlisted);
}

function toggleProjectShortlist() {
  if (!state.project) return;
  const shortlist = loadProjectShortlist();
  const shortlisted = shortlist.includes(state.project.slug);
  const next = shortlisted
    ? shortlist.filter((slug) => slug !== state.project.slug)
    : [...shortlist, state.project.slug];
  saveProjectShortlist(next);
  updateShortlistButton();
}

function renderDataSourceBadge() {
  const meta = getDataSourceMeta();
  elements.dataSourceBadge.textContent = meta.label;
  elements.dataSourceBadge.classList.toggle("source-badge--live", meta.tone === "live");
}

function updateEmi() {
  const project = state.project;
  const downPaymentCr = Number(elements.downPaymentInput.value || 0);
  const interestRate = Number(elements.interestRateInput.value || 0);
  const years = Number(elements.tenureInput.value || 0);
  const principalCr = Math.max((project.priceCr || 0) - downPaymentCr, 0);
  const emi = calculateEmi(principalCr * 10000000, interestRate, years);
  const totalTicket = project.priceCr || 0;
  const downPaymentShare = totalTicket ? Math.min(100, (downPaymentCr / totalTicket) * 100) : 0;
  const loanShare = totalTicket ? Math.min(100, (principalCr / totalTicket) * 100) : 0;
  const totalPayout = emi && years ? emi * years * 12 : 0;
  const interestOutgo = Math.max(totalPayout - principalCr * 10000000, 0);
  elements.emiValue.textContent = emi ? `Rs ${formatter.format(Math.round(emi))}/month` : "Pending";
  elements.emiNote.textContent = `Loan principal assumed: Rs ${formatter.format(Math.round(principalCr * 10000000))}.`;
  elements.emiPrincipal.textContent = totalTicket ? formatCr(totalTicket) : "--";
  elements.emiDownPaymentBar.style.width = `${downPaymentShare}%`;
  elements.emiLoanBar.style.width = `${loanShare}%`;
  elements.emiDownPaymentValue.textContent = totalTicket ? formatCr(downPaymentCr) : "--";
  elements.emiLoanValue.textContent = totalTicket ? formatCr(principalCr) : "--";
  elements.emiMetrics.innerHTML = [
    ["Interest outgo", interestOutgo ? `Rs ${formatter.format(Math.round(interestOutgo))}` : "--", "Over the selected tenure"],
    ["Monthly income thumb-rule", emi ? `Rs ${formatter.format(Math.round(emi * 3))}` : "--", "Assuming EMI stays under one-third of income"],
    ["Interest rate", `${interestRate.toFixed(1)}%`, "Live adjustable"],
  ]
    .map(
      ([label, value, note]) => `
        <div class="emi-metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <em>${note}</em>
        </div>
      `,
    )
    .join("");
}

function syncRangePair(primary, secondary) {
  const sync = (from, to) => {
    to.value = from.value;
    updateEmi();
  };
  primary.addEventListener("input", () => sync(primary, secondary));
  secondary.addEventListener("input", () => sync(secondary, primary));
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.leadForm);
  const payload = Object.fromEntries(formData.entries());
  payload.projectCode = state.project.code;
  payload.projectName = state.project.name;

  elements.leadStatus.textContent = "Sending your request...";
  try {
    await submitLead(payload);
    elements.leadForm.reset();
    elements.leadStatus.textContent = "Thanks. PropSpot has your request and will reach out shortly.";
  } catch (error) {
    console.error(error);
    elements.leadStatus.textContent = "Lead capture is not available right now. Please use WhatsApp or Calendly for the moment.";
  }
}

function bindCompareSelects() {
  [elements.compareSelect1, elements.compareSelect2, elements.compareSelect3].forEach((select, index) => {
    select.addEventListener("change", () => {
      state.compareSlugs[index] = select.value || null;
      renderCompare();
    });
  });
}

function bindAnalyst() {
  elements.analystForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = elements.analystQuestion.value.trim();
    if (!question) return;
    elements.analystAnswer.innerHTML = `<p>${getAnalystResponse(state.project, question)}</p>`;
  });

  document.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = button.dataset.question;
      elements.analystQuestion.value = question;
      elements.analystAnswer.innerHTML = `<p>${getAnalystResponse(state.project, question)}</p>`;
    });
  });
}

function bindBriefCopy() {
  elements.copyBriefButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.projectBrief.textContent);
      elements.copyBriefButton.textContent = "Copied";
    } catch {
      elements.copyBriefButton.textContent = "Copy blocked";
    }
    setTimeout(() => {
      elements.copyBriefButton.textContent = "Copy Brief";
    }, 1200);
  });
}

async function main() {
  state.projects = await loadProjects();
  renderDataSourceBadge();
  const slug = getSlugFromPath();
  state.project = getProjectBySlug(state.projects, slug) || state.projects[0];
  state.compareSlugs = [
    state.projects[0]?.slug || null,
    state.projects[1]?.slug || null,
    state.projects[2]?.slug || null,
  ];

  renderProject();
  syncRangePair(elements.downPaymentInput, elements.downPaymentRange);
  syncRangePair(elements.interestRateInput, elements.interestRateRange);
  syncRangePair(elements.tenureInput, elements.tenureRange);
  elements.leadForm.addEventListener("submit", handleLeadSubmit);
  elements.projectShortlistButton?.addEventListener("click", toggleProjectShortlist);
  window.addEventListener("plinth-shortlist-change", updateShortlistButton);
  bindCompareSelects();
  bindAnalyst();
  bindBriefCopy();
}

main().catch(console.error);
