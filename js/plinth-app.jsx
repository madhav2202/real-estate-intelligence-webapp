/* ─────────────────────────────────────────────────────────────────────
   PLINTH · app.jsx
   ─────────────────────────────────────────────────────────────────────
   Single-file React prototype. To wire to your real backend:
     1. Delete the PROJECTS const below.
     2. Replace it with a fetch / hook / store call that returns the same
        shape (see Project schema below).
     3. Pass the array into <App projects={...} />.
   ───────────────────────────────────────────────────────────────────── */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ─── PROJECT SCHEMA (replace with API data of same shape) ────────────
{
  id:          number | string,
  code:        string,            // 'GGM-36A-TER'
  name:        string,
  developer:   string,
  sector:      string,            // 'Sector 36A'
  corridor:    string,            // 'Dwarka Expressway'
  city:        string,
  stage:       'New Launch' | 'Under Construction' | 'Ready' | ...,
  ticket:      string,            // human-readable, e.g. '₹4.50 Cr'
  sqftPrice:   number | null,     // ₹ per sqft
  fairLow:     number | null,     // PropSpot fair-entry lower bound
  fairHigh:    number | null,
  score:       number,            // 0–100 PropSpot score
  possession:  string,            // 'Q1 2030'
  signal:      string,            // 'Fair entry' | 'Avoid at ask' | ...
  signalType:  'neutral' | 'warning' | 'danger',
  launched:    'EOI' | 'Launched',
  absorption:  string,            // '78%' | 'Data pending'
  location:    number,            // 0–10 location-maturity score
  builderRisk: number,            // 0–10 builder-risk score
  lat:         number,
  lng:         number,
  color:       string,            // hex matching signalType
}
   ───────────────────────────────────────────────────────────────────── */

const SIGNAL_COLORS = { neutral: '#4ade80', danger: '#f87171', warning: '#f5a623' };
const scoreColor = s => s >= 80 ? '#4ade80' : s >= 65 ? '#f5a623' : '#f87171';
const currency = new Intl.NumberFormat('en-IN');
const IS_GITHUB_PAGES = window.location.hostname.endsWith('github.io');
const REPO_BASE = IS_GITHUB_PAGES ? '/real-estate-intelligence-webapp' : '';
const SUPABASE_URL = 'https://uihqsimrwbrhzjfgrfxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpaHFzaW1yd2JyaHpqZmdyZnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjA3ODQsImV4cCI6MjA5Mzc5Njc4NH0.ya5U1tzhTp4tgRQIY6zeGtdp5YFytAqQ1VdLlB3zTbg';
const BUILDER_GRADES = {
  dlf: 'A+',
  oberoi: 'A+',
  godrej: 'A',
  max: 'A',
  sobha: 'A',
  emaar: 'A',
  adani: 'A',
  birla: 'A',
  experion: 'B',
  shapoorji: 'B',
  eldeco: 'B',
  krisumi: 'B',
  aipl: 'B',
  conscient: 'B',
  ashiana: 'B',
  trehan: 'B',
  elan: 'B',
  m3m: 'C',
  'signature global': 'C',
  smartworld: 'C',
  suncity: 'C',
};

function formatTicket(value) {
  if (!value) return 'Price on request';
  return `₹${Number(value).toFixed(2)} Cr`;
}

function withBase(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${REPO_BASE}${normalized}`;
}

function appViewUrl(view = 'map', slug = '') {
  const params = new URLSearchParams();
  if (view && view !== 'map') params.set('view', view);
  if (slug) params.set('project', slug);
  const query = params.toString();
  return withBase(`/index.html${query ? `?${query}` : ''}`);
}

function projectPageUrl(slug = '') {
  const params = new URLSearchParams();
  if (slug) params.set('slug', slug);
  const query = params.toString();
  return withBase(`/project.html${query ? `?${query}` : ''}`);
}

function matchesProjectSlug(project, slug) {
  return Boolean(project && slug && (project.slug === slug || project.legacySlug === slug));
}

function propertiesPageUrl() {
  return withBase('/properties.html');
}

function getBuilderGrade(developer = '') {
  const lower = developer.toLowerCase();
  const match = Object.keys(BUILDER_GRADES).find((name) => lower.includes(name));
  return match ? BUILDER_GRADES[match] : 'B';
}

function getFairEntryRange(project) {
  if (!project.priceSqft) return { low: null, high: null };
  const high = Math.round(project.priceSqft);
  const low = Math.round(project.priceSqft * 0.98);
  return { low, high };
}

function getLocationScoreFromRaw(project) {
  const numeric = Number(String(project.locationIntel?.score || '').split('/')[0]);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const text = [
    ...(project.locationIntel?.connectivity || []),
    ...(project.locationIntel?.social || []),
    ...(project.locationIntel?.infra || []),
    ...(project.locationIntel?.risks || []),
  ]
    .map((row) => row.join(' '))
    .join(' ');
  if (!text.trim()) return 8;
  let score = 8;
  ['Operational', 'High Upside', '18 min', '12 min', 'Improving'].forEach((term) => {
    if (text.includes(term)) score += 0.18;
  });
  ['Watch', 'High', 'Developing'].forEach((term) => {
    if (text.includes(term)) score -= 0.15;
  });
  return Math.max(7.2, Math.min(8.9, Number(score.toFixed(1))));
}

function normalizeBuilderRisk(project) {
  if (Number.isFinite(project?.builderIntelligence?.financialStressScore)) {
    return Number(project.builderIntelligence.financialStressScore);
  }
  if (project?.developerRisk?.rows?.length) {
    const text = project.developerRisk.rows.map((row) => String(row[1] || '')).join(' ').toLowerCase();
    if (text.includes('needs caution')) return 5.8;
    if (text.includes('watch closely')) return 7.2;
  }
  const grade = getBuilderGrade(project?.developer);
  if (grade === 'A+') return 9.2;
  if (grade === 'A') return 8.4;
  if (grade === 'B') return 8.0;
  return 7.2;
}

function getMedianMicroMarketPrice(projects, corridor) {
  const prices = projects
    .filter((project) => project.corridor === corridor && project.priceSqft)
    .map((project) => Number(project.priceSqft))
    .sort((a, b) => a - b);
  if (!prices.length) return 0;
  const midpoint = Math.floor(prices.length / 2);
  return prices.length % 2 ? prices[midpoint] : Math.round((prices[midpoint - 1] + prices[midpoint]) / 2);
}

function getProjectScore(project, projects) {
  const locationScore = getLocationScoreFromRaw(project) * 3.2;
  const builderScore = normalizeBuilderRisk(project) * 2.8;
  const marketMedian = getMedianMicroMarketPrice(projects, project.corridor);
  let priceScore = 24;
  if (project.priceSqft && marketMedian) {
    const premium = ((project.priceSqft - marketMedian) / marketMedian) * 100;
    priceScore = Math.max(16, Math.min(30, 24 - premium * 0.9));
  }
  const total = Math.max(58, Math.min(95, Math.round(locationScore + builderScore + priceScore)));
  return { total, marketMedian };
}

function getSignalLabel(project, fair) {
  if (!project.priceSqft || !fair.low) return 'Builder price pending';
  if (project.priceSqft > fair.high) return 'Avoid at ask';
  if (project.priceSqft < fair.low) return 'Attractive entry';
  return 'Fair entry';
}

function normalizeSignal(project) {
  const raw = String(project.signal || '').toLowerCase();
  if (raw.includes('avoid')) return 'danger';
  if (raw.includes('pending') || raw.includes('wait')) return 'warning';
  return 'neutral';
}

function adaptProject(project) {
  const fair = getFairEntryRange(project);
  const scoreMeta = getProjectScore(project, []);
  const signalLabel = getSignalLabel(project, fair);
  const signalType = normalizeSignal({ signal: signalLabel });
  return {
    id: project.slug || project.code,
    slug: project.slug,
    legacySlug: project.legacySlug || null,
    code: project.code,
    name: project.name,
    developer: project.developer,
    sector: project.sector,
    corridor: project.corridor,
    city: 'Gurugram',
    stage: project.stage,
    ticket: formatTicket(project.priceCr),
    sqftPrice: project.priceSqft || null,
    fairLow: fair.low,
    fairHigh: fair.high,
    score: scoreMeta.total,
    possession: project.possession,
    signal: signalLabel,
    signalType,
    launched: project.launched > 0 ? 'Launched' : 'EOI',
    absorption: project.absorption && project.absorption !== 'Data pending' ? project.absorption : (project.stage === 'New Launch' ? 'Early bookings stage' : 'Visibility building'),
    location: Number(getLocationScoreFromRaw(project).toFixed(1)),
    builderRisk: Number(normalizeBuilderRisk(project).toFixed(1)),
    lat: Number(project.latitude),
    lng: Number(project.longitude),
    color: SIGNAL_COLORS[signalType],
    raw: project,
  };
}

async function loadProjects() {
  let rawProjects;
  let source = 'local-json';
  try {
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&published=eq.true&order=name.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (supabaseResponse.ok) {
      const rows = await supabaseResponse.json();
      rawProjects = rows.map((row) => ({
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
      }));
      source = 'supabase';
    }
  } catch (error) {
    console.warn('Supabase load failed in shell, falling back to local JSON.', error);
  }
  if (!rawProjects) {
    const response = await fetch(withBase('/data/projects-data.json'));
    if (!response.ok) throw new Error('Unable to load project data');
    rawProjects = await response.json();
  } else {
    try {
      const response = await fetch(withBase('/data/projects-data.json'));
      if (response.ok) {
        const localProjects = await response.json();
        const localBySlug = new Map(localProjects.map((project) => [project.slug, project]));
        const localByCode = new Map(localProjects.map((project) => [project.code, project]));
        rawProjects = rawProjects.map((project) => ({
          ...project,
          ...(() => {
            const canonical = localByCode.get(project.code) || localBySlug.get(project.slug) || null;
            const legacySlug =
              canonical && project.slug && canonical.slug && project.slug !== canonical.slug
                ? project.slug
                : canonical?.legacySlug || null;
            return canonical
              ? {
                  code: canonical.code || project.code,
                  name: canonical.name || project.name,
                  slug: canonical.slug || project.slug,
                  legacySlug,
                }
              : {};
          })(),
          builderIntelligence:
            project.builderIntelligence ||
            (localByCode.get(project.code) || localBySlug.get(project.slug))?.builderIntelligence ||
            null,
          reraDetails:
            project.reraDetails && Object.keys(project.reraDetails).length
              ? project.reraDetails
              : (localByCode.get(project.code) || localBySlug.get(project.slug))?.reraDetails || {},
          developerRisk:
            project.developerRisk && Object.keys(project.developerRisk).length
              ? project.developerRisk
              : (localByCode.get(project.code) || localBySlug.get(project.slug))?.developerRisk || {},
          locationIntel:
            project.locationIntel && Object.keys(project.locationIntel).length
              ? project.locationIntel
              : (localByCode.get(project.code) || localBySlug.get(project.slug))?.locationIntel || {},
          tracker:
            project.tracker && Object.keys(project.tracker).length
              ? project.tracker
              : (localByCode.get(project.code) || localBySlug.get(project.slug))?.tracker || {},
        }));
      }
    } catch (error) {
      console.warn('Local enrichment merge skipped in shell.', error);
    }
  }
  const baseProjects = rawProjects
    .filter((project) => project && project.published !== false)
    .map(adaptProject)
    .filter((project) => Number.isFinite(project.lat) && Number.isFinite(project.lng));
  const marketMedians = new Map();
  baseProjects.forEach((project) => {
    if (!marketMedians.has(project.corridor)) {
      marketMedians.set(project.corridor, getMedianMicroMarketPrice(rawProjects, project.corridor));
    }
  });
  const projects = baseProjects.map((project) => {
    const marketMedian = marketMedians.get(project.corridor) || 0;
    const scoreMeta = getProjectScore(project.raw, rawProjects);
    return { ...project, score: scoreMeta.total, marketMedian };
  });
  return { projects, source };
}

function getRouteView(pathname) {
  const queryView = new URLSearchParams(window.location.search).get('view');
  if (queryView === 'screener') return 'screener';
  if (queryView === 'terminal' || queryView === 'dashboard') return 'dashboard';
  if (pathname.endsWith('/index.html') || pathname === '/' || pathname === withBase('/')) return 'map';
  return 'map';
}

function pushView(view) {
  window.history.pushState({ view }, '', appViewUrl(view));
}

function getSelectedSlug() {
  return new URLSearchParams(window.location.search).get('project');
}

function pushSelection(view, slug) {
  window.history.pushState({ view, slug }, '', appViewUrl(view, slug));
}

/* ─── SCORE RING ──────────────────────────────────────────────────── */
function ScoreRing({ score, size = 120, stroke = 8, label = true, animate = true }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const [dashOffset, setDashOffset] = useState(circ);

  useEffect(() => {
    if (!animate) { setDisplayed(score); setDashOffset(circ - (score / 100) * circ); return; }
    const start = Date.now(); const dur = 1400;
    const raf = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * score));
      setDashOffset(circ - ease * (score / 100) * circ);
      if (t < 1) requestAnimationFrame(raf);
    };
    const timeout = setTimeout(() => requestAnimationFrame(raf), 300);
    return () => clearTimeout(timeout);
  }, [score]);

  const hue = scoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={hue} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={dashOffset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${hue}88)`, transition: 'stroke 0.3s' }} />
      </svg>
      {label && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 600, color: hue, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{displayed}</span>
          <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 1 }}>/ 100</span>
        </div>
      )}
    </div>
  );
}

/* ─── TICKER ──────────────────────────────────────────────────────── */
function Ticker({ items }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ background: 'rgba(15,15,24,0.94)', borderBottom: '1px solid var(--border)', overflow: 'hidden', height: 42, display: 'flex', alignItems: 'center', position: 'relative', backdropFilter: 'blur(12px)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 72, zIndex: 2, background: 'linear-gradient(to right, rgba(15,15,24,1), transparent)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72, zIndex: 2, background: 'linear-gradient(to left, rgba(15,15,24,1), transparent)' }} />
      <div
        style={{ display: 'flex', animation: 'ticker 900s linear infinite', whiteSpace: 'nowrap' }}
        onMouseEnter={(event) => {
          event.currentTarget.style.animationPlayState = 'paused';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.animationPlayState = 'running';
        }}
      >
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{item.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border)' }}>{item.stage}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.ticket}</span>
            <span style={{ fontSize: 11, color: scoreColor(item.score), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.score}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SIDEBAR PROJECT CARD ────────────────────────────────────────── */
function ProjectCard({ project, selected, onClick }) {
  const sc = SIGNAL_COLORS[project.signalType];
  return (
    <div onClick={onClick}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
      style={{
        padding: '12px 14px', cursor: 'pointer', borderRadius: 8, marginBottom: 4,
        background: selected ? 'rgba(124,106,245,0.12)' : 'transparent',
        border: `1px solid ${selected ? 'rgba(124,106,245,0.3)' : 'transparent'}`,
        transition: 'all 0.2s',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.sector} · {project.corridor}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc, boxShadow: `0 0 6px ${sc}` }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: sc, fontFamily: 'var(--font-mono)' }}>{project.score}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, minWidth: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>{project.stage}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {project.sqftPrice ? `₹${(project.sqftPrice/1000).toFixed(0)}k/sqft` : 'On req.'}
        </span>
      </div>
    </div>
  );
}

/* ─── MAP VIEW (Leaflet) ──────────────────────────────────────────── */
function MapView({ projects, selected, onSelect }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current || !window.L) return;
    const map = window.L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView([28.4595, 77.0266], 11);

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    leafletRef.current = map;
    markerLayerRef.current = window.L.layerGroup().addTo(map);
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer || !window.L) return;

    layer.clearLayers();
    const bounds = [];

    projects.forEach((project) => {
      const isSelected = selected?.id === project.id;
      const marker = window.L.circleMarker([project.lat, project.lng], {
        radius: isSelected ? 11 : 8,
        color: isSelected ? '#ffffff' : '#0e0e14',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: project.color,
        fillOpacity: 0.92,
      });
      marker.bindTooltip(
        `<div style="min-width:160px"><strong>${project.name}</strong><br/><span style="color:#9a97aa">${project.sector}</span><br/><span style="color:${project.color};font-family:DM Mono,monospace">${project.score}/100</span> · <span style="color:#9a97aa">${project.signal}</span></div>`,
        { direction: 'top', offset: [0, -10], opacity: 1 }
      );
      marker.on('click', () => onSelect(project));
      marker.addTo(layer);
      bounds.push([project.lat, project.lng]);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
    }
  }, [projects, selected, onSelect]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(8,8,13,0.85)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(8px)', zIndex: 500 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Signal</div>
        {[['#4ade80','Fair entry'],['#f5a623','Pending'],['#f87171','Avoid']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, whiteSpace: 'nowrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(8,8,13,0.85)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', zIndex: 500 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{projects.length} PROJECTS</span>
      </div>
    </div>
  );
}

/* ─── METRIC BAR ──────────────────────────────────────────────────── */
function MetricBar({ label, value, max, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth((value / max) * 100), 400); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{value}/10</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 2, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: `0 0 8px ${color}88` }} />
      </div>
    </div>
  );
}

/* ─── PROJECT DETAIL ──────────────────────────────────────────────── */
function ProjectDetail({ project, onClose, animKey }) {
  const sc = SIGNAL_COLORS[project.signalType];
  const whatsapp = `https://wa.me/919873886178?text=${encodeURIComponent(`Hi, I'm interested in ${project.name} on PropSpot Plinth. Please share more details.`)}`;
  return (
    <div key={animKey} style={{ height: '100%', overflowY: 'auto', animation: 'slideLeft 0.35s ease' }}>
      <div style={{ position: 'relative', height: 180, background: 'var(--bg3)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(124,106,245,0.15) 0%, rgba(${project.signalType === 'danger' ? '248,113,113' : project.signalType === 'warning' ? '245,166,35' : '74,222,128'},0.1) 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.012) 20px, rgba(255,255,255,0.012) 40px)' }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '6px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>✕ Close</button>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4 }}>{project.code}</div>
          <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1.1 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{project.developer} · {project.sector}, {project.corridor}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--border)' }}>
        {[{ label: 'Ticket', value: project.ticket }, { label: 'Stage', value: project.stage }, { label: 'Launched', value: project.launched }, { label: 'Possession', value: project.possession }].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg2)', padding: '12px 14px', minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Builder Price</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{project.sqftPrice ? `₹${project.sqftPrice.toLocaleString()}` : 'On request'}</div>
            {project.sqftPrice && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>per sqft</div>}
          </div>
          <div style={{ background: 'var(--bg3)', border: `1px solid ${sc}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Fair Entry Range</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: sc, fontFamily: 'var(--font-mono)' }}>{project.fairLow ? `₹${project.fairLow.toLocaleString()}–${project.fairHigh.toLocaleString()}` : 'Pending'}</div>
            {project.sqftPrice && project.fairLow && (
              <div style={{ fontSize: 10, color: project.sqftPrice > project.fairHigh ? '#f87171' : '#4ade80', marginTop: 4 }}>
                {project.sqftPrice > project.fairHigh ? `+${(((project.sqftPrice - project.fairHigh)/project.fairHigh)*100).toFixed(1)}% above fair` : `Within fair range`}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flexShrink: 0 }}><ScoreRing score={project.score} size={84} stroke={6} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>PropSpot Score</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: scoreColor(project.score) }}>
              {project.score >= 80 ? 'Strong Shortlist' : project.score >= 65 ? 'Moderate Interest' : 'Avoid at Ask'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.45 }}>Strong location maturity and builder track record. Entry is {project.signal.toLowerCase()}.</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['Location','Builder','Price','Absorption'].map(t => (
                <span key={t} style={{ fontSize: 9, padding: '2px 6px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-dim)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: sc + '12', border: `1px solid ${sc}30`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, boxShadow: `0 0 10px ${sc}`, animation: 'blink 2s ease infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 10, color: sc, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Entry Signal</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{project.signal}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <MetricBar label="Location Maturity" value={project.location} max={10} color="#4ade80" />
          <MetricBar label="Builder Risk" value={project.builderRisk} max={10} color="#f5a623" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 12 }}>
          <a href={projectPageUrl(project.slug)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,106,245,0.4)', textDecoration: 'none' }}>Open Full Intelligence</a>
          <a href={whatsapp} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'transparent', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>WhatsApp PropSpot</a>
        </div>
      </div>
    </div>
  );
}

/* ─── SCREENER VIEW ───────────────────────────────────────────────── */
function ScreenerView({ projects, onSelect }) {
  const [sortBy, setSortBy] = useState('score');
  const [filterSignal, setFilterSignal] = useState('all');
  const sorted = [...projects]
    .filter(p => filterSignal === 'all' || p.signalType === filterSignal)
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'price' ? (a.sqftPrice || 99999) - (b.sqftPrice || 99999) : a.name.localeCompare(b.name));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 12, padding: '20px 24px 16px', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>Launch Screener</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['all','neutral','warning','danger'].map(f => (
            <button key={f} onClick={() => setFilterSignal(f)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              background: filterSignal === f ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${filterSignal === f ? 'var(--accent)' : 'var(--border)'}`,
              color: filterSignal === f ? '#fff' : 'var(--text-dim)',
            }}>{f === 'all' ? 'All' : f === 'neutral' ? '● Fair' : f === 'warning' ? '● Pending' : '● Avoid'}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
          <option value="score">Sort: Score</option>
          <option value="price">Sort: Price</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 2 }}>
              {['Project','Corridor','Ticket','₹/sqft','Fair Entry','PropSpot','Signal','Location','Possession'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const sc = SIGNAL_COLORS[p.signalType];
              return (
                <tr key={p.id} onClick={() => onSelect(p)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,106,245,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{p.code}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-dim)' }}>{p.corridor}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{p.ticket}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{p.sqftPrice ? `₹${p.sqftPrice.toLocaleString()}` : '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: p.fairLow ? '#4ade80' : 'var(--text-muted)' }}>{p.fairLow ? `₹${(p.fairLow/1000).toFixed(0)}k–${(p.fairHigh/1000).toFixed(0)}k` : 'Pending'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ScoreRing score={p.score} size={32} stroke={3} animate={false} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(p.score), fontFamily: 'var(--font-mono)' }}>{p.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: sc + '18', color: sc, border: `1px solid ${sc}40`, whiteSpace: 'nowrap' }}>{p.signal}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 3, background: 'var(--bg4)', borderRadius: 2, minWidth: 50 }}>
                        <div style={{ height: '100%', width: `${p.location * 10}%`, background: '#4ade80', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{p.location}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{p.possession}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ───────────────────────────────────────────────────── */
function DashboardView({ projects, onSelect, onNav }) {
  const top = [...projects].sort((a,b) => b.score - a.score).slice(0,3);
  const fair = projects.filter(p => p.signalType === 'neutral');
  const [clock, setClock] = useState('');
  useEffect(() => { const u = () => setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })); u(); const iv = setInterval(u, 1000); return () => clearInterval(iv); }, []);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, animation: 'fadeUp 0.5s ease', gap: 20 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Launch Terminal · Live</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', lineHeight: 1.05 }}>High-Rise Intelligence</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>NCR · {projects.length} active launches tracked</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{clock}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', marginRight: 4, boxShadow: '0 0 6px #4ade80', animation: 'blink 2s ease infinite' }} />LAUNCH LIVE
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24, animation: 'fadeUp 0.5s ease 0.1s both' }}>
        {[
          { label: 'Total Launches', value: projects.length, sub: 'NCR tracked', color: 'var(--accent)' },
          { label: 'Fair Entry', value: fair.length, sub: 'entry signal', color: '#4ade80' },
          { label: 'Avg Score', value: projects.length ? Math.round(projects.reduce((s,p)=>s+p.score,0)/projects.length) : 0, sub: '/ 100', color: '#f5a623' },
          { label: 'New Launch', value: projects.filter(p=>p.stage==='New Launch').length, sub: 'active EOI', color: 'var(--text-dim)' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, animation: 'fadeUp 0.5s ease 0.2s both' }}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>Top Ranked</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>BY PROPSPOT SCORE</span>
          </div>
          {top.map((p, i) => (
            <div key={p.id} onClick={() => onSelect(p)} style={{ padding: '12px 18px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,106,245,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 16, textAlign: 'center' }}>{i+1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{p.sector}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: scoreColor(p.score), boxShadow: `0 0 6px ${scoreColor(p.score)}` }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(p.score), fontFamily: 'var(--font-mono)' }}>{p.score}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div onClick={() => onNav('map')} style={{ background: 'linear-gradient(135deg, rgba(124,106,245,0.15) 0%, rgba(124,106,245,0.05) 100%)', border: '1px solid rgba(124,106,245,0.3)', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', flex: 1 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>⬡</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Launch Map</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>View all {projects.length} projects geographically</div>
          </div>
          <div onClick={() => onNav('screener')} style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0.03) 100%)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', flex: 1 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>▤</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Launch Screener</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Compare all projects side by side</div>
          </div>
        </div>
      </div>

      <div style={{ animation: 'fadeUp 0.5s ease 0.3s both' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Entry Signals</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {projects.slice(0,6).map(p => {
            const sc = SIGNAL_COLORS[p.signalType];
            return (
              <div key={p.id} onClick={() => onSelect(p)} style={{ background: 'var(--bg3)', border: `1px solid ${sc}22`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{p.name}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(p.score), fontFamily: 'var(--font-mono)' }}>{p.score}</span>
                </div>
                <div style={{ fontSize: 10, padding: '2px 7px', display: 'inline-block', background: sc + '18', color: sc, borderRadius: 4, border: `1px solid ${sc}40`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.signal}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT APP ────────────────────────────────────────────────────── */
function App() {
  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('Checking source...');
  const [view, setView] = useState(getRouteView(window.location.pathname));
  const [selected, setSelected] = useState(null);
  const [detailKey, setDetailKey] = useState(0);
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadProjects()
      .then(({ projects: rows, source }) => {
        if (!live) return;
        setProjects(rows);
        setDataSource(source === 'supabase' ? 'Live source: Supabase' : 'Fallback: Local JSON');
        const slug = getSelectedSlug();
        const selectedProject =
          rows.find((p) => matchesProjectSlug(p, slug)) || [...rows].sort((a, b) => b.score - a.score)[0] || null;
        setSelected(selectedProject);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      setView(getRouteView(window.location.pathname));
      const slug = getSelectedSlug();
      setSelected((current) => projects.find((p) => matchesProjectSlug(p, slug)) || current || projects[0] || null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [projects]);

  const filtered = useMemo(() => projects.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sector.toLowerCase().includes(search.toLowerCase()) || p.corridor.toLowerCase().includes(search.toLowerCase());
    const mb = budget === 'all' || (budget === 'under3' && p.sqftPrice && p.sqftPrice < 25000) || (budget === '3to5' && p.sqftPrice && p.sqftPrice >= 25000 && p.sqftPrice < 45000) || (budget === 'above5' && p.sqftPrice && p.sqftPrice >= 45000);
    const mst = stageFilter === 'all' || p.stage === stageFilter;
    return ms && mb && mst;
  }), [projects, search, budget, stageFilter]);

  useEffect(() => {
    if (!filtered.length) {
      setSelected(null);
      return;
    }
    if (!selected || !filtered.some((project) => project.id === selected.id)) {
      const next =
        filtered.find((p) => matchesProjectSlug(p, getSelectedSlug())) ||
        [...filtered].sort((a, b) => b.score - a.score)[0];
      setSelected(next || null);
    }
  }, [filtered]);

  const setViewAndRoute = (nextView) => {
    setView(nextView);
    pushSelection(nextView, selected?.slug || null);
  };

  const select = (p) => {
    const nextView = view === 'screener' ? 'dashboard' : view;
    setSelected(p);
    setDetailKey((k) => k + 1);
    if (nextView !== view) setView(nextView);
    pushSelection(nextView, p.slug);
  };

  const tickerItems = projects.map(p => ({ name: p.name, stage: p.stage, ticket: p.ticket, score: p.score }));

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-dim)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>Loading Plinth...</div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-dim)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>No published projects available.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Top nav */}
      <div style={{ height: 52, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', boxShadow: '0 0 16px var(--accent-glow)' }}>P</div>
          <span style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>Plinth</span>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {[{ id: 'dashboard', label: 'Terminal' }, { id: 'map', label: 'Map' }, { id: 'screener', label: 'Screener' }].map(({ id, label }) => (
          <button key={id} onClick={() => setViewAndRoute(id)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: view === id ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${view === id ? 'var(--accent)' : 'transparent'}`,
            color: view === id ? 'var(--accent)' : 'var(--text-dim)',
          }}>{label}</button>
        ))}
        <a href={propertiesPageUrl()} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid transparent', color: 'var(--text-dim)', textDecoration: 'none' }}>Properties</a>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dataSource.includes('Supabase') ? '#4ade80' : 'var(--text-muted)', animation: dataSource.includes('Supabase') ? 'blink 2s ease infinite' : 'none', boxShadow: dataSource.includes('Supabase') ? '0 0 6px #4ade80' : 'none' }} />{dataSource}
        </div>
      </div>

      <Ticker items={tickerItems} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view !== 'screener' && (
          <div style={{ width: 220, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', marginBottom: 8 }} />
              <select value={budget} onChange={e => setBudget(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '5px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer', marginBottom: 6 }}>
                <option value="all">All budgets</option>
                <option value="under3">Under ₹25k/sqft</option>
                <option value="3to5">₹25k–45k/sqft</option>
                <option value="above5">Above ₹45k/sqft</option>
              </select>
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '5px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
                <option value="all">All stages</option>
                <option value="New Launch">New Launch</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Projects</span><span style={{ color: 'var(--accent)' }}>{filtered.length}</span>
              </div>
              {filtered.map(p => <ProjectCard key={p.id} project={p} selected={selected?.id === p.id} onClick={() => select(p)} />)}
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {view === 'dashboard' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}><DashboardView projects={filtered} onSelect={select} onNav={setViewAndRoute} /></div>
              {selected && <div style={{ width: 340, flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}><ProjectDetail project={selected} onClose={() => { setSelected(null); pushSelection(view, null); }} animKey={detailKey} /></div>}
            </>
          )}
          {view === 'map' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: 20, animation: 'fadeIn 0.4s ease' }}>
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>Launch Map</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 12, fontFamily: 'var(--font-mono)' }}>NCR · {filtered.length} PROJECTS</span>
                  </div>
                </div>
                <div style={{ height: 'calc(100% - 60px)' }}>
                  <MapView projects={filtered} selected={selected} onSelect={select} />
                </div>
              </div>
              {selected && <div style={{ width: 340, flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}><ProjectDetail project={selected} onClose={() => { setSelected(null); pushSelection(view, null); }} animKey={detailKey} /></div>}
            </div>
          )}
          {view === 'screener' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
              <ScreenerView projects={filtered} onSelect={select} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
