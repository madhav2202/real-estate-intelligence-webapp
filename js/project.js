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
} from "./shared.js?v=20260521b";

const formatter = new Intl.NumberFormat("en-IN");

const elements = {
  projectImage: document.querySelector("#projectImage"),
  projectCode: document.querySelector("#projectCode"),
  projectName: document.querySelector("#projectName"),
  projectMeta: document.querySelector("#projectMeta"),
  projectWhatsapp: document.querySelector("#projectWhatsapp"),
  builderPrice: document.querySelector("#builderPrice"),
  builderPriceSubtext: document.querySelector("#builderPriceSubtext"),
  fairEntry: document.querySelector("#fairEntry"),
  propspotScore: document.querySelector("#propspotScore"),
  propspotLabel: document.querySelector("#propspotLabel"),
  projectStage: document.querySelector("#projectStage"),
  snapshotGrid: document.querySelector("#snapshotGrid"),
  registryGrid: document.querySelector("#registryGrid"),
  sourceLinkRow: document.querySelector("#sourceLinkRow"),
  downPaymentInput: document.querySelector("#downPaymentInput"),
  interestRateInput: document.querySelector("#interestRateInput"),
  tenureInput: document.querySelector("#tenureInput"),
  emiValue: document.querySelector("#emiValue"),
  emiNote: document.querySelector("#emiNote"),
  locationScore: document.querySelector("#locationScore"),
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
  scoreBreakdown: document.querySelector("#scoreBreakdown"),
  inventoryPressure: document.querySelector("#inventoryPressure"),
  paymentInventoryList: document.querySelector("#paymentInventoryList"),
  paymentSummary: document.querySelector("#paymentSummary"),
  paymentChips: document.querySelector("#paymentChips"),
  priceStackSignal: document.querySelector("#priceStackSignal"),
  priceStackHeadline: document.querySelector("#priceStackHeadline"),
  priceStackSubline: document.querySelector("#priceStackSubline"),
  priceBars: document.querySelector("#priceBars"),
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
  const text = (project.locationIntel?.connectivity || []).map((row) => row.join(" ")).join(" ");
  if (!text.trim()) return "Good";
  if (/8 min|10 min|12 min|18 min/.test(text)) return "Strong";
  if (/28 min|35 min|45 min/.test(text)) return "Balanced";
  return "Good";
}

function getLocationMaturity(project) {
  const value = project.locationIntel?.livability;
  if (value && value !== "Data pending") return value;
  const text = [
    ...(project.locationIntel?.social || []),
    ...(project.locationIntel?.infra || []),
    ...(project.locationIntel?.risks || []),
  ]
    .map((row) => row.join(" "))
    .join(" ");
  if (!text.trim()) return "Good";
  if (text.includes("Improving") || text.includes("Operational")) return "Maturing";
  if (text.includes("Developing") || text.includes("Watch")) return "Emerging";
  return "Good";
}

function getApprovalScore(project) {
  return 8;
}

function getDeliveryScore(project) {
  const text = (project.tracker?.rows || []).map((row) => row[1]).join(" ");
  if (text.includes("Data pending")) return 8;
  if (text.includes("6-9")) return 5.9;
  if (text.includes("3-6")) return 6.9;
  if (text.includes("0-3")) return 8.2;
  return 7.1;
}

function getAbsorptionScore(project) {
  if (!project.launched || !project.sold) return 8;
  const ratio = project.sold / project.launched;
  return Math.max(4.5, Math.min(9.4, ratio * 10.2));
}

function getInventoryPressure(project) {
  if (!project.launched) return "Good / 8";
  const unsold = project.launched - project.sold;
  const ratio = unsold / project.launched;
  if (ratio > 0.45) return "High pressure";
  if (ratio > 0.22) return "Medium pressure";
  return "Low pressure";
}

function getSupplyPressure(project) {
  const text = (project.locationIntel?.risks || []).map((row) => row.join(" ")).join(" ");
  if (text.includes("Competing supply")) return "High";
  if (text.includes("Watch")) return "Medium";
  return "Good";
}

function hasBuilderRiskData(project) {
  return (project.developerRisk?.rows || []).some((row) => !String(row[1] || "").includes("Data pending"));
}

function getBuilderRiskRows(project) {
  if (hasBuilderRiskData(project)) return project.developerRisk.rows;
  return [
    ["Current view", "Good / 8"],
    ["Builder bucket", `${getBuilderGrade(project)} grade`],
  ];
}

function getTrackerRows(project) {
  if (project.tracker?.rows?.length && !project.tracker.rows.every((row) => String(row[1] || "").includes("Data pending"))) {
    return project.tracker.rows;
  }
  return [
    ["Current stage", "Good / 8"],
    ["Launch progress", "On track"],
  ];
}

function getAbsorptionLabel(project) {
  return project.absorption && project.absorption !== "Data pending" ? project.absorption : "Good";
}

function getScoreBreakdown(project, projects) {
  const score = getPropSpotScore(project, projects);
  const marketMedian = score.marketMedian;
  const priceDiff = project.priceSqft && marketMedian ? ((project.priceSqft - marketMedian) / marketMedian) * 100 : 0;
  const priceAttractiveness = Math.max(4.5, Math.min(9.5, 8.1 - priceDiff * 0.12));
  return [
    ["Price attractiveness", priceAttractiveness],
    ["Builder risk", getBuilderGradeScore(project)],
    ["Approval readiness", getApprovalScore(project)],
    ["Location maturity", getLocationScore(project)],
    ["Absorption", getAbsorptionScore(project)],
    ["Delivery confidence", getDeliveryScore(project)],
  ];
}

function getEntrySignal(project, projects) {
  const fair = getFairEntry(project);
  if (!project.priceSqft || !fair.low) return "Builder price pending";
  if (project.priceSqft > fair.high) return "Avoid at ask";
  if (project.priceSqft < fair.low) return "Attractive entry";
  return "Fair entry";
}

function renderSimpleList(target, rows) {
  target.innerHTML = rows
    .map(([label, value]) => `<li><span>${label}</span><strong>${value || "Good / 8"}</strong></li>`)
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
  if (listed) {
    return [
      { label: "Market cap", value: metrics.marketCap || "Data pending", note: "Current public-market scale" },
      { label: "Revenue", value: metrics.revenue || "Data pending", note: "Latest summarized top line" },
      { label: "Profit", value: metrics.profit || "Data pending", note: "Latest summarized profit line" },
      {
        label: "Promoter holding",
        value: metrics.promoterHolding || "Data pending",
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
  return [
    { label: "RERA number", value: project.reraNumber || null, note: "Project registration reference" },
    { label: "RERA possession", value: project.reraPossession || null, note: "Current registered handover timing" },
    {
      label: "Launch price",
      value: rera.launchPrice ? formatSqft(rera.launchPrice) : null,
      note: "Earliest matched launch pricing signal",
    },
    {
      label: "Current price",
      value: rera.currentPrice ? formatSqft(rera.currentPrice) : null,
      note: "Matched current pricing source",
    },
    { label: "Configurations", value: rera.configurations || null, note: "Current unit mix" },
    { label: "Construction start", value: rera.startDate || null, note: "RERA-linked start date" },
  ];
}

function getTrackerSummary(project) {
  const trackerSignal = project.tracker?.signal && project.tracker.signal !== "Data pending" ? project.tracker.signal : "Good / 8";
  const inventoryNote = project.launched && project.sold ? `${project.sold} sold out of ${project.launched} launched` : "inventory still early in the current dataset";
  return `${project.name} is currently in the ${project.stage.toLowerCase()} stage with possession marked for ${project.possession}. The live tracker signal is ${trackerSignal}, and the launch picture currently shows ${inventoryNote}.`;
}

function getPaymentSummary(project) {
  const paymentPlan = (project.approvals || []).find((row) => row[0] === "Payment plan")?.[1] || "Good / 8";
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
      const score = getPropSpotScore(project, state.projects);
      return `
        <tr>
          <td>${project.name}</td>
          <td>${formatCr(project.priceCr)}</td>
          <td>${formatSqft(project.priceSqft)}</td>
          <td>${score.total}/100</td>
          <td>${getEntrySignal(project, state.projects)}</td>
          <td>${getAbsorptionLabel(project)}</td>
          <td>${getLocationScore(project).toFixed(1)}/10</td>
          <td>${hasBuilderRiskData(project) ? getBuilderGrade(project) : "Good / 8"}</td>
        </tr>
      `;
    })
    .join("");
}

function getAnalystResponse(project, question) {
  const lower = question.toLowerCase();
  const fair = getFairEntry(project);
  const score = getPropSpotScore(project, state.projects);
  if (lower.includes("approval")) {
    return `Approvals are not being shown on the live page right now because the underlying data is still incomplete. For the current MVP view, approval readiness is being held at a placeholder 8/10.`;
  }
  if (lower.includes("compare")) {
    return `${project.name} should mainly be compared on builder price, fair entry range, builder grade, approval readiness, and location maturity rather than brochure-level positioning.`;
  }
  if (lower.includes("price") || lower.includes("entry")) {
    return `${project.name} is showing builder price at ${formatSqft(project.priceSqft)} and fair entry at ${fair.low ? `${formatSqft(fair.low, false)}-${formatter.format(fair.high)}/sqft` : "data pending"}. This module should stay visible even where pricing inputs are incomplete.`;
  }
  return `${project.name} is currently a ${score.label.toLowerCase()} at ${score.total}/100. The page keeps all intelligence modules visible so you can see both what the buyer gets and what data still needs to be captured.`;
}

function getProjectBrief(project) {
  const fair = getFairEntry(project);
  const score = getPropSpotScore(project, state.projects);
  return [
    `${project.name} | ${project.location}`,
    `PropSpot Score: ${score.total}/100 | ${score.label}`,
    `Builder Current Sale Price: ${formatSqft(project.priceSqft)}`,
    `Fair Entry Range: ${fair.low ? `${formatSqft(fair.low, false)}-${formatter.format(fair.high)}/sqft` : "Builder price pending"}`,
    `Builder Grade: ${getBuilderGrade(project)}`,
    `Location Maturity: ${getLocationScore(project).toFixed(1)}/10 | Commute ${getLocationCommute(project)} | Maturity ${getLocationMaturity(project)}`,
    `Approval Readiness: ${getApprovalScore(project).toFixed(1)}/10 | Tracker: ${project.tracker?.signal && project.tracker.signal !== "Data pending" ? project.tracker.signal : "Good / 8"}`,
    `Inventory: ${project.inventory || "Good"} | Absorption: ${getAbsorptionLabel(project)}`,
    `Best Fit: ${project.bestFor || "Good / 8"}`,
  ].join("\n");
}

function renderProject() {
  const project = state.project;
  const score = getPropSpotScore(project, state.projects);
  const fair = getFairEntry(project);
  const rera = project.reraDetails || {};
  const marketGap =
    project.priceSqft && score.marketMedian
      ? `${(((project.priceSqft - score.marketMedian) / score.marketMedian) * 100).toFixed(1)}% vs micro-market median`
      : "Market benchmark pending";

  document.title = `${project.name} | PropSpot Plinth`;
  elements.projectImage.src = project.image;
  elements.projectImage.alt = `${project.name} image`;
  elements.projectCode.textContent = project.code;
  elements.projectName.textContent = project.name;
  elements.projectMeta.textContent = `${project.developer} | ${project.location} | ${project.stage} | ${project.possession}`;
  elements.projectWhatsapp.href = getWhatsappUrl(project);
  elements.sidebarWhatsapp.href = getWhatsappUrl(project);

  elements.builderPrice.textContent = formatSqft(project.priceSqft);
  elements.builderPriceSubtext.textContent = marketGap;
  elements.fairEntry.textContent = fair.low ? `${formatSqft(fair.low, false)}-${formatter.format(fair.high)}` : "Pending";
  elements.propspotScore.textContent = `${score.total}/100`;
  elements.propspotLabel.textContent = score.label;
  elements.projectStage.textContent = project.stage;

  const snapshotRows = [
    ["Ticket", formatCr(project.priceCr)],
    ["Stage", project.stage],
    ["Launched / Sold", project.launched ? `${project.sold}/${project.launched}` : "EOI"],
    ["Possession", project.possession],
    ["Builder Grade", getBuilderGrade(project)],
    ["Total Units", rera.totalUnits ? formatter.format(rera.totalUnits) : project.units ? formatter.format(project.units) : "Good / 8"],
    ["Land Bank", rera.landArea || rera.totalLicensedLand || "Good / 8"],
    ["Total Towers", rera.totalTowers ? formatter.format(rera.totalTowers) : "Good / 8"],
    ["Floors", rera.totalFloors ? formatter.format(rera.totalFloors) : "Good / 8"],
    ["Sizes", rera.sizes || (project.sqft ? `${formatter.format(project.sqft)} sq.ft.` : "Good / 8")],
    ["Best For", project.bestFor || "Good / 8"],
  ];
  elements.snapshotGrid.innerHTML = snapshotRows
    .map(([label, value]) => `<div class="snapshot-item"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
  renderRegistryGrid(elements.registryGrid, getRegistryFacts(project));
  renderSourceLinks(elements.sourceLinkRow, [
    project.reraDetails?.sourceUrl ? { label: "Open RERA / Tracker Source", href: project.reraDetails.sourceUrl } : null,
  ]);

  elements.locationScore.textContent = `${getLocationScore(project).toFixed(1)}/10`;
  elements.commuteValue.textContent = getLocationCommute(project);
  elements.maturityValue.textContent = getLocationMaturity(project);
  renderSimpleList(elements.connectivityList, project.locationIntel?.connectivity?.length ? project.locationIntel.connectivity : [["Current view", "Good / 8"], ["Metro / roads", "Well connected"]]);
  renderSimpleList(elements.socialList, project.locationIntel?.social?.length ? project.locationIntel.social : [["Current view", "Good / 8"], ["Daily access", "Usable catchment"]]);
  renderSimpleList(elements.infraList, project.locationIntel?.infra?.length ? project.locationIntel.infra : [["Current view", "Good / 8"], ["Future upside", "Watchlist positive"]]);
  renderSimpleList(elements.riskList, project.locationIntel?.risks?.length ? project.locationIntel.risks : [["Current view", "Good / 8"], ["Area risk", "Manageable"]]);

  elements.builderGrade.textContent = `${getBuilderGrade(project)} grade`;
  elements.builderGradeCopy.textContent = `Current PropSpot builder bucket for ${project.developer}. This is a temporary live proxy until deeper builder diligence fields are added.`;
  elements.builderRiskScore.textContent = hasBuilderRiskData(project) ? `${getBuilderGradeScore(project).toFixed(1)}/10` : `8.0/10`;
  elements.builderRiskSummary.textContent = getBuilderRiskSummary(project);
  renderChipRow(elements.builderRiskChips, [
    { label: `${getBuilderGrade(project)} grade builder` },
    { label: `${hasBuilderRiskData(project) ? getBuilderGradeScore(project).toFixed(1) : "8.0"}/10 confidence` },
    { label: project.stage, soft: true },
  ]);
  renderMiniStatGrid(elements.builderFinanceGrid, getBuilderFinanceStats(project));
  renderSimpleList(elements.builderRiskList, getBuilderRiskRows(project));
  renderSourceLinks(elements.builderSourceRow, [
    project.builderIntelligence?.financeUrl ? { label: "Open finance source", href: project.builderIntelligence.financeUrl } : null,
  ]);

  elements.scoreBreakdown.innerHTML = getScoreBreakdown(project, state.projects)
    .map(([label, value]) => {
      const width = Math.max(0, Math.min(100, value * 10));
      return `
        <div class="breakdown-row">
          <span>${label}</span>
          <div class="breakdown-track"><i style="width:${width}%"></i></div>
          <strong>${value.toFixed(1)}</strong>
        </div>
      `;
    })
    .join("");

  elements.trackerSignal.textContent = project.tracker?.signal && project.tracker.signal !== "Data pending" ? project.tracker.signal : "Good / 8";
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
    ["Payment plan", (project.approvals || []).find((row) => row[0] === "Payment plan")?.[1] || "Good / 8"],
    ["Inventory released", project.launched ? `${project.launched} launched` : "Good"],
    ["Absorption", getAbsorptionLabel(project)],
    ["Available signal", project.launched ? `${project.launched - project.sold} unsold` : "Good"],
    ["Supply pressure", getSupplyPressure(project)],
  ]);

  const fairAnchor = score.marketMedian || project.priceSqft || 0;
  const stackRows = [
    ["Builder price", project.priceSqft || 0],
    ["Fair anchor", fairAnchor],
    ["Fair low", fair.low || 0],
  ].filter((row) => row[1]);
  const maxStack = Math.max(...stackRows.map((row) => row[1]), 1);
  elements.priceStackSignal.textContent = getEntrySignal(project, state.projects);
  elements.priceStackHeadline.textContent = formatCr(project.priceCr);
  elements.priceStackSubline.textContent = formatSqft(project.priceSqft);
  elements.priceBars.innerHTML = stackRows
    .map(
      ([label, value]) => `
        <div class="bar-row">
          <span>${label}</span>
          <div class="bar-track"><i style="width:${Math.round((value / maxStack) * 100)}%"></i></div>
          <strong>Rs ${formatter.format(value)}</strong>
        </div>
      `
    )
    .join("");

  elements.analystAnswer.innerHTML = `<p>${getAnalystResponse(project, "Should I enter now?")}</p>`;
  elements.projectBrief.textContent = getProjectBrief(project);

  updateEmi();
  renderCompare();
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
  elements.emiValue.textContent = emi ? `Rs ${formatter.format(Math.round(emi))}/month` : "Pending";
  elements.emiNote.textContent = `Loan principal assumed: Rs ${formatter.format(Math.round(principalCr * 10000000))}.`;
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
  [elements.downPaymentInput, elements.interestRateInput, elements.tenureInput].forEach((input) =>
    input.addEventListener("input", updateEmi)
  );
  elements.leadForm.addEventListener("submit", handleLeadSubmit);
  bindCompareSelects();
  bindAnalyst();
  bindBriefCopy();
}

main().catch(console.error);
