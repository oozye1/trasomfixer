import { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const TRANSOM_SHAPES = [
  {
    id: "flat_vertical",
    name: "Flat / Vertical",
    desc: "Traditional flat panel, perpendicular to waterline. Common on utility boats, dinghies, and fishing vessels.",
    angle: 0,
    pros: ["Maximum strength", "Easy engine mounting", "Simple construction"],
    cons: ["More drag", "Wave slap in following seas"],
  },
  {
    id: "raked",
    name: "Raked (Angled Aft)",
    desc: "Tilted aft from vertical, typically 12\u201320\u00b0. The most common powerboat transom. Allows motor trim/tilt range.",
    angle: 14,
    pros: ["Allows prop trim range", "Sheds following seas", "Reserve buoyancy"],
    cons: ["Reduces waterline length slightly"],
  },
  {
    id: "reverse",
    name: "Reverse (Angled Forward)",
    desc: "Angles backward from deck to water. Modern \u2018sugar scoop\u2019 or \u2018Euro\u2019 style. Extends waterline and adds swim platform area.",
    angle: -15,
    pros: ["Extended waterline", "Built-in swim platform", "Modern aesthetics"],
    cons: ["Less following-sea protection", "Complex construction"],
  },
  {
    id: "notched",
    name: "Notched / Cutaway",
    desc: "Full transom with a central V-shaped cutaway. Reduces drag, allows easy outboard mounting lower on hull.",
    angle: 14,
    pros: ["Reduced drag", "Lower motor mount point", "Easy maintenance"],
    cons: ["Weaker at cutout area", "Needs reinforcement"],
  },
  {
    id: "full",
    name: "Full Transom",
    desc: "Extends from hull bottom to gunwale with no cutouts. Maximum strength and wave protection for offshore use.",
    angle: 10,
    pros: ["Maximum structural integrity", "Best wave protection", "Safest in rough seas"],
    cons: ["Boarding from water is harder", "Heavier"],
  },
  {
    id: "walkthrough",
    name: "Walk-Through",
    desc: "Full transom with a door/gate opening. Popular on family boats for easy swim platform access.",
    angle: 12,
    pros: ["Easy water access", "Family friendly", "Retains most structural strength"],
    cons: ["Requires careful engineering around opening"],
  },
];

const MATERIALS = [
  { id: "titanpour", name: "TitanPour Resin System (pourable composite)", density: 1550, desc: "~1550 kg/m\u00b3 *" },
  { id: "frp_hand", name: "FRP Hand Layup (CSM + Polyester)", density: 1500, desc: "~1500 kg/m\u00b3" },
  { id: "frp_spray", name: "FRP Spray-up", density: 1400, desc: "~1400 kg/m\u00b3" },
  { id: "frp_vacuum", name: "FRP Vacuum Infused (Woven + Epoxy)", density: 1700, desc: "~1700 kg/m\u00b3" },
  { id: "marine_ply", name: "Marine Plywood", density: 550, desc: "~550 kg/m\u00b3" },
  { id: "coosa", name: "Coosa Board (Composite Core)", density: 420, desc: "~420 kg/m\u00b3" },
  { id: "aluminium", name: "Marine Aluminium (5083)", density: 2660, desc: "~2660 kg/m\u00b3" },
];

const ENGINE_CONFIGS = [
  { id: "none", name: "No cutout", count: 0, cutoutW: 0, cutoutH: 0, desc: "Full transom, no engine cutout" },
  { id: "single_ob", name: "Single outboard", count: 1, cutoutW: 660, cutoutH: 380, desc: "Standard single outboard cutout" },
  { id: "twin_ob", name: "Twin outboard", count: 2, cutoutW: 660, cutoutH: 380, desc: "Two side-by-side outboard cutouts" },
  { id: "triple_ob", name: "Triple outboard", count: 3, cutoutW: 660, cutoutH: 380, desc: "Three outboard cutouts" },
  { id: "single_sd", name: "Single sterndrive", count: 1, cutoutW: 500, cutoutH: 450, desc: "Sterndrive leg cutout" },
  { id: "twin_sd", name: "Twin sterndrive", count: 2, cutoutW: 500, cutoutH: 450, desc: "Two sterndrive cutouts" },
  { id: "custom", name: "Custom", count: 1, cutoutW: 660, cutoutH: 380, desc: "Enter your own dimensions" },
];

const DEFAULT_LOCATION = {
  name: "Folkestone",
  admin1: "England",
  country: "United Kingdom",
  latitude: 51.0818,
  longitude: 1.1669,
};

const WEATHER_DESC = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Dense freezing drizzle",
  61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Moderate showers", 82: "Violent showers",
  85: "Light snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Thunderstorm + heavy hail",
};

const RAIN_CODES = new Set([51,53,55,56,57,61,63,65,66,67,80,81,82,85,86,95,96,99]);

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// ═══════════════════════════════════════════
// ONBOARDING TUTORIAL STEPS
// ═══════════════════════════════════════════

const TUTORIAL_STEPS = [
  {
    title: "Welcome to TitanPour",
    subtitle: "Transom Engineering Calculator",
    body: "This tool helps you plan and calculate everything needed for a pourable composite transom job — from shape selection and material quantities to reinforcement rods and live weather conditions for curing.",
    icon: "rocket",
    accent: "#f59e0b",
  },
  {
    title: "1. Choose Your Transom Shape",
    subtitle: "Transom Shapes tab",
    body: "Start by selecting the type of transom you're working on. Each shape shows typical rake angles, advantages, and trade-offs. This sets the foundation for all your calculations.",
    icon: "shapes",
    accent: "#f59e0b",
    tab: "shapes",
  },
  {
    title: "2. Calculate Area & Weight",
    subtitle: "Area & Weight tab",
    body: "Enter your transom dimensions (width, height, rake angle, thickness) and select your material. Choose an engine configuration to account for cutouts. The calculator handles all slope conversions automatically and shows net resin volume with wastage.",
    icon: "calc",
    accent: "#22c55e",
    tab: "calc",
  },
  {
    title: "3. Plan Your Rod Grid",
    subtitle: "Rod Spacing tab",
    body: "Set the reinforcement rod spacing and diameter. The calculator works out how many rods you need, their cut lengths (accounting for the slope), and the total rod length to order. A face-on preview shows the grid layout.",
    icon: "grid",
    accent: "#3b82f6",
    tab: "rods",
  },
  {
    title: "4. Check Live Weather",
    subtitle: "Live Weather tab",
    body: "Search any location worldwide to get real-time temperature, humidity, and dew point — all critical for resin cure. The system gives a GO / CAUTION / NO-GO verdict, finds the best layup window, and shows a 7-day outlook. Data refreshes every 10 minutes.",
    icon: "weather",
    accent: "#f59e0b",
    tab: "temp",
  },
  {
    title: "5. Review Your Job Summary",
    subtitle: "Job Summary tab",
    body: "Everything in one place — transom specs, engine config, areas, resin order quantities, rod requirements, and current weather verdict. Use this as your job sheet before you start the pour.",
    icon: "summary",
    accent: "#f59e0b",
    tab: "summary",
  },
  {
    title: "Safety First",
    subtitle: "Important",
    body: "This calculator provides estimates for planning and ordering. All calculations must be verified by a qualified marine engineer before construction. Boat transoms are safety-critical — always cross-check against the product data sheet, engine mounting specs, and ISO 12215.",
    icon: "safety",
    accent: "#ef4444",
  },
];

// ═══════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════

async function searchLocations(query) {
  if (query.length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

async function fetchForecast(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,apparent_temperature,weather_code` +
    `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=7`
  );
  if (!res.ok) throw new Error("Forecast fetch failed");
  return await res.json();
}

// ═══════════════════════════════════════════
// CURE VERDICT
// ═══════════════════════════════════════════

function getCureVerdict(temp, humidity, dewPoint) {
  const dewMargin = temp - dewPoint;
  const isRaining = false; // handled separately via weather code

  if (temp >= 15 && humidity < 80 && dewMargin >= 3) {
    return { status: "GO", color: "#22c55e", label: "IDEAL CONDITIONS", msg: "Temperature and humidity within optimal range for resin cure." };
  }
  if (dewMargin < 2) {
    return { status: "NO-GO", color: "#ef4444", label: "DEW POINT RISK", msg: "Surface condensation likely. Substrate must be 3\u00b0C above dew point." };
  }
  if (temp < 10) {
    return { status: "NO-GO", color: "#ef4444", label: "TOO COLD", msg: "Risk of incomplete cure. Heated workspace required. Min substrate temp: 10\u00b0C." };
  }
  if (humidity >= 85) {
    return { status: "NO-GO", color: "#ef4444", label: "TOO HUMID", msg: "High humidity will affect surface cure and gel coat. Forced ventilation needed." };
  }
  if (temp >= 10 && temp < 15) {
    return { status: "CAUTION", color: "#f59e0b", label: "WORKABLE \u2014 SLOW HARDENER", msg: "Extend cure time 50\u2013100%. Use slow/winter hardener. Work warmest hours." };
  }
  if (humidity >= 80) {
    return { status: "CAUTION", color: "#f59e0b", label: "HUMIDITY MARGINAL", msg: "Humidity above 80%. Ensure ventilation. Monitor for surface moisture." };
  }
  return { status: "GO", color: "#22c55e", label: "GOOD CONDITIONS", msg: "Conditions suitable for resin work." };
}

function getTempColor(temp) {
  if (temp >= 15) return "#22c55e";
  if (temp >= 10) return "#f59e0b";
  return "#ef4444";
}

function getDayVerdict(high, low, weatherCode) {
  if (RAIN_CODES.has(weatherCode)) return { label: "RAIN", color: "#3b82f6", short: "Rain expected" };
  if (high >= 15) return { label: "GO", color: "#22c55e", short: "Ideal window likely" };
  if (high >= 10) return { label: "POSSIBLE", color: "#f59e0b", short: "Workable at peak" };
  return { label: "NO-GO", color: "#ef4444", short: "Too cold" };
}

// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

function TransomProfile({ shape, size = 120 }) {
  const angleRad = (shape.angle * Math.PI) / 180;
  const topX = 50 + Math.sin(angleRad) * 35;
  const botX = 50 - Math.sin(angleRad) * 5;
  const waterY = 72;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ background: "#0a1628", borderRadius: 8 }}>
      <rect x="0" y={waterY} width="100" height={100 - waterY} fill="#1a4a7a" opacity="0.4" />
      <line x1="0" y1={waterY} x2="100" y2={waterY} stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="3,2" />
      <path d={`M 15 85 Q 30 92 50 90 Q 70 92 85 85`} fill="none" stroke="#64748b" strokeWidth="1.2" />
      {shape.id === "walkthrough" ? (
        <>
          <line x1={topX} y1="15" x2={botX + (topX - botX) * 0.55} y2="50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={botX + (topX - botX) * 0.35} y1="60" x2={botX} y2="85" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <text x={botX + (topX - botX) * 0.45} y="57" fill="#94a3b8" fontSize="6" textAnchor="middle">door</text>
        </>
      ) : shape.id === "notched" ? (
        <>
          <line x1={topX} y1="15" x2={botX + (topX - botX) * 0.5} y2="52" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <polyline
            points={`${botX + (topX - botX) * 0.5},52 ${botX + (topX - botX) * 0.35 + 5},65 ${botX + (topX - botX) * 0.25},72`}
            fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <line x1={botX + (topX - botX) * 0.25} y1="72" x2={botX} y2="85" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <line x1={topX} y1="15" x2={botX} y2="85" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {shape.angle !== 0 && (
        <>
          <line x1="50" y1="15" x2="50" y2="50" stroke="#475569" strokeWidth="0.6" strokeDasharray="2,2" />
          <text x="62" y="30" fill="#94a3b8" fontSize="7">{Math.abs(shape.angle)}\u00b0</text>
        </>
      )}
      <text x="50" y="8" fill="#e2e8f0" fontSize="6" textAnchor="middle" fontWeight="600">{shape.name}</text>
      <text x="8" y={waterY + 4} fill="#3b82f6" fontSize="5">WL</text>
    </svg>
  );
}

function ShapeCard({ shape, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(shape.id)}
      style={{
        background: selected ? "#1e293b" : "#0f172a",
        border: selected ? "2px solid #f59e0b" : "2px solid #1e293b",
        borderRadius: 12, padding: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
      }}
    >
      <TransomProfile shape={shape} size={100} />
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>{shape.desc}</p>
      <div style={{ marginTop: 8 }}>
        <span style={{ color: "#22c55e", fontSize: 11 }}>{"\u2713"} </span>
        <span style={{ color: "#94a3b8", fontSize: 11 }}>{shape.pros[0]}</span>
      </div>
    </button>
  );
}

function NumberInput({ label, value, onChange, unit, min, max, step = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <label style={{ color: "#94a3b8", fontSize: 13, minWidth: 160 }}>{label}</label>
      <input
        type="number" value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step}
        style={{
          background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
          color: "#e2e8f0", padding: "6px 10px", width: 90, fontSize: 14,
        }}
      />
      <span style={{ color: "#64748b", fontSize: 12 }}>{unit}</span>
    </div>
  );
}

function ResultBox({ label, value, unit, highlight }) {
  return (
    <div style={{
      background: highlight ? "#1a2744" : "#0f172a",
      border: highlight ? "1px solid #3b82f6" : "1px solid #1e293b",
      borderRadius: 8, padding: "10px 14px", minWidth: 140,
    }}>
      <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: highlight ? "#60a5fa" : "#e2e8f0", fontSize: 18, fontWeight: 700 }}>
        {value} <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ONBOARDING OVERLAY
// ═══════════════════════════════════════════

function TutorialIcon({ icon, size = 48 }) {
  const s = { width: size, height: size };
  if (icon === "rocket") return (
    <svg viewBox="0 0 48 48" style={s}><path d="M24 4C24 4 10 16 10 32l6 4 8-8 8 8 6-4C38 16 24 4 24 4z" fill="#f59e0b" opacity="0.9"/><circle cx="24" cy="20" r="4" fill="#020617"/><path d="M10 32l-4 8 8-4M38 32l4 8-8-4" fill="#f59e0b" opacity="0.6"/></svg>
  );
  if (icon === "shapes") return (
    <svg viewBox="0 0 48 48" style={s}><polygon points="24,6 42,38 6,38" fill="none" stroke="#f59e0b" strokeWidth="2.5"/><line x1="24" y1="6" x2="24" y2="38" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"/></svg>
  );
  if (icon === "calc") return (
    <svg viewBox="0 0 48 48" style={s}><rect x="8" y="6" width="32" height="36" rx="4" fill="none" stroke="#22c55e" strokeWidth="2.5"/><rect x="14" y="12" width="20" height="8" rx="2" fill="#22c55e" opacity="0.3"/><circle cx="18" cy="28" r="2" fill="#22c55e"/><circle cx="30" cy="28" r="2" fill="#22c55e"/><circle cx="18" cy="36" r="2" fill="#22c55e"/><circle cx="30" cy="36" r="2" fill="#22c55e"/></svg>
  );
  if (icon === "grid") return (
    <svg viewBox="0 0 48 48" style={s}><rect x="6" y="6" width="36" height="36" fill="none" stroke="#3b82f6" strokeWidth="2"/>{[18,30].map(x=><line key={`v${x}`} x1={x} y1="6" x2={x} y2="42" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6"/>)}{[18,30].map(y=><line key={`h${y}`} x1="6" y1={y} x2="42" y2={y} stroke="#f59e0b" strokeWidth="1.5" opacity="0.6"/>)}</svg>
  );
  if (icon === "weather") return (
    <svg viewBox="0 0 48 48" style={s}><circle cx="20" cy="20" r="8" fill="#f59e0b" opacity="0.8"/>{[[20,4],[20,36],[4,20],[36,20],[9,9],[31,9],[9,31],[31,31]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.5" fill="#f59e0b" opacity="0.4"/>)}<path d="M28 30a8 8 0 0 1-16 0 6 6 0 0 1 0-12 8 8 0 0 1 16 0z" fill="#94a3b8" opacity="0.4" transform="translate(6,4)"/></svg>
  );
  if (icon === "summary") return (
    <svg viewBox="0 0 48 48" style={s}><rect x="10" y="4" width="28" height="40" rx="3" fill="none" stroke="#f59e0b" strokeWidth="2"/><line x1="16" y1="14" x2="32" y2="14" stroke="#f59e0b" strokeWidth="2" opacity="0.6"/><line x1="16" y1="22" x2="32" y2="22" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4"/><line x1="16" y1="28" x2="28" y2="28" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4"/><line x1="16" y1="34" x2="30" y2="34" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4"/></svg>
  );
  if (icon === "safety") return (
    <svg viewBox="0 0 48 48" style={s}><path d="M24 4L6 14v12c0 11 8 18 18 22 10-4 18-11 18-22V14L24 4z" fill="none" stroke="#ef4444" strokeWidth="2.5"/><text x="24" y="32" textAnchor="middle" fill="#ef4444" fontSize="22" fontWeight="800">!</text></svg>
  );
  return null;
}

function OnboardingOverlay({ step, totalSteps, onNext, onPrev, onSkip, onFinish }) {
  const data = TUTORIAL_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(2, 6, 23, 0.92)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "tutorialFadeIn 0.3s ease-out",
    }}>
      <style>{`
        @keyframes tutorialFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes tutorialSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{
        background: "#0f172a", border: `1px solid ${data.accent}40`,
        borderRadius: 16, maxWidth: 520, width: "100%",
        boxShadow: `0 0 60px ${data.accent}15, 0 25px 50px rgba(0,0,0,0.5)`,
        animation: "tutorialSlide 0.35s ease-out",
        overflow: "hidden",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#1e293b" }}>
          <div style={{
            height: "100%", background: data.accent,
            width: `${((step + 1) / totalSteps) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ padding: "32px 32px 24px" }}>
          {/* Icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{
              background: `${data.accent}12`, border: `1px solid ${data.accent}30`,
              borderRadius: 16, padding: 16, display: "inline-flex",
            }}>
              <TutorialIcon icon={data.icon} size={56} />
            </div>
          </div>

          {/* Step counter */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{
              color: data.accent, fontSize: 11, fontWeight: 700,
              background: `${data.accent}15`, padding: "3px 10px", borderRadius: 20,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              {isFirst ? "Getting Started" : isLast ? "One More Thing" : `Step ${step} of ${totalSteps - 2}`}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            color: "#e2e8f0", fontSize: 22, fontWeight: 800,
            textAlign: "center", margin: "12px 0 4px", letterSpacing: "-0.3px",
          }}>
            {data.title}
          </h2>

          {/* Subtitle */}
          <div style={{ color: data.accent, fontSize: 13, textAlign: "center", fontWeight: 600, marginBottom: 16 }}>
            {data.subtitle}
          </div>

          {/* Body */}
          <p style={{
            color: "#94a3b8", fontSize: 14, lineHeight: 1.7,
            textAlign: "center", margin: "0 0 28px",
          }}>
            {data.body}
          </p>

          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? data.accent : "#334155",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {!isFirst && (
              <button onClick={onPrev} style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
                color: "#94a3b8", padding: "10px 20px", fontSize: 13,
                cursor: "pointer", fontWeight: 600,
              }}>
                Back
              </button>
            )}
            {isFirst && (
              <button onClick={onSkip} style={{
                background: "transparent", border: "1px solid #334155", borderRadius: 8,
                color: "#64748b", padding: "10px 20px", fontSize: 13,
                cursor: "pointer",
              }}>
                Skip tutorial
              </button>
            )}
            <button onClick={isLast ? onFinish : onNext} style={{
              background: data.accent, border: "none", borderRadius: 8,
              color: "#020617", padding: "10px 28px", fontSize: 14,
              cursor: "pointer", fontWeight: 700,
            }}>
              {isLast ? "Start Building" : isFirst ? "Show Me Around" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function TransomCalculator() {
  const [tab, setTab] = useState("shapes");
  const [selectedShape, setSelectedShape] = useState("raked");

  // ── Onboarding tutorial state ──
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const reopenTutorial = useCallback(() => {
    setTutorialStep(0);
    setShowTutorial(true);
  }, []);

  const handleTutorialNext = useCallback(() => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    if (TUTORIAL_STEPS[nextStep]?.tab) setTab(TUTORIAL_STEPS[nextStep].tab);
  }, [tutorialStep]);

  const handleTutorialPrev = useCallback(() => {
    const prevStep = tutorialStep - 1;
    setTutorialStep(prevStep);
    if (TUTORIAL_STEPS[prevStep]?.tab) setTab(TUTORIAL_STEPS[prevStep].tab);
  }, [tutorialStep]);

  // Area calculator state
  const [transomWidth, setTransomWidth] = useState(1800);
  const [transomHeight, setTransomHeight] = useState(508);
  const [transomAngle, setTransomAngle] = useState(20);
  const [thickness, setThickness] = useState(50);
  const [materialId, setMaterialId] = useState("titanpour");

  // Engine cutout
  const [engineConfig, setEngineConfig] = useState("single_ob");
  const [cutoutWidth, setCutoutWidth] = useState(660);
  const [cutoutHeight, setCutoutHeight] = useState(380);
  const [cutoutCount, setCutoutCount] = useState(1);
  const hasCutout = cutoutCount > 0;

  // Resin
  const [wastagePercent, setWastagePercent] = useState(10);

  // Rod spacing
  const [rodSpacing, setRodSpacing] = useState(70);
  const [rodDiameter, setRodDiameter] = useState(6);

  // ── LIVE WEATHER STATE ──
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const material = MATERIALS.find((m) => m.id === materialId);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch forecast for a location ──
  const loadForecast = useCallback(async (lat, lon) => {
    setLoadingForecast(true);
    setForecastError(null);
    try {
      const data = await fetchForecast(lat, lon);
      setForecastData(data);
      setLastUpdated(new Date());
    } catch (e) {
      setForecastError("Failed to fetch live weather data. Check connection and retry.");
      console.error(e);
    }
    setLoadingForecast(false);
  }, []);

  // ── Auto-refresh every 10 min ──
  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    // Initial fetch
    loadForecast(selectedLocation.latitude, selectedLocation.longitude);
    // Set up interval
    refreshIntervalRef.current = setInterval(() => {
      loadForecast(selectedLocation.latitude, selectedLocation.longitude);
    }, REFRESH_INTERVAL);
    return () => clearInterval(refreshIntervalRef.current);
  }, [selectedLocation, loadForecast]);

  // ── Debounced location search ──
  const handleSearchInput = useCallback((value) => {
    setLocationQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(value);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }, []);

  // ── Select a location ──
  const handleSelectLocation = useCallback((loc) => {
    setSelectedLocation({
      name: loc.name,
      admin1: loc.admin1 || "",
      country: loc.country || "",
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
    setShowDropdown(false);
    setLocationQuery("");
  }, []);

  // ── Use browser geolocation ──
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSelectLocation({
          name: "My Location",
          admin1: "",
          country: `${pos.coords.latitude.toFixed(3)}\u00b0, ${pos.coords.longitude.toFixed(3)}\u00b0`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setForecastError("Geolocation denied or unavailable.");
      }
    );
  }, [handleSelectLocation]);

  // ── Manual refresh ──
  const handleRefresh = useCallback(() => {
    loadForecast(selectedLocation.latitude, selectedLocation.longitude);
  }, [selectedLocation, loadForecast]);

  // ── Engineering calculations ──
  // All areas computed on the panel surface (slope plane) for consistency.
  // Cutout height is converted from face-on (vertical) to slope measurement
  // since engine cutout specs are given as face-on dimensions.
  const calcs = useMemo(() => {
    const angleRad = (transomAngle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);

    // Panel slope height: vertical height projected onto the raked surface
    // h_slope = h_vertical / cos(angle)
    const slopeHeight = transomHeight / cosAngle;

    // Gross panel area on the slope surface (mm²)
    const grossArea_mm2 = transomWidth * slopeHeight;
    const grossArea_m2 = grossArea_mm2 / 1e6;

    // Cutout: specs are face-on (vertical) measurements.
    // Width is unchanged (perpendicular to rake axis).
    // Height must be converted to slope: h_cutout_slope = h_cutout_vertical / cos(angle)
    // Multiple cutouts: total cutout = single cutout area × count
    const cutoutSlopeHeight = hasCutout ? cutoutHeight / cosAngle : 0;
    const singleCutoutArea_mm2 = hasCutout ? cutoutWidth * cutoutSlopeHeight : 0;
    const cutoutArea_mm2 = singleCutoutArea_mm2 * cutoutCount;
    const cutoutArea_m2 = cutoutArea_mm2 / 1e6;

    // Net panel area (slope surface minus cutout)
    const netArea_mm2 = grossArea_mm2 - cutoutArea_mm2;
    const netArea_m2 = netArea_mm2 / 1e6;

    // Volume = surface area × thickness (uniform thickness normal to surface)
    const volume_mm3 = netArea_mm2 * thickness;
    const volume_m3 = volume_mm3 / 1e9;

    // Weight = volume × material density
    const weight_kg = volume_m3 * material.density;
    const weight_g = weight_kg * 1000;

    // GSM = mass per unit surface area (g/m²)
    // = (thickness_m) × (density_kg/m³) × 1000 g/kg
    const gsm = (thickness / 1000) * material.density * 1000;

    // Resin volume (litres) = volume_mm3 / 1e6 (1 litre = 1e6 mm³)
    const resinLitres = volume_mm3 / 1e6;
    const resinWithWastage = resinLitres * (1 + wastagePercent / 100);

    // Rod grid: spacing measured along the panel surface
    const hRods = Math.floor(slopeHeight / rodSpacing) + 1;
    const vRods = Math.floor(transomWidth / rodSpacing) + 1;
    const hRodLength = transomWidth;  // each H rod spans full width
    const vRodLength = slopeHeight;   // each V rod runs full slope height
    const totalHRodLength = hRods * hRodLength;
    const totalVRodLength = vRods * vRodLength;
    const totalRodLength = totalHRodLength + totalVRodLength;

    return {
      slopeHeight: slopeHeight.toFixed(1),
      cutoutSlopeHeight: cutoutSlopeHeight.toFixed(1),
      grossArea_m2: grossArea_m2.toFixed(4),
      cutoutArea_m2: cutoutArea_m2.toFixed(4),
      cutoutCount,
      netArea_m2: netArea_m2.toFixed(4),
      volume_m3: (volume_m3 * 1000).toFixed(2),
      resinLitres: resinLitres.toFixed(2),
      resinWithWastage: resinWithWastage.toFixed(2),
      weight_g: weight_g.toFixed(0),
      weight_kg: weight_kg.toFixed(2),
      gsm: gsm.toFixed(0),
      hRods, vRods,
      hRodLength: hRodLength.toFixed(0),
      vRodLength: vRodLength.toFixed(0),
      totalHRodLength: (totalHRodLength / 1000).toFixed(2),
      totalVRodLength: (totalVRodLength / 1000).toFixed(2),
      totalRodLength: (totalRodLength / 1000).toFixed(2),
      totalRodCount: hRods + vRods,
    };
  }, [transomWidth, transomHeight, transomAngle, thickness, materialId, cutoutWidth, cutoutHeight, cutoutCount, hasCutout, rodSpacing, wastagePercent, material]);

  // ── Hourly data for today (next 24h) ──
  const hourlyToday = useMemo(() => {
    if (!forecastData?.hourly) return [];
    const times = forecastData.hourly.time;
    const temps = forecastData.hourly.temperature_2m;
    const hums = forecastData.hourly.relative_humidity_2m;
    const dews = forecastData.hourly.dew_point_2m;
    // Show first 24 hours (today in location's timezone)
    return times.slice(0, 24).map((t, i) => ({
      hour: parseInt(t.slice(11, 13), 10),
      temp: temps[i],
      humidity: hums[i],
      dewPoint: dews[i],
    }));
  }, [forecastData]);

  // ── Best layup window today ──
  const bestWindow = useMemo(() => {
    if (hourlyToday.length === 0) return null;
    // Find longest contiguous run of workable hours (temp >= 10, humidity < 85, between 06:00-20:00)
    let bestStart = -1, bestLen = 0, bestAvgTemp = 0;
    let currStart = -1, currLen = 0, currTempSum = 0;

    for (let i = 0; i < hourlyToday.length; i++) {
      const h = hourlyToday[i];
      if (h.hour >= 6 && h.hour <= 20 && h.temp >= 10 && h.humidity < 85) {
        if (currStart === -1) { currStart = i; currTempSum = 0; }
        currLen++;
        currTempSum += h.temp;
        if (currLen > bestLen || (currLen === bestLen && currTempSum / currLen > bestAvgTemp)) {
          bestStart = currStart;
          bestLen = currLen;
          bestAvgTemp = currTempSum / currLen;
        }
      } else {
        currStart = -1;
        currLen = 0;
        currTempSum = 0;
      }
    }

    if (bestStart < 0) return null;
    return {
      startHour: hourlyToday[bestStart].hour,
      endHour: hourlyToday[bestStart + bestLen - 1].hour,
      hours: bestLen,
      avgTemp: bestAvgTemp.toFixed(1),
    };
  }, [hourlyToday]);

  // ── Daily forecast ──
  const dailyForecast = useMemo(() => {
    if (!forecastData?.daily) return [];
    const days = forecastData.daily.time;
    const highs = forecastData.daily.temperature_2m_max;
    const lows = forecastData.daily.temperature_2m_min;
    const codes = forecastData.daily.weather_code;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return days.map((d, i) => {
      const date = new Date(d + "T12:00:00");
      const verdict = getDayVerdict(highs[i], lows[i], codes[i]);
      return {
        date: d,
        dayName: dayNames[date.getDay()],
        dayNum: date.getDate(),
        month: date.toLocaleString("en", { month: "short" }),
        high: highs[i],
        low: lows[i],
        weatherCode: codes[i],
        weather: WEATHER_DESC[codes[i]] || "Unknown",
        verdict,
      };
    });
  }, [forecastData]);

  // ── Best day this week ──
  const bestDay = useMemo(() => {
    if (dailyForecast.length === 0) return null;
    // Best = highest high temp, not raining
    const nonRainy = dailyForecast.filter(d => !RAIN_CODES.has(d.weatherCode));
    if (nonRainy.length === 0) return null;
    return nonRainy.reduce((best, d) => d.high > best.high ? d : best, nonRainy[0]);
  }, [dailyForecast]);

  // ── Engine config handler ──
  const handleEngineConfig = useCallback((configId) => {
    setEngineConfig(configId);
    const cfg = ENGINE_CONFIGS.find(c => c.id === configId);
    if (cfg) {
      setCutoutCount(cfg.count);
      if (cfg.id !== "custom") {
        setCutoutWidth(cfg.cutoutW);
        setCutoutHeight(cfg.cutoutH);
      }
    }
  }, []);

  const tabs = [
    { id: "shapes", label: "Transom Shapes" },
    { id: "calc", label: "Area & Weight" },
    { id: "rods", label: "Rod Spacing" },
    { id: "temp", label: "Live Weather" },
    { id: "summary", label: "Job Summary" },
  ];

  // ── Time since last update ──
  const timeSinceUpdate = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 60000)
    : null;

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: "#020617", color: "#e2e8f0", minHeight: "100vh", padding: "24px 16px",
    }}>
      {/* ═══ ONBOARDING TUTORIAL ═══ */}
      {showTutorial && (
        <OnboardingOverlay
          step={tutorialStep}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={handleTutorialNext}
          onPrev={handleTutorialPrev}
          onSkip={closeTutorial}
          onFinish={closeTutorial}
        />
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", margin: 0, letterSpacing: "-0.5px" }}>
              TitanPour &mdash; Transom Engineering Calculator
            </h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
              Pourable composite transom system &middot; Shape reference &middot; Area &amp; weight &middot; Rod spacing &middot; Live weather &middot; Job summary
            </p>
          </div>
          <button
            onClick={reopenTutorial}
            style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
              color: "#94a3b8", padding: "6px 14px", fontSize: 12, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            ? Tutorial
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "#f59e0b" : "#1e293b",
                color: tab === t.id ? "#020617" : "#94a3b8",
                border: "none", borderRadius: 8, padding: "8px 16px",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {t.label}
              {t.id === "temp" && forecastData?.current && (
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                  {forecastData.current.temperature_2m.toFixed(0)}\u00b0C
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== SHAPES TAB ===== */}
        {tab === "shapes" && (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12, marginBottom: 20,
            }}>
              {TRANSOM_SHAPES.map((s) => (
                <ShapeCard key={s.id} shape={s} selected={selectedShape === s.id} onClick={setSelectedShape} />
              ))}
            </div>
            {(() => {
              const s = TRANSOM_SHAPES.find((x) => x.id === selectedShape);
              return (
                <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <TransomProfile shape={s} size={150} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h2 style={{ fontSize: 18, color: "#f59e0b", margin: "0 0 4px" }}>{s.name}</h2>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{s.desc}</p>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Typical angle: </span>
                        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                          {s.angle === 0 ? "0\u00b0 (vertical)" : `${Math.abs(s.angle)}\u00b0 ${s.angle > 0 ? "raked aft" : "reversed forward"}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
                        <div>
                          <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ADVANTAGES</div>
                          {s.pros.map((p, i) => (
                            <div key={i} style={{ color: "#94a3b8", fontSize: 12, padding: "2px 0" }}>{"\u2713"} {p}</div>
                          ))}
                        </div>
                        <div>
                          <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>TRADE-OFFS</div>
                          {s.cons.map((c, i) => (
                            <div key={i} style={{ color: "#94a3b8", fontSize: 12, padding: "2px 0" }}>{"\u2717"} {c}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, padding: "12px 16px", background: "#1e293b", borderRadius: 8 }}>
                    <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>INDUSTRY ANGLE REFERENCE</div>
                    <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>
                      Average powerboat transom rake: <strong style={{ color: "#f59e0b" }}>12\u201316\u00b0</strong> (industry avg ~14\u00b0) &middot;
                      Sterndrive spec (MerCruiser): <strong style={{ color: "#e2e8f0" }}>13\u201316\u00b0</strong> &middot;
                      Max safe outboard rake: <strong style={{ color: "#e2e8f0" }}>~17\u00b0</strong> &middot;
                      Your design target: <strong style={{ color: "#22c55e" }}>20\u00b0</strong> (steep \u2014 verify motor tilt clearance)
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== AREA & WEIGHT TAB ===== */}
        {tab === "calc" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
                <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>TRANSOM DIMENSIONS</h3>
                <NumberInput label="Width (beam at transom)" value={transomWidth} onChange={setTransomWidth} unit="mm" min={500} max={5000} />
                <NumberInput label="Height (vertical)" value={transomHeight} onChange={setTransomHeight} unit="mm" min={200} max={1500} />
                <NumberInput label="Rake / Slope angle" value={transomAngle} onChange={setTransomAngle} unit="\u00b0" min={0} max={35} />
                <NumberInput label="Thickness" value={thickness} onChange={setThickness} unit="mm" min={5} max={150} step={0.5} />
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                  <label style={{ color: "#94a3b8", fontSize: 13 }}>Material</label>
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    style={{
                      display: "block", width: "100%", background: "#1e293b",
                      border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0",
                      padding: "8px 10px", fontSize: 13, marginTop: 4,
                    }}
                  >
                    {MATERIALS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} \u2014 {m.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginTop: 12 }}>
                <h3 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>ENGINE CONFIGURATION</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {ENGINE_CONFIGS.map((cfg) => (
                    <button
                      key={cfg.id}
                      onClick={() => handleEngineConfig(cfg.id)}
                      style={{
                        background: engineConfig === cfg.id ? "#f59e0b20" : "#1e293b",
                        border: engineConfig === cfg.id ? "1px solid #f59e0b" : "1px solid #334155",
                        borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer",
                        color: engineConfig === cfg.id ? "#f59e0b" : "#94a3b8",
                        fontWeight: engineConfig === cfg.id ? 700 : 400,
                      }}
                    >
                      {cfg.name}
                    </button>
                  ))}
                </div>
                {hasCutout && (
                  <>
                    <NumberInput label="Cutout width (each)" value={cutoutWidth} onChange={setCutoutWidth} unit="mm" min={200} max={1500} />
                    <NumberInput label="Cutout height (face-on)" value={cutoutHeight} onChange={setCutoutHeight} unit="mm" min={100} max={800} />
                    {engineConfig === "custom" && (
                      <NumberInput label="Number of cutouts" value={cutoutCount} onChange={setCutoutCount} unit="" min={1} max={4} />
                    )}
                    {transomAngle > 0 && (
                      <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2, marginBottom: 4 }}>
                        On slope at {transomAngle}&deg;: {calcs.cutoutSlopeHeight}mm actual cut height
                      </div>
                    )}
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>
                      {cutoutCount > 1 ? `${cutoutCount} cutouts @ ${cutoutWidth} x ${cutoutHeight} mm each` : `${cutoutWidth} x ${cutoutHeight} mm`}
                      {cutoutCount > 1 && ` \u2014 total cutout area: ${calcs.cutoutArea_m2} m\u00b2`}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginTop: 12 }}>
                <h3 style={{ color: "#3b82f6", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>RESIN VOLUME</h3>
                <NumberInput label="Wastage allowance" value={wastagePercent} onChange={setWastagePercent} unit="%" min={0} max={30} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <ResultBox label="Net resin volume" value={calcs.resinLitres} unit="litres" />
                  <ResultBox label={`With ${wastagePercent}% wastage`} value={calcs.resinWithWastage} unit="litres" highlight />
                </div>
                {materialId === "titanpour" && (
                  <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                    * TitanPour density is placeholder (1550 kg/m\u00b3). Update when confirmed specs available.
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
                <h3 style={{ color: "#22c55e", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>RESULTS</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <ResultBox label="Slope Height (on angle)" value={calcs.slopeHeight} unit="mm" />
                  <ResultBox label="Gross Area" value={calcs.grossArea_m2} unit="m\u00b2" />
                  {hasCutout && <ResultBox label={`Cutout Area (${cutoutCount}x)`} value={calcs.cutoutArea_m2} unit="m\u00b2" />}
                  <ResultBox label="Net Area" value={calcs.netArea_m2} unit="m\u00b2" highlight />
                  <ResultBox label="Resin Volume (net)" value={calcs.resinLitres} unit="litres" />
                  <ResultBox label={`Resin +${wastagePercent}% waste`} value={calcs.resinWithWastage} unit="litres" highlight />
                  <ResultBox label="Total Weight" value={calcs.weight_kg} unit="kg" highlight />
                  <ResultBox label="GSM (surface weight)" value={calcs.gsm} unit="g/m\u00b2" />
                </div>
              </div>

              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginTop: 12 }}>
                <h3 style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px" }}>CROSS-SECTION SCHEMATIC</h3>
                <svg viewBox="0 0 300 200" style={{ width: "100%", maxHeight: 200, background: "#020617", borderRadius: 8 }}>
                  {(() => {
                    const aRad = (transomAngle * Math.PI) / 180;
                    const dx = Math.sin(aRad) * 140;
                    const topL = 150 - dx / 2 - thickness / 6;
                    const topR = topL + thickness / 3;
                    const botL = 150 + dx / 2 - thickness / 6;
                    const botR = botL + thickness / 3;
                    return (
                      <>
                        <polygon
                          points={`${topL},20 ${topR},20 ${botR},170 ${botL},170`}
                          fill="#b45309" opacity="0.6" stroke="#f59e0b" strokeWidth="1.5"
                        />
                        {hasCutout && (
                          <rect
                            x={(topL + botL) / 2 - 15} y={60} width={30} height={50}
                            fill="#020617" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2"
                          />
                        )}
                        <line x1="40" y1="20" x2="40" y2="170" stroke="#3b82f6" strokeWidth="0.8" />
                        <line x1="36" y1="20" x2="44" y2="20" stroke="#3b82f6" strokeWidth="0.8" />
                        <line x1="36" y1="170" x2="44" y2="170" stroke="#3b82f6" strokeWidth="0.8" />
                        <text x="28" y="100" fill="#3b82f6" fontSize="9" textAnchor="middle" transform="rotate(-90, 28, 100)">{transomHeight}mm</text>
                        <text x={(topL + topR) / 2} y="14" fill="#f59e0b" fontSize="8" textAnchor="middle">{transomAngle}\u00b0</text>
                        <text x={(topR + botR) / 2 + 20} y="100" fill="#94a3b8" fontSize="8" textAnchor="start">{thickness}mm</text>
                        {hasCutout && (
                          <text x={(topL + botL) / 2} y={118} fill="#ef4444" fontSize="7" textAnchor="middle">cutout</text>
                        )}
                      </>
                    );
                  })()}
                  <text x="150" y="190" fill="#64748b" fontSize="8" textAnchor="middle">{transomWidth}mm wide (into page)</text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ===== ROD SPACING TAB ===== */}
        {tab === "rods" && (
          <div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
                <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>ROD GRID PARAMETERS</h3>
                <NumberInput label="Rod spacing (H & V)" value={rodSpacing} onChange={setRodSpacing} unit="mm" min={20} max={300} />
                <NumberInput label="Rod diameter" value={rodDiameter} onChange={setRodDiameter} unit="mm" min={3} max={20} />
                <NumberInput label="Transom width" value={transomWidth} onChange={setTransomWidth} unit="mm" />
                <NumberInput label="Transom height (vertical)" value={transomHeight} onChange={setTransomHeight} unit="mm" />
                <NumberInput label="Rake angle" value={transomAngle} onChange={setTransomAngle} unit="\u00b0" min={0} max={35} />
                <div style={{ marginTop: 16, padding: 12, background: "#1e293b", borderRadius: 8 }}>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 8 }}>AT {rodSpacing}mm SPACING</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Horizontal rods" value={calcs.hRods} unit="rods" />
                    <ResultBox label="Vertical rods" value={calcs.vRods} unit="rods" />
                    <ResultBox label="H rod length (each)" value={calcs.hRodLength} unit="mm" />
                    <ResultBox label="V rod length (on slope)" value={calcs.vRodLength} unit="mm" highlight />
                    <ResultBox label="Total H rod length" value={calcs.totalHRodLength} unit="m" />
                    <ResultBox label="Total V rod length" value={calcs.totalVRodLength} unit="m" />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ResultBox label="TOTAL ROD LENGTH (all rods)" value={calcs.totalRodLength} unit="metres" highlight />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ResultBox label="Total rod count" value={calcs.totalRodCount} unit={`(${calcs.hRods}H + ${calcs.vRods}V)`} />
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 280, background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
                <h3 style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px" }}>ROD GRID PREVIEW (face-on)</h3>
                <svg viewBox="0 0 300 220" style={{ width: "100%", background: "#020617", borderRadius: 8 }}>
                  <rect x="30" y="20" width="240" height="170" fill="none" stroke="#334155" strokeWidth="1.5" rx="2" />
                  {Array.from({ length: Math.min(calcs.hRods, 30) }).map((_, i) => {
                    const y = 20 + (i * 170) / Math.max(calcs.hRods - 1, 1);
                    return <line key={`h${i}`} x1="30" y1={y} x2="270" y2={y} stroke="#f59e0b" strokeWidth="0.8" opacity="0.5" />;
                  })}
                  {Array.from({ length: Math.min(calcs.vRods, 40) }).map((_, i) => {
                    const x = 30 + (i * 240) / Math.max(calcs.vRods - 1, 1);
                    return <line key={`v${i}`} x1={x} y1="20" x2={x} y2="190" stroke="#3b82f6" strokeWidth="0.8" opacity="0.5" />;
                  })}
                  {hasCutout && (() => {
                    const cw = (cutoutWidth / transomWidth) * 240;
                    const ch = (cutoutHeight / transomHeight) * 170;
                    const cx = 30 + (240 - cw) / 2;
                    return <rect x={cx} y={20} width={cw} height={ch} fill="#020617" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />;
                  })()}
                  <text x="150" y="210" fill="#64748b" fontSize="9" textAnchor="middle">{transomWidth}mm</text>
                  <text x="18" y="105" fill="#64748b" fontSize="9" textAnchor="middle" transform="rotate(-90, 18, 105)">{calcs.slopeHeight}mm (slope)</text>
                  <text x="280" y="105" fill="#f59e0b" fontSize="8" textAnchor="start">H: {calcs.hRods}</text>
                  <text x="150" y="14" fill="#3b82f6" fontSize="8" textAnchor="middle">V: {calcs.vRods}</text>
                </svg>
                <div style={{ marginTop: 12, padding: 10, background: "#1e293b", borderRadius: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  <strong style={{ color: "#f59e0b" }}>Key measurement:</strong> Each vertical rod runs along the slope, not the vertical height.
                  At {transomAngle}\u00b0 rake, the slope length is <strong style={{ color: "#22c55e" }}>{calcs.vRodLength}mm</strong> vs {transomHeight}mm vertical.
                  <br/><br/>
                  <strong style={{ color: "#f59e0b" }}>Rod \u00f8{rodDiameter}mm</strong> at {rodSpacing}mm centres \u2014 {calcs.totalRodCount} rods total requiring <strong style={{ color: "#22c55e" }}>{calcs.totalRodLength}m</strong> of rod.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* ===== LIVE WEATHER TAB ===== */}
        {/* ═══════════════════════════════════════════════════ */}
        {tab === "temp" && (
          <div>
            {/* ── LOCATION SEARCH ── */}
            <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ color: "#f59e0b", fontSize: 14, margin: 0, fontWeight: 700 }}>INSTALLATION LOCATION</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleUseMyLocation}
                    style={{
                      background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
                      color: "#94a3b8", padding: "6px 12px", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    Use my GPS
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={loadingForecast}
                    style={{
                      background: loadingForecast ? "#334155" : "#1e293b",
                      border: "1px solid #334155", borderRadius: 6,
                      color: loadingForecast ? "#64748b" : "#94a3b8",
                      padding: "6px 12px", fontSize: 12, cursor: loadingForecast ? "default" : "pointer",
                    }}
                  >
                    {loadingForecast ? "Refreshing..." : "Refresh now"}
                  </button>
                </div>
              </div>

              <div ref={dropdownRef} style={{ position: "relative", marginBottom: 16 }}>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search any city or town worldwide..."
                  style={{
                    width: "100%", background: "#1e293b", border: "1px solid #334155",
                    borderRadius: showDropdown ? "8px 8px 0 0" : 8,
                    color: "#e2e8f0", padding: "10px 14px", fontSize: 14, outline: "none",
                  }}
                />
                {showDropdown && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "#1e293b", border: "1px solid #334155", borderTop: "none",
                    borderRadius: "0 0 8px 8px", zIndex: 10, maxHeight: 280, overflowY: "auto",
                  }}>
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectLocation(r)}
                        style={{
                          display: "block", width: "100%", background: "transparent",
                          border: "none", borderBottom: "1px solid #1e293b80",
                          color: "#e2e8f0", padding: "10px 14px", textAlign: "left",
                          cursor: "pointer", fontSize: 13,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <strong>{r.name}</strong>
                        <span style={{ color: "#94a3b8" }}>
                          {r.admin1 ? ` \u2014 ${r.admin1}, ` : " \u2014 "}{r.country}
                        </span>
                        <span style={{ color: "#64748b", fontSize: 11, float: "right" }}>
                          {Math.abs(r.latitude).toFixed(2)}\u00b0{r.latitude >= 0 ? "N" : "S"},{" "}
                          {Math.abs(r.longitude).toFixed(2)}\u00b0{r.longitude >= 0 ? "E" : "W"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected location display */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 700 }}>
                    {selectedLocation.name}
                    {selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}
                    {selectedLocation.country ? `, ${selectedLocation.country}` : ""}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    {Math.abs(selectedLocation.latitude).toFixed(4)}\u00b0{selectedLocation.latitude >= 0 ? "N" : "S"},{" "}
                    {Math.abs(selectedLocation.longitude).toFixed(4)}\u00b0{selectedLocation.longitude >= 0 ? "E" : "W"}
                    {lastUpdated && (
                      <span> &middot; Updated {timeSinceUpdate === 0 ? "just now" : `${timeSinceUpdate}m ago`} &middot; Auto-refreshes every 10 min</span>
                    )}
                  </div>
                </div>
              </div>

              {forecastError && (
                <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12 }}>{forecastError}</div>
              )}
            </div>

            {/* ── LIVE CONDITIONS (HERO) ── */}
            {forecastData?.current && (() => {
              const c = forecastData.current;
              const verdict = getCureVerdict(c.temperature_2m, c.relative_humidity_2m, c.dew_point_2m);
              const dewMargin = (c.temperature_2m - c.dew_point_2m).toFixed(1);
              const isRaining = RAIN_CODES.has(c.weather_code);
              const weatherDesc = WEATHER_DESC[c.weather_code] || "";

              return (
                <div style={{
                  background: "#0f172a", borderRadius: 12, padding: 20,
                  border: `2px solid ${verdict.color}40`, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ color: "#e2e8f0", fontSize: 14, margin: 0, fontWeight: 700 }}>
                      LIVE CONDITIONS
                    </h3>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{weatherDesc}</div>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: "#020617", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>TEMPERATURE</div>
                      <div style={{ color: getTempColor(c.temperature_2m), fontSize: 28, fontWeight: 800 }}>
                        {c.temperature_2m.toFixed(1)}\u00b0
                      </div>
                      <div style={{ color: "#64748b", fontSize: 10 }}>Feels {c.apparent_temperature.toFixed(1)}\u00b0</div>
                    </div>
                    <div style={{ background: "#020617", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>HUMIDITY</div>
                      <div style={{ color: c.relative_humidity_2m >= 85 ? "#ef4444" : c.relative_humidity_2m >= 80 ? "#f59e0b" : "#22c55e", fontSize: 28, fontWeight: 800 }}>
                        {c.relative_humidity_2m}%
                      </div>
                      <div style={{ color: "#64748b", fontSize: 10 }}>{c.relative_humidity_2m >= 85 ? "Too high" : c.relative_humidity_2m >= 80 ? "Marginal" : "OK"}</div>
                    </div>
                    <div style={{ background: "#020617", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>DEW POINT</div>
                      <div style={{ color: "#e2e8f0", fontSize: 28, fontWeight: 800 }}>
                        {c.dew_point_2m.toFixed(1)}\u00b0
                      </div>
                      <div style={{ color: "#64748b", fontSize: 10 }}>Margin: {dewMargin}\u00b0C</div>
                    </div>
                    <div style={{ background: "#020617", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>WIND</div>
                      <div style={{ color: "#e2e8f0", fontSize: 28, fontWeight: 800 }}>
                        {c.wind_speed_10m.toFixed(0)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 10 }}>km/h</div>
                    </div>
                  </div>

                  {/* Verdict banner */}
                  <div style={{
                    background: `${verdict.color}15`, border: `1px solid ${verdict.color}40`,
                    borderRadius: 8, padding: "12px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{
                        background: verdict.color, color: "#000", fontWeight: 800, fontSize: 12,
                        padding: "2px 10px", borderRadius: 4,
                      }}>
                        {verdict.status}
                      </span>
                      <span style={{ color: verdict.color, fontWeight: 700, fontSize: 14 }}>{verdict.label}</span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                      {verdict.msg}
                      {isRaining && (
                        <><br/><strong style={{ color: "#3b82f6" }}>Currently raining/precipitating \u2014 do NOT lay up resin in wet conditions.</strong></>
                      )}
                      {parseFloat(dewMargin) < 3 && parseFloat(dewMargin) >= 2 && (
                        <><br/>Dew point margin is tight ({dewMargin}\u00b0C). Monitor for substrate condensation.</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {loadingForecast && !forecastData && (
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 40, border: "1px solid #1e293b", marginBottom: 16, textAlign: "center" }}>
                <div style={{ color: "#f59e0b", fontSize: 14 }}>Fetching live weather data...</div>
              </div>
            )}

            {/* ── NEXT 24 HOURS ── */}
            {hourlyToday.length > 0 && (
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 14, margin: 0, fontWeight: 700 }}>TODAY \u2014 HOURLY FORECAST</h3>
                  {bestWindow && (
                    <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                      Best window: {String(bestWindow.startHour).padStart(2, "0")}:00 \u2013 {String(bestWindow.endHour).padStart(2, "0")}:00
                      ({bestWindow.hours}h, avg {bestWindow.avgTemp}\u00b0C)
                    </div>
                  )}
                  {!bestWindow && (
                    <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                      No workable window today (temp &lt;10\u00b0C or humidity &gt;85% all day)
                    </div>
                  )}
                </div>

                {/* Hourly bars */}
                <div style={{ overflowX: "auto" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140, minWidth: 500, padding: "0 4px" }}>
                    {hourlyToday.map((h, i) => {
                      const allTemps = hourlyToday.map(x => x.temp);
                      const minT = Math.min(...allTemps, 0);
                      const maxT = Math.max(...allTemps, 20);
                      const range = Math.max(maxT - minT, 10);
                      const barH = Math.max(((h.temp - minT) / range) * 120, 4);
                      const col = getTempColor(h.temp);
                      const isInWindow = bestWindow && h.hour >= bestWindow.startHour && h.hour <= bestWindow.endHour;
                      const isDaylight = h.hour >= 6 && h.hour <= 20;

                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", opacity: isDaylight ? 1 : 0.4 }}>
                          <div style={{ color: "#e2e8f0", fontSize: 9, fontWeight: 600, marginBottom: 2 }}>
                            {h.temp.toFixed(0)}\u00b0
                          </div>
                          <div style={{
                            width: "100%", height: barH, background: col,
                            borderRadius: "3px 3px 0 0", opacity: 0.7,
                            border: isInWindow ? "1.5px solid #22c55e" : "none",
                            boxSizing: "border-box",
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 2, minWidth: 500, padding: "4px 4px 0" }}>
                    {hourlyToday.map((h, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center", color: "#64748b", fontSize: 9, fontWeight: 600 }}>
                        {String(h.hour).padStart(2, "0")}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Humidity row */}
                <div style={{ marginTop: 8, padding: "0 4px", overflowX: "auto" }}>
                  <div style={{ display: "flex", gap: 2, minWidth: 500 }}>
                    {hourlyToday.map((h, i) => (
                      <div key={i} style={{
                        flex: 1, textAlign: "center", fontSize: 8,
                        color: h.humidity >= 85 ? "#ef4444" : h.humidity >= 80 ? "#f59e0b" : "#64748b",
                      }}>
                        {h.humidity}%
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#22c55e", borderRadius: 2, opacity: 0.7 }} />
                    <span style={{ color: "#94a3b8", fontSize: 10 }}>{"\u2265"}15\u00b0C Ideal</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#f59e0b", borderRadius: 2, opacity: 0.7 }} />
                    <span style={{ color: "#94a3b8", fontSize: 10 }}>10\u201315\u00b0C Workable</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2, opacity: 0.7 }} />
                    <span style={{ color: "#94a3b8", fontSize: 10 }}>&lt;10\u00b0C Risky</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, border: "1.5px solid #22c55e", borderRadius: 2, boxSizing: "border-box" }} />
                    <span style={{ color: "#94a3b8", fontSize: 10 }}>Best window</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── 7-DAY OUTLOOK ── */}
            {dailyForecast.length > 0 && (
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 14, margin: 0, fontWeight: 700 }}>7-DAY OUTLOOK</h3>
                  {bestDay && (
                    <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                      Best day: {bestDay.dayName} {bestDay.dayNum} {bestDay.month} ({bestDay.high.toFixed(0)}\u00b0C high)
                    </div>
                  )}
                </div>

                {dailyForecast.map((d, i) => {
                  // Scale bar to show range
                  const allLows = dailyForecast.map(x => x.low);
                  const allHighs = dailyForecast.map(x => x.high);
                  const minAll = Math.min(...allLows);
                  const maxAll = Math.max(...allHighs);
                  const range = Math.max(maxAll - minAll, 10);
                  const leftPct = ((d.low - minAll) / range) * 100;
                  const widthPct = ((d.high - d.low) / range) * 100;
                  const isBest = bestDay && d.date === bestDay.date;
                  const avgTemp = (d.high + d.low) / 2;

                  return (
                    <div
                      key={d.date}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                        borderBottom: i < dailyForecast.length - 1 ? "1px solid #1e293b" : "none",
                        background: isBest ? "#22c55e08" : "transparent",
                      }}
                    >
                      <div style={{ width: 80, color: i === 0 ? "#f59e0b" : "#94a3b8", fontSize: 13, fontWeight: i === 0 ? 700 : 400 }}>
                        {i === 0 ? "Today" : `${d.dayName} ${d.dayNum}`}
                      </div>
                      <div style={{ width: 35, color: "#94a3b8", fontSize: 12, textAlign: "right" }}>
                        {d.low.toFixed(0)}\u00b0
                      </div>
                      <div style={{ flex: 1, height: 8, background: "#1e293b", borderRadius: 4, position: "relative" }}>
                        <div style={{
                          position: "absolute", left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%`,
                          height: "100%", background: getTempColor(avgTemp), borderRadius: 4, opacity: 0.7,
                        }} />
                      </div>
                      <div style={{ width: 35, color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>
                        {d.high.toFixed(0)}\u00b0
                      </div>
                      <div style={{ width: 100, fontSize: 11, color: "#64748b" }}>{d.weather}</div>
                      <div style={{
                        minWidth: 60, textAlign: "center",
                        background: `${d.verdict.color}20`, color: d.verdict.color,
                        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                      }}>
                        {d.verdict.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── RESIN CURE REFERENCE ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, border: "1px solid #22c55e40" }}>
                <h4 style={{ color: "#22c55e", fontSize: 13, margin: "0 0 8px" }}>{"\u2713"} IDEAL ({"\u2265"}15\u00b0C, RH &lt;80%)</h4>
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: normal catalyst ratio (1\u20132% MEKP)<br/>
                  Epoxy: standard hardener, 6\u20138hr pot life<br/>
                  Gel time: ~15\u201320 min (polyester)<br/>
                  Full cure: 24\u201348 hours<br/>
                  <strong style={{ color: "#e2e8f0" }}>Optimal working conditions</strong>
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, border: "1px solid #f59e0b40" }}>
                <h4 style={{ color: "#f59e0b", fontSize: 13, margin: "0 0 8px" }}>{"!"} WORKABLE (10\u201315\u00b0C)</h4>
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: increase catalyst 0.5\u20131%<br/>
                  Epoxy: slow/winter hardener required<br/>
                  Gel time: 25\u201340 min (polyester)<br/>
                  Full cure: 48\u201396 hours<br/>
                  <strong style={{ color: "#e2e8f0" }}>Work midday, allow 50\u2013100% extra cure</strong>
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, border: "1px solid #ef444440" }}>
                <h4 style={{ color: "#ef4444", fontSize: 13, margin: "0 0 8px" }}>{"\u2717"} RISKY (&lt;10\u00b0C)</h4>
                <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: high risk of undercure<br/>
                  Epoxy: will not cross-link below 5\u00b0C<br/>
                  Gel time: &gt;60 min or may not gel<br/>
                  Full cure: may never fully cure<br/>
                  <strong style={{ color: "#e2e8f0" }}>Heated workspace essential (min 10\u00b0C substrate)</strong>
                </div>
              </div>
            </div>

            {/* Dew point reference */}
            <div style={{ background: "#1e293b", borderRadius: 8, padding: 14, marginTop: 12, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
              <strong style={{ color: "#f59e0b" }}>Dew point rule:</strong> Substrate temperature must be at least 3\u00b0C above the dew point to prevent moisture condensation on the surface.
              Moisture on the layup surface will cause delamination, fisheyes, and incomplete bonding.
              {" "}<strong style={{ color: "#e2e8f0" }}>Always check dew point margin before mixing resin.</strong>
              <br/>
              <strong style={{ color: "#f59e0b" }}>Humidity:</strong> Relative humidity above 80% slows surface cure and can cause amine blush (epoxy) or surface tackiness (polyester).
              Above 85% is a no-go for quality layup work.
            </div>
          </div>
        )}

        {/* ===== JOB SUMMARY TAB ===== */}
        {tab === "summary" && (
          <div>
            <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #f59e0b40", marginBottom: 16 }}>
              <h3 style={{ color: "#f59e0b", fontSize: 16, margin: "0 0 4px", fontWeight: 800 }}>
                TitanPour Job Summary
              </h3>
              <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 20px" }}>
                All measurements and quantities for this transom job
              </p>

              {/* Transom specs */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Transom Specifications
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Width (beam)" value={transomWidth} unit="mm" />
                  <ResultBox label="Height (vertical)" value={transomHeight} unit="mm" />
                  <ResultBox label="Rake angle" value={transomAngle} unit={"\u00b0"} />
                  <ResultBox label="Slope height" value={calcs.slopeHeight} unit="mm" highlight />
                  <ResultBox label="Thickness" value={thickness} unit="mm" />
                  <ResultBox label="Material" value={material.name.split("(")[0].trim()} unit="" />
                </div>
              </div>

              {/* Engine config */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Engine Configuration
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Setup" value={ENGINE_CONFIGS.find(c => c.id === engineConfig)?.name || "Custom"} unit="" />
                  {hasCutout && <ResultBox label="Cutout size (each)" value={`${cutoutWidth} x ${cutoutHeight}`} unit="mm" />}
                  {hasCutout && <ResultBox label="Cutout count" value={cutoutCount} unit="" />}
                  <ResultBox label="Total cutout area" value={calcs.cutoutArea_m2} unit="m\u00b2" />
                </div>
              </div>

              {/* Areas and volumes */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Areas &amp; Volumes
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Gross panel area" value={calcs.grossArea_m2} unit="m\u00b2" />
                  <ResultBox label="Net panel area" value={calcs.netArea_m2} unit="m\u00b2" highlight />
                  <ResultBox label="Panel volume" value={calcs.volume_m3} unit="litres" />
                  <ResultBox label="Finished weight" value={calcs.weight_kg} unit="kg" highlight />
                </div>
              </div>

              {/* Resin order */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Resin Order Quantity
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Net resin needed" value={calcs.resinLitres} unit="litres" />
                  <ResultBox label={`+ ${wastagePercent}% wastage`} value={(parseFloat(calcs.resinWithWastage) - parseFloat(calcs.resinLitres)).toFixed(2)} unit="litres" />
                  <ResultBox label="ORDER QUANTITY" value={calcs.resinWithWastage} unit="litres" highlight />
                  <ResultBox label="Order weight" value={(parseFloat(calcs.resinWithWastage) * material.density / 1000).toFixed(1)} unit="kg" />
                </div>
              </div>

              {/* Rod requirements */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Reinforcement Rod Requirements
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Rod diameter" value={rodDiameter} unit="mm" />
                  <ResultBox label="Grid spacing" value={rodSpacing} unit="mm" />
                  <ResultBox label="Horizontal rods" value={calcs.hRods} unit={`@ ${calcs.hRodLength}mm`} />
                  <ResultBox label="Vertical rods" value={calcs.vRods} unit={`@ ${calcs.vRodLength}mm`} />
                  <ResultBox label="Total rod count" value={calcs.totalRodCount} unit="rods" />
                  <ResultBox label="TOTAL ROD LENGTH" value={calcs.totalRodLength} unit="metres" highlight />
                </div>
              </div>

              {/* Weather status */}
              {forecastData?.current && (() => {
                const c = forecastData.current;
                const verdict = getCureVerdict(c.temperature_2m, c.relative_humidity_2m, c.dew_point_2m);
                return (
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                      Current Conditions @ {selectedLocation.name}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      background: `${verdict.color}10`, border: `1px solid ${verdict.color}30`, borderRadius: 8,
                    }}>
                      <span style={{
                        background: verdict.color, color: "#000", fontWeight: 800, fontSize: 12,
                        padding: "4px 12px", borderRadius: 4,
                      }}>
                        {verdict.status}
                      </span>
                      <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>
                        {c.temperature_2m.toFixed(1)}{"\u00b0"}C &middot; {c.relative_humidity_2m}% RH &middot; Dew {c.dew_point_2m.toFixed(1)}{"\u00b0"}C
                      </span>
                      <span style={{ color: verdict.color, fontSize: 12 }}>{verdict.label}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Formulas reference */}
            <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, border: "1px solid #1e293b" }}>
              <h3 style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px", fontWeight: 700 }}>CALCULATION FORMULAS USED</h3>
              <div style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.8, fontFamily: "monospace" }}>
                <div>Slope Height = Vertical Height / cos(Rake Angle)</div>
                <div>Gross Area = Width &times; Slope Height</div>
                <div>Cutout Area = Cutout Width &times; (Cutout Height / cos(Rake Angle)) &times; Count</div>
                <div>Net Area = Gross Area &minus; Cutout Area</div>
                <div>Volume = Net Area &times; Thickness</div>
                <div>Weight = Volume &times; Material Density</div>
                <div>Resin Order = Volume &times; (1 + Wastage%)</div>
                <div>H Rods = floor(Slope Height / Spacing) + 1</div>
                <div>V Rods = floor(Width / Spacing) + 1</div>
                <div>Total Rod Length = (H Rods &times; Width) + (V Rods &times; Slope Height)</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAFETY DISCLAIMER ═══ */}
        <div style={{
          marginTop: 32, padding: "16px 20px", background: "#1e0000",
          border: "1px solid #ef444460", borderRadius: 8,
          fontSize: 11, color: "#fca5a5", lineHeight: 1.6,
        }}>
          <strong style={{ color: "#ef4444", fontSize: 12 }}>SAFETY NOTICE</strong><br/>
          This calculator provides estimates for planning and material ordering only. All calculations
          must be independently verified by a qualified marine engineer or naval architect before use
          in construction. Boat structural components are safety-critical — errors can result in
          catastrophic failure, sinking, and loss of life. The formulas assume uniform rectangular
          geometry and do not account for compound curves, local reinforcement, hardware loads, or
          dynamic sea loads. Always consult ISO 12215 (small craft hull construction) or equivalent
          classification society standards for your vessel's scantling requirements. Weather data is
          provided by Open-Meteo and should be cross-checked with local conditions before resin work.
        </div>
      </div>
    </div>
  );
}
