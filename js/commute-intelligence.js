import {
  loadProjects,
  getDataSourceMeta,
  loadProjectShortlist,
  projectPageUrl,
  formatCr,
} from "./shared.js?v=20260604a";

const SOCIAL_RADIUS_METERS = 10000;
const MID_RADIUS_METERS = 5000;
const INITIAL_POI_LIMIT = 5;
const POI_LOAD_STEP = 3;
const GURGAON_CENTER = [28.4595, 77.0266];
const MAPLIBRE_CENTER = [GURGAON_CENTER[1], GURGAON_CENTER[0]];
const MAPLIBRE_CAMERA = { pitch: 58, bearing: -22 };

const CITY_ANCHORS = [
  { id: "cyber-city", name: "Cyber City Gurgaon", type: "business", lat: 28.4949, lng: 77.0884 },
  { id: "huda-metro", name: "Millennium City Centre Metro", type: "metro", lat: 28.4593, lng: 77.0726 },
];

const CATEGORY_CONFIG = {
  school: { label: "Schools", color: "#dd8a00", marker: "S" },
  hospital: { label: "Hospitals", color: "#0f5ca8", marker: "H" },
  market: { label: "Markets", color: "#a33f5f", marker: "M" },
  transit: { label: "Transit", color: "#16756f", marker: "T" },
};

const LOCATION_PROFILES = {
  family: {
    label: "Family",
    note: "Schools and hospitals carry more weight.",
    weights: { school: 0.4, hospital: 0.3, market: 0.15, transit: 0.15 },
  },
  investor: {
    label: "Investor",
    note: "Transit and retail catchment matter most.",
    weights: { school: 0.15, hospital: 0.15, market: 0.3, transit: 0.4 },
  },
  convenience: {
    label: "Convenience",
    note: "Balanced day-to-day access score.",
    weights: { school: 0.25, hospital: 0.25, market: 0.25, transit: 0.25 },
  },
};

const GOOGLE_PLACE_QUERIES = {
  school: { keyword: "school", type: "school" },
  hospital: { keyword: "hospital clinic", type: "hospital" },
  market: { keyword: "market mall supermarket", type: "shopping_mall" },
  transit: { keyword: "metro station rapid metro bus station", type: "transit_station" },
};

const GOOGLE_FOCUSED_PLACE_QUERIES = {
  school: [
    "Pathways School Gurgaon",
    "Pathways World School Aravali Gurgaon",
    "Heritage Xperiential Learning School Gurgaon",
    "Heritage School Gurgaon",
    "Delhi Public School Gurgaon",
    "GD Goenka Public School Gurgaon",
    "Shiv Nadar School Gurgaon",
    "The Shri Ram School Gurgaon",
  ],
  hospital: [
    "Medanta The Medicity Gurgaon",
    "Artemis Hospital Gurgaon",
    "Fortis Memorial Research Institute Gurgaon",
    "CK Birla Hospital Gurgaon",
    "Cloudnine Hospital Gurgaon",
    "Paras Hospitals Gurgaon",
    "Marengo Asia Hospitals Gurgaon",
    "W Pratiksha Hospital Gurgaon",
    "Park Hospital Gurgaon",
    "Max Hospital Gurgaon",
  ],
  market: [
    "Airia Mall Gurgaon",
    "Good Earth City Centre Gurgaon",
    "M3M IFC Gurgaon",
    "M3M Urbana Gurgaon",
    "Hong Kong Bazaar Gurgaon",
    "WorldMark Gurgaon Sector 65",
    "South Point Mall Gurgaon",
    "AIPL Joy Street Gurgaon",
    "Baani Square Gurgaon",
    "Raheja Mall Gurgaon",
    "MGF Metropolitan Mall Gurgaon",
  ],
  transit: [
    "Millennium City Centre Metro Gurgaon",
    "Sector 55 56 Rapid Metro Gurgaon",
    "Sector 54 Chowk Rapid Metro Gurgaon",
    "Golf Course Road Rapid Metro Gurgaon",
    "Phase 1 Rapid Metro Gurgaon",
    "Phase 2 Rapid Metro Gurgaon",
    "Sikanderpur Metro Station Gurgaon",
    "Iffco Chowk Metro Station Gurgaon",
    "MG Road Metro Station Gurgaon",
    "Huda City Centre Metro Gurgaon",
  ],
};

const BUYER_RELEVANCE = {
  school: {
    prefer: [
      "international",
      "world",
      "heritage",
      "pathways",
      "delhi public",
      "dps",
      "gd goenka",
      "shiv nadar",
      "shri ram",
      "scottish",
      "lotus valley",
      "suncity",
      "amity",
      "gems",
      "st. xavier",
      "st xavier",
      "dav",
      "kunskapsskolan",
    ],
    avoid: ["primary", "play", "preschool", "pre school", "daycare", "day care", "kid", "kids", "creche", "anganwadi"],
  },
  hospital: {
    prefer: ["medanta", "artemis", "fortis", "paras", "max", "ck birla", "cloudnine", "marengo", "park hospital"],
    avoid: ["clinic", "dental", "physio", "path lab", "diagnostic", "chemist", "pharmacy", "tyagi market"],
  },
  market: {
    prefer: ["mall", "worldmark", "airia", "aipl", "m3m", "good earth", "south point", "hong kong bazaar", "baani", "metropolitan"],
    avoid: ["kirana", "general store", "departmental store", "chemist", "medical store", "tyagi market"],
  },
  transit: {
    prefer: ["metro", "rapid", "station", "sikanderpur", "iffco", "mg road", "millennium", "huda"],
    avoid: ["bus stop", "auto stand", "taxi stand", "mall"],
  },
};

const FALLBACK_POIS = [
  { name: "Medanta - The Medicity", category: "hospital", lat: 28.4392, lng: 77.0407 },
  { name: "Artemis Hospital", category: "hospital", lat: 28.4322, lng: 77.0734 },
  { name: "Fortis Memorial Research Institute", category: "hospital", lat: 28.4591, lng: 77.0728 },
  { name: "DPS Sector 45", category: "school", lat: 28.4427, lng: 77.0604 },
  { name: "The Shri Ram School Aravali", category: "school", lat: 28.4426, lng: 77.1062 },
  { name: "Heritage Xperiential Learning School", category: "school", lat: 28.4217, lng: 77.0653 },
  { name: "Ambience Mall", category: "market", lat: 28.5039, lng: 77.0968 },
  { name: "Good Earth City Centre", category: "market", lat: 28.4132, lng: 77.0514 },
  { name: "Golf Course Road Rapid Metro", category: "transit", lat: 28.4693, lng: 77.0957 },
  { name: "Sector 55-56 Rapid Metro", category: "transit", lat: 28.4213, lng: 77.1049 },
];

const elements = {
  dataSourceBadge: document.querySelector("#dataSourceBadge"),
  projectSelect: document.querySelector("#projectSelect"),
  projectCard: document.querySelector("#projectCard"),
  mapTitle: document.querySelector("#mapTitle"),
  customLocationForm: document.querySelector("#customLocationForm"),
  customName: document.querySelector("#customName"),
  customAddress: document.querySelector("#customAddress"),
  customType: document.querySelector("#customType"),
  customCount: document.querySelector("#customCount"),
  formStatus: document.querySelector("#formStatus"),
  customLocationList: document.querySelector("#customLocationList"),
  locationShortlistCard: document.querySelector("#locationShortlistCard"),
  locationShortlistCount: document.querySelector("#locationShortlistCount"),
  locationShortlist: document.querySelector("#locationShortlist"),
  anchorList: document.querySelector("#anchorList"),
  poiStatus: document.querySelector("#poiStatus"),
  categoryTabs: document.querySelector("#categoryTabs"),
  poiList: document.querySelector("#poiList"),
  loadMorePois: document.querySelector("#loadMorePois"),
  summaryGrid: document.querySelector("#summaryGrid"),
  mapCategoryStrip: document.querySelector("#mapCategoryStrip"),
  mapDetailPanel: document.querySelector("#mapDetailPanel"),
  addressSuggestions: document.querySelector("#addressSuggestions"),
};

const state = {
  projects: [],
  selectedProject: null,
  mapProvider: "maplibre",
  map: null,
  google: null,
  googleServices: null,
  googleMarkers: [],
  activeInfoWindow: null,
  googleCircle: null,
  mapLibreMarkers: [],
  mapLibrePopup: null,
  mapLibreReady: false,
  activeMapDetail: null,
  anchorDistances: {},
  layers: {
    project: L.layerGroup(),
    radius: L.layerGroup(),
    custom: L.layerGroup(),
    anchors: L.layerGroup(),
    pois: L.layerGroup(),
  },
  customLocations: [],
  shortlist: [],
  selectedSuggestion: null,
  suggestionAbort: null,
  pois: [],
  visiblePoiLimit: INITIAL_POI_LIMIT,
  selectedCategory: "school",
  selectedProfile: "family",
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getDistanceKm(a, b) {
  const radiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return "--";
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function displayDistance(row) {
  return row.distanceText || formatDistance(row.distanceKm);
}

function sortDistanceValue(row = {}) {
  return Number.isFinite(row.googleDistanceKm)
    ? row.googleDistanceKm
    : Number.isFinite(row.distanceKm)
      ? row.distanceKm
      : Number.POSITIVE_INFINITY;
}

function compareByGoogleDistance(a, b) {
  const relevanceDelta = (b.relevanceScore || 0) - (a.relevanceScore || 0);
  if (Math.abs(relevanceDelta) >= 25) return relevanceDelta;
  const distanceDelta = sortDistanceValue(a) - sortDistanceValue(b);
  if (distanceDelta) return distanceDelta;
  if (relevanceDelta) return relevanceDelta;
  const ratingA = (a.rating || 0) + Math.min(a.userRatingsTotal || 0, 500) / 1000;
  const ratingB = (b.rating || 0) + Math.min(b.userRatingsTotal || 0, 500) / 1000;
  return ratingB - ratingA;
}

function textIncludesAny(value = "", terms = []) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function normalizedPlaceKey(poi = {}) {
  return `${poi.category}:${String(poi.name || "")
    .toLowerCase()
    .replace(/\bcentre\b/g, "center")
    .replace(/\bhuda\b/g, "millennium")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(gurgaon|gurugram|sector|sec)\b/g, "")
    .trim()
    .slice(0, 54)}`;
}

function capPoisByCategory(pois, limit = 5) {
  const byCategory = Object.fromEntries(Object.keys(CATEGORY_CONFIG).map((category) => [category, []]));
  pois.sort(compareByGoogleDistance).forEach((poi) => {
    const bucket = byCategory[poi.category];
    if (!bucket || bucket.length >= limit) return;
    bucket.push(poi);
  });
  return Object.values(byCategory).flat();
}

function relevanceScore(poi) {
  const rules = BUYER_RELEVANCE[poi.category] || {};
  const name = poi.name || "";
  let score = 0;
  if (poi.source === "focused") score += 70;
  if (textIncludesAny(name, rules.prefer || [])) score += 45;
  if (textIncludesAny(name, rules.avoid || [])) score -= 60;
  if ((poi.rating || 0) >= 4.1) score += 12;
  if ((poi.userRatingsTotal || 0) >= 50) score += 16;
  if ((poi.userRatingsTotal || 0) >= 200) score += 10;
  if (Number.isFinite(poi.distanceKm)) score += Math.max(0, 10 - poi.distanceKm);
  return score;
}

function projectPoint(project) {
  return {
    lat: Number(project.latitude),
    lng: Number(project.longitude),
  };
}

function hasProjectCoordinates(project) {
  const point = projectPoint(project);
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function personalModeActive() {
  return state.customLocations.length > 0;
}

function visiblePois() {
  if (personalModeActive()) return [];
  return state.pois
    .filter((poi) => poi.category === state.selectedCategory)
    .sort(compareByGoogleDistance)
    .slice(0, state.visiblePoiLimit);
}

function markerSize(type = "") {
  if (type === "project") return { width: 42, height: 52, anchorX: 21, anchorY: 50, labelY: 18, labelSize: 13 };
  if (type === "custom") return { width: 48, height: 58, anchorX: 24, anchorY: 56, labelY: 19, labelSize: 11 };
  return { width: 36, height: 46, anchorX: 18, anchorY: 44, labelY: 16, labelSize: 11 };
}

function markerSvg(color, label, type = "") {
  const size = markerSize(type);
  const stroke = type === "project" ? "#f4f0ff" : "#ffffff";
  const shadowOpacity = type === "project" ? "0.32" : "0.24";
  const safeLabel = escapeHtml(label);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
      <ellipse cx="${size.anchorX}" cy="${size.anchorY - 3}" rx="${size.width * 0.24}" ry="4" fill="#000000" opacity="${shadowOpacity}"/>
      <path d="M${size.anchorX} ${size.anchorY - 1}C${size.anchorX} ${size.anchorY - 1} ${size.width - 8} ${size.height * 0.48} ${size.width - 8} ${size.height * 0.27}C${size.width - 8} ${size.height * 0.11} ${size.width * 0.75} 5 ${size.anchorX} 5C${size.width * 0.25} 5 8 ${size.height * 0.11} 8 ${size.height * 0.27}C8 ${size.height * 0.48} ${size.anchorX} ${size.anchorY - 1} ${size.anchorX} ${size.anchorY - 1}Z" fill="${color}" stroke="${stroke}" stroke-width="2.4"/>
      <circle cx="${size.anchorX}" cy="${size.labelY}" r="${type === "project" ? 12 : 10}" fill="#ffffff" opacity="0.96"/>
      <text x="${size.anchorX}" y="${size.labelY + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size.labelSize}" font-weight="800" fill="#08080d">${safeLabel}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function markerIcon(color, label, type = "") {
  const size = markerSize(type);
  return L.divIcon({
    className: "commute-marker",
    html: `<img class="commute-pin commute-pin--${escapeHtml(type)}" src="${markerSvg(color, label, type)}" alt="" />`,
    iconSize: [size.width, size.height],
    iconAnchor: [size.anchorX, size.anchorY],
  });
}

function setupMarkerStyles() {
  if (document.querySelector("#commuteMarkerStyles")) return;
  const style = document.createElement("style");
  style.id = "commuteMarkerStyles";
  style.textContent = `
  `;
  document.head.appendChild(style);
}

function renderDataSourceBadge() {
  const meta = getDataSourceMeta();
  elements.dataSourceBadge.textContent = state.googleServices
    ? `${meta.label} + MapLibre 3D + Google Places · Build 20260606-2`
    : `${meta.label} + MapLibre 3D · Build 20260606-2`;
  elements.dataSourceBadge.classList.toggle("source-badge--live", meta.tone === "live");
}

function googleMapRejected() {
  const mapText = document.querySelector("#commuteMap")?.innerText || "";
  return (
    mapText.includes("can't load Google Maps correctly") ||
    mapText.includes("didn't load Google Maps correctly")
  );
}

async function getGoogleMapsApiKey() {
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("gmapsKey");
  if (urlKey) {
    window.localStorage.setItem("plinthGoogleMapsKey", urlKey);
    return urlKey;
  }
  const savedKey = window.localStorage.getItem("plinthGoogleMapsKey");
  if (savedKey) return savedKey;
  try {
    const response = await fetch("/api/google-maps-key");
    if (!response.ok) return "";
    const payload = await response.json();
    return payload.apiKey || "";
  } catch {
    return "";
  }
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  return new Promise((resolve, reject) => {
    const callbackName = `initPlinthGoogleMaps${Date.now()}`;
    const previousAuthFailure = window.gm_authFailure;
    let settled = false;
    const cleanup = () => {
      delete window[callbackName];
      window.gm_authFailure = previousAuthFailure;
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    window[callbackName] = () => {
      if (settled) return;
      const maps = window.google?.maps;
      if (!maps) {
        fail(new Error("Google Maps did not initialize"));
        return;
      }
      window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(maps);
      }, 400);
    };
    window.gm_authFailure = () => {
      if (typeof previousAuthFailure === "function") previousAuthFailure();
      fail(new Error("Google Maps authentication failed"));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => fail(new Error("Unable to load Google Maps"));
    document.head.appendChild(script);
  });
}

function initGoogleServices(apiKey) {
  if (!apiKey) return Promise.resolve(false);
  return loadGoogleMaps(apiKey)
    .then((maps) => {
      state.google = maps;
      const placesHost = document.createElement("div");
      placesHost.className = "google-services-host";
      placesHost.setAttribute("aria-hidden", "true");
      document.body.appendChild(placesHost);
      state.googleServices = {
        places: new maps.places.PlacesService(placesHost),
        geocoder: new maps.Geocoder(),
        autocomplete: new maps.places.AutocompleteService(),
        distanceMatrix: new maps.DistanceMatrixService(),
      };
      return true;
    })
    .catch((error) => {
      console.warn("Google services unavailable; MapLibre will use open-data fallbacks", error);
      state.google = null;
      state.googleServices = null;
      return false;
    });
}

async function initGoogleMap(apiKey) {
  state.google = await loadGoogleMaps(apiKey);
  state.mapProvider = "google";
  const mapElement = document.querySelector("#commuteMap");
  state.map = new state.google.Map(mapElement, {
    center: { lat: GURGAON_CENTER[0], lng: GURGAON_CENTER[1] },
    zoom: 11,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    clickableIcons: false,
    styles: [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    ],
  });
  state.googleServices = {
    places: new state.google.places.PlacesService(state.map),
    geocoder: new state.google.Geocoder(),
    autocomplete: new state.google.places.AutocompleteService(),
    distanceMatrix: new state.google.DistanceMatrixService(),
  };
  state.map.addListener("click", () => {
    if (state.activeInfoWindow) {
      state.activeInfoWindow.close();
      state.activeInfoWindow = null;
    }
  });
  await new Promise((resolve) => window.setTimeout(resolve, 3500));
  if (googleMapRejected()) {
    throw new Error("Google Maps key was rejected for this page");
  }
}

function initLeafletMap() {
  setupMarkerStyles();
  state.mapProvider = "leaflet";
  state.map = L.map("commuteMap", {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView(GURGAON_CENTER, 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(state.map);
  state.map.on("click", () => state.map.closePopup());

  Object.values(state.layers).forEach((layer) => layer.addTo(state.map));
}

function mapLibreStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
        maxzoom: 19,
      },
      terrainSource: {
        type: "raster-dem",
        url: "https://tiles.mapterhorn.com/tilejson.json",
      },
      hillshadeSource: {
        type: "raster-dem",
        url: "https://tiles.mapterhorn.com/tilejson.json",
      },
      radius: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      { id: "osm", type: "raster", source: "osm" },
      {
        id: "terrain-shade",
        type: "hillshade",
        source: "hillshadeSource",
        paint: {
          "hillshade-shadow-color": "#2c2a33",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-accent-color": "#6d6978",
        },
      },
      {
        id: "social-radius",
        type: "fill",
        source: "radius",
        paint: {
          "fill-color": "#7c6af5",
          "fill-opacity": 0.1,
        },
      },
      {
        id: "social-radius-outline",
        type: "line",
        source: "radius",
        paint: {
          "line-color": "#7c6af5",
          "line-width": 1.4,
          "line-opacity": 0.75,
        },
      },
    ],
    terrain: {
      source: "terrainSource",
      exaggeration: 1.15,
    },
    sky: {},
  };
}

function initMapLibreMap() {
  setupMarkerStyles();
  state.mapProvider = "maplibre";
  state.mapLibreReady = false;
  state.map = new maplibregl.Map({
    container: "commuteMap",
    style: "https://tiles.openfreemap.org/styles/bright",
    center: MAPLIBRE_CENTER,
    zoom: 11.3,
    pitch: MAPLIBRE_CAMERA.pitch,
    bearing: MAPLIBRE_CAMERA.bearing,
    maxPitch: 78,
    antialias: true,
  });
  state.map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true,
    }),
    "top-right",
  );
  state.map.on("click", (event) => {
    const target = event.originalEvent?.target;
    if (!target?.closest?.(".maplibre-commute-marker")) {
      closeMapLibrePopup();
      renderMapDetail(null);
    }
  });
  state.map.on("mousemove", (event) => {
    const target = event.originalEvent?.target;
    if (state.mapLibrePopup && !target?.closest?.(".maplibre-commute-marker")) {
      closeMapLibrePopup();
    }
  });
  state.map.on("load", () => {
    addMapLibreTerrain();
    addMapLibreOverlayLayers();
    addMapLibreBuildingsLayer();
    state.mapLibreReady = true;
    if (state.selectedProject) renderMap();
  });
}

function addMapLibreTerrain() {
  if (!state.map || state.map.getSource("terrainSource")) return;
  state.map.addSource("terrainSource", {
    type: "raster-dem",
    url: "https://tiles.mapterhorn.com/tilejson.json",
  });
  state.map.addSource("hillshadeSource", {
    type: "raster-dem",
    url: "https://tiles.mapterhorn.com/tilejson.json",
  });
  state.map.addLayer({
    id: "terrain-shade",
    type: "hillshade",
    source: "hillshadeSource",
    paint: {
      "hillshade-shadow-color": "#2c2a33",
      "hillshade-highlight-color": "#ffffff",
      "hillshade-accent-color": "#6d6978",
    },
  });
  state.map.setTerrain({ source: "terrainSource", exaggeration: 1.15 });
  if (maplibregl.TerrainControl) {
    state.map.addControl(
      new maplibregl.TerrainControl({
        source: "terrainSource",
        exaggeration: 1.15,
      }),
      "top-right",
    );
  }
}

function addMapLibreOverlayLayers() {
  if (!state.map || state.map.getSource("radius")) return;
  state.map.addSource("radius", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  state.map.addSource("radius-rings", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  state.map.addSource("connections", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  state.map.addLayer({
    id: "social-radius",
    type: "fill",
    source: "radius",
    paint: {
      "fill-color": "#16756f",
      "fill-opacity": 0.075,
    },
  });
  state.map.addLayer({
    id: "social-connections",
    type: "line",
    source: "connections",
    paint: {
      "line-color": ["coalesce", ["get", "color"], "#16756f"],
      "line-width": 2.5,
      "line-opacity": 0.82,
      "line-dasharray": [1.2, 1],
    },
  });
  state.map.addLayer({
    id: "social-radius-rings",
    type: "line",
    source: "radius-rings",
    paint: {
      "line-color": "#2f3137",
      "line-width": ["match", ["get", "label"], "5 km", 1.1, 1.4],
      "line-opacity": ["match", ["get", "label"], "5 km", 0.35, 0.7],
      "line-dasharray": [1.2, 1.8],
    },
  });
  state.map.addLayer({
    id: "social-radius-outline",
    type: "line",
    source: "radius",
    paint: {
      "line-color": "#2f3137",
      "line-width": 1.4,
      "line-opacity": 0.55,
      "line-dasharray": [1.2, 1.8],
    },
  });
}

function addMapLibreBuildingsLayer() {
  if (!state.map || state.map.getLayer("plinth-3d-buildings")) return;
  if (!state.map.getSource("openfreemap")) {
    state.map.addSource("openfreemap", {
      url: "https://tiles.openfreemap.org/planet",
      type: "vector",
    });
  }
  const labelLayer = state.map
    .getStyle()
    .layers
    .find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;
  state.map.addLayer({
    id: "plinth-3d-buildings",
    source: "openfreemap",
    "source-layer": "building",
    type: "fill-extrusion",
    minzoom: 14,
    filter: ["!=", ["get", "hide_3d"], true],
    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        ["get", "render_height"],
        0,
        "#d7d4e8",
        80,
        "#9a91d6",
        220,
        "#7c6af5",
      ],
      "fill-extrusion-height": [
        "interpolate",
        ["linear"],
        ["zoom"],
        14,
        0,
        16,
        ["coalesce", ["get", "render_height"], 18],
      ],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-opacity": 0.42,
    },
  }, labelLayer);
}

async function initMap() {
  initMapLibreMap();
  const apiKey = await getGoogleMapsApiKey();
  const googleReady = await initGoogleServices(apiKey);
  if (!googleReady) {
    elements.formStatus.textContent = "Using MapLibre 3D map with open-data place fallback.";
  }
  renderDataSourceBadge();
}

async function fallbackFromRejectedGoogleMap() {
  if (state.mapProvider !== "google" || !googleMapRejected()) return;
  console.warn("Google Maps key was rejected after initialization; switching to Leaflet fallback");
  elements.formStatus.textContent = "Google Maps key is still rejected for this page. Using fallback map.";
  document.querySelector("#commuteMap").innerHTML = "";
  state.mapProvider = "leaflet";
  state.map = null;
  initLeafletMap();
  renderDataSourceBadge();
  if (state.selectedProject) {
    renderMap();
    await loadNearbyInfrastructure();
  }
}

function watchForGoogleMapRejection() {
  window.setTimeout(() => fallbackFromRejectedGoogleMap(), 4500);
  window.setTimeout(() => fallbackFromRejectedGoogleMap(), 9000);
  window.setTimeout(() => fallbackFromRejectedGoogleMap(), 14000);
}

function getProjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || params.get("project");
  if (!slug) return null;
  return state.projects.find((project) => project.slug === slug || project.legacySlug === slug) || null;
}

function renderProjectOptions() {
  elements.projectSelect.innerHTML = state.projects
    .filter(hasProjectCoordinates)
    .map((project) => `<option value="${escapeHtml(project.slug)}">${escapeHtml(project.name)}</option>`)
    .join("");
}

function renderLocationShortlist() {
  const projects = state.shortlist
    .map((slug) => state.projects.find((project) => project.slug === slug || project.legacySlug === slug))
    .filter(Boolean);
  elements.locationShortlistCard.hidden = projects.length === 0;
  elements.locationShortlistCount.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;
  elements.locationShortlist.innerHTML = projects
    .map(
      (project) => `
        <button class="location-shortlist-project${state.selectedProject?.slug === project.slug ? " active" : ""}" data-shortlist-project="${escapeHtml(project.slug)}" type="button">
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(project.corridor || project.location || "Gurugram")} | ${formatCr(project.priceCr)}</span>
        </button>
      `,
    )
    .join("");
  elements.locationShortlist.querySelectorAll("[data-shortlist-project]").forEach((button) => {
    button.addEventListener("click", () => {
      const project = state.projects.find((item) => item.slug === button.dataset.shortlistProject);
      if (project) setSelectedProject(project);
    });
  });
}

function setSelectedProject(project) {
  state.selectedProject = project;
  state.visiblePoiLimit = INITIAL_POI_LIMIT;
  elements.projectSelect.value = project.slug;
  window.history.replaceState(null, "", `?slug=${encodeURIComponent(project.slug)}`);
  renderProject();
  renderLocationShortlist();
  renderMap();
  loadNearbyInfrastructure();
}

function renderProject() {
  const project = state.selectedProject;
  elements.mapTitle.textContent = project.name;
  elements.projectCard.innerHTML = `
    <strong>${escapeHtml(project.name)}</strong>
    <span>${escapeHtml(project.location || project.sector || "Gurugram")}</span>
    <div class="mini-fact-row">
      <i>${escapeHtml(project.stage || "Stage pending")}</i>
      <i>${formatCr(project.priceCr)}</i>
      <i>${escapeHtml(project.reraNumber || "RERA pending")}</i>
    </div>
    <a class="location-distance" href="${projectPageUrl(project.slug)}">Open project page</a>
  `;
}

function addPointMarker(layer, point, options) {
  const popup = markerInfoContent(options);
  const marker = L.marker([point.lat, point.lng], {
    icon: markerIcon(options.color, options.label, options.type),
  }).bindPopup(popup, {
    closeButton: false,
    className: "commute-leaflet-popup",
    maxWidth: 280,
  });
  marker.on("mouseover", () => marker.openPopup());
  marker.on("mouseout", () => marker.closePopup());
  marker.on("click", () => marker.openPopup());
  marker.addTo(layer);
  return marker;
}

function markerTypeLabel(type = "") {
  if (type === "project") return "Selected project";
  if (type === "custom") return "Your location";
  if (type === "anchor") return "City anchor";
  return "Nearby infrastructure";
}

function markerInfoContent(options) {
  return `
    <div class="commute-info-card">
      <div class="commute-info-top">
        <span class="commute-info-pin" style="background:${options.color};">${escapeHtml(options.label)}</span>
        <span>${escapeHtml(markerTypeLabel(options.type))}</span>
      </div>
      <strong>${escapeHtml(options.title)}</strong>
      ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ""}
    </div>
  `;
}

function markerHoverContent(item, options = {}) {
  const meta = item?.category ? detailTypeMeta(item) : detailTypeMeta({ type: options.type });
  return `
    <div class="pin-hover-card">
      <span class="pin-hover-dot" style="background:${meta.color};">${escapeHtml(meta.marker || options.label || "")}</span>
      <div>
        <strong>${escapeHtml(item?.name || options.title || "Location")}</strong>
        <small>${escapeHtml(item ? detailDistance(item) : options.subtitle || "")}</small>
      </div>
    </div>
  `;
}

function detailTypeMeta(item = {}) {
  if (item.type === "project") return { label: "Selected project", color: "#16756f", marker: "P" };
  if (item.type === "custom") return { label: "Your location", color: "#a33f5f", marker: "U" };
  if (item.type === "anchor") return { label: "City anchor", color: "#16756f", marker: "C" };
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.market;
  return { label: config.label, color: config.color, marker: config.marker };
}

function detailDistance(item = {}) {
  const center = state.selectedProject ? projectPoint(state.selectedProject) : null;
  if (item.distanceText) return item.distanceText;
  if (Number.isFinite(item.distanceKm)) return formatDistance(item.distanceKm);
  if (center && Number.isFinite(item.lat) && Number.isFinite(item.lng)) return formatDistance(getDistanceKm(center, item));
  return "--";
}

function nearestPoiByCategory(category) {
  return state.pois
    .filter((poi) => poi.category === category)
    .sort(compareByGoogleDistance)[0];
}

function topPoisByCategory(category, limit = 5) {
  return state.pois
    .filter((poi) => poi.category === category)
    .sort(compareByGoogleDistance)
    .slice(0, limit);
}

function categoryScore(category) {
  const nearest = nearestPoiByCategory(category);
  if (!nearest) return 0;
  const distance = sortDistanceValue(nearest);
  return Math.max(0, Math.min(100, Math.round(100 - distance * 9)));
}

function profileWeight(category) {
  return LOCATION_PROFILES[state.selectedProfile]?.weights?.[category] || 0;
}

function overallLocationScore() {
  const categories = Object.keys(CATEGORY_CONFIG);
  const weightedRows = categories
    .map((category) => ({ score: categoryScore(category), weight: profileWeight(category) }))
    .filter((row) => row.score > 0 && row.weight > 0);
  const totalWeight = weightedRows.reduce((sum, row) => sum + row.weight, 0);
  if (!weightedRows.length || !totalWeight) return "--";
  return Math.round(weightedRows.reduce((sum, row) => sum + row.score * row.weight, 0) / totalWeight);
}

function closeMapDetail() {
  state.activeMapDetail = null;
  document.querySelector(".map-panel")?.classList.remove("has-detail");
  elements.mapDetailPanel?.classList.add("is-empty");
  elements.mapDetailPanel?.classList.remove("is-open");
  window.setTimeout(() => state.map?.resize?.(), 260);
}

function renderMapDetail(item = null) {
  if (!elements.mapDetailPanel || !state.selectedProject) return;
  const mapPanel = document.querySelector(".map-panel");
  const project = state.selectedProject;
  const selectedCategory = item?.category || state.selectedCategory;
  const selectedMeta = item ? detailTypeMeta(item) : null;
  const selectedDistance = item ? detailDistance(item) : "";
  state.activeMapDetail = item;
  mapPanel?.classList.add("has-detail");
  elements.mapDetailPanel.classList.remove("is-empty");
  elements.mapDetailPanel.classList.add("is-open");
  window.setTimeout(() => state.map?.resize?.(), 260);

  const nearestRows = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const nearest = nearestPoiByCategory(category);
    const active = category === selectedCategory;
    return `
      <button class="vibe-essential-row${active ? " active" : ""}" data-detail-category="${category}" type="button">
        <span class="vibe-essential-dot" style="background:${config.color};">${escapeHtml(config.marker)}</span>
        <span>
          <strong>${escapeHtml(config.label)}</strong>
          <small>${escapeHtml(nearest?.name || "Not surfaced")}</small>
        </span>
        <i>${escapeHtml(nearest ? displayDistance(nearest) : "--")}</i>
      </button>
    `;
  }).join("");

  const scoreRows = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const score = categoryScore(category);
    const active = category === selectedCategory;
    const weight = Math.round(profileWeight(category) * 100);
    return `
      <button class="vibe-score-row${active ? " active" : ""}" data-detail-category="${category}" type="button">
        <span>${escapeHtml(config.label)}<small>${weight}% weight</small></span>
        <strong>${score || "--"}</strong>
        <i><b style="width:${score || 0}%; background:${config.color};"></b></i>
      </button>
    `;
  }).join("");

  const profile = LOCATION_PROFILES[state.selectedProfile] || LOCATION_PROFILES.family;
  const profileButtons = Object.entries(LOCATION_PROFILES).map(([profileId, profileConfig]) => `
    <button class="vibe-profile-chip${profileId === state.selectedProfile ? " active" : ""}" data-location-profile="${profileId}" type="button">
      ${escapeHtml(profileConfig.label)}
    </button>
  `).join("");

  const categoryDetailSections = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const pois = topPoisByCategory(category, 5);
    const active = category === selectedCategory;
    return `
      <section class="vibe-category-section${active ? " active" : ""}">
        <button class="vibe-category-head" data-detail-category="${category}" type="button">
          <span class="vibe-essential-dot" style="background:${config.color};">${escapeHtml(config.marker)}</span>
          <strong>${escapeHtml(config.label)}</strong>
          <i>${pois.length ? `${pois.length} shown` : "Not surfaced"}</i>
        </button>
        <div class="vibe-category-list">
          ${
            pois.length
              ? pois.map((poi) => `
                  <div class="vibe-infra-row">
                    <span>
                      <strong>${escapeHtml(poi.name)}</strong>
                      <small>${escapeHtml(poi.durationText || poi.rating ? `${poi.durationText || "Drive estimate"}${poi.rating ? ` · ${poi.rating} rating` : ""}` : "Google-ranked place")}</small>
                    </span>
                    <i>${escapeHtml(displayDistance(poi))}</i>
                  </div>
                `).join("")
              : `<div class="vibe-infra-row"><span><strong>No buyer-relevant ${escapeHtml(config.label.toLowerCase())}</strong><small>Try expanding the radius later</small></span><i>--</i></div>`
          }
        </div>
      </section>
    `;
  }).join("");

  elements.mapDetailPanel.innerHTML = `
    <button class="map-detail-close" type="button" aria-label="Reset details">x</button>
    <div class="vibe-project-head">
      <span>${escapeHtml(project.location || project.sector || "Gurugram")}</span>
      <strong>${escapeHtml(project.name)}</strong>
      <small>${escapeHtml(project.stage || "Project")} · ${formatCr(project.priceCr)}</small>
    </div>
    <section class="vibe-score-card">
      <div class="vibe-score-orb">${escapeHtml(overallLocationScore())}</div>
      <div>
        <span class="map-detail-kicker">Location Score</span>
        <strong>Social infrastructure</strong>
        <p>${escapeHtml(profile.note)}</p>
      </div>
    </section>
    <section class="vibe-profile-switch" aria-label="Location scoring profile">
      ${profileButtons}
    </section>
    <section class="vibe-score-list">
      ${scoreRows}
    </section>
    ${
      item
        ? `<section class="vibe-selected-card">
            <span class="vibe-essential-dot" style="background:${selectedMeta.color};">${escapeHtml(selectedMeta.marker)}</span>
            <div>
              <span class="map-detail-kicker">${escapeHtml(selectedMeta.label)}</span>
              <strong>${escapeHtml(item.name || "Selected location")}</strong>
              <small>${escapeHtml(selectedDistance)}${item.durationText ? ` · ${escapeHtml(item.durationText)}` : ""}</small>
            </div>
          </section>`
        : ""
    }
    <section>
      <div class="vibe-section-title">Nearest essentials</div>
      <div class="vibe-essential-list">${nearestRows}</div>
    </section>
    <section>
      <div class="vibe-section-title">Social infrastructure details</div>
      <div class="vibe-category-stack">${categoryDetailSections}</div>
    </section>
  `;
  elements.mapDetailPanel.querySelector(".map-detail-close")?.addEventListener("click", closeMapDetail);
  elements.mapDetailPanel.querySelectorAll("[data-location-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProfile = button.dataset.locationProfile;
      renderMapDetail(state.activeMapDetail);
    });
  });
  elements.mapDetailPanel.querySelectorAll("[data-detail-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.detailCategory;
      state.visiblePoiLimit = INITIAL_POI_LIMIT;
      state.activeMapDetail = null;
      renderCategoryTabs();
      renderMap();
    });
  });
}

function clearGoogleMap() {
  state.googleMarkers.forEach((marker) => marker.setMap(null));
  state.googleMarkers = [];
  if (state.activeInfoWindow) {
    state.activeInfoWindow.close();
    state.activeInfoWindow = null;
  }
  if (state.googleCircle) {
    state.googleCircle.setMap(null);
    state.googleCircle = null;
  }
}

function addGoogleMarker(point, options) {
  const size = markerSize(options.type);
  const marker = new state.google.Marker({
    position: { lat: point.lat, lng: point.lng },
    map: state.map,
    title: options.title,
    icon: {
      url: markerSvg(options.color, options.label, options.type),
      scaledSize: new state.google.Size(size.width, size.height),
      anchor: new state.google.Point(size.anchorX, size.anchorY),
    },
    optimized: true,
    zIndex: options.type === "project" ? 30 : options.type === "custom" ? 25 : 15,
  });
  const infoWindow = new state.google.InfoWindow({
    content: markerInfoContent(options),
    maxWidth: 280,
  });
  const openInfoWindow = () => {
    if (state.activeInfoWindow && state.activeInfoWindow !== infoWindow) {
      state.activeInfoWindow.close();
    }
    state.activeInfoWindow = infoWindow;
    infoWindow.open({ anchor: marker, map: state.map });
  };
  const closeInfoWindow = () => {
    infoWindow.close();
    if (state.activeInfoWindow === infoWindow) state.activeInfoWindow = null;
  };
  marker.addListener("mouseover", openInfoWindow);
  marker.addListener("mouseout", closeInfoWindow);
  marker.addListener("click", openInfoWindow);
  state.googleMarkers.push(marker);
  return marker;
}

function closeMapLibrePopup() {
  if (state.mapLibrePopup) {
    state.mapLibrePopup.remove();
    state.mapLibrePopup = null;
  }
}

function clearMapLibreMap() {
  state.mapLibreMarkers.forEach((marker) => marker.remove());
  state.mapLibreMarkers = [];
  closeMapLibrePopup();
  const source = state.map?.getSource("radius");
  if (source) {
    source.setData({ type: "FeatureCollection", features: [] });
  }
  const ringsSource = state.map?.getSource("radius-rings");
  if (ringsSource) {
    ringsSource.setData({ type: "FeatureCollection", features: [] });
  }
  const connectionsSource = state.map?.getSource("connections");
  if (connectionsSource) {
    connectionsSource.setData({ type: "FeatureCollection", features: [] });
  }
}

function circleFeature(center, radiusMeters, steps = 96) {
  const coordinates = [];
  const latRadians = (center.lat * Math.PI) / 180;
  const kmPerDegreeLat = 110.574;
  const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
  const radiusKm = radiusMeters / 1000;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    coordinates.push([
      center.lng + (Math.cos(angle) * radiusKm) / kmPerDegreeLng,
      center.lat + (Math.sin(angle) * radiusKm) / kmPerDegreeLat,
    ]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coordinates] },
    properties: {},
  };
}

function circleLineFeature(center, radiusMeters, label, steps = 128) {
  const feature = circleFeature(center, radiusMeters, steps);
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: feature.geometry.coordinates[0],
    },
    properties: { label },
  };
}

function setMapLibreRadius(center) {
  const source = state.map?.getSource("radius");
  if (!source) return;
  source.setData({
    type: "FeatureCollection",
    features: [circleFeature(center, SOCIAL_RADIUS_METERS)],
  });
  const ringsSource = state.map?.getSource("radius-rings");
  if (ringsSource) {
    ringsSource.setData({
      type: "FeatureCollection",
      features: [
        circleLineFeature(center, MID_RADIUS_METERS, "5 km"),
        circleLineFeature(center, SOCIAL_RADIUS_METERS, "10 km"),
      ],
    });
  }
}

function setMapLibreConnections(center, points) {
  const source = state.map?.getSource("connections");
  if (!source) return;
  source.setData({
    type: "FeatureCollection",
    features: points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .map((point) => {
        const config = CATEGORY_CONFIG[point.category] || {};
        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [center.lng, center.lat],
              [point.lng, point.lat],
            ],
          },
          properties: {
            color: point.pathColor || config.color || "#16756f",
            kind: point.type || point.category || "poi",
          },
        };
      }),
  });
}

function markerElement(color, label, type = "") {
  const element = document.createElement("button");
  element.className = `maplibre-commute-marker maplibre-commute-marker--${type || "poi"}`;
  element.type = "button";
  element.style.setProperty("--pin-color", color);
  element.innerHTML = `
    <span class="map-dot map-dot--${escapeHtml(type || "poi")}">
      <span>${escapeHtml(label)}</span>
    </span>
  `;
  return element;
}

function addMapLibreMarker(point, options) {
  const element = markerElement(options.color, options.label, options.type);
  const detailItem = options.detailItem || {
    ...point,
    name: options.title,
    subtitle: options.subtitle,
    type: options.type,
  };
  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "pin-hover-popup",
    offset: 18,
    maxWidth: "260px",
  }).setHTML(markerHoverContent(detailItem, options));
  const marker = new maplibregl.Marker({
    element,
    anchor: "center",
    offset: [0, 0],
  })
    .setLngLat([point.lng, point.lat])
    .addTo(state.map);
  const openPinHover = () => {
    closeMapLibrePopup();
    state.mapLibrePopup = popup.setLngLat([point.lng, point.lat]).addTo(state.map);
  };
  const openDetail = () => {
    if (detailItem.category) {
      state.selectedCategory = detailItem.category;
      renderCategoryTabs();
      renderMapDetail(detailItem);
      return;
    }
    renderMapDetail(detailItem);
  };
  element.addEventListener("mouseenter", openPinHover);
  element.addEventListener("mouseleave", closeMapLibrePopup);
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    openPinHover();
    openDetail();
  });
  state.mapLibreMarkers.push(marker);
  return marker;
}

function fitMapLibreToPoints(points) {
  if (!points.length || !state.map) return;
  const bounds = new maplibregl.LngLatBounds();
  points.forEach((point) => bounds.extend([point.lng, point.lat]));
  state.map.fitBounds(bounds, {
    padding: { top: 70, right: 70, bottom: 70, left: 70 },
    maxZoom: 13.5,
    duration: 900,
  });
  window.setTimeout(() => {
    state.map.easeTo({
      pitch: MAPLIBRE_CAMERA.pitch,
      bearing: MAPLIBRE_CAMERA.bearing,
      duration: 700,
    });
  }, 950);
}

function renderGoogleMap() {
  const project = state.selectedProject;
  const center = projectPoint(project);
  const bounds = new state.google.LatLngBounds();
  clearGoogleMap();

  addGoogleMarker(center, {
    color: "#7c6af5",
    label: "P",
    type: "project",
    title: project.name,
    subtitle: project.location,
  });
  bounds.extend(center);

  if (!personalModeActive()) {
    state.googleCircle = new state.google.Circle({
      map: state.map,
      center,
      radius: SOCIAL_RADIUS_METERS,
      strokeColor: "#7c6af5",
      strokeOpacity: 0.7,
      strokeWeight: 1,
      fillColor: "#7c6af5",
      fillOpacity: 0.07,
    });

    CITY_ANCHORS.forEach((anchor) => {
      const anchorDistance = state.anchorDistances[anchor.id] || { distanceKm: getDistanceKm(center, anchor) };
      addGoogleMarker(anchor, {
        color: "#4ade80",
        label: "C",
        type: "anchor",
        title: anchor.name,
        subtitle: `${displayDistance({ ...anchor, ...anchorDistance })} from project`,
      });
      bounds.extend(anchor);
    });
  }

  state.customLocations.forEach((location) => {
    addGoogleMarker(location, {
      color: "#f5a623",
      label: "U",
      type: "custom",
      title: location.name,
      subtitle: `${displayDistance(location)} from project`,
    });
    bounds.extend(location);
  });

  visiblePois().forEach((poi) => {
    const config = CATEGORY_CONFIG[poi.category] || CATEGORY_CONFIG.market;
    addGoogleMarker(poi, {
      color: config.color,
      label: config.marker,
      type: "poi",
      title: poi.name,
      subtitle: `${displayDistance(poi)} from project`,
    });
    bounds.extend(poi);
  });

  state.map.fitBounds(bounds, 80);
  state.google.event.addListenerOnce(state.map, "bounds_changed", () => {
    if (state.map.getZoom() > 13) state.map.setZoom(13);
  });
  renderLists();
}

function renderMap() {
  const project = state.selectedProject;
  const center = projectPoint(project);

  if (state.mapProvider === "google") {
    renderGoogleMap();
    return;
  }

  if (!state.mapLibreReady) {
    renderLists();
    return;
  }

  clearMapLibreMap();

  addMapLibreMarker(center, {
    color: "#16756f",
    label: "P",
    type: "project",
    title: project.name,
    subtitle: project.location,
    detailItem: {
      ...center,
      name: project.name,
      location: project.location,
      type: "project",
      subtitle: project.reraNumber || project.stage || "Selected project",
    },
  });

  const connectionPoints = [];

  if (!personalModeActive()) {
    setMapLibreRadius(center);

    CITY_ANCHORS.forEach((anchor) => {
      const anchorDistance = state.anchorDistances[anchor.id] || { distanceKm: getDistanceKm(center, anchor) };
      const detailItem = {
        ...anchor,
        ...anchorDistance,
        type: "anchor",
        pathColor: "#16756f",
        subtitle: `${anchor.type} from selected project`,
      };
      addMapLibreMarker(anchor, {
        color: "#16756f",
        label: "C",
        type: "anchor",
        title: anchor.name,
        subtitle: `${displayDistance(detailItem)} from project`,
        detailItem,
      });
      connectionPoints.push(detailItem);
    });
  }

  state.customLocations.forEach((location) => {
    const detailItem = {
      ...location,
      distanceKm: location.distanceKm ?? getDistanceKm(center, location),
      type: "custom",
      pathColor: "#a33f5f",
      subtitle: location.address,
    };
    addMapLibreMarker(location, {
      color: "#a33f5f",
      label: "U",
      type: "custom",
      title: location.name,
      subtitle: `${displayDistance(detailItem)} from project`,
      detailItem,
    });
    connectionPoints.push(detailItem);
  });

  visiblePois().forEach((poi) => {
    const config = CATEGORY_CONFIG[poi.category] || CATEGORY_CONFIG.market;
    const detailItem = {
      ...poi,
      type: "poi",
      pathColor: config.color,
      subtitle: `${config.label} near selected project`,
    };
    addMapLibreMarker(poi, {
      color: config.color,
      label: config.marker,
      type: "poi",
      title: poi.name,
      subtitle: `${displayDistance(poi)} from project`,
      detailItem,
    });
    connectionPoints.push(detailItem);
  });

  setMapLibreConnections(center, connectionPoints);

  const points = [
    center,
    ...(personalModeActive() ? [] : CITY_ANCHORS),
    ...state.customLocations,
    ...visiblePois(),
  ];
  fitMapLibreToPoints(points);

  renderLists();
  if (!state.activeMapDetail) renderMapDetail(null);
}

function renderLocationList(target, rows, options = {}) {
  const emptyTitle = options.emptyTitle || "No locations yet";
  const emptyText = options.emptyText || "Add one above";
  target.innerHTML = rows.length
    ? rows
        .map((row) => {
          const right = options.removable
            ? `<button class="location-remove" data-remove="${escapeHtml(row.id)}" type="button">Remove</button>`
            : `<span class="location-distance">${escapeHtml(displayDistance(row))}</span>`;
          return `
            <div class="location-item">
              <div>
                <strong>${escapeHtml(row.name)}</strong>
                <span>${escapeHtml(row.subtitle || row.type || "")}</span>
              </div>
              ${right}
            </div>
          `;
        })
        .join("")
    : `<div class="location-item"><div><strong>${escapeHtml(emptyTitle)}</strong><span>${escapeHtml(emptyText)}</span></div></div>`;
}

function renderLists() {
  const center = projectPoint(state.selectedProject);
  const isPersonalMode = personalModeActive();

  const anchorRows = CITY_ANCHORS.map((anchor) => ({
    ...anchor,
    ...(state.anchorDistances[anchor.id] || {}),
    distanceKm: state.anchorDistances[anchor.id]?.distanceKm ?? getDistanceKm(center, anchor),
    subtitle: anchor.type,
  })).sort(compareByGoogleDistance);
  renderLocationList(
    elements.anchorList,
    isPersonalMode ? [] : anchorRows,
    { emptyTitle: isPersonalMode ? "Personal mode active" : "No anchors", emptyText: isPersonalMode ? "Clear saved locations to restore city anchors" : "Anchors unavailable" },
  );

  const customRows = state.customLocations
    .map((location) => ({
      ...location,
      distanceKm: location.distanceKm ?? getDistanceKm(center, location),
      subtitle: location.address,
    }))
    .sort(compareByGoogleDistance);
  renderLocationList(elements.customLocationList, customRows, { removable: true });
  elements.customCount.textContent = `${customRows.length} saved`;

  const categoryPois = state.pois
    .filter((poi) => poi.category === state.selectedCategory)
    .sort(compareByGoogleDistance);
  const poiRows = isPersonalMode ? [] : categoryPois.slice(0, state.visiblePoiLimit);
  renderLocationList(
    elements.poiList,
    poiRows,
    { emptyTitle: isPersonalMode ? "Personal mode active" : "No nearby infra", emptyText: isPersonalMode ? "Nearby infra pins are hidden while your locations are shown" : "Try another category" },
  );
  elements.loadMorePois.hidden = isPersonalMode || categoryPois.length <= state.visiblePoiLimit;
  elements.poiStatus.textContent = isPersonalMode
    ? "Hidden"
    : state.pois.length
      ? `${Math.min(state.visiblePoiLimit, categoryPois.length)} of ${categoryPois.length}`
      : elements.poiStatus.textContent;

  const summaryItems = isPersonalMode
    ? customRows.map((location) => ({
        label: location.name,
        value: displayDistance(location),
        note: location.subtitle,
      }))
    : Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
    const nearest = state.pois
      .filter((poi) => poi.category === category)
      .sort(compareByGoogleDistance)[0];
    return {
      label: config.label,
      value: nearest ? displayDistance(nearest) : "--",
      note: nearest?.name || "Not surfaced",
    };
  });

  elements.summaryGrid.innerHTML = summaryItems
    .map(
      (item) => `
        <div class="summary-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </div>
      `,
    )
    .join("");

  elements.customLocationList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      state.customLocations = state.customLocations.filter((location) => location.id !== button.dataset.remove);
      renderMap();
    });
  });

  renderMapCategoryStrip(summaryItems, isPersonalMode);
}

function renderMapCategoryStrip(summaryItems, isPersonalMode) {
  if (!elements.mapCategoryStrip) return;
  if (isPersonalMode) {
    elements.mapCategoryStrip.innerHTML = `
      <button class="map-category-chip active" type="button">
        <span class="chip-dot" style="background:#a33f5f;"></span>
        <strong>${state.customLocations.length}</strong>
        <span>Saved locations</span>
      </button>
    `;
    return;
  }

  elements.mapCategoryStrip.innerHTML = Object.entries(CATEGORY_CONFIG)
    .map(([category, config]) => {
      const nearest = state.pois
        .filter((poi) => poi.category === category)
        .sort(compareByGoogleDistance)[0];
      const count = state.pois.filter((poi) => poi.category === category).length;
      const value = nearest ? displayDistance(nearest) : "--";
      return `
        <button class="map-category-chip${category === state.selectedCategory ? " active" : ""}" data-map-category="${category}" type="button">
          <span class="chip-dot" style="background:${config.color};"></span>
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(config.label)}${count ? ` · ${count}` : ""}</span>
        </button>
      `;
    })
    .join("");

  elements.mapCategoryStrip.querySelectorAll("[data-map-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.mapCategory;
      state.visiblePoiLimit = INITIAL_POI_LIMIT;
      state.activeMapDetail = null;
      renderCategoryTabs();
      renderMap();
    });
  });
}

function renderCategoryTabs() {
  elements.categoryTabs.innerHTML = Object.entries(CATEGORY_CONFIG)
    .map(
      ([key, config]) => `
        <button class="category-tab${key === state.selectedCategory ? " active" : ""}" data-category="${key}" type="button">
          ${escapeHtml(config.label)}
        </button>
      `,
    )
    .join("");

  elements.categoryTabs.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      state.visiblePoiLimit = INITIAL_POI_LIMIT;
      renderCategoryTabs();
      renderMap();
      renderLists();
    });
  });
}

function overpassQuery(point) {
  const lat = point.lat;
  const lng = point.lng;
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"school|hospital|clinic|marketplace|bus_station|metro_station"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
      node["shop"~"mall|supermarket"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
      node["railway"~"station|subway_entrance"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
      way["amenity"~"school|hospital|clinic|marketplace|bus_station|metro_station"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
      way["shop"~"mall|supermarket"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
      way["railway"~"station|subway_entrance"](around:${SOCIAL_RADIUS_METERS},${lat},${lng});
    );
    out center tags 80;
  `;
}

function poiCategory(tags = {}) {
  if (tags.amenity === "school") return "school";
  if (["hospital", "clinic"].includes(tags.amenity)) return "hospital";
  if (["marketplace"].includes(tags.amenity) || ["mall", "supermarket"].includes(tags.shop)) return "market";
  if (tags.railway || ["bus_station", "metro_station"].includes(tags.amenity)) return "transit";
  return null;
}

function googleNearbySearch(request) {
  return new Promise((resolve, reject) => {
    state.googleServices.places.nearbySearch(request, (results, status) => {
      if (
        status === state.google.places.PlacesServiceStatus.OK ||
        status === state.google.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve(results || []);
        return;
      }
      reject(new Error(`Google Places failed: ${status}`));
    });
  });
}

function googleTextSearch(request) {
  return new Promise((resolve, reject) => {
    state.googleServices.places.textSearch(request, (results, status) => {
      if (
        status === state.google.places.PlacesServiceStatus.OK ||
        status === state.google.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve(results || []);
        return;
      }
      reject(new Error(`Google text search failed: ${status}`));
    });
  });
}

function googleDistanceMatrix(destinations, travelMode = "DRIVING") {
  if (!destinations.length) return Promise.resolve([]);
  const center = projectPoint(state.selectedProject);
  return new Promise((resolve) => {
    state.googleServices.distanceMatrix.getDistanceMatrix(
      {
        origins: [{ lat: center.lat, lng: center.lng }],
        destinations: destinations.map((item) => ({ lat: item.lat, lng: item.lng })),
        travelMode: state.google.TravelMode[travelMode] || state.google.TravelMode.DRIVING,
        unitSystem: state.google.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== "OK") {
          resolve(destinations);
          return;
        }
        const elementsRow = response.rows?.[0]?.elements || [];
        resolve(destinations.map((item, index) => {
          const result = elementsRow[index];
          if (!result || result.status !== "OK") return item;
          return {
            ...item,
            distanceText: result.distance?.text || item.distanceText,
            googleDistanceKm: Number.isFinite(result.distance?.value)
              ? result.distance.value / 1000
              : item.googleDistanceKm,
            distanceKm: Number.isFinite(result.distance?.value)
              ? result.distance.value / 1000
              : item.distanceKm,
            durationText: result.duration?.text || item.durationText,
          };
        }));
      },
    );
  });
}

function isRelevantGooglePoi(poi) {
  const name = (poi.name || "").toLowerCase();
  const rules = BUYER_RELEVANCE[poi.category] || {};
  const hasPreferredSignal = textIncludesAny(name, rules.prefer || []);
  const hasAvoidSignal = textIncludesAny(name, rules.avoid || []);
  const hasMarketScale = (poi.rating || 0) >= 4.1 && (poi.userRatingsTotal || 0) >= 50;
  if (poi.source === "focused") return !hasAvoidSignal || hasPreferredSignal;
  if (hasAvoidSignal && !hasPreferredSignal) return false;
  if (poi.category === "transit") {
    return hasPreferredSignal || /^sector\s+\d/.test(name);
  }
  return hasPreferredSignal || hasMarketScale;
}

async function loadGoogleNearbyInfrastructure() {
  const center = projectPoint(state.selectedProject);
  const location = new state.google.LatLng(center.lat, center.lng);
  const focusedBatches = await Promise.all(
    Object.entries(GOOGLE_FOCUSED_PLACE_QUERIES).map(async ([category, queries]) => {
      const results = await Promise.all(
        queries.map((query) =>
          googleTextSearch({
            query,
            location,
            radius: SOCIAL_RADIUS_METERS,
          }).catch(() => []),
        ),
      );
      return results.flat().map((place) => {
        const placeLocation = place.geometry?.location;
        if (!placeLocation || !place.name) return null;
        const poi = {
          id: place.place_id || `${category}:${place.name.toLowerCase()}`,
          placeId: place.place_id,
          name: place.name,
          category,
          source: "focused",
          lat: placeLocation.lat(),
          lng: placeLocation.lng(),
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
        };
        poi.distanceKm = getDistanceKm(center, poi);
        poi.relevanceScore = relevanceScore(poi);
        return poi;
      }).filter(Boolean);
    }),
  );

  const seen = new Set();
  const focusedRanked = focusedBatches
    .flat()
    .filter((poi) => {
      const key = normalizedPlaceKey(poi);
      if (poi.distanceKm > 14 || seen.has(key) || !isRelevantGooglePoi(poi)) return false;
      seen.add(key);
      return true;
    })
    .sort(compareByGoogleDistance);

  const counts = Object.fromEntries(Object.keys(CATEGORY_CONFIG).map((category) => [category, 0]));
  focusedRanked.forEach((poi) => {
    counts[poi.category] += 1;
  });
  const neededCategories = Object.entries(counts)
    .filter(([, count]) => count < 5)
    .map(([category]) => category);

  const nearbyBatches = await Promise.all(
    neededCategories.map(async (category) => {
      const query = GOOGLE_PLACE_QUERIES[category];
      const results = await googleNearbySearch({
        location,
        rankBy: state.google.places.RankBy.DISTANCE,
        keyword: query.keyword,
        type: query.type,
      }).catch(() => []);
      return results.map((place) => {
        const placeLocation = place.geometry?.location;
        if (!placeLocation || !place.name) return null;
        const poi = {
          id: place.place_id || `${category}:${place.name.toLowerCase()}`,
          placeId: place.place_id,
          name: place.name,
          category,
          source: "nearby",
          lat: placeLocation.lat(),
          lng: placeLocation.lng(),
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
        };
        poi.distanceKm = getDistanceKm(center, poi);
        poi.relevanceScore = relevanceScore(poi);
        return poi;
      }).filter(Boolean);
    }),
  );

  const nearbyRanked = nearbyBatches
    .flat()
    .filter((poi) => {
      const key = normalizedPlaceKey(poi);
      if (poi.distanceKm > 10 || seen.has(key) || !isRelevantGooglePoi(poi)) return false;
      seen.add(key);
      return true;
    });

  const rankedWithDistances = (await googleDistanceMatrix([...focusedRanked, ...nearbyRanked]))
    .map((poi) => ({ ...poi, relevanceScore: relevanceScore(poi) }))
    .sort(compareByGoogleDistance);

  state.pois = capPoisByCategory(rankedWithDistances, 5).sort(compareByGoogleDistance);
}

async function updateGoogleAnchorDistances() {
  if (!state.googleServices) return;
  const rows = await googleDistanceMatrix(CITY_ANCHORS);
  state.anchorDistances = Object.fromEntries(rows.map((row) => [row.id, row]));
}

async function loadNearbyInfrastructure() {
  const center = projectPoint(state.selectedProject);
  elements.poiStatus.textContent = "Loading";
  state.pois = [];
  renderMap();

  try {
    if (state.googleServices) {
      await updateGoogleAnchorDistances();
      await loadGoogleNearbyInfrastructure();
      if (!state.pois.length) throw new Error("No Google Places found");
      elements.poiStatus.textContent = `${state.pois.length} found`;
      renderMap();
      return;
    }

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery(center),
    });
    if (!response.ok) throw new Error("Overpass request failed");
    const payload = await response.json();
    const seen = new Set();
    state.pois = payload.elements
      .map((item) => {
        const lat = item.lat ?? item.center?.lat;
        const lng = item.lon ?? item.center?.lon;
        const category = poiCategory(item.tags || {});
        const name = item.tags?.name;
        if (!lat || !lng || !category || !name) return null;
        const key = `${category}:${name.toLowerCase()}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const poi = {
          id: key,
          name,
          category,
          lat,
          lng,
        };
        poi.distanceKm = getDistanceKm(center, poi);
        return poi;
      })
      .filter(Boolean)
      .filter((poi) => poi.distanceKm <= 10)
      .sort(compareByGoogleDistance)
      .slice(0, 48);
    if (!state.pois.length) throw new Error("No POIs found");
    elements.poiStatus.textContent = `${state.pois.length} found`;
  } catch (error) {
    state.pois = FALLBACK_POIS.map((poi, index) => ({
      ...poi,
      id: `fallback-${index}`,
      distanceKm: getDistanceKm(center, poi),
    }))
      .filter((poi) => poi.distanceKm <= 18)
      .sort(compareByGoogleDistance);
    elements.poiStatus.textContent = "Fallback";
  }
  renderMap();
}

async function geocodeAddress(address) {
  if (
    state.selectedSuggestion &&
    state.selectedSuggestion.displayName === address &&
    Number.isFinite(state.selectedSuggestion.lat) &&
    Number.isFinite(state.selectedSuggestion.lng)
  ) {
    return state.selectedSuggestion;
  }

  if (state.googleServices) {
    return new Promise((resolve, reject) => {
      state.googleServices.geocoder.geocode(
        state.selectedSuggestion?.placeId
          ? { placeId: state.selectedSuggestion.placeId }
          : {
              address: `${address}, Gurgaon, Haryana, India`,
              componentRestrictions: { country: "IN" },
            },
        (results, status) => {
          if (status !== "OK" || !results?.length) {
            reject(new Error("Location not found"));
            return;
          }
          const best = results[0];
          resolve({
            lat: best.geometry.location.lat(),
            lng: best.geometry.location.lng(),
            displayName: best.formatted_address,
            placeId: best.place_id,
          });
        },
      );
    });
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${address}, Gurgaon, Haryana, India`,
    limit: "1",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Geocoding failed");
  const rows = await response.json();
  if (!rows.length) throw new Error("Location not found");
  return {
    lat: Number(rows[0].lat),
    lng: Number(rows[0].lon),
    displayName: rows[0].display_name,
  };
}

async function searchAddressSuggestions(query) {
  if (state.suggestionAbort) state.suggestionAbort.abort();
  state.suggestionAbort = new AbortController();
  if (state.googleServices) {
    return new Promise((resolve, reject) => {
      state.googleServices.autocomplete.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "in" },
          locationBias: {
            center: { lat: GURGAON_CENTER[0], lng: GURGAON_CENTER[1] },
            radius: SOCIAL_RADIUS_METERS * 2,
          },
        },
        (predictions, status) => {
          if (
            status === state.google.places.PlacesServiceStatus.OK ||
            status === state.google.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve((predictions || []).slice(0, 5).map((prediction) => ({
              googlePrediction: true,
              place_id: prediction.place_id,
              display_name: prediction.description,
              label: prediction.structured_formatting?.main_text || prediction.description,
            })));
            return;
          }
          reject(new Error(`Google autocomplete failed: ${status}`));
        },
      );
    });
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${query}, Gurgaon, Haryana, India`,
    limit: "5",
    addressdetails: "1",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: state.suggestionAbort.signal,
  });
  if (!response.ok) throw new Error("Suggestion lookup failed");
  return response.json();
}

function shortSuggestionLabel(row) {
  if (row.label) return row.label;
  const address = row.address || {};
  return address.neighbourhood || address.suburb || address.city_district || address.road || address.city || "Gurgaon";
}

function hideAddressSuggestions() {
  elements.addressSuggestions.classList.remove("open");
  elements.addressSuggestions.innerHTML = "";
}

function renderAddressSuggestions(rows) {
  elements.addressSuggestions.innerHTML = rows
    .map((row, index) => {
      const displayName = row.display_name || "";
      return `
        <button class="suggestion-option" data-suggestion="${index}" type="button">
          <strong>${escapeHtml(shortSuggestionLabel(row))}</strong>
          <span>${escapeHtml(displayName)}</span>
        </button>
      `;
    })
    .join("");
  elements.addressSuggestions.classList.toggle("open", rows.length > 0);
  elements.addressSuggestions.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = rows[Number(button.dataset.suggestion)];
      state.selectedSuggestion = row.googlePrediction
        ? { placeId: row.place_id, displayName: row.display_name }
        : {
            lat: Number(row.lat),
            lng: Number(row.lon),
            displayName: row.display_name,
          };
      elements.customAddress.value = row.display_name;
      hideAddressSuggestions();
    });
  });
}

function debounce(fn, wait = 300) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

const handleAddressInput = debounce(async () => {
  const query = elements.customAddress.value.trim();
  state.selectedSuggestion = null;
  if (query.length < 3) {
    hideAddressSuggestions();
    return;
  }
  try {
    const rows = await searchAddressSuggestions(query);
    renderAddressSuggestions(rows);
  } catch (error) {
    if (error.name !== "AbortError") hideAddressSuggestions();
  }
}, 350);

async function handleCustomLocationSubmit(event) {
  event.preventDefault();
  const name = elements.customName.value.trim();
  const address = elements.customAddress.value.trim();
  if (!name || !address) return;

  elements.formStatus.textContent = "Finding location...";
  try {
    const geo = await geocodeAddress(address);
    let nextLocation = {
      id: `${Date.now()}`,
      name,
      address: geo.displayName || address,
      type: elements.customType.value,
      lat: geo.lat,
      lng: geo.lng,
    };
    if (state.googleServices) {
      [nextLocation] = await googleDistanceMatrix([nextLocation]);
    }
    state.customLocations.push(nextLocation);
    elements.customLocationForm.reset();
    state.selectedSuggestion = null;
    hideAddressSuggestions();
    elements.formStatus.textContent = "Location added";
    renderMap();
  } catch (error) {
    elements.formStatus.textContent = "Could not find that address";
  }
}

async function main() {
  await initMap();
  state.projects = (await loadProjects()).filter(hasProjectCoordinates);
  state.shortlist = loadProjectShortlist();
  renderDataSourceBadge();
  renderProjectOptions();
  renderCategoryTabs();

  const params = new URLSearchParams(window.location.search);
  const shortlistProject = params.get("shortlist") === "1"
    ? state.projects.find((project) => state.shortlist.includes(project.slug))
    : null;
  const initialProject = getProjectFromUrl() || shortlistProject || state.projects[0];
  setSelectedProject(initialProject);

  elements.projectSelect.addEventListener("change", () => {
    const project = state.projects.find((item) => item.slug === elements.projectSelect.value);
    if (project) setSelectedProject(project);
  });
  elements.customLocationForm.addEventListener("submit", handleCustomLocationSubmit);
  elements.customAddress.addEventListener("input", handleAddressInput);
  elements.customAddress.addEventListener("focus", handleAddressInput);
  elements.loadMorePois.addEventListener("click", () => {
    state.visiblePoiLimit += POI_LOAD_STEP;
    renderMap();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".address-search")) hideAddressSuggestions();
  });
}

main().catch((error) => {
  console.error(error);
  elements.mapTitle.textContent = "Unable to load commute intelligence";
});
