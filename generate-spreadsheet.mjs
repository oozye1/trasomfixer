import XLSX from "xlsx";

// ═══════════════════════════════════════════
// TitanPour — Transom Engineering Spreadsheet
// ═══════════════════════════════════════════

const wb = XLSX.utils.book_new();

// ── Helper: style-aware cell ──
function n(v, fmt) { return { v, t: "n", z: fmt || "0.00" }; }
function s(v) { return { v, t: "s" }; }
function f(formula) { return { f: formula }; }

// ══════════════════════════════════════
// SHEET 1: ROD GRID CALCULATOR
// ══════════════════════════════════════

const rodData = [
  // Title
  ["TitanPour — Rod Grid Calculator"],
  [""],
  // Inputs section
  ["ROD GRID PARAMETERS", "", "", "", "RESULTS"],
  [""],
  ["Input", "Value", "Unit", "", "Output", "Formula", "Value", "Unit"],
  ["Rod spacing (H & V)", 70, "mm", "", "Slope height", '=B11/COS(RADIANS(B13))', "", "mm"],
  ["Horizontal rod diameter", 6, "mm", "", "Horizontal rods", '=FLOOR(G5/B5,1)+1', "", "rods"],
  ["Vertical rod diameter", 6, "mm", "", "Vertical rods", '=FLOOR(B10/B5,1)+1', "", "rods"],
  ["Outer shell thickness", 6, "mm", "", "H rod length (each)", '=B10', "", "mm"],
  ["Transom width", 1800, "mm", "", "V rod length (on slope)", '=G5', "", "mm"],
  ["Transom height (vertical)", 508, "mm", "", "Total H rod length", '=G7*G9/1000', "", "m"],
  ["Thickness (total)", 50, "mm", "", "Total V rod length", '=G8*G10/1000', "", "m"],
  ["Rake angle", 20, "°", "", "TOTAL ROD LENGTH", '=G11+G12', "", "metres"],
  ["Min resin cover", 10, "mm", "", "Total rod count", '=G7+G8', "", "rods"],
  [""],
  // Cover & fit check
  ["COVER & FIT CHECK"],
  [""],
  ["", "Value", "Unit", "", "Status"],
  ["Pour depth (thickness - shell)", '=B12-B8', "mm"],
  [""],
  ["Horizontal ø cover", '=(B19-B6)/2', "mm", "", '=IF(B21>=B14,"OK","TOO TIGHT")'],
  ["Vertical ø cover", '=(B19-B7)/2', "mm", "", '=IF(B22>=B14,"OK","TOO TIGHT")'],
  ["Stacked height (H+V)", '=B6+B7', "mm"],
  ["Cover at crossing", '=(B19-B23)/2', "mm", "", '=IF(B24>=B14,"FITS","WON\'T FIT")'],
  ["Min thickness needed", '=B23+B14*2+B8', "mm", "", "(including shell)"],
  [""],
  // Rod displacement
  ["ROD DISPLACEMENT"],
  [""],
  ["H rod cross-section area", '=PI()*(B6/2)^2', "mm²"],
  ["V rod cross-section area", '=PI()*(B7/2)^2', "mm²"],
  ["H rod total volume", '=B29*G7*G9', "mm³"],
  ["V rod total volume", '=B30*G8*G10', "mm³"],
  ["Total rod volume", '=(B31+B32)/1000000', "litres"],
];

const ws1 = XLSX.utils.aoa_to_sheet(rodData);

// Column widths
ws1["!cols"] = [
  { wch: 28 }, // A
  { wch: 14 }, // B
  { wch: 8 },  // C
  { wch: 3 },  // D
  { wch: 24 }, // E
  { wch: 28 }, // F - formula
  { wch: 14 }, // G
  { wch: 8 },  // H
];

// Set the formula cells in G column to calculate from the formulas
// G5 = slope height
ws1["G5"] = { f: "B11/COS(RADIANS(B13))" };
ws1["G6"] = { f: "G5" }; // display slope height value
ws1["G7"] = { f: "FLOOR(G5/B5,1)+1" };
ws1["G8"] = { f: "FLOOR(B10/B5,1)+1" };
ws1["G9"] = { f: "B10" };
ws1["G10"] = { f: "G5" };
ws1["G11"] = { f: "G7*G9/1000" };
ws1["G12"] = { f: "G8*G10/1000" };
ws1["G13"] = { f: "G11+G12" };
ws1["G14"] = { f: "G7+G8" };

XLSX.utils.book_append_sheet(wb, ws1, "Rod Grid");

// ══════════════════════════════════════
// SHEET 2: AREA & WEIGHT
// ══════════════════════════════════════

const areaData = [
  ["TitanPour — Area & Weight Calculator"],
  [""],
  ["TRANSOM DIMENSIONS"],
  [""],
  ["Input", "Value", "Unit"],
  ["Width (beam at transom)", 1800, "mm"],
  ["Height (vertical)", 508, "mm"],
  ["Rake / Slope angle", 20, "°"],
  ["Total thickness", 50, "mm"],
  ["Outer shell", 6, "mm"],
  ["Material density", 1550, "kg/m³", "", "TitanPour Resin System"],
  ["Wastage allowance", 10, "%"],
  [""],
  ["ENGINE CUTOUT"],
  [""],
  ["Cutout width (each)", 660, "mm"],
  ["Cutout height (face-on)", 380, "mm"],
  ["Number of cutouts", 1, ""],
  [""],
  ["CALCULATED RESULTS", "", "", "", "Formula"],
  [""],
  ["Slope height", '=B7/COS(RADIANS(B8))', "mm", "", "= height / cos(angle)"],
  ["Cutout slope height", '=B17/COS(RADIANS(B8))', "mm", "", "= cutout height / cos(angle)"],
  [""],
  ["Gross panel area", '=B6*B22/1000000', "m²", "", "= width × slope height"],
  ["Single cutout area", '=B16*B23/1000000', "m²", "", "= cutout width × cutout slope height"],
  ["Total cutout area", '=B26*B18', "m²", "", "= single cutout × count"],
  ["Net panel area", '=B25-B27', "m²", "", "= gross - cutouts"],
  [""],
  ["Panel volume (cavity)", '=B28*B9/1000', "litres", "", "= net area × thickness (in litres)"],
  ["Pour depth", '=B9-B10', "mm", "", "= thickness - shell"],
  [""],
  ["Rod displacement", "", "litres", "", "(from Rod Grid sheet)"],
  ["Pour volume (minus rods)", '=B30-B33', "litres", "", "= cavity - rod displacement"],
  ["Pour + wastage", '=B34*(1+B12/100)', "litres", "", "= pour × (1 + wastage%)"],
  [""],
  ["Finished weight", '=B30/1000*B11', "kg", "", "= volume(m³) × density"],
  ["GSM (surface weight)", '=B9/1000*B11*1000', "g/m²", "", "= thickness(m) × density × 1000"],
];

const ws2 = XLSX.utils.aoa_to_sheet(areaData);
ws2["!cols"] = [
  { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 3 }, { wch: 36 },
];

XLSX.utils.book_append_sheet(wb, ws2, "Area & Weight");

// ══════════════════════════════════════
// SHEET 3: MIX CALCULATOR
// ══════════════════════════════════════

const mixData = [
  ["TitanPour — Mix Calculator"],
  [""],
  ["BATCH SIZE"],
  [""],
  ["Input", "Value", "Unit"],
  ["Total batch weight", 1000, "kg"],
  ["Ambient temperature", 20, "°C", "", "(enter current temp or use weather data)"],
  [""],
  ["MIX BREAKDOWN"],
  [""],
  ["Component", "Fraction", "Mass (kg)", "", "Notes"],
  ["Resin (reactive)", "58%", '=B6*0.58', "", "Crystic VE671-03 — the only reactive component"],
  ["Talc filler", "30%", '=B6*0.30', "", "Inert — heat sink, does not react"],
  ["Glass fibre", "10%", '=B6*0.10', "", "Inert — structural reinforcement"],
  ["Catalyst + retarder", "~2%", '=B6*0.02', "", "Trigonox 239 + gel retarder"],
  [""],
  ["CATALYST — TRIGONOX 239"],
  [""],
  ["", "% of Resin", "% of Mix", "kg to Weigh", "Temp Range"],
  ["Level 1", "1.2%", '=C12*0.012/B6*100&"%"', '=C12*0.012', "> 26°C (hot)"],
  ["Level 2", "1.5%", '=C12*0.015/B6*100&"%"', '=C12*0.015', "18–26°C (normal)"],
  ["Level 3", "2.0%", '=C12*0.020/B6*100&"%"', '=C12*0.020', "< 18°C (cold)"],
  [""],
  ["Recommended", '=IF(B7>26,"1.2%",IF(B7>=18,"1.5%","2.0%"))', "", '=IF(B7>26,D20,IF(B7>=18,D21,D22))'],
  [""],
  ["RETARDER"],
  [""],
  ["Dose (0.025% of resin)", '=C12*0.00025', "kg"],
  ["In grams", '=B28*1000', "grams"],
  [""],
  ["THE FORMULA"],
  [""],
  ["Step 1:", "Batch weight × 0.58 = resin mass", "", '=B6&" × 0.58 = "&TEXT(C12,"0.0")&" kg"'],
  ["Step 2:", "Resin mass × catalyst % = catalyst", "", '=TEXT(C12,"0.0")&" × "&B24&" = "&TEXT(D24,"0.00")&" kg"'],
  ["Step 3:", "Resin mass × 0.00025 = retarder", "", '=TEXT(C12,"0.0")&" × 0.00025 = "&TEXT(B28*1000,"0")&" grams"'],
  [""],
  ["⚠ CRITICAL WARNING"],
  ["Catalyst % applies to RESIN FRACTION ONLY (58% of batch), NEVER the total batch weight."],
  [""],
  ["Wrong (full batch):", '=TEXT(B6*IF(B7>26,0.012,IF(B7>=18,0.015,0.020)),"0.00")&" kg"', "", "← DANGEROUS: nearly double the correct dose"],
  ["Correct (resin only):", '=TEXT(D24,"0.00")&" kg"', "", "← This is the right amount"],
];

const ws3 = XLSX.utils.aoa_to_sheet(mixData);
ws3["!cols"] = [
  { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 40 },
];

XLSX.utils.book_append_sheet(wb, ws3, "Mix Calculator");

// ══════════════════════════════════════
// SHEET 4: QUICK REFERENCE
// ══════════════════════════════════════

const refData = [
  ["TitanPour — Quick Reference & Formulas"],
  [""],
  ["ENGINEERING FORMULAS"],
  [""],
  ["Calculation", "Formula", "Notes"],
  ["Slope Height", "= Vertical Height / cos(Rake Angle)", "Converts face-on height to actual surface length"],
  ["Gross Area", "= Width × Slope Height", "Full panel surface area on the raked plane"],
  ["Cutout Area", "= Cutout Width × (Cutout Height / cos(Angle)) × Count", "Engine cutouts measured face-on, converted to slope"],
  ["Net Area", "= Gross Area − Cutout Area", "Material surface area"],
  ["Volume", "= Net Area × Thickness", "Thickness normal to surface"],
  ["Weight", "= Volume × Material Density", ""],
  ["Pour Volume", "= Cavity Volume − Rod Displacement", "Actual liquid to pour"],
  ["Rod Displacement", "= π × (d/2)² × total rod length", "Volume occupied by reinforcement rods"],
  ["Resin Mass", "= Batch Weight × 0.58", "Only 58% of mix is reactive resin"],
  ["Catalyst (kg)", "= Resin Mass × Catalyst %", "% applies to resin, NOT total batch"],
  ["Retarder (kg)", "= Resin Mass × 0.00025", "0.025% of resin fraction"],
  ["H Rods", "= floor(Slope Height / Spacing) + 1", "Fencepost formula"],
  ["V Rods", "= floor(Width / Spacing) + 1", ""],
  ["Pour Depth", "= Total Thickness − Shell Thickness", "Space available for the pour"],
  ["Single Rod Cover", "= (Pour Depth − Rod Diameter) / 2", "Resin either side of a single rod"],
  ["Stacked Cover", "= (Pour Depth − H Dia − V Dia) / 2", "At H/V rod crossing points"],
  [""],
  ["CATALYST QUICK LOOKUP (per 1000kg batch)"],
  [""],
  ["% of Resin", "% of Mix", "kg to Weigh", "Temp Range"],
  ["1.2%", "0.696%", 6.96, "> 26°C"],
  ["1.5%", "0.870%", 8.70, "18–26°C"],
  ["2.0%", "1.160%", 11.60, "< 18°C"],
  [""],
  ["Retarder: 0.025% of resin = 145 grams per 1000kg batch"],
  [""],
  ["MATERIAL DENSITIES"],
  [""],
  ["Material", "Density (kg/m³)"],
  ["TitanPour Resin System", 1550],
  ["FRP Hand Layup (CSM + Polyester)", 1500],
  ["FRP Spray-up", 1400],
  ["FRP Vacuum Infused (Woven + Epoxy)", 1700],
  ["Marine Plywood", 550],
  ["Coosa Board (Composite Core)", 420],
  ["Marine Aluminium (5083)", 2660],
  [""],
  ["MIX COMPOSITION"],
  [""],
  ["Component", "Fraction", "Per 1000kg"],
  ["Resin (Crystic VE671-03)", "58%", "580 kg"],
  ["Talc filler", "30%", "300 kg"],
  ["Glass fibre", "10%", "100 kg"],
  ["Catalyst + retarder", "~2%", "~20 kg"],
  [""],
  ["CURE TEMPERATURE THRESHOLDS"],
  [""],
  ["Condition", "Verdict"],
  ["≥ 18°C, dry, low humidity", "IDEAL — standard catalyst 1.5%"],
  ["15–18°C", "WORKABLE — may need 2.0% catalyst"],
  ["10–15°C", "CAUTION — slow cure, use 2.0% + winter hardener"],
  ["< 10°C", "NO-GO — incomplete cure risk without mould heating"],
  ["> 26°C", "CAUTION — reduce to 1.2%, pre-cool resin"],
  ["> 30°C", "HIGH RISK — exotherm danger, consider postponing"],
];

const ws4 = XLSX.utils.aoa_to_sheet(refData);
ws4["!cols"] = [
  { wch: 36 }, { wch: 50 }, { wch: 16 }, { wch: 16 },
];

XLSX.utils.book_append_sheet(wb, ws4, "Reference");

// ── Write file ──
const outPath = "TitanPour_Transom_Calculator.xlsx";
XLSX.writeFile(wb, outPath);
console.log(`Spreadsheet saved: ${outPath}`);
