import {
  loadProjects,
  getFilteredProjects,
  uniqueCorridors,
  getFairEntry,
  getPropSpotScore,
  getWhatsappUrl,
  projectPageUrl,
} from "./shared.js";

const elements = {
  searchInput: document.querySelector("#searchInput"),
  budgetFilter: document.querySelector("#budgetFilter"),
  stageFilter: document.querySelector("#stageFilter"),
  corridorFilter: document.querySelector("#corridorFilter"),
  resultCount: document.querySelector("#resultCount"),
  previewEmpty: document.querySelector("#previewEmpty"),
  previewContent: document.querySelector("#previewContent"),
  previewCode: document.querySelector("#previewCode"),
  previewName: document.querySelector("#previewName"),
  previewMeta: document.querySelector("#previewMeta"),
  previewMetrics: document.querySelector("#previewMetrics"),
  previewCopy: document.querySelector("#previewCopy"),
  openProjectButton: document.querySelector("#openProjectButton"),
  previewWhatsappButton: document.querySelector("#previewWhatsappButton"),
  closePreviewButton: document.querySelector("#closePreviewButton"),
};

const state = {
  projects: [],
  filtered: [],
  previewSlug: null,
  map: null,
  markers: null,
};

function getFilters() {
  return {
    term: elements.searchInput.value,
    budget: elements.budgetFilter.value,
    stage: elements.stageFilter.value,
    corridor: elements.corridorFilter.value,
  };
}

function getStageColor(stage) {
  if (stage === "Upcoming") return "#f3c950";
  if (stage === "New Launch") return "#58d2ff";
  return "#30d07d";
}

function initMap() {
  state.map = window.L.map("projectMap", {
    zoomControl: true,
    attributionControl: true,
  }).setView([28.4595, 77.0266], 11);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap",
  }).addTo(state.map);

  state.markers = window.L.layerGroup().addTo(state.map);
}

function renderPreview() {
  const project = state.filtered.find((item) => item.slug === state.previewSlug);
  if (!project) {
    elements.previewEmpty.hidden = false;
    elements.previewContent.hidden = true;
    return;
  }

  const fair = getFairEntry(project);
  const score = getPropSpotScore(project, state.projects);
  elements.previewEmpty.hidden = true;
  elements.previewContent.hidden = false;
  elements.previewCode.textContent = project.code;
  elements.previewName.textContent = project.name;
  elements.previewMeta.textContent = `${project.location} | ${project.stage}`;
  elements.previewMetrics.innerHTML = [
    ["Builder Price", project.priceSqft ? `Rs ${new Intl.NumberFormat("en-IN").format(project.priceSqft)}` : "POR"],
    ["Fair Entry", fair.low ? `Rs ${new Intl.NumberFormat("en-IN").format(fair.low)}-${new Intl.NumberFormat("en-IN").format(fair.high)}` : "Pending"],
    ["PropSpot Score", `${score.total}/100`],
    ["Possession", project.possession],
  ]
    .map(
      ([label, value]) => `
        <div class="mini-metric">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");
  elements.previewCopy.textContent = `${score.label}. Open the full page to review location intelligence, builder risk, approvals, tracker, comparison, and EMI.`;
  elements.openProjectButton.href = projectPageUrl(project.slug);
  elements.previewWhatsappButton.href = getWhatsappUrl(project);
}

function renderMap() {
  state.markers.clearLayers();
  const bounds = [];
  state.filtered.forEach((project) => {
    if (!Number.isFinite(project.latitude) || !Number.isFinite(project.longitude)) return;
    const score = getPropSpotScore(project, state.projects);
    const marker = window.L.circleMarker([project.latitude, project.longitude], {
      radius: project.slug === state.previewSlug ? 10 : 7,
      weight: project.slug === state.previewSlug ? 3 : 2,
      color: "#081111",
      fillColor: getStageColor(project.stage),
      fillOpacity: 0.95,
    });
    marker.bindTooltip(`${project.name} | ${score.total}/100`, { direction: "top" });
    marker.on("click", () => {
      state.previewSlug = project.slug;
      renderMap();
      renderPreview();
    });
    marker.addTo(state.markers);
    bounds.push([project.latitude, project.longitude]);
  });

  elements.resultCount.textContent = `${state.filtered.length} projects`;
  if (bounds.length) state.map.fitBounds(bounds, { padding: [24, 24] });
}

function render() {
  state.filtered = getFilteredProjects(state.projects, getFilters());
  if (!state.filtered.find((project) => project.slug === state.previewSlug)) {
    const ranked = [...state.filtered].sort(
      (a, b) => getPropSpotScore(b, state.projects).total - getPropSpotScore(a, state.projects).total
    );
    state.previewSlug = ranked[0]?.slug || null;
  }
  renderMap();
  renderPreview();
}

function populateCorridors() {
  elements.corridorFilter.innerHTML = [
    `<option value="all">All corridors</option>`,
    ...uniqueCorridors(state.projects).map((corridor) => `<option value="${corridor}">${corridor}</option>`),
  ].join("");
}

async function main() {
  state.projects = await loadProjects();
  populateCorridors();
  initMap();
  render();

  ["input", "change"].forEach((eventName) => {
    elements.searchInput.addEventListener(eventName, render);
    elements.budgetFilter.addEventListener(eventName, render);
    elements.stageFilter.addEventListener(eventName, render);
    elements.corridorFilter.addEventListener(eventName, render);
  });

  elements.closePreviewButton.addEventListener("click", () => {
    state.previewSlug = null;
    render();
  });
}

main().catch((error) => {
  console.error(error);
});
