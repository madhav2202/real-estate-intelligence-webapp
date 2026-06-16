import {
  formatCr,
  getBuilderGradeScore,
  getDataSourceMeta,
  getLocationScore,
  getPropSpotScore,
  loadProjects,
  loadProjectShortlist,
  projectPageUrl,
  saveProjectShortlist,
  uniqueCorridors,
} from "./shared.js?v=20260604a";

const CURRENT_YEAR = new Date().getFullYear();
const MAX_CORRIDORS = 3;
const TIMELINES = {
  short: { label: "0-2 years", targetYears: 1.25, tolerance: 1.4 },
  medium: { label: "3-5 years", targetYears: 4, tolerance: 2 },
  long: { label: "5+ years", targetYears: 7, tolerance: 3.2 },
};

const CORRIDOR_NEIGHBORS = {
  "Golf Course Extension": ["Golf Course Road", "Southern Peripheral Road", "Sohna Road"],
  "Golf Course Road": ["Golf Course Extension", "MG Road Extension"],
  "Southern Peripheral Road": ["Golf Course Extension", "Sohna Road", "New Gurgaon"],
  "Sohna Road": ["Golf Course Extension", "Southern Peripheral Road", "Sohna"],
  "Dwarka Expressway": ["New Gurgaon", "Old Gurgaon"],
  "New Gurgaon": ["Dwarka Expressway", "Manesar", "Southern Peripheral Road"],
  "MG Road Extension": ["Golf Course Road", "Old Gurgaon"],
  "Old Gurgaon": ["Dwarka Expressway", "MG Road Extension"],
  "Sohna": ["Sohna Road", "Southern Peripheral Road"],
  "Manesar": ["New Gurgaon"],
};

const elements = {
  dataSourceBadge: document.querySelector("#dataSourceBadge"),
  form: document.querySelector("#recommendationForm"),
  budgetInput: document.querySelector("#budgetInput"),
  budgetNumberInput: document.querySelector("#budgetNumberInput"),
  budgetValue: document.querySelector("#budgetValue"),
  budgetPresets: document.querySelector("#budgetPresets"),
  corridorOptions: document.querySelector("#corridorOptions"),
  corridorNote: document.querySelector("#corridorNote"),
  backButton: document.querySelector("#backButton"),
  nextButton: document.querySelector("#nextButton"),
  editProfileButton: document.querySelector("#editProfileButton"),
  resultsTitle: document.querySelector("#resultsTitle"),
  modelPlaceholder: document.querySelector("#modelPlaceholder"),
  profileSummary: document.querySelector("#profileSummary"),
  shortlistTray: document.querySelector("#shortlistTray"),
  shortlistTitle: document.querySelector("#shortlistTitle"),
  shortlistChips: document.querySelector("#shortlistChips"),
  recommendationList: document.querySelector("#recommendationList"),
};

const state = {
  projects: [],
  step: 1,
  budget: 5,
  corridors: [],
  timeline: "medium",
  shortlist: [],
  resultsVisible: false,
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function renderDataSourceBadge() {
  const meta = getDataSourceMeta();
  elements.dataSourceBadge.textContent = meta.label;
  elements.dataSourceBadge.classList.toggle("source-badge--live", meta.tone === "live");
}

function setBudget(value) {
  const normalized = clamp(Number(value) || 0.25, 0.25, Number.MAX_SAFE_INTEGER);
  state.budget = Number(normalized.toFixed(2));
  elements.budgetNumberInput.value = state.budget;
  elements.budgetInput.value = clamp(state.budget, Number(elements.budgetInput.min), Number(elements.budgetInput.max));
  elements.budgetValue.textContent = formatCr(state.budget);
}

function projectBySlug(slug) {
  return state.projects.find((project) => project.slug === slug || project.legacySlug === slug) || null;
}

function renderShortlist() {
  const projects = state.shortlist.map(projectBySlug).filter(Boolean);
  elements.shortlistTray.hidden = projects.length === 0;
  elements.shortlistTitle.textContent = `${projects.length} shortlisted project${projects.length === 1 ? "" : "s"}`;
  elements.shortlistChips.innerHTML = projects
    .map(
      (project) => `
        <button type="button" data-remove-shortlist="${escapeHtml(project.slug)}">
          <span>${escapeHtml(project.name)}</span><b aria-hidden="true">x</b>
        </button>
      `,
    )
    .join("");
  elements.shortlistChips.querySelectorAll("[data-remove-shortlist]").forEach((button) => {
    button.addEventListener("click", () => toggleShortlist(button.dataset.removeShortlist));
  });
}

function toggleShortlist(slug) {
  state.shortlist = state.shortlist.includes(slug)
    ? state.shortlist.filter((item) => item !== slug)
    : [...state.shortlist, slug];
  state.shortlist = saveProjectShortlist(state.shortlist);
  renderShortlist();
  if (state.resultsVisible) renderRecommendations();
}

function parsePossessionYear(project) {
  const values = [project.possession, project.reraPossession, project.reraDetails?.possession]
    .filter(Boolean)
    .map(String);
  for (const value of values) {
    const match = value.match(/20\d{2}/);
    if (match) return Number(match[0]);
  }
  return CURRENT_YEAR + (project.stage === "New Launch" ? 6 : 4);
}

function budgetFit(project, budget) {
  const price = Number(project.priceCr);
  if (!Number.isFinite(price) || price <= 0) return 0.35;
  if (price <= budget) {
    const utilization = price / budget;
    return clamp(0.76 + utilization * 0.24);
  }
  const overage = (price - budget) / budget;
  return clamp(Math.exp(-Math.pow(overage / 0.24, 2)));
}

function normalizedLocationScore(project) {
  const raw = Number(getLocationScore(project));
  if (!Number.isFinite(raw)) return 8;
  return clamp(raw > 10 ? raw / 10 : raw, 0, 10);
}

function locationFit(project, corridors) {
  if (!corridors.length) return clamp(normalizedLocationScore(project) / 10);
  if (corridors.includes(project.corridor)) return 1;
  const isNeighbor = corridors.some((corridor) => (CORRIDOR_NEIGHBORS[corridor] || []).includes(project.corridor));
  if (isNeighbor) return 0.72;
  return clamp((normalizedLocationScore(project) / 10) * 0.48);
}

function timelineFit(project, timelineKey) {
  const timeline = TIMELINES[timelineKey];
  const yearsToPossession = Math.max(0, parsePossessionYear(project) - CURRENT_YEAR);
  const distance = Math.abs(yearsToPossession - timeline.targetYears);
  let fit = Math.exp(-Math.pow(distance / timeline.tolerance, 2));
  if (timelineKey === "long" && project.stage === "New Launch") fit += 0.08;
  if (timelineKey === "short" && project.stage === "Under Construction") fit += 0.05;
  return clamp(fit);
}

function qualityConfidence(project) {
  const builder = getBuilderGradeScore(project) / 10;
  const location = normalizedLocationScore(project) / 10;
  return clamp(builder * 0.62 + location * 0.38);
}

function matchReasons(project, scores) {
  const reasons = [];
  const price = Number(project.priceCr);
  if (price > 0 && price <= state.budget) {
    reasons.push(`${formatCr(price)} within budget`);
  } else if (price > state.budget) {
    reasons.push(`${Math.round(((price - state.budget) / state.budget) * 100)}% budget stretch`);
  } else {
    reasons.push("Price confirmation needed");
  }
  if (state.corridors.includes(project.corridor)) {
    reasons.push(`Exact ${project.corridor} fit`);
  } else if (scores.location >= 0.7) {
    reasons.push(`Connected to preferred corridor`);
  } else {
    reasons.push(`${normalizedLocationScore(project).toFixed(1)}/10 location maturity`);
  }
  reasons.push(`${project.possession || parsePossessionYear(project)} possession`);
  if (scores.quality >= 0.82) reasons.push("Strong quality confidence");
  return reasons.slice(0, 4);
}

function scoreProject(project) {
  const scores = {
    budget: budgetFit(project, state.budget),
    location: locationFit(project, state.corridors),
    timeline: timelineFit(project, state.timeline),
    quality: qualityConfidence(project),
  };
  const weighted =
    scores.budget * 0.4 +
    scores.location * 0.3 +
    scores.timeline * 0.2 +
    scores.quality * 0.1;
  return {
    project,
    scores,
    match: Math.round(weighted * 100),
    reasons: matchReasons(project, scores),
  };
}

function getRecommendations() {
  const seen = new Set();
  return state.projects
    .filter((project) => {
      const key = `${String(project.name || "").trim().toLowerCase()}|${String(project.developer || "").trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((project) => Number(project.priceCr) > 0)
    .map(scoreProject)
    .filter((item) => Number(item.project.priceCr) <= state.budget * 1.38)
    .sort((a, b) => b.match - a.match || b.scores.quality - a.scores.quality)
    .slice(0, 10);
}

function formatFactor(value) {
  return `${Math.round(value * 100)}%`;
}

function factorRow(label, value) {
  return `
    <div class="factor-row">
      <span>${escapeHtml(label)}</span>
      <div class="factor-track"><i style="width:${Math.round(value * 100)}%"></i></div>
      <strong>${formatFactor(value)}</strong>
    </div>
  `;
}

function renderRecommendations() {
  state.resultsVisible = true;
  const recommendations = getRecommendations();
  elements.modelPlaceholder.hidden = true;
  elements.profileSummary.hidden = false;
  elements.editProfileButton.hidden = false;
  elements.resultsTitle.textContent = `${recommendations.length} projects matched to your profile`;
  elements.profileSummary.innerHTML = `
    <span>Budget: ${formatCr(state.budget)}</span>
    <span>Location: ${escapeHtml(state.corridors.join(", "))}</span>
    <span>Timeline: ${escapeHtml(TIMELINES[state.timeline].label)}</span>
    <span>Model: 90% preference fit + 10% quality confidence</span>
  `;
  elements.recommendationList.innerHTML = recommendations.length
    ? recommendations
        .map(({ project, match, scores, reasons }, index) => {
          const propScore = getPropSpotScore(project, state.projects);
          const commuteUrl = `./commute-intelligence.html?slug=${encodeURIComponent(project.slug)}`;
          const shortlisted = state.shortlist.includes(project.slug);
          return `
            <article class="recommendation-card${index === 0 ? " top-match" : ""}${shortlisted ? " shortlisted" : ""}">
              <div class="match-score"><strong>${match}</strong><span>Match</span></div>
              <div class="recommendation-main">
                <span class="recommendation-rank">${index === 0 ? "Best match" : `Rank ${index + 1}`}</span>
                <h3>${escapeHtml(project.name)}</h3>
                <p class="recommendation-meta">${escapeHtml(project.developer)} | ${escapeHtml(project.corridor)} | ${formatCr(project.priceCr)} | ${escapeHtml(project.possession || "Possession pending")}</p>
                <div class="reason-list">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>
                <div class="recommendation-actions">
                  <a href="${projectPageUrl(project.slug)}">Open Intelligence</a>
                  <a href="${commuteUrl}">Check Location</a>
                  <button class="shortlist-toggle${shortlisted ? " selected" : ""}" data-shortlist="${escapeHtml(project.slug)}" type="button">
                    ${shortlisted ? "Shortlisted" : "Add to Shortlist"}
                  </button>
                </div>
              </div>
              <div class="match-breakdown">
                ${factorRow("Budget", scores.budget)}
                ${factorRow("Location", scores.location)}
                ${factorRow("Timeline", scores.timeline)}
                ${factorRow("Confidence", scores.quality)}
                <div class="factor-row">
                  <span>PropSpot</span>
                  <div class="factor-track"><i style="width:${propScore.total}%"></i></div>
                  <strong>${propScore.total}</strong>
                </div>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="model-placeholder"><p>No projects are close enough to this profile. Increase the budget or select another corridor.</p></div>`;
  elements.recommendationList.querySelectorAll("[data-shortlist]").forEach((button) => {
    button.addEventListener("click", () => toggleShortlist(button.dataset.shortlist));
  });
}

function renderCorridors() {
  elements.corridorOptions.innerHTML = uniqueCorridors(state.projects)
    .map(
      (corridor) => `
        <button class="corridor-option${state.corridors.includes(corridor) ? " selected" : ""}" data-corridor="${escapeHtml(corridor)}" type="button">
          ${escapeHtml(corridor)}
        </button>
      `,
    )
    .join("");
  elements.corridorNote.textContent = state.corridors.length
    ? `${state.corridors.length} of ${MAX_CORRIDORS} corridors selected`
    : "Choose at least one corridor";
  elements.corridorOptions.querySelectorAll("[data-corridor]").forEach((button) => {
    button.addEventListener("click", () => {
      const corridor = button.dataset.corridor;
      if (state.corridors.includes(corridor)) {
        state.corridors = state.corridors.filter((item) => item !== corridor);
      } else if (state.corridors.length < MAX_CORRIDORS) {
        state.corridors.push(corridor);
      }
      renderCorridors();
    });
  });
}

function renderStep() {
  document.querySelectorAll("[data-step]").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === state.step);
  });
  document.querySelectorAll("[data-jump-step]").forEach((button) => {
    const step = Number(button.dataset.jumpStep);
    button.classList.toggle("active", step === state.step);
    button.classList.toggle("complete", step < state.step);
  });
  elements.backButton.disabled = state.step === 1;
  elements.nextButton.textContent = state.step === 3 ? "Build Recommendations" : "Continue";
}

function canContinue() {
  if (state.step === 2) return state.corridors.length > 0;
  return true;
}

function nextStep() {
  if (!canContinue()) {
    elements.corridorNote.textContent = "Select at least one corridor to continue";
    return;
  }
  if (state.step < 3) {
    state.step += 1;
    renderStep();
    return;
  }
  state.timeline = elements.form.querySelector('input[name="timeline"]:checked')?.value || "medium";
  renderRecommendations();
}

function bindEvents() {
  elements.budgetInput.addEventListener("input", () => {
    setBudget(elements.budgetInput.value);
  });
  elements.budgetNumberInput.addEventListener("input", () => {
    setBudget(elements.budgetNumberInput.value);
  });
  elements.budgetPresets.querySelectorAll("[data-budget]").forEach((button) => {
    button.addEventListener("click", () => {
      setBudget(button.dataset.budget);
    });
  });
  elements.backButton.addEventListener("click", () => {
    state.step = Math.max(1, state.step - 1);
    renderStep();
  });
  elements.nextButton.addEventListener("click", nextStep);
  elements.editProfileButton.addEventListener("click", () => {
    state.step = 1;
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.querySelectorAll("[data-jump-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.jumpStep);
      if (target <= state.step || (target === 2 && state.step >= 1) || (target === 3 && state.corridors.length)) {
        state.step = target;
        renderStep();
      }
    });
  });
}

async function main() {
  state.projects = await loadProjects();
  state.shortlist = loadProjectShortlist();
  renderDataSourceBadge();
  renderShortlist();
  renderCorridors();
  renderStep();
  bindEvents();
}

main().catch((error) => {
  console.error(error);
  elements.resultsTitle.textContent = "Unable to load project recommendations";
});
