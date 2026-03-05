import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import transomDiagram from "./assets/image.jpg";

// ═══════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════

const THEMES = {
  dark: {
    bg: "#020617", card: "#0f172a", cardAlt: "#1a2744", input: "#1e293b",
    border: "#1e293b", borderSubtle: "#334155", borderInput: "#334155",
    text: "#e2e8f0", textSecondary: "#94a3b8", textTertiary: "#64748b",
    svgBg: "#020617", svgStroke: "#475569",
    danger: "#1e0000", dangerBorder: "#ef444460", dangerText: "#fca5a5",
    tabBg: "#1e293b", tabActiveBg: "#f59e0b20", tabActiveText: "#f59e0b", tabText: "#94a3b8",
    headerBg: "#0f172a",
  },
  light: {
    bg: "#f1f5f9", card: "#ffffff", cardAlt: "#e8f0fe", input: "#f1f5f9",
    border: "#cbd5e1", borderSubtle: "#e2e8f0", borderInput: "#cbd5e1",
    text: "#0f172a", textSecondary: "#475569", textTertiary: "#64748b",
    svgBg: "#f8fafc", svgStroke: "#94a3b8",
    danger: "#fef2f2", dangerBorder: "#ef444440", dangerText: "#991b1b",
    tabBg: "#e2e8f0", tabActiveBg: "#f59e0b20", tabActiveText: "#b45309", tabText: "#475569",
    headerBg: "#ffffff",
  },
};

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const MATERIALS = [
  { id: "titanpour", name: "TitanPour Resin System (pourable composite)", density: 1550, desc: "~1550 kg/m³ *" },
  { id: "frp_hand", name: "FRP Hand Layup (CSM + Polyester)", density: 1500, desc: "~1500 kg/m³" },
  { id: "frp_spray", name: "FRP Spray-up", density: 1400, desc: "~1400 kg/m³" },
  { id: "frp_vacuum", name: "FRP Vacuum Infused (Woven + Epoxy)", density: 1700, desc: "~1700 kg/m³" },
  { id: "marine_ply", name: "Marine Plywood", density: 550, desc: "~550 kg/m³" },
  { id: "coosa", name: "Coosa Board (Composite Core)", density: 420, desc: "~420 kg/m³" },
  { id: "aluminium", name: "Marine Aluminium (5083)", density: 2660, desc: "~2660 kg/m³" },
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
    title: "1. Calculate Area & Volume",
    subtitle: "Area & Volume tab",
    body: "Enter your transom dimensions (width, centre height, side height, rake angle, thickness). The pentagon shape (rectangle + V bottom) is calculated automatically. Choose an engine configuration to account for cutouts.",
    icon: "calc",
    accent: "#22c55e",
    tab: "calc",
  },
  {
    title: "2. Plan Your Rod Grid",
    subtitle: "Rod Spacing tab",
    body: "Set the reinforcement rod spacing and diameter. The calculator works out how many rods you need, their cut lengths (accounting for the slope), and the total rod length to order. A face-on preview shows the grid layout.",
    icon: "grid",
    accent: "#3b82f6",
    tab: "rods",
  },
  {
    title: "3. Mix Calculator",
    subtitle: "Mix Calculator tab",
    body: "Enter your batch weight and the calculator works out the exact catalyst and retarder weights to put on the scales. Catalyst % is applied to the resin fraction only (58% of the batch) — not the total weight. Rod displacement is subtracted from the pour volume automatically.",
    icon: "mix",
    accent: "#ef4444",
    tab: "mix",
  },
  {
    title: "4. Check Live Weather",
    subtitle: "Live Weather tab",
    body: "Search any location worldwide to get real-time temperature, humidity, and dew point — all critical for resin cure. The system gives a GO / CAUTION / NO-GO verdict, finds the best layup window, and shows a 3-week outlook. Data refreshes every 10 minutes.",
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
  // Standard API: current conditions + hourly (today) + daily up to 16 days
  const stdRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,apparent_temperature,weather_code` +
    `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=auto&forecast_days=16`
  );
  if (!stdRes.ok) throw new Error("Forecast fetch failed");
  const stdData = await stdRes.json();

  // Ensemble API: extended daily forecast up to 21 days (for days 17-21)
  try {
    const ensRes = await fetch(
      `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=auto&forecast_days=21`
    );
    if (ensRes.ok) {
      const ensData = await ensRes.json();
      if (ensData.daily?.time) {
        // Merge: use standard data for the first 16 days, ensemble for days beyond
        const stdDates = new Set(stdData.daily.time);
        ensData.daily.time.forEach((date, i) => {
          if (!stdDates.has(date)) {
            stdData.daily.time.push(date);
            stdData.daily.temperature_2m_max.push(ensData.daily.temperature_2m_max[i]);
            stdData.daily.temperature_2m_min.push(ensData.daily.temperature_2m_min[i]);
            stdData.daily.weather_code.push(ensData.daily.weather_code?.[i] ?? 0);
          }
        });
      }
    }
  } catch {
    // Ensemble failed — continue with 16-day standard data
  }

  return stdData;
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
    return { status: "NO-GO", color: "#ef4444", label: "DEW POINT RISK", msg: "Surface condensation likely. Substrate must be 3°C above dew point." };
  }
  if (temp < 10) {
    return { status: "NO-GO", color: "#ef4444", label: "TOO COLD", msg: "Risk of incomplete cure. Heated workspace required. Min substrate temp: 10°C." };
  }
  if (humidity >= 85) {
    return { status: "NO-GO", color: "#ef4444", label: "TOO HUMID", msg: "High humidity will affect surface cure and gel coat. Forced ventilation needed." };
  }
  if (temp >= 10 && temp < 15) {
    return { status: "CAUTION", color: "#f59e0b", label: "WORKABLE — SLOW HARDENER", msg: "Extend cure time 50–100%. Use slow/winter hardener. Work warmest hours." };
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

// Module-level theme accessor — set by main component on each render
let t = (key) => THEMES.dark[key];

function NumberInput({ label, value, onChange, unit, min, max, step = 1, labelColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <label style={{ color: labelColor || t("textSecondary"), fontSize: 13, minWidth: 160, fontWeight: labelColor ? 700 : 400 }}>{label}</label>
      <input
        type="number" value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step}
        style={{
          background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 6,
          color: t("text"), padding: "6px 10px", width: 90, fontSize: 14,
        }}
      />
      <span style={{ color: t("textTertiary"), fontSize: 12 }}>{unit}</span>
    </div>
  );
}

function ResultBox({ label, value, unit, highlight }) {
  return (
    <div style={{
      background: highlight ? t("cardAlt") : t("card"),
      border: highlight ? "1px solid #3b82f6" : `1px solid ${t("border")}`,
      borderRadius: 8, padding: "10px 14px", minWidth: 140,
    }}>
      <div style={{ color: t("textTertiary"), fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: highlight ? "#60a5fa" : t("text"), fontSize: 18, fontWeight: 700 }}>
        {value} <span style={{ fontSize: 12, fontWeight: 400, color: t("textSecondary") }}>{unit}</span>
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
  if (icon === "mix") return (
    <svg viewBox="0 0 48 48" style={s}><path d="M18 8h12v4l4 20a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6L18 12V8z" fill="none" stroke="#ef4444" strokeWidth="2.5"/><line x1="16" y1="28" x2="32" y2="28" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"/><line x1="17" y1="22" x2="31" y2="22" stroke="#ef4444" strokeWidth="1.5" opacity="0.3"/><circle cx="22" cy="32" r="1.5" fill="#f59e0b"/><circle cx="27" cy="30" r="1" fill="#f59e0b"/></svg>
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
        background: t("card"), border: `1px solid ${data.accent}40`,
        borderRadius: 16, maxWidth: 520, width: "100%",
        boxShadow: `0 0 60px ${data.accent}15, 0 25px 50px rgba(0,0,0,0.5)`,
        animation: "tutorialSlide 0.35s ease-out",
        overflow: "hidden",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: t("input") }}>
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
            color: t("text"), fontSize: 22, fontWeight: 800,
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
            color: t("textSecondary"), fontSize: 14, lineHeight: 1.7,
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
                background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 8,
                color: t("textSecondary"), padding: "10px 20px", fontSize: 13,
                cursor: "pointer", fontWeight: 600,
              }}>
                Back
              </button>
            )}
            {isFirst && (
              <button onClick={onSkip} style={{
                background: "transparent", border: `1px solid ${t("borderSubtle")}`, borderRadius: 8,
                color: t("textTertiary"), padding: "10px 20px", fontSize: 13,
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

// Load saved state from localStorage
const STORAGE_KEY = "transom-calc-state";
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
const _saved = loadSaved();

export default function TransomCalculator() {
  const [tab, setTab] = useState("quick");
  const [darkMode, setDarkMode] = useState(_saved.darkMode !== false); // default dark
  t = (key) => THEMES[darkMode ? "dark" : "light"][key]; // update module-level theme accessor

  // ── Onboarding tutorial state ──
  const [showTutorial, setShowTutorial] = useState(!_saved._tutorialDone);
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
  const [transomWidth, setTransomWidth] = useState(_saved.transomWidth ?? 1800);
  const [centreHeight, setCentreHeight] = useState(_saved.centreHeight ?? 508);
  const [sideHeight, setSideHeight] = useState(_saved.sideHeight ?? 350);
  const [transomAngle, setTransomAngle] = useState(_saved.transomAngle ?? 20);
  const [thickness, setThickness] = useState(_saved.thickness ?? 50);
  const [materialId, setMaterialId] = useState(_saved.materialId ?? "titanpour");

  // Engine cutout
  const [engineConfig, setEngineConfig] = useState(_saved.engineConfig ?? "single_ob");
  const [cutoutWidth, setCutoutWidth] = useState(_saved.cutoutWidth ?? 660);
  const [cutoutHeight, setCutoutHeight] = useState(_saved.cutoutHeight ?? 380);
  const [cutoutCount, setCutoutCount] = useState(_saved.cutoutCount ?? 1);
  const hasCutout = cutoutCount > 0;

  // Resin
  const [wastagePercent, setWastagePercent] = useState(_saved.wastagePercent ?? 10);

  // Rod spacing
  const [rodSpacing, setRodSpacing] = useState(_saved.rodSpacing ?? 70);
  const [hRodDiameter, setHRodDiameter] = useState(_saved.hRodDiameter ?? 7);
  const [vRodDiameter, setVRodDiameter] = useState(_saved.vRodDiameter ?? 7);
  const [shellThickness, setShellThickness] = useState(_saved.shellThickness ?? 6);
  const [minCover, setMinCover] = useState(_saved.minCover ?? 10);
  // Keep rodDiameter as derived value for backward compat (use the larger)
  const rodDiameter = Math.max(hRodDiameter, vRodDiameter);

  // ── LIVE WEATHER STATE ──
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(_saved.selectedLocation ?? DEFAULT_LOCATION);
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Mix calculator
  const [batchWeight, setBatchWeight] = useState(_saved.batchWeight ?? 1000);
  const [maxPourHeight, setMaxPourHeight] = useState(_saved.maxPourHeight ?? 140);

  // ── Persist all inputs to localStorage ──
  useEffect(() => {
    const state = {
      transomWidth, centreHeight, sideHeight, transomAngle, thickness, materialId,
      engineConfig, cutoutWidth, cutoutHeight, cutoutCount, wastagePercent,
      rodSpacing, hRodDiameter, vRodDiameter, shellThickness, minCover,
      selectedLocation, batchWeight, maxPourHeight, darkMode, _tutorialDone: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [transomWidth, centreHeight, sideHeight, transomAngle, thickness, materialId,
      engineConfig, cutoutWidth, cutoutHeight, cutoutCount, wastagePercent,
      rodSpacing, hRodDiameter, vRodDiameter, shellThickness, minCover,
      selectedLocation, batchWeight, maxPourHeight, darkMode]);

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
          country: `${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°`,
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
  // Pentagon transom: rectangle on top (full width × sideHeight) + triangle V at bottom.
  // Area = Width × (CentreSlopeH + SideSlopeH) / 2  (trapezoid formula)
  // H rods: -30mm for clearance, shorter in triangle zone
  // V rods: each calculated individually based on position across width
  const calcs = useMemo(() => {
    const angleRad = (transomAngle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const ROD_GAP = 30; // mm clearance on H rods

    // Slope heights
    const centreSlopeHeight = centreHeight / cosAngle;
    const sideSlopeHeight = sideHeight / cosAngle;

    // Pentagon area: trapezoid formula on slope surface
    // Area = Width × (CentreSlopeH + SideSlopeH) / 2
    const grossArea_mm2 = transomWidth * (centreSlopeHeight + sideSlopeHeight) / 2;
    const grossArea_m2 = grossArea_mm2 / 1e6;

    // Cutout
    const cutoutSlopeHeight = hasCutout ? cutoutHeight / cosAngle : 0;
    const singleCutoutArea_mm2 = hasCutout ? cutoutWidth * cutoutSlopeHeight : 0;
    const cutoutArea_mm2 = singleCutoutArea_mm2 * cutoutCount;
    const cutoutArea_m2 = cutoutArea_mm2 / 1e6;

    // Net area
    const netArea_mm2 = grossArea_mm2 - cutoutArea_mm2;
    const netArea_m2 = netArea_mm2 / 1e6;

    // Volume: m² × mm = litres
    const cavityLitres = netArea_m2 * thickness;
    const volume_mm3 = netArea_mm2 * thickness;

    // ── Horizontal rods (spaced down the slope from top) ──
    // H rods based on centre (tallest) slope height
    const hRodCount = Math.floor(centreSlopeHeight / rodSpacing) + 1;
    const hRodDetails = [];
    let totalHRodLength_mm = 0;
    for (let i = 0; i < hRodCount; i++) {
      const slopeY = i * rodSpacing;
      const vertY = slopeY * cosAngle; // convert slope position to vertical
      let panelWidth;
      if (vertY <= sideHeight) {
        panelWidth = transomWidth; // rectangular zone
      } else {
        // triangle zone: narrows linearly from full width to 0
        panelWidth = transomWidth * (centreHeight - vertY) / (centreHeight - sideHeight);
      }
      const rodLen = Math.max(panelWidth - ROD_GAP, 0);
      hRodDetails.push({ slopeY, vertY, panelWidth, length: rodLen, zone: vertY <= sideHeight ? "RECT" : "TRI" });
      totalHRodLength_mm += rodLen;
    }

    // ── Vertical rods (spaced across the width) ──
    // Height varies: sideHeight at edges, centreHeight at middle
    const vRodCount = Math.floor(transomWidth / rodSpacing) + 1;
    const vRodDetails = [];
    let totalVRodLength_mm = 0;
    for (let i = 0; i < vRodCount; i++) {
      const x = i * rodSpacing;
      const t = 1 - Math.abs(2 * x / transomWidth - 1); // 0 at edges, 1 at centre
      const h = sideHeight + (centreHeight - sideHeight) * t;
      const slopeLen = h / cosAngle;
      vRodDetails.push({ x, t, height: h, length: slopeLen });
      totalVRodLength_mm += slopeLen;
    }

    const totalRodLength_mm = totalHRodLength_mm + totalVRodLength_mm;

    // Rod displacement
    const hRodCrossSection = Math.PI * (hRodDiameter / 2) * (hRodDiameter / 2);
    const vRodCrossSection = Math.PI * (vRodDiameter / 2) * (vRodDiameter / 2);
    const hRodVolume_mm3 = hRodCrossSection * totalHRodLength_mm;
    const vRodVolume_mm3 = vRodCrossSection * totalVRodLength_mm;
    const totalRodVolume_mm3 = hRodVolume_mm3 + vRodVolume_mm3;
    const totalRodVolume_litres = totalRodVolume_mm3 / 1e6;

    // Pour depth
    const pourDepth = thickness - shellThickness;

    // Cover analysis
    const hCover = (pourDepth - hRodDiameter) / 2;
    const vCover = (pourDepth - vRodDiameter) / 2;
    const stackedHeight = hRodDiameter + vRodDiameter;
    const stackCover = (pourDepth - stackedHeight) / 2;
    const stackFits = stackCover >= minCover;
    const hFits = hCover >= minCover;
    const vFits = vCover >= minCover;
    const minThicknessForStack = stackedHeight + minCover * 2 + shellThickness;

    // Resin volumes
    const resinLitres = (volume_mm3 - totalRodVolume_mm3) / 1e6;
    const resinWithWastage = resinLitres * (1 + wastagePercent / 100);
    const pourVolume_mm3 = volume_mm3 - totalRodVolume_mm3;
    const pourVolume_litres = pourVolume_mm3 / 1e6;

    // ── Pour breakdown (140mm bands from bottom of V upward) ──
    // Coordinate: y measured from bottom of V (lowest point) upward
    // Triangle zone: y = 0 to triH, width = W * y / triH
    // Rectangle zone: y = triH to centreH, width = W
    // Cutout zone: y = centreH - cutoutH to centreH, subtract cutoutWidth × overlap
    const triH = centreHeight - sideHeight; // height of triangle zone (vertical)
    const cutoutYStart = hasCutout ? centreHeight - cutoutHeight : centreHeight;
    const pourBands = [];
    const numPours = Math.ceil(centreHeight / maxPourHeight);
    let cumulativeVol = 0;
    for (let p = 0; p < numPours; p++) {
      const y1 = p * maxPourHeight;
      const y2 = Math.min((p + 1) * maxPourHeight, centreHeight);
      // Integrate width(y) dy from y1 to y2
      let vertArea_mm2 = 0;
      if (triH > 0) {
        // Triangle zone contribution
        const tLo = Math.max(y1, 0);
        const tHi = Math.min(y2, triH);
        if (tHi > tLo) {
          vertArea_mm2 += (transomWidth / triH) * (tHi * tHi - tLo * tLo) / 2;
        }
      }
      // Rectangle zone contribution
      const rLo = Math.max(y1, triH);
      const rHi = y2;
      if (rHi > rLo) {
        vertArea_mm2 += transomWidth * (rHi - rLo);
      }
      // Subtract cutout overlap (cutout is at top of transom)
      if (hasCutout) {
        const cLo = Math.max(y1, cutoutYStart);
        const cHi = Math.min(y2, centreHeight);
        if (cHi > cLo) {
          vertArea_mm2 -= cutoutWidth * (cHi - cLo) * cutoutCount;
        }
      }
      // Volume = vertArea * thickness / cos(angle)
      // vertArea is in mm², thickness in mm, result in mm³
      const bandVol_mm3 = vertArea_mm2 * thickness / cosAngle;
      const bandVol_litres = bandVol_mm3 / 1e6;
      cumulativeVol += bandVol_litres;
      pourBands.push({
        pour: p + 1,
        fromY: y1,
        toY: y2,
        height: y2 - y1,
        litres: bandVol_litres,
        cumulative: cumulativeVol,
      });
    }

    return {
      centreSlopeHeight: centreSlopeHeight.toFixed(1),
      sideSlopeHeight: sideSlopeHeight.toFixed(1),
      cutoutSlopeHeight: cutoutSlopeHeight.toFixed(1),
      grossArea_m2: grossArea_m2.toFixed(4),
      cutoutArea_m2: cutoutArea_m2.toFixed(4),
      cutoutCount,
      netArea_m2: netArea_m2.toFixed(4),
      cavityLitres: cavityLitres.toFixed(2),
      resinLitres: resinLitres.toFixed(2),
      resinWithWastage: resinWithWastage.toFixed(2),
      hRods: hRodCount, vRods: vRodCount,
      hRodDetails, vRodDetails,
      totalHRodLength: (totalHRodLength_mm / 1000).toFixed(2),
      totalVRodLength: (totalVRodLength_mm / 1000).toFixed(2),
      totalRodLength: (totalRodLength_mm / 1000).toFixed(2),
      totalRodCount: hRodCount + vRodCount,
      rodDisplacement_litres: totalRodVolume_litres.toFixed(2),
      pourVolume_litres: pourVolume_litres.toFixed(2),
      pourVolume_mm3,
      pourDepth,
      hCover: hCover.toFixed(1),
      vCover: vCover.toFixed(1),
      stackCover: stackCover.toFixed(1),
      stackFits, hFits, vFits,
      minThicknessForStack,
      pourBands,
    };
  }, [transomWidth, centreHeight, sideHeight, transomAngle, thickness, shellThickness, cutoutWidth, cutoutHeight, cutoutCount, hasCutout, rodSpacing, hRodDiameter, vRodDiameter, minCover, wastagePercent, maxPourHeight]);

  // ── Mix calculator ──
  // Uses live weather temp if available, otherwise defaults to 20°C
  const ambientTemp = forecastData?.current?.temperature_2m ?? 20;

  const mixCalcs = useMemo(() => {
    // Mix fractions
    const RESIN_FRAC = 0.58;
    const TALC_FRAC = 0.30;
    const GLASS_FRAC = 0.10;
    const CATALYST_RETARDER_FRAC = 0.02;

    const resinMass = batchWeight * RESIN_FRAC;
    const talcMass = batchWeight * TALC_FRAC;
    const glassMass = batchWeight * GLASS_FRAC;

    // Recommended catalyst % based on ambient temperature (corrected for filled mix)
    let recommendedCatPct;
    let tempZone;
    if (ambientTemp > 26) { recommendedCatPct = 1.2; tempZone = "hot"; }
    else if (ambientTemp >= 18) { recommendedCatPct = 1.5; tempZone = "normal"; }
    else { recommendedCatPct = 2.0; tempZone = "cold"; }

    // Catalyst levels — all three options
    const catalystLevels = [1.2, 1.5, 2.0].map(pct => {
      const kgOfResin = resinMass * (pct / 100);
      const pctOfMix = (kgOfResin / batchWeight) * 100;
      return {
        pctResin: pct,
        pctMix: pctOfMix,
        kg: kgOfResin,
        recommended: pct === recommendedCatPct,
      };
    });

    // Retarder: 0.025% of resin
    const retarderKg = resinMass * 0.00025;
    const retarderGrams = retarderKg * 1000;

    // Rod displacement (from main calcs)
    const rodDisp = parseFloat(calcs.rodDisplacement_litres);
    const cavityVolume = parseFloat(calcs.cavityLitres);
    const pourNeeded = parseFloat(calcs.pourVolume_litres);

    // Pour weight = pour volume (litres) × mixed density
    // Mixed density: resin 1100 kg/m³ base, but with 30% talc (~2700) + 10% glass (~2500)
    // Weighted average: 0.58×1100 + 0.30×2700 + 0.10×2500 + 0.02×1100 ≈ 1700 kg/m³
    // But we use a simpler approach: batchWeight per litre from the material density
    const mixDensity_kg_per_litre = material.density / 1000; // density is kg/m³, 1 litre = 0.001 m³
    const pourWeightKg = pourNeeded * mixDensity_kg_per_litre;

    return {
      resinMass, talcMass, glassMass,
      catalystLevels, recommendedCatPct, tempZone,
      retarderKg, retarderGrams,
      rodDisp, cavityVolume, pourNeeded, pourWeightKg,
    };
  }, [batchWeight, ambientTemp, calcs, material]);

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

  // ── Best pour days (ranked across full forecast) ──
  const bestPourDays = useMemo(() => {
    if (dailyForecast.length === 0) return [];
    // Score each day: higher = better for pouring
    // Ideal: warm (18-25°C high), dry, not too cold overnight
    return dailyForecast
      .map((d, idx) => {
        let score = 0;
        // Rain = disqualified
        if (RAIN_CODES.has(d.weatherCode)) return { ...d, idx, score: -1, reason: "Rain expected" };
        // Temperature scoring (high temp)
        if (d.high >= 18 && d.high <= 26) score += 50; // ideal range
        else if (d.high >= 15 && d.high < 18) score += 30; // workable
        else if (d.high > 26 && d.high <= 30) score += 25; // warm but ok
        else if (d.high >= 10 && d.high < 15) score += 10; // cold, slow cure
        else score -= 20; // too cold or too hot
        // Overnight low matters for cure completion
        if (d.low >= 12) score += 20;
        else if (d.low >= 8) score += 10;
        else if (d.low >= 5) score += 0;
        else score -= 15; // frost risk
        // Prefer days sooner rather than later (less forecast uncertainty)
        score -= idx * 0.5;
        const reason = d.high >= 18 && d.high <= 26 ? "Ideal temp range" :
                       d.high >= 15 ? "Workable" : d.high >= 10 ? "Cold — slow hardener needed" : "Too cold";
        return { ...d, idx, score, reason };
      })
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // top 5 days
  }, [dailyForecast]);

  // Keep bestDay for backward compat in weather tab display
  const bestDay = bestPourDays.length > 0 ? bestPourDays[0] : null;

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
    { id: "quick", label: "Quick Calc" },
    { id: "calc", label: "Area & Volume" },
    { id: "rods", label: "Rod Spacing" },
    { id: "mix", label: "Mix Calculator" },
    { id: "temp", label: "Live Weather" },
    { id: "summary", label: "Job Summary" },
  ];

  // ── Quick Calc: auto rod sizing from 1/3 rule ──
  const quickCalc = useMemo(() => {
    const cosA = Math.cos((transomAngle * Math.PI) / 180);
    const pourDepth = thickness - shellThickness;
    const stackedTarget = pourDepth / 3;          // 1/3 of gap for rods
    const rodDiam = stackedTarget / 2;             // split between H and V
    const rodDiamRounded = Math.floor(rodDiam);    // round down to whole mm
    const actualStacked = rodDiamRounded * 2;
    const actualCover = (pourDepth - actualStacked) / 2;

    // Area
    const centreSlopeH = centreHeight / cosA;
    const sideSlopeH = sideHeight / cosA;
    const grossArea_m2 = transomWidth * (centreSlopeH + sideSlopeH) / 2 / 1e6;

    // Cutout
    const cutSlopeH = cutoutCount > 0 ? cutoutHeight / cosA : 0;
    const cutArea_m2 = cutoutCount > 0 ? (cutoutWidth * cutSlopeH * cutoutCount) / 1e6 : 0;
    const netArea_m2 = grossArea_m2 - cutArea_m2;

    // Volume
    const cavityLitres = netArea_m2 * thickness;

    // Rods (use auto diameter)
    const ROD_GAP = 30;
    const triH = centreHeight - sideHeight;
    const hCount = Math.floor(centreSlopeH / rodSpacing) + 1;
    let totalH = 0;
    for (let i = 0; i < hCount; i++) {
      const vertY = i * rodSpacing * cosA;
      const pw = vertY <= sideHeight ? transomWidth : transomWidth * (centreHeight - vertY) / (triH || 1);
      totalH += Math.max(pw - ROD_GAP, 0);
    }
    const vCount = Math.floor(transomWidth / rodSpacing) + 1;
    let totalV = 0;
    for (let i = 0; i < vCount; i++) {
      const x = i * rodSpacing;
      const t = 1 - Math.abs(2 * x / transomWidth - 1);
      totalV += (sideHeight + (centreHeight - sideHeight) * t) / cosA;
    }
    const crossSection = Math.PI * (rodDiamRounded / 2) ** 2;
    const rodDispLitres = crossSection * (totalH + totalV) / 1e6;
    const pourLitres = cavityLitres - rodDispLitres;
    const resinWithWastage = pourLitres * (1 + wastagePercent / 100);

    return {
      pourDepth, stackedTarget, rodDiam, rodDiamRounded, actualStacked, actualCover,
      centreSlopeH, sideSlopeH, grossArea_m2, netArea_m2, cavityLitres,
      hCount, vCount, totalH, totalV, rodDispLitres, pourLitres, resinWithWastage,
    };
  }, [transomWidth, centreHeight, sideHeight, transomAngle, thickness, shellThickness,
      cutoutWidth, cutoutHeight, cutoutCount, rodSpacing, wastagePercent]);

  // ── Time since last update ──
  const timeSinceUpdate = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 60000)
    : null;

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: t("bg"), color: t("text"), minHeight: "100vh", padding: "24px 16px",
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
              Titon Pour System
            </h1>
            <p style={{ color: t("textTertiary"), fontSize: 13, margin: "4px 0 0" }}>
              Pourable composite transom system &middot; Area &amp; volume &middot; Rod spacing &middot; Mix calculator &middot; Live weather &middot; Job summary
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 8,
                color: t("textSecondary"), padding: "6px 14px", fontSize: 14, cursor: "pointer",
              }}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "\u2600" : "\u263D"}
            </button>
            <button
              onClick={reopenTutorial}
              style={{
                background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 8,
                color: t("textSecondary"), padding: "6px 14px", fontSize: 12, cursor: "pointer",
              }}
            >
              ? Tutorial
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                background: tab === tb.id ? "#f59e0b" : t("tabBg"),
                color: tab === tb.id ? (darkMode ? "#020617" : "#ffffff") : t("tabText"),
                border: "none", borderRadius: 8, padding: "8px 16px",
                fontSize: 13, fontWeight: tab === tb.id ? 700 : 500,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {tb.label}
              {tb.id === "temp" && forecastData?.current && (
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                  {forecastData.current.temperature_2m.toFixed(0)}°C
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== QUICK CALC TAB ===== */}
        {tab === "quick" && (
          <div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {/* Left: inputs */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>MEASUREMENTS</h3>
                  <div style={{ marginBottom: 12, textAlign: "center" }}>
                    <img src={transomDiagram} alt="Where to measure" style={{ width: "100%", maxWidth: 360, borderRadius: 8, border: `1px solid ${t("border")}` }} />
                  </div>
                  {/* Colour key matching diagram arrows */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginBottom: 16, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#3b82f6", flexShrink: 0 }} />
                      <span style={{ color: "#3b82f6", fontWeight: 700 }}>Blue</span>
                      <span style={{ color: t("textSecondary") }}>= Width</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#22c55e", flexShrink: 0 }} />
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>Green</span>
                      <span style={{ color: t("textSecondary") }}>= Centre height</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#ef4444", flexShrink: 0 }} />
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>Red</span>
                      <span style={{ color: t("textSecondary") }}>= Side height</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#a855f7", flexShrink: 0 }} />
                      <span style={{ color: "#a855f7", fontWeight: 700 }}>Purple</span>
                      <span style={{ color: t("textSecondary") }}>= Cutout height</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#1e293b", border: "1px solid #94a3b8", flexShrink: 0 }} />
                      <span style={{ color: t("text"), fontWeight: 700 }}>Black</span>
                      <span style={{ color: t("textSecondary") }}>= Cutout width</span>
                    </div>
                  </div>
                  <NumberInput label="Width" value={transomWidth} onChange={setTransomWidth} unit="mm" min={500} max={5000} labelColor="#3b82f6" />
                  <NumberInput label="Centre height (deepest)" value={centreHeight} onChange={setCentreHeight} unit="mm" min={200} max={1500} labelColor="#22c55e" />
                  <NumberInput label="Side height (edges)" value={sideHeight} onChange={setSideHeight} unit="mm" min={50} max={1500} labelColor="#ef4444" />
                  <NumberInput label="Depth (total thickness)" value={thickness} onChange={setThickness} unit="mm" min={5} max={150} step={0.5} />
                </div>
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>MOTORWELL CUTOUT</h3>
                  <NumberInput label="Cutout width" value={cutoutWidth} onChange={setCutoutWidth} unit="mm" min={0} max={3000} labelColor="#1e293b" />
                  <NumberInput label="Cutout height" value={cutoutHeight} onChange={setCutoutHeight} unit="mm" min={0} max={1000} labelColor="#a855f7" />
                </div>
              </div>

              {/* Right: key results */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#3b82f6", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>RESULTS</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Net area" value={quickCalc.netArea_m2.toFixed(4)} unit="m²" />
                    <ResultBox label="Cavity volume" value={quickCalc.cavityLitres.toFixed(2)} unit="litres" />
                    <ResultBox label="Rod diameter (auto)" value={quickCalc.rodDiamRounded} unit="mm" highlight />
                    <ResultBox label="Rod displacement" value={quickCalc.rodDispLitres.toFixed(2)} unit="litres" />
                    <ResultBox label="Pour volume" value={quickCalc.pourLitres.toFixed(2)} unit="litres" highlight />
                    <ResultBox label="Resin + wastage" value={quickCalc.resinWithWastage.toFixed(2)} unit="litres" highlight />
                    <ResultBox label="Rods" value={`${quickCalc.hCount}H + ${quickCalc.vCount}V`} unit="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== AREA & VOLUME TAB ===== */}
        {tab === "calc" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}` }}>
                <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>TRANSOM DIMENSIONS</h3>
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <img
                    src={transomDiagram}
                    alt="Transom measurement guide — measure width across top, centre height at deepest point, side height at edges"
                    style={{ width: "100%", maxWidth: 360, borderRadius: 8, border: `1px solid ${t("border")}` }}
                  />
                  <div style={{ color: t("textTertiary"), fontSize: 11, marginTop: 6 }}>
                    Measure width across the top, centre height at the deepest point, side height at the edges
                  </div>
                </div>
                <NumberInput label="Width (beam at transom)" value={transomWidth} onChange={setTransomWidth} unit="mm" min={500} max={5000} />
                <NumberInput label="Centre height (deepest)" value={centreHeight} onChange={setCentreHeight} unit="mm" min={200} max={1500} />
                <NumberInput label="Side height (edges)" value={sideHeight} onChange={setSideHeight} unit="mm" min={50} max={1500} />
                <NumberInput label="Rake / Slope angle" value={transomAngle} onChange={setTransomAngle} unit="°" min={0} max={35} />
                <NumberInput label="Total thickness" value={thickness} onChange={setThickness} unit="mm" min={5} max={150} step={0.5} />
                <NumberInput label="Outer shell (existing skin)" value={shellThickness} onChange={setShellThickness} unit="mm" min={0} max={20} />
                <div style={{ color: t("textTertiary"), fontSize: 11, marginBottom: 4 }}>
                  Pour depth: <strong style={{ color: "#f59e0b" }}>{calcs.pourDepth}mm</strong> (thickness minus shell)
                </div>
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                  <label style={{ color: t("textSecondary"), fontSize: 13 }}>Material</label>
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    style={{
                      display: "block", width: "100%", background: t("input"),
                      border: `1px solid ${t("borderSubtle")}`, borderRadius: 6, color: t("text"),
                      padding: "8px 10px", fontSize: 13, marginTop: 4,
                    }}
                  >
                    {MATERIALS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginTop: 12 }}>
                <h3 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>ENGINE CONFIGURATION</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {ENGINE_CONFIGS.map((cfg) => (
                    <button
                      key={cfg.id}
                      onClick={() => handleEngineConfig(cfg.id)}
                      style={{
                        background: engineConfig === cfg.id ? "#f59e0b20" : t("input"),
                        border: engineConfig === cfg.id ? "1px solid #f59e0b" : `1px solid ${t("borderSubtle")}`,
                        borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer",
                        color: engineConfig === cfg.id ? "#f59e0b" : t("textSecondary"),
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
                    <div style={{ color: t("textTertiary"), fontSize: 11, marginTop: 4 }}>
                      {cutoutCount > 1 ? `${cutoutCount} cutouts @ ${cutoutWidth} x ${cutoutHeight} mm each` : `${cutoutWidth} x ${cutoutHeight} mm`}
                      {cutoutCount > 1 && ` — total cutout area: ${calcs.cutoutArea_m2} m²`}
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginTop: 12 }}>
                <h3 style={{ color: "#3b82f6", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>RESIN VOLUME</h3>
                <NumberInput label="Wastage allowance" value={wastagePercent} onChange={setWastagePercent} unit="%" min={0} max={30} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <ResultBox label="Pour volume (minus rods)" value={calcs.resinLitres} unit="litres" />
                  <ResultBox label={`With ${wastagePercent}% wastage`} value={calcs.resinWithWastage} unit="litres" highlight />
                </div>
                {materialId === "titanpour" && (
                  <div style={{ color: "#f59e0b", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                    * TitanPour density is placeholder (1550 kg/m³). Update when confirmed specs available.
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}` }}>
                <h3 style={{ color: "#22c55e", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>RESULTS</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <ResultBox label="Centre slope height" value={calcs.centreSlopeHeight} unit="mm" />
                  <ResultBox label="Side slope height" value={calcs.sideSlopeHeight} unit="mm" />
                  <ResultBox label="Gross Area (pentagon)" value={calcs.grossArea_m2} unit="m²" />
                  {hasCutout && <ResultBox label={`Cutout Area (${cutoutCount}x)`} value={calcs.cutoutArea_m2} unit="m²" />}
                  <ResultBox label="Net Area" value={calcs.netArea_m2} unit="m²" highlight />
                  <ResultBox label="Cavity volume" value={calcs.cavityLitres} unit="litres" />
                  <ResultBox label="Pour volume (minus rods)" value={calcs.resinLitres} unit="litres" />
                  <ResultBox label={`Pour +${wastagePercent}% waste`} value={calcs.resinWithWastage} unit="litres" highlight />
                </div>
              </div>

              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginTop: 12 }}>
                <h3 style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 12px" }}>TRANSOM FACE-ON (PENTAGON SHAPE)</h3>
                <svg viewBox="0 0 300 200" style={{ width: "100%", maxHeight: 200, background: t("bg"), borderRadius: 8 }}>
                  {(() => {
                    // Pentagon: rectangle top + V bottom
                    const maxH = Math.max(centreHeight, 1);
                    const scale = 150 / maxH;
                    const w = Math.min(transomWidth * scale, 260);
                    const sH = sideHeight * scale;
                    const cH = centreHeight * scale;
                    const x0 = 150 - w / 2;
                    const x1 = 150 + w / 2;
                    const y0 = 15;
                    return (
                      <>
                        <polygon
                          points={`${x0},${y0} ${x1},${y0} ${x1},${y0 + sH} ${150},${y0 + cH} ${x0},${y0 + sH}`}
                          fill="#b45309" opacity="0.4" stroke="#f59e0b" strokeWidth="1.5"
                        />
                        {/* Side height label */}
                        <line x1={x0 - 8} y1={y0} x2={x0 - 8} y2={y0 + sH} stroke="#3b82f6" strokeWidth="0.8" />
                        <text x={x0 - 12} y={y0 + sH / 2} fill="#3b82f6" fontSize="8" textAnchor="end">{sideHeight}mm</text>
                        {/* Centre height label */}
                        <line x1={150} y1={y0} x2={150} y2={y0 + cH} stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3,2" />
                        <text x={156} y={y0 + cH / 2} fill="#22c55e" fontSize="8" textAnchor="start">{centreHeight}mm</text>
                        {/* Width label */}
                        <text x="150" y={y0 + cH + 18} fill={t("textTertiary")} fontSize="8" textAnchor="middle">{transomWidth}mm wide</text>
                        {hasCutout && (
                          <>
                            <rect
                              x={150 - (cutoutWidth * scale) / 2} y={y0} width={cutoutWidth * scale} height={Math.min(cutoutHeight * scale, sH)}
                              fill={t("bg")} stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2"
                            />
                            <text x="150" y={y0 + Math.min(cutoutHeight * scale, sH) + 10} fill="#ef4444" fontSize="7" textAnchor="middle">cutout</text>
                          </>
                        )}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ===== ROD SPACING TAB ===== */}
        {tab === "rods" && (
          <div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 12 }}>
                  <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>ROD GRID PARAMETERS</h3>
                  <NumberInput label="Rod spacing (H & V)" value={rodSpacing} onChange={setRodSpacing} unit="mm" min={20} max={300} />
                  <NumberInput label="Horizontal rod diameter" value={hRodDiameter} onChange={setHRodDiameter} unit="mm" min={2} max={20} />
                  <NumberInput label="Vertical rod diameter" value={vRodDiameter} onChange={setVRodDiameter} unit="mm" min={2} max={20} />
                  <NumberInput label="Outer shell thickness" value={shellThickness} onChange={setShellThickness} unit="mm" min={0} max={20} />
                  <NumberInput label="Min resin cover" value={minCover} onChange={setMinCover} unit="mm" min={3} max={30} />
                  <NumberInput label="Transom width" value={transomWidth} onChange={setTransomWidth} unit="mm" />
                  <NumberInput label="Centre height" value={centreHeight} onChange={setCentreHeight} unit="mm" />
                  <NumberInput label="Side height" value={sideHeight} onChange={setSideHeight} unit="mm" />
                  <NumberInput label="Rake angle" value={transomAngle} onChange={setTransomAngle} unit={"°"} min={0} max={35} />
                </div>

                {/* Cover / fit analysis */}
                <div style={{
                  background: t("card"), borderRadius: 12, padding: 20, marginBottom: 12,
                  border: calcs.stackFits ? "1px solid #1e293b" : "1px solid #ef444460",
                }}>
                  <h3 style={{ color: "#3b82f6", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>COVER &amp; FIT CHECK</h3>
                  <div style={{ fontSize: 12, color: t("textSecondary"), marginBottom: 12, lineHeight: 1.6 }}>
                    Total thickness: <strong style={{ color: t("text") }}>{thickness}mm</strong> &middot;
                    Shell: <strong style={{ color: t("text") }}>{shellThickness}mm</strong> &middot;
                    Pour depth: <strong style={{ color: "#f59e0b" }}>{calcs.pourDepth}mm</strong> &middot;
                    Min cover: <strong style={{ color: "#f59e0b" }}>{minCover}mm</strong>
                  </div>

                  {/* H rod */}
                  <div style={{
                    padding: "10px 14px", borderRadius: 8, marginBottom: 8,
                    background: calcs.hFits ? "#22c55e08" : "#ef444410",
                    border: `1px solid ${calcs.hFits ? "#22c55e30" : "#ef444440"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: t("text"), fontSize: 13, fontWeight: 600 }}>
                        Horizontal &oslash;{hRodDiameter}mm <span style={{ color: t("textSecondary"), fontWeight: 400, fontSize: 11 }}>— cover: {calcs.hCover}mm</span>
                      </div>
                      <div style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: calcs.hFits ? "#22c55e20" : "#ef444420",
                        color: calcs.hFits ? "#22c55e" : "#ef4444",
                      }}>
                        {calcs.hFits ? "OK" : "TOO TIGHT"}
                      </div>
                    </div>
                  </div>

                  {/* V rod */}
                  <div style={{
                    padding: "10px 14px", borderRadius: 8, marginBottom: 8,
                    background: calcs.vFits ? "#22c55e08" : "#ef444410",
                    border: `1px solid ${calcs.vFits ? "#22c55e30" : "#ef444440"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: t("text"), fontSize: 13, fontWeight: 600 }}>
                        Vertical &oslash;{vRodDiameter}mm <span style={{ color: t("textSecondary"), fontWeight: 400, fontSize: 11 }}>— cover: {calcs.vCover}mm</span>
                      </div>
                      <div style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: calcs.vFits ? "#22c55e20" : "#ef444420",
                        color: calcs.vFits ? "#22c55e" : "#ef4444",
                      }}>
                        {calcs.vFits ? "OK" : "TOO TIGHT"}
                      </div>
                    </div>
                  </div>

                  {/* Stacked at crossing */}
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: calcs.stackFits ? "#22c55e08" : "#ef444410",
                    border: `1px solid ${calcs.stackFits ? "#22c55e30" : "#ef444440"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: t("text"), fontSize: 13, fontWeight: 600 }}>
                        At crossing ({hRodDiameter}+{vRodDiameter}={hRodDiameter + vRodDiameter}mm)
                        <span style={{ color: t("textSecondary"), fontWeight: 400, fontSize: 11 }}> — cover: {calcs.stackCover}mm</span>
                      </div>
                      <div style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: calcs.stackFits ? "#22c55e20" : "#ef444420",
                        color: calcs.stackFits ? "#22c55e" : "#ef4444",
                      }}>
                        {calcs.stackFits ? "FITS" : "WON'T FIT"}
                      </div>
                    </div>
                    {!calcs.stackFits && (
                      <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>
                        Need {calcs.minThicknessForStack}mm thickness for &oslash;{hRodDiameter}mm + &oslash;{vRodDiameter}mm stacked with {minCover}mm cover each side.
                        {hRodDiameter !== vRodDiameter
                          ? ` Try reducing the ${hRodDiameter > vRodDiameter ? "horizontal" : "vertical"} rod diameter.`
                          : " Reduce rod diameter or increase transom thickness."}
                      </div>
                    )}
                  </div>

                  {/* Cross-section at crossing */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ color: t("textTertiary"), fontSize: 11, marginBottom: 6 }}>CROSS-SECTION AT ROD CROSSING</div>
                    <svg viewBox="0 0 200 100" style={{ width: "100%", maxWidth: 300, background: t("bg"), borderRadius: 8 }}>
                      <rect x="40" y="10" width="120" height="80" fill="#b4530920" stroke="#f59e0b" strokeWidth="1.5" rx="2" />
                      <text x="100" y="7" fill={t("textTertiary")} fontSize="7" textAnchor="middle">{thickness}mm</text>
                      {(() => {
                        const scale = 70 / thickness;
                        const cy = 50;
                        const rH = (hRodDiameter / 2) * scale;
                        const rV = (vRodDiameter / 2) * scale;
                        return (
                          <>
                            <circle cx="100" cy={cy - rV} r={rH} fill="#f59e0b40" stroke="#f59e0b" strokeWidth="1" />
                            <text x="100" fill="#f59e0b" fontSize="6" textAnchor="middle" y={cy - rV + 2}>H &oslash;{hRodDiameter}</text>
                            <circle cx="100" cy={cy + rH} r={rV} fill="#3b82f640" stroke="#3b82f6" strokeWidth="1" />
                            <text x="100" fill="#3b82f6" fontSize="6" textAnchor="middle" y={cy + rH + 2}>V &oslash;{vRodDiameter}</text>
                            {/* Cover line */}
                            <line x1="30" y1={10} x2="30" y2={10 + parseFloat(calcs.stackCover) * scale} stroke={calcs.stackFits ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
                            <text x="22" y={10 + parseFloat(calcs.stackCover) * scale / 2 + 2} fill={calcs.stackFits ? "#22c55e" : "#ef4444"} fontSize="6" textAnchor="middle">{calcs.stackCover}</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Auto rod sizing (1/3 rule) */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 12 }}>
                  <h3 style={{ color: "#a855f7", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>AUTO ROD SIZING (1/3 RULE)</h3>
                  <div style={{
                    padding: "12px 16px", background: t("input"), borderRadius: 8, marginBottom: 12,
                    fontSize: 12, color: t("textSecondary"), lineHeight: 1.8, fontFamily: "monospace",
                  }}>
                    <div>Pour depth = {thickness} &minus; {shellThickness} = <strong style={{ color: "#f59e0b" }}>{quickCalc.pourDepth}mm</strong></div>
                    <div>1/3 for rods = {quickCalc.pourDepth} &divide; 3 = <strong style={{ color: "#f59e0b" }}>{quickCalc.stackedTarget.toFixed(1)}mm</strong> stacked</div>
                    <div>Each rod = {quickCalc.stackedTarget.toFixed(1)} &divide; 2 = <strong style={{ color: "#f59e0b" }}>{quickCalc.rodDiam.toFixed(1)}mm</strong></div>
                    <div>Rounded down = <strong style={{ color: "#22c55e", fontSize: 16 }}>{quickCalc.rodDiamRounded}mm rods</strong></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <ResultBox label="Rod diameter" value={quickCalc.rodDiamRounded} unit="mm" highlight />
                    <ResultBox label="Stacked" value={quickCalc.actualStacked} unit="mm" />
                    <ResultBox label="Cover each side" value={quickCalc.actualCover.toFixed(1)} unit="mm" />
                  </div>
                  {quickCalc.actualCover < 10 && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#ef444420", border: `1px solid ${t("dangerBorder")}`, borderRadius: 6, fontSize: 11, color: t("dangerText") }}>
                      Cover is under 10mm — consider thinner rods or thicker transom.
                    </div>
                  )}
                </div>

                {/* 1/3 rule cross section */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 12 }}>
                  <h3 style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 12px", fontWeight: 700 }}>1/3 RULE CROSS SECTION</h3>
                  <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 300 }}>
                    <rect x="20" y="10" width="160" height="100" rx="2" fill="none" stroke="#475569" strokeWidth="1" />
                    {(() => {
                      const total = 100;
                      const shellFrac = shellThickness / thickness;
                      const pourFrac = quickCalc.pourDepth / thickness;
                      const thirdH = pourFrac * total / 3;
                      const shellH = shellFrac * total;
                      const yShell = 10 + shellH;
                      const yRodTop = yShell + thirdH;
                      const yRodBot = yRodTop + thirdH;
                      return (
                        <>
                          <rect x="20" y="10" width="160" height={shellH} fill="#f59e0b20" stroke="none" />
                          <text x="100" y={10 + shellH / 2 + 3} textAnchor="middle" fill="#f59e0b" fontSize="8">shell {shellThickness}mm</text>
                          <rect x="20" y={yShell} width="160" height={thirdH} fill="#3b82f620" stroke="none" />
                          <text x="100" y={yShell + thirdH / 2 + 3} textAnchor="middle" fill="#3b82f6" fontSize="7">1/3 cover</text>
                          <rect x="20" y={yRodTop} width="160" height={thirdH} fill="#a855f730" stroke="none" />
                          <line x1="40" y1={yRodTop + thirdH * 0.35} x2="160" y2={yRodTop + thirdH * 0.35} stroke="#a855f7" strokeWidth="2" />
                          <line x1="40" y1={yRodTop + thirdH * 0.65} x2="160" y2={yRodTop + thirdH * 0.65} stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" />
                          <text x="100" y={yRodTop + thirdH / 2 + 3} textAnchor="middle" fill="#a855f7" fontSize="7">1/3 rods ({quickCalc.rodDiamRounded}+{quickCalc.rodDiamRounded}mm)</text>
                          <rect x="20" y={yRodBot} width="160" height={thirdH} fill="#3b82f620" stroke="none" />
                          <text x="100" y={yRodBot + thirdH / 2 + 3} textAnchor="middle" fill="#3b82f6" fontSize="7">1/3 cover</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                {/* Grid results */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 12 }}>
                  <div style={{ color: t("textTertiary"), fontSize: 11, marginBottom: 8 }}>AT {rodSpacing}mm SPACING &mdash; H &oslash;{hRodDiameter}mm / V &oslash;{vRodDiameter}mm &mdash; H rods 30mm shorter for clearance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Horizontal rods" value={calcs.hRods} unit="rods" />
                    <ResultBox label="Vertical rods" value={calcs.vRods} unit="rods" />
                    <ResultBox label="Total H rod length" value={calcs.totalHRodLength} unit="m" />
                    <ResultBox label="Total V rod length" value={calcs.totalVRodLength} unit="m" />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ResultBox label="TOTAL ROD LENGTH (all rods)" value={calcs.totalRodLength} unit="metres" highlight />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ResultBox label="Total rod count" value={calcs.totalRodCount} unit={`(${calcs.hRods}H + ${calcs.vRods}V)`} />
                  </div>

                  {/* Individual rod cut list */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>H ROD CUT LIST</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {calcs.hRodDetails.map((r, i) => (
                        <span key={i} style={{
                          background: r.zone === "RECT" ? t("input") : "#f59e0b15",
                          border: `1px solid ${t("borderSubtle")}`, borderRadius: 4,
                          padding: "2px 6px", fontSize: 11, color: t("text"),
                        }}>
                          {r.length.toFixed(0)}mm
                        </span>
                      ))}
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 6, marginTop: 10 }}>V ROD CUT LIST</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {calcs.vRodDetails.map((r, i) => (
                        <span key={i} style={{
                          background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 4,
                          padding: "2px 6px", fontSize: 11, color: t("text"),
                        }}>
                          {r.length.toFixed(0)}mm
                        </span>
                      ))}
                    </div>
                  </div>
                  {hRodDiameter !== vRodDiameter && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#f59e0b10", border: "1px solid #f59e0b30", borderRadius: 6, fontSize: 11, color: "#f59e0b" }}>
                      Two rod sizes: order &oslash;{hRodDiameter}mm for horizontal and &oslash;{vRodDiameter}mm for vertical separately.
                    </div>
                  )}
                </div>

                {/* Grid preview */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}` }}>
                  <h3 style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 12px" }}>ROD GRID PREVIEW (face-on)</h3>
                  <svg viewBox="0 0 300 220" style={{ width: "100%", background: t("bg"), borderRadius: 8 }}>
                    {(() => {
                      // Pentagon outline scaled to fit
                      const maxH = Math.max(parseFloat(calcs.centreSlopeHeight), 1);
                      const sH = parseFloat(calcs.sideSlopeHeight);
                      const scale = 170 / maxH;
                      const w = Math.min(transomWidth * scale, 240);
                      const svgSH = sH * scale;
                      const svgCH = maxH * scale;
                      const x0 = 150 - w / 2;
                      const x1 = 150 + w / 2;
                      const y0 = 20;
                      return (
                        <>
                          <polygon
                            points={`${x0},${y0} ${x1},${y0} ${x1},${y0 + svgSH} ${150},${y0 + svgCH} ${x0},${y0 + svgSH}`}
                            fill="none" stroke="#334155" strokeWidth="1.5"
                          />
                          {/* H rods */}
                          {calcs.hRodDetails.slice(0, 30).map((r, i) => {
                            const y = y0 + (r.slopeY / maxH) * svgCH;
                            const rw = (r.length / transomWidth) * w;
                            const rx = 150 - rw / 2;
                            return <line key={`h${i}`} x1={rx} y1={y} x2={rx + rw} y2={y} stroke="#f59e0b" strokeWidth="0.8" opacity="0.5" />;
                          })}
                          {/* V rods */}
                          {calcs.vRodDetails.slice(0, 40).map((r, i) => {
                            const x = x0 + (r.x / transomWidth) * w;
                            const rodH = (r.length / maxH) * svgCH;
                            return <line key={`v${i}`} x1={x} y1={y0} x2={x} y2={y0 + rodH} stroke="#3b82f6" strokeWidth="0.8" opacity="0.5" />;
                          })}
                          {hasCutout && (() => {
                            const cw = (cutoutWidth / transomWidth) * w;
                            const ch = Math.min((cutoutHeight / maxH) * svgCH, svgSH);
                            return <rect x={150 - cw / 2} y={y0} width={cw} height={ch} fill={t("bg")} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />;
                          })()}
                        </>
                      );
                    })()}
                    <text x="150" y="210" fill={t("textTertiary")} fontSize="9" textAnchor="middle">{transomWidth}mm</text>
                    <text x="280" y="105" fill="#f59e0b" fontSize="8" textAnchor="start">H: {calcs.hRods}</text>
                    <text x="150" y="14" fill="#3b82f6" fontSize="8" textAnchor="middle">V: {calcs.vRods}</text>
                  </svg>
                  <div style={{ marginTop: 12, padding: 10, background: t("input"), borderRadius: 8, fontSize: 12, color: t("textSecondary"), lineHeight: 1.6 }}>
                    <strong style={{ color: "#f59e0b" }}>Pentagon shape:</strong> {transomWidth}mm wide, {centreHeight}mm centre, {sideHeight}mm sides.
                    H rods are 30mm shorter than panel width for clearance. V rods vary in length (shorter at edges, longest at centre).
                    <br/><br/>
                    <strong style={{ color: "#f59e0b" }}>H &oslash;{hRodDiameter}mm</strong> / <strong style={{ color: "#3b82f6" }}>V &oslash;{vRodDiameter}mm</strong> at {rodSpacing}mm centres — {calcs.totalRodCount} rods total requiring <strong style={{ color: "#22c55e" }}>{calcs.totalRodLength}m</strong> of rod.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MIX CALCULATOR TAB ===== */}
        {tab === "mix" && (
          <div>
            {/* Batch input */}
            <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
              <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 16px", fontWeight: 700 }}>BATCH SIZE</h3>
              <NumberInput label="Total batch weight" value={batchWeight} onChange={setBatchWeight} unit="kg" min={1} max={10000} step={10} />
              <div style={{ color: t("textTertiary"), fontSize: 12, marginTop: 4 }}>
                Ambient temperature: <strong style={{ color: ambientTemp >= 18 && ambientTemp <= 26 ? "#22c55e" : ambientTemp < 18 ? "#3b82f6" : "#ef4444" }}>
                  {ambientTemp.toFixed(1)}&deg;C
                </strong>
                {forecastData?.current ? " (live from weather tab)" : " (default — set location in Live Weather tab)"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {/* Left column */}
              <div style={{ flex: 1, minWidth: 280 }}>
                {/* Mix breakdown */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#f59e0b", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>MIX BREAKDOWN</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Resin (58%)" value={mixCalcs.resinMass.toFixed(1)} unit="kg" highlight />
                    <ResultBox label="Talc filler (30%)" value={mixCalcs.talcMass.toFixed(1)} unit="kg" />
                    <ResultBox label="Glass fibre (10%)" value={mixCalcs.glassMass.toFixed(1)} unit="kg" />
                    <ResultBox label="Cat + retarder (~2%)" value={(batchWeight * 0.02).toFixed(1)} unit="kg" />
                  </div>
                </div>

                {/* Rod displacement */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#3b82f6", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>POUR VOLUME (ROD DISPLACEMENT)</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Cavity volume" value={calcs.cavityLitres} unit="litres" />
                    <ResultBox label="Rod displacement" value={calcs.rodDisplacement_litres} unit="litres" />
                    <ResultBox label="Actual pour needed" value={calcs.pourVolume_litres} unit="litres" highlight />
                  </div>
                  <div style={{ color: t("textTertiary"), fontSize: 11, marginTop: 8 }}>
                    {calcs.totalRodCount} rods (H &oslash;{hRodDiameter}mm / V &oslash;{vRodDiameter}mm) displace {calcs.rodDisplacement_litres} litres from the cavity
                  </div>
                </div>

                {/* Pour breakdown by 140mm bands */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#a855f7", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>POUR BREAKDOWN</h3>
                  <NumberInput label="Max pour height" value={maxPourHeight} onChange={setMaxPourHeight} unit="mm" min={50} max={500} step={10} />
                  <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: `1px solid ${t("border")}` }}>
                    <div style={{
                      display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr",
                      background: t("input"), padding: "8px 12px", gap: 8,
                    }}>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>POUR</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>BAND (mm)</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>LITRES</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>CUMULATIVE</div>
                    </div>
                    {calcs.pourBands.map((band) => (
                      <div key={band.pour} style={{
                        display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr",
                        padding: "8px 12px", gap: 8,
                        borderBottom: `1px solid ${t("border")}`,
                      }}>
                        <div style={{ color: "#a855f7", fontSize: 13, fontWeight: 700 }}>#{band.pour}</div>
                        <div style={{ color: t("textSecondary"), fontSize: 13 }}>{band.fromY}&ndash;{band.toY}</div>
                        <div style={{ color: t("text"), fontSize: 13, fontWeight: 700 }}>{band.litres.toFixed(2)} L</div>
                        <div style={{ color: t("textTertiary"), fontSize: 13 }}>{band.cumulative.toFixed(2)} L</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ color: t("textTertiary"), fontSize: 11, marginTop: 8 }}>
                    {calcs.pourBands.length} pours at {maxPourHeight}mm max. Measured from bottom of V upward. Volumes are cavity (before rod displacement).
                  </div>
                </div>

                {/* Retarder */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}` }}>
                  <h3 style={{ color: "#22c55e", fontSize: 14, margin: "0 0 12px", fontWeight: 700 }}>RETARDER</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ResultBox label="Dose (0.025% of resin)" value={mixCalcs.retarderGrams.toFixed(0)} unit="grams" highlight />
                    <ResultBox label="In kg" value={mixCalcs.retarderKg.toFixed(3)} unit="kg" />
                  </div>
                  <div style={{
                    marginTop: 10, padding: "8px 12px", background: "#f59e0b10",
                    border: "1px solid #f59e0b30", borderRadius: 6, fontSize: 11, color: "#f59e0b",
                  }}>
                    Retarder is a very small quantity. A 50g error on {mixCalcs.retarderGrams.toFixed(0)}g is a {((50 / mixCalcs.retarderGrams) * 100).toFixed(0)}% mistake — use accurate scales.
                  </div>
                </div>
              </div>

              {/* Right column — catalyst */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: "#ef4444", fontSize: 14, margin: "0 0 4px", fontWeight: 700 }}>CATALYST — TRIGONOX 239</h3>
                  <div style={{ color: t("textTertiary"), fontSize: 12, marginBottom: 16 }}>
                    Recommended level at {ambientTemp.toFixed(1)}&deg;C: <strong style={{ color: "#f59e0b" }}>{mixCalcs.recommendedCatPct}% of resin</strong>
                  </div>

                  {/* Catalyst table */}
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${t("border")}` }}>
                    {/* Header */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      background: t("input"), padding: "8px 12px", gap: 8,
                    }}>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>% OF RESIN</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>% OF MIX</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>WEIGH OUT</div>
                      <div style={{ color: t("textTertiary"), fontSize: 11, fontWeight: 700 }}>TEMP RANGE</div>
                    </div>
                    {/* Rows */}
                    {mixCalcs.catalystLevels.map((lvl) => (
                      <div key={lvl.pctResin} style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        padding: "10px 12px", gap: 8,
                        background: lvl.recommended ? "#f59e0b12" : "transparent",
                        borderLeft: lvl.recommended ? "3px solid #f59e0b" : "3px solid transparent",
                        borderBottom: `1px solid ${t("border")}`,
                      }}>
                        <div style={{ color: t("text"), fontSize: 14, fontWeight: lvl.recommended ? 700 : 400 }}>
                          {lvl.pctResin}%
                        </div>
                        <div style={{ color: t("textSecondary"), fontSize: 14 }}>
                          {lvl.pctMix.toFixed(3)}%
                        </div>
                        <div style={{ color: lvl.recommended ? "#f59e0b" : t("text"), fontSize: 14, fontWeight: 700 }}>
                          {lvl.kg.toFixed(2)} kg
                        </div>
                        <div style={{ fontSize: 11, color: t("textSecondary") }}>
                          {lvl.pctResin === 1.2 && "> 26°C"}
                          {lvl.pctResin === 1.5 && "18–26°C"}
                          {lvl.pctResin === 2.0 && "< 18°C"}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* The formula */}
                <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                  <h3 style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 12px", fontWeight: 700 }}>THE FORMULA</h3>
                  <div style={{ color: t("textSecondary"), fontSize: 12, lineHeight: 2, fontFamily: "monospace" }}>
                    <div>Batch weight &times; 0.58 = <strong style={{ color: "#f59e0b" }}>resin mass</strong></div>
                    <div>Resin mass &times; catalyst % = <strong style={{ color: "#ef4444" }}>catalyst to weigh</strong></div>
                    <div>Resin mass &times; 0.00025 = <strong style={{ color: "#22c55e" }}>retarder to weigh</strong></div>
                  </div>
                  <div style={{ marginTop: 12, color: t("textSecondary"), fontSize: 12, lineHeight: 1.6 }}>
                    <strong style={{ color: t("text") }}>Example:</strong> {batchWeight} kg &times; 0.58 = {mixCalcs.resinMass.toFixed(1)} kg resin<br/>
                    {mixCalcs.resinMass.toFixed(1)} kg &times; {(mixCalcs.recommendedCatPct / 100).toFixed(3)} = <strong style={{ color: "#f59e0b" }}>
                      {(mixCalcs.resinMass * mixCalcs.recommendedCatPct / 100).toFixed(2)} kg Trigonox 239
                    </strong>
                  </div>
                </div>

                {/* Safety warning */}
                <div style={{
                  padding: "16px 20px", background: t("danger"),
                  border: `1px solid ${t("dangerBorder")}`, borderRadius: 8,
                }}>
                  <strong style={{ color: "#ef4444", fontSize: 13 }}>CRITICAL — DO NOT MIX UP</strong>
                  <div style={{ color: t("dangerText"), fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
                    Catalyst % applies to the <strong>resin fraction only</strong> (58% of batch), never the total batch weight.
                    Calculating {mixCalcs.recommendedCatPct}% of the full {batchWeight} kg gives{" "}
                    <strong style={{ color: "#ef4444" }}>{(batchWeight * mixCalcs.recommendedCatPct / 100).toFixed(2)} kg</strong> — that is{" "}
                    <strong style={{ color: "#ef4444" }}>
                      {((batchWeight * mixCalcs.recommendedCatPct / 100) / (mixCalcs.resinMass * mixCalcs.recommendedCatPct / 100) * 100 - 100).toFixed(0)}% too much catalyst
                    </strong>{" "}
                    and would cause a dangerous exotherm event.
                    The correct amount is <strong style={{ color: "#22c55e" }}>
                      {(mixCalcs.resinMass * mixCalcs.recommendedCatPct / 100).toFixed(2)} kg
                    </strong>.
                  </div>
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
            <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ color: "#f59e0b", fontSize: 14, margin: 0, fontWeight: 700 }}>INSTALLATION LOCATION</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleUseMyLocation}
                    style={{
                      background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderRadius: 6,
                      color: t("textSecondary"), padding: "6px 12px", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    Use my GPS
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={loadingForecast}
                    style={{
                      background: loadingForecast ? t("borderSubtle") : t("input"),
                      border: `1px solid ${t("borderSubtle")}`, borderRadius: 6,
                      color: loadingForecast ? t("textTertiary") : t("textSecondary"),
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
                    width: "100%", background: t("input"), border: `1px solid ${t("borderSubtle")}`,
                    borderRadius: showDropdown ? "8px 8px 0 0" : 8,
                    color: t("text"), padding: "10px 14px", fontSize: 14, outline: "none",
                  }}
                />
                {showDropdown && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: t("input"), border: `1px solid ${t("borderSubtle")}`, borderTop: "none",
                    borderRadius: "0 0 8px 8px", zIndex: 10, maxHeight: 280, overflowY: "auto",
                  }}>
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectLocation(r)}
                        style={{
                          display: "block", width: "100%", background: "transparent",
                          border: "none", borderBottom: "1px solid #1e293b80",
                          color: t("text"), padding: "10px 14px", textAlign: "left",
                          cursor: "pointer", fontSize: 13,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <strong>{r.name}</strong>
                        <span style={{ color: t("textSecondary") }}>
                          {r.admin1 ? ` — ${r.admin1}, ` : " — "}{r.country}
                        </span>
                        <span style={{ color: t("textTertiary"), fontSize: 11, float: "right" }}>
                          {Math.abs(r.latitude).toFixed(2)}°{r.latitude >= 0 ? "N" : "S"},{" "}
                          {Math.abs(r.longitude).toFixed(2)}°{r.longitude >= 0 ? "E" : "W"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected location display */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ color: t("text"), fontSize: 16, fontWeight: 700 }}>
                    {selectedLocation.name}
                    {selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}
                    {selectedLocation.country ? `, ${selectedLocation.country}` : ""}
                  </div>
                  <div style={{ color: t("textTertiary"), fontSize: 12 }}>
                    {Math.abs(selectedLocation.latitude).toFixed(4)}°{selectedLocation.latitude >= 0 ? "N" : "S"},{" "}
                    {Math.abs(selectedLocation.longitude).toFixed(4)}°{selectedLocation.longitude >= 0 ? "E" : "W"}
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
                  background: t("card"), borderRadius: 12, padding: 20,
                  border: `2px solid ${verdict.color}40`, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ color: t("text"), fontSize: 14, margin: 0, fontWeight: 700 }}>
                      LIVE CONDITIONS
                    </h3>
                    <div style={{ color: t("textTertiary"), fontSize: 11 }}>{weatherDesc}</div>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: t("bg"), borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: t("textTertiary"), fontSize: 10, marginBottom: 4 }}>TEMPERATURE</div>
                      <div style={{ color: getTempColor(c.temperature_2m), fontSize: 28, fontWeight: 800 }}>
                        {c.temperature_2m.toFixed(1)}°
                      </div>
                      <div style={{ color: t("textTertiary"), fontSize: 10 }}>Feels {c.apparent_temperature.toFixed(1)}°</div>
                    </div>
                    <div style={{ background: t("bg"), borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: t("textTertiary"), fontSize: 10, marginBottom: 4 }}>HUMIDITY</div>
                      <div style={{ color: c.relative_humidity_2m >= 85 ? "#ef4444" : c.relative_humidity_2m >= 80 ? "#f59e0b" : "#22c55e", fontSize: 28, fontWeight: 800 }}>
                        {c.relative_humidity_2m}%
                      </div>
                      <div style={{ color: t("textTertiary"), fontSize: 10 }}>{c.relative_humidity_2m >= 85 ? "Too high" : c.relative_humidity_2m >= 80 ? "Marginal" : "OK"}</div>
                    </div>
                    <div style={{ background: t("bg"), borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: t("textTertiary"), fontSize: 10, marginBottom: 4 }}>DEW POINT</div>
                      <div style={{ color: t("text"), fontSize: 28, fontWeight: 800 }}>
                        {c.dew_point_2m.toFixed(1)}°
                      </div>
                      <div style={{ color: t("textTertiary"), fontSize: 10 }}>Margin: {dewMargin}°C</div>
                    </div>
                    <div style={{ background: t("bg"), borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: t("textTertiary"), fontSize: 10, marginBottom: 4 }}>WIND</div>
                      <div style={{ color: t("text"), fontSize: 28, fontWeight: 800 }}>
                        {c.wind_speed_10m.toFixed(0)}
                      </div>
                      <div style={{ color: t("textTertiary"), fontSize: 10 }}>km/h</div>
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
                    <div style={{ color: t("textSecondary"), fontSize: 12, lineHeight: 1.5 }}>
                      {verdict.msg}
                      {isRaining && (
                        <><br/><strong style={{ color: "#3b82f6" }}>Currently raining/precipitating — do NOT lay up resin in wet conditions.</strong></>
                      )}
                      {parseFloat(dewMargin) < 3 && parseFloat(dewMargin) >= 2 && (
                        <><br/>Dew point margin is tight ({dewMargin}°C). Monitor for substrate condensation.</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {loadingForecast && !forecastData && (
              <div style={{ background: t("card"), borderRadius: 12, padding: 40, border: `1px solid ${t("border")}`, marginBottom: 16, textAlign: "center" }}>
                <div style={{ color: "#f59e0b", fontSize: 14 }}>Fetching live weather data...</div>
              </div>
            )}

            {/* ── NEXT 24 HOURS ── */}
            {hourlyToday.length > 0 && (
              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ color: t("text"), fontSize: 14, margin: 0, fontWeight: 700 }}>TODAY — HOURLY FORECAST</h3>
                  {bestWindow && (
                    <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                      Best window: {String(bestWindow.startHour).padStart(2, "0")}:00 – {String(bestWindow.endHour).padStart(2, "0")}:00
                      ({bestWindow.hours}h, avg {bestWindow.avgTemp}°C)
                    </div>
                  )}
                  {!bestWindow && (
                    <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                      No workable window today (temp &lt;10°C or humidity &gt;85% all day)
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
                          <div style={{ color: t("text"), fontSize: 9, fontWeight: 600, marginBottom: 2 }}>
                            {h.temp.toFixed(0)}°
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
                      <div key={i} style={{ flex: 1, textAlign: "center", color: t("textTertiary"), fontSize: 9, fontWeight: 600 }}>
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
                        color: h.humidity >= 85 ? "#ef4444" : h.humidity >= 80 ? "#f59e0b" : t("textTertiary"),
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
                    <span style={{ color: t("textSecondary"), fontSize: 10 }}>{"≥"}15°C Ideal</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#f59e0b", borderRadius: 2, opacity: 0.7 }} />
                    <span style={{ color: t("textSecondary"), fontSize: 10 }}>10–15°C Workable</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2, opacity: 0.7 }} />
                    <span style={{ color: t("textSecondary"), fontSize: 10 }}>&lt;10°C Risky</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, border: "1.5px solid #22c55e", borderRadius: 2, boxSizing: "border-box" }} />
                    <span style={{ color: t("textSecondary"), fontSize: 10 }}>Best window</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── RECOMMENDED POUR DAYS ── */}
            {bestPourDays.length > 0 && (
              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: "1px solid #22c55e40", marginBottom: 16 }}>
                <h3 style={{ color: "#22c55e", fontSize: 14, margin: "0 0 4px", fontWeight: 700 }}>RECOMMENDED POUR DAYS</h3>
                <div style={{ color: t("textTertiary"), fontSize: 12, marginBottom: 14 }}>
                  Top {bestPourDays.length} days ranked by temperature, conditions, and forecast confidence
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bestPourDays.map((d, i) => (
                    <div key={d.date} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: i === 0 ? "#22c55e10" : t("input"),
                      border: i === 0 ? "1px solid #22c55e40" : `1px solid ${t("borderSubtle")}`,
                      borderRadius: 8,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: i === 0 ? "#22c55e" : t("borderSubtle"),
                        color: i === 0 ? "#020617" : t("textSecondary"),
                        fontSize: 13, fontWeight: 800,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: t("text"), fontSize: 14, fontWeight: 600 }}>
                          {d.dayName} {d.dayNum} {d.month}
                          {i === 0 && <span style={{ color: "#22c55e", fontSize: 11, marginLeft: 8 }}>BEST</span>}
                        </div>
                        <div style={{ color: t("textSecondary"), fontSize: 12 }}>
                          {d.high.toFixed(0)}&deg;C high / {d.low.toFixed(0)}&deg;C low &middot; {d.weather} &middot; {d.reason}
                        </div>
                      </div>
                      <div style={{
                        background: `${d.verdict.color}20`, color: d.verdict.color,
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4,
                      }}>
                        {d.verdict.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 3-WEEK OUTLOOK ── */}
            {dailyForecast.length > 0 && (
              <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}`, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <h3 style={{ color: t("text"), fontSize: 14, margin: 0, fontWeight: 700 }}>3-WEEK OUTLOOK</h3>
                  {bestDay && (
                    <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                      Best day: {bestDay.dayName} {bestDay.dayNum} {bestDay.month} ({bestDay.high.toFixed(0)}°C high)
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
                      <div style={{ width: 80, color: i === 0 ? "#f59e0b" : t("textSecondary"), fontSize: 13, fontWeight: i === 0 ? 700 : 400 }}>
                        {i === 0 ? "Today" : `${d.dayName} ${d.dayNum}`}
                      </div>
                      <div style={{ width: 35, color: t("textSecondary"), fontSize: 12, textAlign: "right" }}>
                        {d.low.toFixed(0)}°
                      </div>
                      <div style={{ flex: 1, height: 8, background: t("input"), borderRadius: 4, position: "relative" }}>
                        <div style={{
                          position: "absolute", left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%`,
                          height: "100%", background: getTempColor(avgTemp), borderRadius: 4, opacity: 0.7,
                        }} />
                      </div>
                      <div style={{ width: 35, color: t("text"), fontSize: 12, fontWeight: 600 }}>
                        {d.high.toFixed(0)}°
                      </div>
                      <div style={{ width: 100, fontSize: 11, color: t("textTertiary") }}>{d.weather}</div>
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
              <div style={{ background: t("card"), borderRadius: 12, padding: 16, border: "1px solid #22c55e40" }}>
                <h4 style={{ color: "#22c55e", fontSize: 13, margin: "0 0 8px" }}>{"✓"} IDEAL ({"≥"}15°C, RH &lt;80%)</h4>
                <div style={{ color: t("textSecondary"), fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: normal catalyst ratio (1–2% MEKP)<br/>
                  Epoxy: standard hardener, 6–8hr pot life<br/>
                  Gel time: ~15–20 min (polyester)<br/>
                  Full cure: 24–48 hours<br/>
                  <strong style={{ color: t("text") }}>Optimal working conditions</strong>
                </div>
              </div>
              <div style={{ background: t("card"), borderRadius: 12, padding: 16, border: "1px solid #f59e0b40" }}>
                <h4 style={{ color: "#f59e0b", fontSize: 13, margin: "0 0 8px" }}>{"!"} WORKABLE (10–15°C)</h4>
                <div style={{ color: t("textSecondary"), fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: increase catalyst 0.5–1%<br/>
                  Epoxy: slow/winter hardener required<br/>
                  Gel time: 25–40 min (polyester)<br/>
                  Full cure: 48–96 hours<br/>
                  <strong style={{ color: t("text") }}>Work midday, allow 50–100% extra cure</strong>
                </div>
              </div>
              <div style={{ background: t("card"), borderRadius: 12, padding: 16, border: "1px solid #ef444440" }}>
                <h4 style={{ color: "#ef4444", fontSize: 13, margin: "0 0 8px" }}>{"✗"} RISKY (&lt;10°C)</h4>
                <div style={{ color: t("textSecondary"), fontSize: 12, lineHeight: 1.6 }}>
                  Polyester: high risk of undercure<br/>
                  Epoxy: will not cross-link below 5°C<br/>
                  Gel time: &gt;60 min or may not gel<br/>
                  Full cure: may never fully cure<br/>
                  <strong style={{ color: t("text") }}>Heated workspace essential (min 10°C substrate)</strong>
                </div>
              </div>
            </div>

            {/* Dew point reference */}
            <div style={{ background: t("input"), borderRadius: 8, padding: 14, marginTop: 12, fontSize: 12, color: t("textSecondary"), lineHeight: 1.6 }}>
              <strong style={{ color: "#f59e0b" }}>Dew point rule:</strong> Substrate temperature must be at least 3°C above the dew point to prevent moisture condensation on the surface.
              Moisture on the layup surface will cause delamination, fisheyes, and incomplete bonding.
              {" "}<strong style={{ color: t("text") }}>Always check dew point margin before mixing resin.</strong>
              <br/>
              <strong style={{ color: "#f59e0b" }}>Humidity:</strong> Relative humidity above 80% slows surface cure and can cause amine blush (epoxy) or surface tackiness (polyester).
              Above 85% is a no-go for quality layup work.
            </div>
          </div>
        )}

        {/* ===== JOB SUMMARY TAB ===== */}
        {tab === "summary" && (
          <div>
            <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: "1px solid #f59e0b40", marginBottom: 16 }}>
              <h3 style={{ color: "#f59e0b", fontSize: 16, margin: "0 0 4px", fontWeight: 800 }}>
                TitanPour Job Summary
              </h3>
              <p style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 20px" }}>
                All measurements and quantities for this transom job
              </p>

              {/* Transom specs */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Transom Specifications
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Width (beam)" value={transomWidth} unit="mm" />
                  <ResultBox label="Centre height" value={centreHeight} unit="mm" />
                  <ResultBox label="Side height" value={sideHeight} unit="mm" />
                  <ResultBox label="Rake angle" value={transomAngle} unit={"°"} />
                  <ResultBox label="Centre slope" value={calcs.centreSlopeHeight} unit="mm" highlight />
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
                  <ResultBox label="Total cutout area" value={calcs.cutoutArea_m2} unit="m²" />
                </div>
              </div>

              {/* Areas and volumes */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
                  Areas &amp; Volumes
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  <ResultBox label="Gross area (pentagon)" value={calcs.grossArea_m2} unit="m²" />
                  <ResultBox label="Net panel area" value={calcs.netArea_m2} unit="m²" highlight />
                  <ResultBox label="Cavity volume" value={calcs.cavityLitres} unit="litres" />
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
                  <ResultBox label="Rod diameter (H / V)" value={`${hRodDiameter} / ${vRodDiameter}`} unit="mm" />
                  <ResultBox label="Grid spacing" value={rodSpacing} unit="mm" />
                  <ResultBox label="Horizontal rods" value={calcs.hRods} unit="rods (vary by zone)" />
                  <ResultBox label="Vertical rods" value={calcs.vRods} unit="rods (vary by position)" />
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
                    <div style={{ color: t("textTertiary"), fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
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
                      <span style={{ color: t("text"), fontSize: 14, fontWeight: 600 }}>
                        {c.temperature_2m.toFixed(1)}{"°"}C &middot; {c.relative_humidity_2m}% RH &middot; Dew {c.dew_point_2m.toFixed(1)}{"°"}C
                      </span>
                      <span style={{ color: verdict.color, fontSize: 12 }}>{verdict.label}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Formulas reference */}
            <div style={{ background: t("card"), borderRadius: 12, padding: 20, border: `1px solid ${t("border")}` }}>
              <h3 style={{ color: t("textTertiary"), fontSize: 12, margin: "0 0 12px", fontWeight: 700 }}>CALCULATION FORMULAS USED</h3>
              <div style={{ color: t("textSecondary"), fontSize: 11, lineHeight: 1.8, fontFamily: "monospace" }}>
                <div>Slope Height = Vertical Height / cos(Rake Angle)</div>
                <div>Gross Area = Width &times; (Centre Slope H + Side Slope H) / 2</div>
                <div>Cutout Area = Cutout Width &times; (Cutout Height / cos(Rake Angle)) &times; Count</div>
                <div>Net Area = Gross Area &minus; Cutout Area</div>
                <div>Volume = Net Area &times; Thickness</div>
                <div>Resin Order = Volume &times; (1 + Wastage%)</div>
                <div>H Rod Length = Width &minus; 30mm (rect zone), tapered in triangle zone</div>
                <div>V Rod Height at x = Side H + (Centre H &minus; Side H) &times; (1 &minus; |2x/W &minus; 1|)</div>
                <div>V Rod Slope Length = Height at x / cos(Rake Angle)</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAFETY DISCLAIMER ═══ */}
        <div style={{
          marginTop: 32, padding: "16px 20px", background: t("danger"),
          border: `1px solid ${t("dangerBorder")}`, borderRadius: 8,
          fontSize: 11, color: t("dangerText"), lineHeight: 1.6,
        }}>
          <strong style={{ color: "#ef4444", fontSize: 12 }}>SAFETY NOTICE</strong><br/>
          This calculator provides estimates for planning and material ordering only. All calculations
          must be independently verified by a qualified marine engineer or naval architect before use
          in construction. Boat structural components are safety-critical — errors can result in
          catastrophic failure, sinking, and loss of life. The formulas assume a pentagon (trapezoid) transom
          geometry and do not account for compound curves, local reinforcement, hardware loads, or
          dynamic sea loads. Always consult ISO 12215 (small craft hull construction) or equivalent
          classification society standards for your vessel's scantling requirements. Weather data is
          provided by Open-Meteo and should be cross-checked with local conditions before resin work.
        </div>
      </div>
    </div>
  );
}
