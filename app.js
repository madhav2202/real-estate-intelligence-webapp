const projects = [
  {
    code: "GGM-113-LUX",
    name: "Aurelia Heights",
    developer: "Northline Developers",
    location: "Sector 113, Dwarka Expressway, Gurugram",
    stage: "Under Construction",
    possession: "Q4 2028",
    priceCr: 3.35,
    sqft: 2150,
    priceSqft: 15581,
    units: 684,
    launched: 420,
    sold: 278,
    absorption: "+18% QoQ",
    appreciation: "+11.4% YoY",
    inventory: "142 launched units",
    bestFor: "End-use + long-horizon appreciation",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80",
    developerRisk: {
      score: "Seems ok",
      rows: [
        ["Delivery record", "8-12 mo delay"],
        ["Financial leverage", "Moderate"],
        ["Legal / litigation", "No major flag"],
        ["RERA complaints", "Low"],
        ["Active load", "5 projects"],
        ["Cashflow cover", "Adequate"],
      ],
    },
    approvals: [
      ["RERA", "Registered"],
      ["Land title", "Clear"],
      ["Environment clearance", "Received"],
      ["Payment plan", "CLP"],
    ],
    tracker: {
      signal: "Podium stage",
      rows: [
        ["Construction", "Podium slab"],
        ["Tower progress", "B1-B3 rising"],
        ["RERA possession", "Dec 2028"],
        ["Expected delay", "3-6 months"],
      ],
    },
    comps: [
      ["Elan Presidential", "Under Construction", 17100],
      ["M3M Capital", "Under Construction", 14800],
      ["Sobha City Vista", "New Launch", 15050],
    ],
    stack: [
      ["Launch", 13200],
      ["Current ask", 15581],
      ["Fair entry", 15100],
      ["Max entry", 15350],
    ],
    locationIntel: {
      score: "8.1/10",
      commute: "Strong",
      livability: "Maturing",
      connectivity: [
        ["IGI Airport", "18 min"],
        ["Dwarka Sec 21 Metro", "12 min"],
        ["Cyber City", "28 min"],
      ],
      social: [
        ["DPS Dwarka", "14 min"],
        ["Manipal Hospital", "16 min"],
        ["Vegas Mall", "13 min"],
      ],
      infra: [
        ["Dwarka Expressway", "Operational"],
        ["UER-II linkage", "High upside"],
        ["Metro extension", "Watch"],
      ],
      risks: [
        ["Peak traffic", "Medium"],
        ["Construction dust", "High"],
        ["Retail depth", "Improving"],
      ],
    },
  },
  {
    code: "GGM-79-PRM",
    name: "The Meridian Reserve",
    developer: "Crestpoint Realty",
    location: "Sector 79, New Gurugram",
    stage: "New Launch",
    possession: "Q2 2030",
    priceCr: 2.62,
    sqft: 1980,
    priceSqft: 13232,
    units: 912,
    launched: 310,
    sold: 164,
    absorption: "+31% QoQ",
    appreciation: "+13.7% YoY",
    inventory: "146 launched units",
    bestFor: "Growth buyer with 5-7 year horizon",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
    developerRisk: {
      score: "Needs caution",
      rows: [
        ["Delivery record", "Mixed"],
        ["Financial leverage", "Elevated"],
        ["Legal / litigation", "Open watch"],
        ["RERA complaints", "Moderate"],
        ["Active load", "7 projects"],
        ["Cashflow cover", "Launch dependent"],
      ],
    },
    approvals: [
      ["RERA", "Applied"],
      ["Land title", "Clear"],
      ["Building plan", "In approval"],
      ["Payment plan", "EOI + CLP"],
    ],
    tracker: {
      signal: "Launch risk",
      rows: [
        ["Construction", "Pre-excavation"],
        ["Launch window", "Next 45 days"],
        ["RERA possession", "Jun 2030"],
        ["Expected delay", "6-9 months"],
      ],
    },
    comps: [
      ["DLF Privana West", "Under Construction", 18100],
      ["Mapsko Mount Ville", "Under Construction", 11600],
      ["Godrej Aria Edge", "New Launch", 12150],
    ],
    stack: [
      ["EOI quote", 12600],
      ["Current ask", 13232],
      ["Fair entry", 12550],
      ["Max entry", 12950],
    ],
    locationIntel: {
      score: "7.4/10",
      commute: "Emerging",
      livability: "Improving",
      connectivity: [
        ["SPR Road", "11 min"],
        ["NH-48", "18 min"],
        ["Cyber City", "42 min"],
      ],
      social: [
        ["Broadways International", "10 min"],
        ["Sapphire 83", "12 min"],
        ["Medanta", "31 min"],
      ],
      infra: [
        ["SPR upgrade", "High upside"],
        ["Metro proposal", "Speculative"],
        ["New Gurugram retail", "Expanding"],
      ],
      risks: [
        ["Competing supply", "High"],
        ["Last-mile roads", "Medium"],
        ["Delivery horizon", "Long"],
      ],
    },
  },
  {
    code: "BLR-WFD-SKY",
    name: "Skylark District",
    developer: "Korra Urban",
    location: "Whitefield, Bengaluru",
    stage: "Under Construction",
    possession: "Q1 2027",
    priceCr: 2.18,
    sqft: 1710,
    priceSqft: 12749,
    units: 520,
    launched: 520,
    sold: 443,
    absorption: "+14% QoQ",
    appreciation: "+9.9% YoY",
    inventory: "77 units",
    bestFor: "End-use buyer near tech corridor",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80",
    developerRisk: {
      score: "Seems ok",
      rows: [
        ["Delivery record", "Mostly on time"],
        ["Financial leverage", "Low-moderate"],
        ["Legal / litigation", "No major flag"],
        ["RERA complaints", "Low"],
        ["Active load", "3 projects"],
        ["Cashflow cover", "Healthy"],
      ],
    },
    approvals: [
      ["RERA", "Registered"],
      ["Land title", "Clear"],
      ["Plan sanction", "Received"],
      ["Payment plan", "Milestone"],
    ],
    tracker: {
      signal: "Structure stage",
      rows: [
        ["Construction", "Structure complete"],
        ["Facade", "Started"],
        ["RERA possession", "Mar 2027"],
        ["Expected delay", "0-3 months"],
      ],
    },
    comps: [
      ["Prestige Lakeside Habitat", "Under Construction", 13600],
      ["Brigade Cornerstone", "Under Construction", 13250],
      ["Assetz Marq Next", "New Launch", 11900],
    ],
    stack: [
      ["Launch", 11100],
      ["Current ask", 12749],
      ["Fair entry", 12600],
      ["Max entry", 12900],
    ],
    locationIntel: {
      score: "8.3/10",
      commute: "Tech-led",
      livability: "Good",
      connectivity: [
        ["Whitefield Metro", "8 min"],
        ["ITPL", "14 min"],
        ["Outer Ring Road", "29 min"],
      ],
      social: [
        ["Vydehi Hospital", "11 min"],
        ["Phoenix Marketcity", "22 min"],
        ["Greenwood High", "18 min"],
      ],
      infra: [
        ["Metro purple line", "Operational"],
        ["Tech hiring density", "Strong"],
        ["Peripheral road links", "Watch"],
      ],
      risks: [
        ["Water stress", "Medium"],
        ["Peak traffic", "High"],
        ["Civic works", "Patchy"],
      ],
    },
  },
  {
    code: "NOI-146-ARC",
    name: "Arcadia Crest",
    developer: "Arc Habitat",
    location: "Sector 146, Noida Expressway",
    stage: "Upcoming",
    possession: "Q3 2030",
    priceCr: 1.96,
    sqft: 1760,
    priceSqft: 11136,
    units: 760,
    launched: 0,
    sold: 0,
    absorption: "EOI open",
    appreciation: "+8.6% YoY",
    inventory: "EOI phase",
    bestFor: "Early entry buyer waiting for RERA",
    image:
      "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1600&q=80",
    developerRisk: {
      score: "Watch closely",
      rows: [
        ["Delivery record", "6-10 mo variance"],
        ["Financial leverage", "Moderate"],
        ["Legal / litigation", "Title diligence"],
        ["RERA complaints", "Low"],
        ["Active load", "4 projects"],
        ["Cashflow cover", "Not visible"],
      ],
    },
    approvals: [
      ["RERA", "Not filed"],
      ["Land title", "Under diligence"],
      ["Building plan", "Draft"],
      ["Payment plan", "EOI only"],
    ],
    tracker: {
      signal: "Wait for RERA",
      rows: [
        ["Construction", "Not started"],
        ["Launch window", "Q3 2026"],
        ["RERA possession", "Pending"],
        ["Expected delay", "Unknown"],
      ],
    },
    comps: [
      ["Tata Eureka Park Phase 2", "Under Construction", 10100],
      ["Godrej Palm Retreat Next", "New Launch", 10550],
      ["ATS Nobility Edge", "Under Construction", 11800],
    ],
    stack: [
      ["EOI quote", 10700],
      ["Expected ask", 11136],
      ["Fair entry", 10650],
      ["Max entry", 10950],
    ],
    locationIntel: {
      score: "8.0/10",
      commute: "Balanced",
      livability: "Maturing",
      connectivity: [
        ["Noida Expressway", "5 min"],
        ["Sector 148 Metro", "11 min"],
        ["Jewar Airport route", "50 min"],
      ],
      social: [
        ["Shiv Nadar School", "13 min"],
        ["Jaypee Hospital", "19 min"],
        ["Sector 104 retail", "18 min"],
      ],
      infra: [
        ["Airport corridor", "Long term"],
        ["Expressway widening", "Stable"],
        ["Office catchment", "Developing"],
      ],
      risks: [
        ["Approval timing", "High"],
        ["Night retail", "Limited"],
        ["Launch repricing", "Medium"],
      ],
    },
  },
  {
    code: "MUM-PWL-LFT",
    name: "Lakefront Spire",
    developer: "Bayfront Estates",
    location: "Powai, Mumbai",
    stage: "New Launch",
    possession: "Q4 2029",
    priceCr: 5.85,
    sqft: 1510,
    priceSqft: 38742,
    units: 318,
    launched: 180,
    sold: 96,
    absorption: "+11% QoQ",
    appreciation: "+7.1% YoY",
    inventory: "84 launched units",
    bestFor: "Premium end-use buyer",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    developerRisk: {
      score: "Seems ok",
      rows: [
        ["Delivery record", "Premium stable"],
        ["Financial leverage", "Low"],
        ["Legal / litigation", "No major flag"],
        ["RERA complaints", "Low"],
        ["Active load", "2 projects"],
        ["Cashflow cover", "Healthy"],
      ],
    },
    approvals: [
      ["RERA", "Registered"],
      ["Land title", "Clear"],
      ["IOD", "Received"],
      ["Payment plan", "30:70 + CLP"],
    ],
    tracker: {
      signal: "Excavation",
      rows: [
        ["Construction", "Excavation"],
        ["Basement", "Not started"],
        ["RERA possession", "Dec 2029"],
        ["Expected delay", "6 months"],
      ],
    },
    comps: [
      ["Lodha Bellagio", "Under Construction", 40200],
      ["Hiranandani Regent", "New Launch", 36500],
      ["Kanakia Silicon Next", "Under Construction", 34400],
    ],
    stack: [
      ["Launch", 37400],
      ["Current ask", 38742],
      ["Fair entry", 37200],
      ["Max entry", 38100],
    ],
    locationIntel: {
      score: "8.8/10",
      commute: "Premium",
      livability: "High",
      connectivity: [
        ["JVLR", "6 min"],
        ["Powai business district", "8 min"],
        ["BKC", "34 min"],
      ],
      social: [
        ["Hiranandani Hospital", "7 min"],
        ["IIT Bombay", "9 min"],
        ["Galleria", "6 min"],
      ],
      infra: [
        ["Metro Line 6", "Upcoming"],
        ["Lake district premium", "Stable"],
        ["Office catchment", "Strong"],
      ],
      risks: [
        ["Entry pricing", "High"],
        ["Traffic choke points", "High"],
        ["Yield compression", "Medium"],
      ],
    },
  },
];

const state = {
  selectedCode: projects[0].code,
  watched: new Set(),
  compareCodes: new Set(projects.slice(0, 3).map((project) => project.code)),
  quotes: [
    {
      projectCode: "GGM-113-LUX",
      source: "PropSpot offered rate",
      rate: 15450,
      date: "Today",
    },
    {
      projectCode: "NOI-146-ARC",
      source: "EOI indication",
      rate: 10700,
      date: "Today",
    },
  ],
};

const formatter = new Intl.NumberFormat("en-IN");
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const elements = {
  clock: document.querySelector("#clock"),
  tickerTrack: document.querySelector("#tickerTrack"),
  projectList: document.querySelector("#projectList"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  budgetFilter: document.querySelector("#budgetFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  projectImage: document.querySelector("#projectImage"),
  assetCode: document.querySelector("#assetCode"),
  projectName: document.querySelector("#projectName"),
  projectLocation: document.querySelector("#projectLocation"),
  watchButton: document.querySelector("#watchButton"),
  metricGrid: document.querySelector("#metricGrid"),
  dealScore: document.querySelector("#dealScore"),
  dealSummary: document.querySelector("#dealSummary"),
  fairValueRange: document.querySelector("#fairValueRange"),
  fairValueSignal: document.querySelector("#fairValueSignal"),
  builderSalePrice: document.querySelector("#builderSalePrice"),
  builderPriceSignal: document.querySelector("#builderPriceSignal"),
  compareCount: document.querySelector("#compareCount"),
  compareControls: document.querySelector("#compareControls"),
  compareTable: document.querySelector("#compareTable"),
  priceSignal: document.querySelector("#priceSignal"),
  headlinePrice: document.querySelector("#headlinePrice"),
  pricePerSqft: document.querySelector("#pricePerSqft"),
  barChart: document.querySelector("#barChart"),
  locationScore: document.querySelector("#locationScore"),
  commuteIndex: document.querySelector("#commuteIndex"),
  livabilityIndex: document.querySelector("#livabilityIndex"),
  connectivityList: document.querySelector("#connectivityList"),
  socialInfraList: document.querySelector("#socialInfraList"),
  infraList: document.querySelector("#infraList"),
  locationRiskList: document.querySelector("#locationRiskList"),
  developerRiskScore: document.querySelector("#developerRiskScore"),
  developerRiskList: document.querySelector("#developerRiskList"),
  scoreBreakdown: document.querySelector("#scoreBreakdown"),
  riskScore: document.querySelector("#riskScore"),
  signalList: document.querySelector("#signalList"),
  trackerSignal: document.querySelector("#trackerSignal"),
  trackerList: document.querySelector("#trackerList"),
  inventoryPressure: document.querySelector("#inventoryPressure"),
  paymentInventoryList: document.querySelector("#paymentInventoryList"),
  downPayment: document.querySelector("#downPayment"),
  downPaymentLabel: document.querySelector("#downPaymentLabel"),
  rateInput: document.querySelector("#rateInput"),
  rateLabel: document.querySelector("#rateLabel"),
  emiValue: document.querySelector("#emiValue"),
  analystForm: document.querySelector("#analystForm"),
  analystQuestion: document.querySelector("#analystQuestion"),
  analystAnswer: document.querySelector("#analystAnswer"),
  buyerReport: document.querySelector("#buyerReport"),
  copyReportButton: document.querySelector("#copyReportButton"),
  expertButton: document.querySelector("#expertButton"),
  expertModuleButton: document.querySelector("#expertModuleButton"),
  leadStatus: document.querySelector("#leadStatus"),
  expertCopy: document.querySelector("#expertCopy"),
};

function formatCr(value) {
  return `Rs ${value.toFixed(2)} Cr`;
}

function parsePercent(value) {
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getSelectedProject() {
  return projects.find((project) => project.code === state.selectedCode) || projects[0];
}

function getLocationScore(project) {
  return Number(project.locationIntel.score.split("/")[0]);
}

function getAverageComp(project) {
  return Math.round(average(project.comps.map((comp) => comp[2])));
}

function getApprovalScore(project) {
  const values = project.approvals.map((item) => item[1]);
  let score = 10;
  values.forEach((value) => {
    if (["Applied", "Not filed", "Pending", "Under diligence", "Draft", "In approval"].some((word) => value.includes(word))) {
      score -= 2;
    }
  });
  return Math.max(2, score);
}

function getDeveloperRiskNumber(project) {
  const score = project.developerRisk.score;
  if (score === "Seems ok") return 8.1;
  if (score === "Watch closely") return 6.4;
  if (score === "Needs caution") return 4.9;
  if (score === "Very risky") return 3.2;
  return 4;
}

function getBuilderRiskScore(project) {
  return getDeveloperRiskNumber(project);
}

function getDeliveryScore(project) {
  const text = project.tracker.rows.map((row) => row[1]).join(" ");
  if (text.includes("Unknown")) return 4.5;
  if (text.includes("6-9")) return 5.3;
  if (text.includes("6 months")) return 6;
  if (text.includes("3-6")) return 6.8;
  if (text.includes("0-3")) return 8.6;
  return 7;
}

function getAbsorptionScore(project) {
  if (project.sold === 0 || project.launched === 0) return 5.6;
  const soldRatio = project.sold / project.launched;
  return Math.max(4, Math.min(9.5, soldRatio * 10.5));
}

function getPaymentPlan(project) {
  const row = project.approvals.find((item) => item[0] === "Payment plan");
  return row ? row[1] : "Not shared";
}

function getSupplyPressure(project) {
  const risks = project.locationIntel.risks.map((risk) => risk.join(" ")).join(" ");
  if (risks.includes("Competing supply")) return "High";
  if (project.units > 850) return "Medium";
  return "Low";
}

function getInventoryPressure(project) {
  if (!project.launched) return "Pre-launch";
  const unsold = project.launched - project.sold;
  const unsoldRatio = unsold / project.launched;
  if (unsoldRatio > 0.45) return "High";
  if (unsoldRatio > 0.22) return "Medium";
  return "Low";
}

function getFairEntry(project) {
  const compAverage = getAverageComp(project);
  const approvalAdjustment = (getApprovalScore(project) - 7) * 0.008;
  const locationAdjustment = (getLocationScore(project) - 8) * 0.014;
  const developerAdjustment = (getDeveloperRiskNumber(project) - 7) * 0.012;
  const launchStageAdjustment = project.stage === "Upcoming" ? -0.025 : project.stage === "New Launch" ? -0.01 : 0.008;
  const fairMid = Math.round(
    compAverage * (1 + approvalAdjustment + locationAdjustment + developerAdjustment + launchStageAdjustment)
  );
  const fairLow = Math.round(fairMid * 0.965);
  const fairHigh = Math.round(fairMid * 1.035);
  const spread = ((project.priceSqft - fairMid) / fairMid) * 100;
  let signal = "Fair entry";
  if (spread > 5) signal = "Avoid at ask";
  else if (spread > 2) signal = "Negotiate entry";
  else if (spread < -4) signal = "Attractive entry";
  return { fairLow, fairHigh, fairMid, spread, signal };
}

function getLaunchScore(project) {
  const fair = getFairEntry(project);
  const priceScore = Math.max(8, Math.min(26, 19 - fair.spread * 1.25));
  const developerScore = getDeveloperRiskNumber(project) * 2.1;
  const approvalScore = getApprovalScore(project) * 1.8;
  const locationScore = getLocationScore(project) * 1.9;
  const absorptionScore = getAbsorptionScore(project) * 1.4;
  const deliveryScore = getDeliveryScore(project) * 1.6;
  const total = Math.round(priceScore + developerScore + approvalScore + locationScore + absorptionScore + deliveryScore);
  let label = "Watchlist only";
  if (total >= 82 && fair.spread <= 2) label = "Strong shortlist";
  else if (total >= 74) label = "Shortlist, check price";
  else if (getApprovalScore(project) < 6) label = "Wait for approvals";
  else if (getDeliveryScore(project) < 6) label = "Wait for progress";
  else if (fair.spread > 5) label = "Avoid at current price";
  return { total: Math.max(1, Math.min(99, total)), label };
}

function getScoreBreakdown(project) {
  const fair = getFairEntry(project);
  const price = Math.max(3, Math.min(9.5, 7 - fair.spread * 0.35));
  return [
    ["Price attractiveness", price],
    ["Builder risk", getBuilderRiskScore(project)],
    ["Approval readiness", getApprovalScore(project)],
    ["Location maturity", getLocationScore(project)],
    ["Absorption", getAbsorptionScore(project)],
    ["Delivery confidence", getDeliveryScore(project)],
  ];
}

function getFilteredProjects() {
  const term = elements.searchInput.value.trim().toLowerCase();
  const budget = elements.budgetFilter.value;
  const stage = elements.statusFilter.value;

  return projects.filter((project) => {
    const matchesTerm = [project.name, project.developer, project.location, project.code]
      .join(" ")
      .toLowerCase()
      .includes(term);
    const matchesBudget =
      budget === "all" ||
      (budget === "under2" && project.priceCr < 2) ||
      (budget === "2to4" && project.priceCr >= 2 && project.priceCr <= 4) ||
      (budget === "above4" && project.priceCr > 4);
    const matchesStage = stage === "all" || project.stage === stage;
    return matchesTerm && matchesBudget && matchesStage;
  });
}

function renderTicker() {
  elements.tickerTrack.innerHTML = projects
    .map((project) => {
      const score = getLaunchScore(project);
      return `
        <span class="ticker-item">
          <strong>${project.code}</strong>
          <span>${project.stage}</span>
          <span>${formatCr(project.priceCr)}</span>
          <span class="${score.total >= 74 ? "up" : "down"}">${score.total}/100</span>
        </span>
      `;
    })
    .join("");
}

function renderProjectList() {
  const visibleProjects = getFilteredProjects();
  elements.resultCount.textContent = `${visibleProjects.length} projects`;
  elements.projectList.innerHTML = visibleProjects
    .map((project) => {
      const score = getLaunchScore(project);
      return `
        <button class="project-row ${project.code === state.selectedCode ? "active" : ""}" data-code="${project.code}" type="button">
          <strong>${project.name}</strong>
          <span class="row-meta">
            <span>${project.location.split(",")[0]}</span>
            <span>${project.stage}</span>
          </span>
          <span class="row-numbers">
            <span>${score.total}/100</span>
            <span>Rs ${formatter.format(project.priceSqft)}/sqft</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderMetrics(project) {
  const soldText = project.launched ? `${project.sold}/${project.launched}` : "EOI";
  const metrics = [
    ["Ticket", formatCr(project.priceCr)],
    ["Stage", project.stage],
    ["Launched / sold", soldText],
    ["Possession", project.possession],
  ];
  elements.metricGrid.innerHTML = metrics
    .map(
      ([label, value]) => `
        <div class="metric">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
}

function renderDecision(project) {
  const score = getLaunchScore(project);
  const fair = getFairEntry(project);
  const premiumText = `${fair.spread >= 0 ? "+" : ""}${fair.spread.toFixed(1)}% vs fair entry`;
  elements.dealScore.textContent = `${score.total}/100`;
  elements.dealSummary.textContent = score.label;
  elements.fairValueRange.textContent = `Rs ${formatter.format(fair.fairLow)}-${formatter.format(fair.fairHigh)}`;
  elements.fairValueSignal.textContent = `${fair.signal} | ${premiumText}`;
  elements.builderSalePrice.textContent = `Rs ${formatter.format(project.priceSqft)}`;
  elements.builderPriceSignal.textContent = premiumText;
}

function renderScoreBreakdown(project) {
  elements.scoreBreakdown.innerHTML = getScoreBreakdown(project)
    .map(([label, value]) => {
      const width = Math.round(Math.max(0, Math.min(10, value)) * 10);
      return `
        <div class="score-row">
          <span>${label}</span>
          <div class="score-track"><i style="width: ${width}%"></i></div>
          <strong>${value.toFixed(1)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderCompareControls() {
  elements.compareCount.textContent = `${state.compareCodes.size} selected`;
  elements.compareControls.innerHTML = projects
    .map(
      (project) => `
        <label class="compare-chip ${state.compareCodes.has(project.code) ? "active" : ""}">
          <input type="checkbox" value="${project.code}" ${state.compareCodes.has(project.code) ? "checked" : ""} />
          ${project.name}
        </label>
      `
    )
    .join("");
}

function renderCompareTable() {
  const selected = projects.filter((project) => state.compareCodes.has(project.code));
  elements.compareTable.innerHTML = selected
    .map((project) => {
      const score = getLaunchScore(project);
      const fair = getFairEntry(project);
      return `
        <tr>
          <td>${project.name}</td>
          <td>${formatCr(project.priceCr)}</td>
          <td>Rs ${formatter.format(project.priceSqft)}</td>
          <td>${score.total}/100</td>
          <td class="${fair.spread > 2 ? "down" : "up"}">${fair.signal}</td>
          <td>${project.absorption}</td>
          <td>${project.locationIntel.score}</td>
          <td>${getBuilderRiskScore(project).toFixed(1)}/10</td>
        </tr>
      `;
    })
    .join("");
}

function renderCompare() {
  renderCompareControls();
  renderCompareTable();
}

function renderBars(project) {
  const max = Math.max(...project.stack.map((item) => item[1]));
  elements.barChart.innerHTML = project.stack
    .map(([label, value]) => {
      const width = Math.round((value / max) * 100);
      return `
        <div class="bar-row">
          <span>${label}</span>
          <span class="bar"><i style="width: ${width}%"></i></span>
          <span>Rs ${formatter.format(value)}</span>
        </div>
      `;
    })
    .join("");
}

function renderList(target, rows) {
  target.innerHTML = rows
    .map(([label, value]) => {
      const risk = ["Applied", "Not filed", "Draft", "In approval", "High", "Medium-High", "Watch", "Unknown"].some((word) =>
        String(value).includes(word)
      );
      return `<li><span>${label}</span><strong class="${risk ? "down" : "up"}">${value}</strong></li>`;
    })
    .join("");
}

function renderLocation(project) {
  const location = project.locationIntel;
  elements.locationScore.textContent = location.score;
  elements.commuteIndex.textContent = location.commute;
  elements.livabilityIndex.textContent = location.livability;
  renderList(elements.connectivityList, location.connectivity);
  renderList(elements.socialInfraList, location.social);
  renderList(elements.infraList, location.infra);
  renderList(elements.locationRiskList, location.risks);
}

function renderDeveloperRisk(project) {
  elements.developerRiskScore.textContent = `${getBuilderRiskScore(project).toFixed(1)}/10`;
  renderList(elements.developerRiskList, project.developerRisk.rows);
}

function renderApprovals(project) {
  elements.riskScore.textContent = `${getApprovalScore(project).toFixed(1)}/10`;
  renderList(elements.signalList, project.approvals);
}

function renderTracker(project) {
  elements.trackerSignal.textContent = project.tracker.signal;
  renderList(elements.trackerList, project.tracker.rows);
}

function renderPaymentInventory(project) {
  const pressure = getInventoryPressure(project);
  const launchedText = project.launched ? `${project.launched} launched` : "Not launched";
  const soldText = project.launched ? `${project.sold} sold` : "EOI only";
  const unsoldText = project.launched ? `${project.launched - project.sold} unsold` : "No released inventory";
  elements.inventoryPressure.textContent = `${pressure} pressure`;
  renderList(elements.paymentInventoryList, [
    ["Payment plan", getPaymentPlan(project)],
    ["Inventory released", launchedText],
    ["Absorption", project.absorption],
    ["Available signal", unsoldText],
    ["Supply pressure", getSupplyPressure(project)],
  ]);
}

function getAnalystResponse(project, question) {
  const lower = question.toLowerCase();
  const score = getLaunchScore(project);
  const fair = getFairEntry(project);
  const missingApprovals = project.approvals
    .filter((item) => ["Applied", "Not filed", "Draft", "In approval", "Under diligence", "Pending"].some((word) => item[1].includes(word)))
    .map((item) => `${item[0]}: ${item[1]}`);

  if (lower.includes("approval")) {
    return missingApprovals.length
      ? `Do not treat this as clean yet. Missing or soft approval items: ${missingApprovals.join("; ")}. Wait for these before paying more than a token EOI.`
      : `Approvals look clean for this launch stage. Still verify the latest RERA page, sanctioned plans, payment schedule, and allotment terms before booking.`;
  }

  if (lower.includes("enter") || lower.includes("now")) {
    return `${score.label}. The project scores ${score.total}/100, with ${fair.signal.toLowerCase()} pricing at ${fair.spread >= 0 ? "+" : ""}${fair.spread.toFixed(1)}% versus fair entry. Enter only if your effective rate is within Rs ${formatter.format(fair.fairLow)}-${formatter.format(fair.fairHigh)}/sqft.`;
  }

  if (lower.includes("price") || lower.includes("offer")) {
    return `Builder current sale price is Rs ${formatter.format(project.priceSqft)}/sqft. PropSpot fair entry is Rs ${formatter.format(fair.fairLow)}-${formatter.format(fair.fairHigh)}/sqft. That puts builder pricing at ${fair.spread >= 0 ? "+" : ""}${fair.spread.toFixed(1)}% versus fair entry.`;
  }

  if (lower.includes("compare")) {
    const best = projects.slice().sort((a, b) => getLaunchScore(b).total - getLaunchScore(a).total)[0];
    return `${best.name} currently ranks highest at PropSpot Score ${getLaunchScore(best).total}/100. ${project.name} is ${score.total}/100. Compare mainly on effective rate, RERA readiness, possession gap, and builder risk rather than brochure amenities.`;
  }

  if (lower.includes("risk")) {
    return `Main risks: builder risk is ${getBuilderRiskScore(project).toFixed(1)}/10, approval readiness is ${getApprovalScore(project).toFixed(1)}/10, delivery confidence is ${getDeliveryScore(project).toFixed(1)}/10, and supply pressure is ${getSupplyPressure(project)}.`;
  }

  return `${project.name} is a ${score.label.toLowerCase()} at PropSpot Score ${score.total}/100. Fair entry is Rs ${formatter.format(fair.fairLow)}-${formatter.format(fair.fairHigh)}/sqft, builder risk is ${getBuilderRiskScore(project).toFixed(1)}/10, and the launch is best for ${project.bestFor.toLowerCase()}.`;
}

function renderAnalyst(project, question = "Should I enter now?") {
  elements.analystAnswer.innerHTML = `<p>${getAnalystResponse(project, question)}</p>`;
}

function getProjectBrief(project) {
  const score = getLaunchScore(project);
  const fair = getFairEntry(project);
  const missingApprovals = project.approvals
    .filter((item) => ["Applied", "Not filed", "Draft", "In approval", "Under diligence", "Pending"].some((word) => item[1].includes(word)))
    .map((item) => `${item[0]} ${item[1]}`)
    .join(", ");

  return [
    `${project.name} | ${project.location}`,
    `PropSpot Score: ${score.total}/100`,
    `Builder: ${project.developer} | Builder risk: ${getBuilderRiskScore(project).toFixed(1)}/10`,
    `Stage: ${project.stage} | Possession: ${project.possession} | Tracker: ${project.tracker.signal}`,
    `Builder current sale price: Rs ${formatter.format(project.priceSqft)}/sqft | Ticket: ${formatCr(project.priceCr)}`,
    `Fair entry: Rs ${formatter.format(fair.fairLow)}-${formatter.format(fair.fairHigh)}/sqft | ${fair.signal}`,
    `Price gap: ${fair.spread >= 0 ? "+" : ""}${fair.spread.toFixed(1)}% versus fair entry`,
    `Approvals: ${missingApprovals || "core items clean for stage"}`,
    `Location: ${project.locationIntel.score} | Commute ${project.locationIntel.commute} | Maturity ${project.locationIntel.livability}`,
    `Absorption: ${project.absorption} | Inventory: ${project.inventory} | Supply pressure: ${getSupplyPressure(project)}`,
    `Buyer fit: ${project.bestFor}`,
  ].join("\n");
}

function renderProjectBrief(project) {
  elements.buyerReport.textContent = getProjectBrief(project);
}

function requestExpertConnect() {
  const project = getSelectedProject();
  elements.leadStatus.textContent = "requested";
  elements.expertCopy.textContent = `A PropSpot expert request is queued for ${project.name}. Share your preferred unit, budget, and timing when connected.`;
  elements.expertButton.textContent = "Expert Requested";
  elements.expertModuleButton.textContent = "Request Sent";
}

function renderDetail() {
  const project = getSelectedProject();
  const fair = getFairEntry(project);
  elements.projectImage.src = project.image;
  elements.projectImage.alt = `${project.name} high-rise launch`;
  elements.assetCode.textContent = project.code;
  elements.projectName.textContent = project.name;
  elements.projectLocation.textContent = `${project.developer} | ${project.location} | ${project.stage} | ${project.possession}`;
  elements.watchButton.classList.toggle("active", state.watched.has(project.code));
  elements.watchButton.textContent = state.watched.has(project.code) ? "Watching" : "Add Watch";
  elements.headlinePrice.textContent = formatCr(project.priceCr);
  elements.pricePerSqft.textContent = `Rs ${formatter.format(project.priceSqft)}/sqft`;
  elements.priceSignal.textContent = fair.signal;
  renderMetrics(project);
  renderDecision(project);
  renderBars(project);
  renderLocation(project);
  renderDeveloperRisk(project);
  renderScoreBreakdown(project);
  renderApprovals(project);
  renderTracker(project);
  renderPaymentInventory(project);
  renderAnalyst(project);
  renderProjectBrief(project);
}

function render() {
  renderProjectList();
  renderCompare();
  renderDetail();
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

elements.projectList.addEventListener("click", (event) => {
  const row = event.target.closest(".project-row");
  if (!row) return;
  state.selectedCode = row.dataset.code;
  render();
});

elements.compareControls.addEventListener("change", (event) => {
  const input = event.target.closest("input[type='checkbox']");
  if (!input) return;
  if (input.checked) state.compareCodes.add(input.value);
  else state.compareCodes.delete(input.value);
  renderCompare();
});

elements.searchInput.addEventListener("input", renderProjectList);
elements.budgetFilter.addEventListener("change", renderProjectList);
elements.statusFilter.addEventListener("change", renderProjectList);

elements.watchButton.addEventListener("click", () => {
  const project = getSelectedProject();
  if (state.watched.has(project.code)) state.watched.delete(project.code);
  else state.watched.add(project.code);
  renderDetail();
});

elements.expertButton.addEventListener("click", requestExpertConnect);
elements.expertModuleButton.addEventListener("click", requestExpertConnect);

elements.analystForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = elements.analystQuestion.value.trim();
  if (!question) return;
  renderAnalyst(getSelectedProject(), question);
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => {
    elements.analystQuestion.value = button.dataset.question;
    renderAnalyst(getSelectedProject(), button.dataset.question);
  });
});

elements.copyReportButton.addEventListener("click", async () => {
  const brief = getProjectBrief(getSelectedProject());
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(brief);
    elements.copyReportButton.textContent = "Copied";
  } catch {
    elements.copyReportButton.textContent = "Copy blocked";
  }
  window.setTimeout(() => {
    elements.copyReportButton.textContent = "Copy Brief";
  }, 1400);
});

renderTicker();
render();
updateClock();
window.setInterval(updateClock, 30000);
