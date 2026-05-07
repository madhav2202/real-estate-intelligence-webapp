/* ─────────────────────────────────────────────────────────────────────
   PLINTH · app.jsx
   ─────────────────────────────────────────────────────────────────────
   Single-file React prototype. To wire to your real backend:
     1. Delete the PROJECTS const below.
     2. Replace it with a fetch / hook / store call that returns the same
        shape (see Project schema below).
     3. Pass the array into <App projects={...} />.
   ───────────────────────────────────────────────────────────────────── */

const { useState, useEffect, useRef, useCallback } = React;

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

const PROJECTS = [
  { id: 1, code: 'GGM-36A-TER', name: 'Max Estate Terraces', developer: 'Max Estates Ltd', sector: 'Sector 36A', corridor: 'Dwarka Expressway', city: 'Gurugram', stage: 'New Launch', ticket: '₹0.00 Cr', sqftPrice: 24000, fairLow: 23508, fairHigh: 25214, score: 84, possession: 'Q1 2030', signal: 'Fair entry', signalType: 'neutral', launched: 'EOI', absorption: 'Data pending', location: 7.4, builderRisk: 5.5, lat: 28.47, lng: 77.05, color: '#4ade80' },
  { id: 2, code: 'GGM-42-EXP', name: 'Experion One42', developer: 'Experion Developers', sector: 'Sector 42', corridor: 'Golf Course Ext', city: 'Gurugram', stage: 'Under Construction', ticket: '₹4.50 Cr', sqftPrice: 45000, fairLow: 42000, fairHigh: 46000, score: 70, possession: 'Q3 2027', signal: 'Avoid at ask', signalType: 'danger', launched: 'Launched', absorption: '62%', location: 8.1, builderRisk: 6.2, lat: 28.46, lng: 77.09, color: '#f87171' },
  { id: 3, code: 'GGM-48-SPD', name: 'SP Dualis', developer: 'SP Group', sector: 'Sector 48', corridor: 'Sohna Road', city: 'Gurugram', stage: 'Under Construction', ticket: '₹2.45 Cr', sqftPrice: 24500, fairLow: 22800, fairHigh: 25100, score: 86, possession: 'Q2 2028', signal: 'Fair entry', signalType: 'neutral', launched: 'Launched', absorption: '78%', location: 6.9, builderRisk: 7.0, lat: 28.42, lng: 77.03, color: '#4ade80' },
  { id: 4, code: 'GGM-65-AIR', name: 'Godrej Aira', developer: 'Godrej Properties', sector: 'Sector 65', corridor: 'Golf Course Ext', city: 'Gurugram', stage: 'New Launch', ticket: '₹3.80 Cr', sqftPrice: 32000, fairLow: 30500, fairHigh: 33800, score: 78, possession: 'Q4 2029', signal: 'Builder price pending', signalType: 'warning', launched: 'EOI', absorption: 'Data pending', location: 8.5, builderRisk: 4.0, lat: 28.44, lng: 77.08, color: '#f5a623' },
  { id: 5, code: 'DL-99-AIR', name: 'AIPL Riviera', developer: 'AIPL', sector: 'Sector 76', corridor: 'NH-48', city: 'Gurugram', stage: 'New Launch', ticket: '₹3.28 Cr', sqftPrice: 16000, fairLow: 15200, fairHigh: 17400, score: 71, possession: 'Q2 2031', signal: 'Avoid at ask', signalType: 'danger', launched: 'EOI', absorption: 'Data pending', location: 6.5, builderRisk: 6.8, lat: 28.50, lng: 77.12, color: '#f87171' },
  { id: 6, code: 'GGM-77-ASH', name: 'Ashiana Aaroham', developer: 'Ashiana Housing', sector: 'Sector 77', corridor: 'Dwarka Expressway', city: 'Gurugram', stage: 'Under Construction', ticket: '₹2.99 Cr', sqftPrice: null, fairLow: null, fairHigh: null, score: 77, possession: 'Q3 2028', signal: 'Builder price pending', signalType: 'warning', launched: 'Launched', absorption: '55%', location: 7.0, builderRisk: 5.0, lat: 28.53, lng: 76.98, color: '#f5a623' },
  { id: 7, code: 'GGM-82-MAX', name: 'Max Estate 361', developer: 'Max Estates Ltd', sector: 'Sector 36B', corridor: 'Dwarka Expressway', city: 'Gurugram', stage: 'Under Construction', ticket: '₹6.49 Cr', sqftPrice: 21850, fairLow: 20500, fairHigh: 23000, score: 82, possession: 'Q4 2028', signal: 'Fair entry', signalType: 'neutral', launched: 'Launched', absorption: 'Data pending', location: 7.4, builderRisk: 5.5, lat: 28.48, lng: 77.06, color: '#4ade80' },
];

const SIGNAL_COLORS = { neutral: '#4ade80', danger: '#f87171', warning: '#f5a623' };
const scoreColor = s => s >= 80 ? '#4ade80' : s >= 65 ? '#f5a623' : '#f87171';

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
    <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', overflow: 'hidden', height: 36, display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 2, background: 'linear-gradient(to right, var(--bg2), transparent)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 2, background: 'linear-gradient(to left, var(--bg2), transparent)' }} />
      <div style={{ display: 'flex', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap' }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', borderRight: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{item.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 3 }}>{item.stage}</span>
            <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.ticket}</span>
            <span style={{ fontSize: 11, color: scoreColor(item.score), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.score}/100</span>
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

/* ─── MAP VIEW (canvas) ───────────────────────────────────────────── */
function MapView({ projects, selected, onSelect }) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const LAT_MIN = 28.35, LAT_MAX = 28.62, LNG_MIN = 76.88, LNG_MAX = 77.22;
  const projectToXY = useCallback((lat, lng, w, h) => ({
    x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * w,
    y: h - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * h,
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(124,106,245,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * w, y = (i / 8) * h;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
    [[[28.60,76.90],[28.35,77.20]],[[28.55,76.95],[28.40,77.15]],[[28.50,76.90],[28.50,77.20]],[[28.44,76.88],[28.44,77.22]]].forEach(road => {
      ctx.beginPath();
      road.forEach(([la, ln], i) => { const {x,y} = projectToXY(la, ln, w, h); i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
      ctx.stroke();
    });
    projects.forEach(p => {
      const { x, y } = projectToXY(p.lat, p.lng, w, h);
      const isSel = selected?.id === p.id; const r = isSel ? 14 : 10;
      if (isSel) { ctx.beginPath(); ctx.arc(x, y, r + 8, 0, Math.PI * 2); ctx.strokeStyle = p.color + '44'; ctx.lineWidth = 2; ctx.stroke(); }
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
      grad.addColorStop(0, p.color + '66'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? p.color : p.color + 'cc'; ctx.fill();
      ctx.strokeStyle = isSel ? '#fff' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = isSel ? 2 : 1; ctx.stroke();
      ctx.fillStyle = isSel ? '#000' : p.color;
      ctx.font = `bold ${isSel ? 9 : 8}px DM Mono, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.score, x, y);
    });
  }, [projects, selected]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const w = canvas.width, h = canvas.height;
    let found = null;
    projects.forEach(p => { const { x, y } = projectToXY(p.lat, p.lng, w, h); if (Math.hypot(mx - x, my - y) < 16) found = { project: p, x: mx, y: my }; });
    setTooltip(found); canvas.style.cursor = found ? 'pointer' : 'default';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)' }}>
      <canvas ref={canvasRef} width={700} height={480} style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove} onClick={() => tooltip && onSelect(tooltip.project)} />
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(8,8,13,0.85)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(8px)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Signal</div>
        {[['#4ade80','Fair entry'],['#f5a623','Pending'],['#f87171','Avoid']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, whiteSpace: 'nowrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(8,8,13,0.85)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{projects.length} PROJECTS</span>
      </div>
      {tooltip && (
        <div style={{ position: 'absolute', left: Math.min(tooltip.x + 12, 500), top: Math.max(tooltip.y - 60, 8), background: 'rgba(10,10,18,0.95)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(12px)', pointerEvents: 'none', minWidth: 160 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{tooltip.project.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{tooltip.project.sector}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: SIGNAL_COLORS[tooltip.project.signalType], fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tooltip.project.score}/100</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tooltip.project.signal}</span>
          </div>
        </div>
      )}
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

        <div style={{ display: 'flex', gap: 10, paddingBottom: 96 }}>
          <button style={{ flex: 1, padding: '12px 0', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,106,245,0.4)' }}>Add to Watchlist</button>
          <button style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>Connect Expert</button>
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
function App({ projects = PROJECTS }) {
  const [view, setView] = useState('dashboard');
  const [selected, setSelected] = useState(projects[0]);
  const [detailKey, setDetailKey] = useState(0);
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const filtered = projects.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sector.toLowerCase().includes(search.toLowerCase()) || p.corridor.toLowerCase().includes(search.toLowerCase());
    const mb = budget === 'all' || (budget === 'under3' && p.sqftPrice && p.sqftPrice < 25000) || (budget === '3to5' && p.sqftPrice && p.sqftPrice >= 25000 && p.sqftPrice < 45000) || (budget === 'above5' && p.sqftPrice && p.sqftPrice >= 45000);
    const mst = stageFilter === 'all' || p.stage === stageFilter;
    return ms && mb && mst;
  });

  const select = p => { setSelected(p); setDetailKey(k => k + 1); if (view === 'screener') setView('dashboard'); };
  const tickerItems = projects.map(p => ({ name: p.name, stage: p.stage, ticket: p.ticket, score: p.score }));

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
          <button key={id} onClick={() => setView(id)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: view === id ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${view === id ? 'var(--accent)' : 'transparent'}`,
            color: view === id ? 'var(--accent)' : 'var(--text-dim)',
          }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blink 2s ease infinite', boxShadow: '0 0 6px #4ade80' }} />LIVE DATA
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
              {filtered.map(p => <ProjectCard key={p.id} project={p} selected={selected?.id === p.id} onClick={() => { setSelected(p); setDetailKey(k => k + 1); }} />)}
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {view === 'dashboard' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}><DashboardView projects={filtered} onSelect={select} onNav={setView} /></div>
              {selected && <div style={{ width: 340, flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}><ProjectDetail project={selected} onClose={() => setSelected(null)} animKey={detailKey} /></div>}
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
                  <MapView projects={filtered} selected={selected} onSelect={p => { setSelected(p); setDetailKey(k => k + 1); }} />
                </div>
              </div>
              {selected && <div style={{ width: 340, flexShrink: 0, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}><ProjectDetail project={selected} onClose={() => setSelected(null)} animKey={detailKey} /></div>}
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
