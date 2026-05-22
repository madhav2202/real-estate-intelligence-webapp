import {
  loadProjects,
  getFilteredProjects,
  uniqueCorridors,
  formatSqft,
  getPropSpotScore,
  getFairEntry,
  projectPageUrl,
  getDataSourceMeta,
} from "./shared.js?v=20260522a";

const elements = {
  searchInput: document.querySelector("#searchInput"),
  budgetFilter: document.querySelector("#budgetFilter"),
  stageFilter: document.querySelector("#stageFilter"),
  corridorFilter: document.querySelector("#corridorFilter"),
  resultCount: document.querySelector("#resultCount"),
  projectList: document.querySelector("#projectList"),
  dataSourceBadge: document.querySelector("#dataSourceBadge"),
};

const state = { projects: [] };

function filters() {
  return {
    term: elements.searchInput.value,
    budget: elements.budgetFilter.value,
    stage: elements.stageFilter.value,
    corridor: elements.corridorFilter.value,
  };
}

function render() {
  const filtered = getFilteredProjects(state.projects, filters());
  elements.resultCount.textContent = `${filtered.length} projects`;
  elements.projectList.innerHTML = filtered
    .map((project) => {
      const score = getPropSpotScore(project, state.projects);
      const fair = getFairEntry(project);
      const scoreColor = score.total >= 80 ? "#4ade80" : score.total >= 65 ? "#f5a623" : "#f87171";
      const signal = !project.priceSqft
        ? "Builder price pending"
        : fair.high && project.priceSqft > fair.high
          ? "Avoid at ask"
          : "Fair entry";
      return `
        <a class="property-row" href="${projectPageUrl(project.slug)}">
          <div class="property-main">
            <strong>${project.name}</strong>
            <span>${project.location}</span>
          </div>
          <div class="property-meta">
            <span class="property-meta-label">Stage</span>
            <span class="property-stage-pill">${project.stage}</span>
          </div>
          <div class="property-meta">
            <span class="property-meta-label">Builder Price</span>
            <span class="property-meta-value">${formatSqft(project.priceSqft)}</span>
          </div>
          <div class="property-meta">
            <span class="property-meta-label">Corridor</span>
            <span class="property-meta-value">${project.corridor}</span>
          </div>
          <div class="property-meta">
            <span class="property-meta-label">Possession</span>
            <span class="property-meta-value">${project.possession}</span>
          </div>
          <div class="property-score">
            <strong style="color:${scoreColor}">${score.total}/100</strong>
            <span>${signal}</span>
          </div>
          <span class="property-cta">Open intelligence</span>
        </a>
      `;
    })
    .join("");
}

function renderDataSourceBadge() {
  const meta = getDataSourceMeta();
  elements.dataSourceBadge.textContent = meta.label;
  elements.dataSourceBadge.classList.toggle("source-badge--live", meta.tone === "live");
}

async function main() {
  state.projects = await loadProjects();
  renderDataSourceBadge();
  elements.corridorFilter.innerHTML = [
    `<option value="all">All corridors</option>`,
    ...uniqueCorridors(state.projects).map((corridor) => `<option value="${corridor}">${corridor}</option>`),
  ].join("");

  render();
  [elements.searchInput, elements.budgetFilter, elements.stageFilter, elements.corridorFilter].forEach((input) => {
    input.addEventListener(input.tagName === "INPUT" ? "input" : "change", render);
  });
}

main().catch(console.error);
