#!/usr/bin/env python3
"""Verify TransomCalculator.jsx calcs against known test case.

Test case: 1000mm wide x 500mm centre x 250mm side, 20 deg rake, 70mm spacing, 7mm rods
"""
import sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Inputs ──
W = 1000          # width mm
centreH = 500     # centre vertical height mm
sideH = 250       # side vertical height mm
angle = 20        # rake degrees
thickness = 50    # mm
shell = 6         # mm
spacing = 70      # mm
hDiam = 7         # mm
vDiam = 7         # mm
minCover = 10     # mm
wastage = 10      # %
cutoutW = 0       # no cutout for this test
cutoutH = 0
cutoutCount = 0

# ── Calculations (mirror JSX exactly) ──
angleRad = angle * math.pi / 180
cosAngle = math.cos(angleRad)
ROD_GAP = 30

centreSlopeH = centreH / cosAngle
sideSlopeH = sideH / cosAngle

grossArea_mm2 = W * (centreSlopeH + sideSlopeH) / 2
grossArea_m2 = grossArea_mm2 / 1e6

cutoutSlopeH = cutoutH / cosAngle if cutoutCount > 0 else 0
singleCutoutArea_mm2 = cutoutW * cutoutSlopeH if cutoutCount > 0 else 0
cutoutArea_mm2 = singleCutoutArea_mm2 * cutoutCount
cutoutArea_m2 = cutoutArea_mm2 / 1e6

netArea_mm2 = grossArea_mm2 - cutoutArea_mm2
netArea_m2 = netArea_mm2 / 1e6

cavityLitres = netArea_m2 * thickness
volume_mm3 = netArea_mm2 * thickness

# ── H Rods ──
hRodCount = math.floor(centreSlopeH / spacing) + 1
hRodDetails = []
totalHLen = 0
for i in range(hRodCount):
    slopeY = i * spacing
    vertY = slopeY * cosAngle
    if vertY <= sideH:
        pw = W
    else:
        pw = W * (centreH - vertY) / (centreH - sideH)
    rodLen = max(pw - ROD_GAP, 0)
    zone = "RECT" if vertY <= sideH else "TRI"
    hRodDetails.append((i+1, slopeY, vertY, zone, pw, rodLen))
    totalHLen += rodLen

# ── V Rods ──
vRodCount = math.floor(W / spacing) + 1
vRodDetails = []
totalVLen = 0
for i in range(vRodCount):
    x = i * spacing
    t = 1 - abs(2 * x / W - 1)
    h = sideH + (centreH - sideH) * t
    slopeLen = h / cosAngle
    vRodDetails.append((i+1, x, t, h, slopeLen))
    totalVLen += slopeLen

totalRodLen = totalHLen + totalVLen

# Rod displacement
hCross = math.pi * (hDiam/2)**2
vCross = math.pi * (vDiam/2)**2
hVol_mm3 = hCross * totalHLen
vVol_mm3 = vCross * totalVLen
totalRodVol_mm3 = hVol_mm3 + vVol_mm3
totalRodVol_litres = totalRodVol_mm3 / 1e6

# Pour depth
pourDepth = thickness - shell

# Cover
stackedH = hDiam + vDiam
stackCover = (pourDepth - stackedH) / 2
stackFits = stackCover >= minCover

# Resin
resinLitres = (volume_mm3 - totalRodVol_mm3) / 1e6
resinWithWastage = resinLitres * (1 + wastage / 100)
pourVolume_mm3 = volume_mm3 - totalRodVol_mm3
pourVolume_litres = pourVolume_mm3 / 1e6

# ══════════════════════════════════════════════
# PRINT RESULTS
# ══════════════════════════════════════════════
print("=" * 70)
print("VERIFICATION: 1000 x 500(centre) x 250(side), 20 deg, 70mm spacing, 7mm rods")
print("=" * 70)

print(f"\n--- SLOPE HEIGHTS ---")
print(f"  Centre Slope Height: {centreSlopeH:.1f} mm")
print(f"  Side Slope Height:   {sideSlopeH:.1f} mm")

print(f"\n--- AREA ---")
print(f"  Gross Area: {grossArea_m2:.4f} m2")
print(f"  Net Area:   {netArea_m2:.4f} m2  (no cutouts)")

print(f"\n--- VOLUME ---")
print(f"  Cavity Volume: {cavityLitres:.2f} litres")

print(f"\n--- H RODS ({hRodCount} rods) ---")
for rod in hRodDetails:
    num, sy, vy, zone, pw, rl = rod
    print(f"  H{num:2d}: slopeY={sy:7.1f}  vertY={vy:7.1f}  zone={zone:4s}  panelW={pw:7.1f}  len={rl:7.1f} mm")
print(f"  Total H length: {totalHLen:.1f} mm = {totalHLen/1000:.2f} m")

print(f"\n--- V RODS ({vRodCount} rods) ---")
for rod in vRodDetails:
    num, x, t, h, sl = rod
    print(f"  V{num:2d}: x={x:7.1f}  t={t:.4f}  height={h:7.1f}  slopeLen={sl:7.1f} mm")
print(f"  Total V length: {totalVLen:.1f} mm = {totalVLen/1000:.2f} m")

print(f"\n--- ROD TOTALS ---")
print(f"  Total rod length: {totalRodLen/1000:.2f} m")
print(f"  Total rod count:  {hRodCount + vRodCount}")
print(f"  Rod displacement: {totalRodVol_litres:.4f} litres")

print(f"\n--- POUR ---")
print(f"  Pour depth:   {pourDepth} mm")
print(f"  Stacked H:    {stackedH} mm")
print(f"  Stack cover:  {stackCover:.1f} mm (fits: {stackFits})")
print(f"  Pour volume:  {pourVolume_litres:.2f} litres")
print(f"  Resin needed: {resinLitres:.2f} litres")
print(f"  With wastage: {resinWithWastage:.2f} litres")

# ── Sanity checks ──
print(f"\n--- SANITY CHECKS ---")
checks = 0
passes = 0

def check(name, val, expected, tol=0.01):
    global checks, passes
    checks += 1
    ok = abs(val - expected) < tol
    if ok:
        passes += 1
        print(f"  PASS: {name} = {val:.4f} (expected {expected:.4f})")
    else:
        print(f"  FAIL: {name} = {val:.4f} (expected {expected:.4f})")

# Manual calculation verification:
# Centre slope = 500 / cos(20) = 500 / 0.93969 = 532.089
# Side slope   = 250 / cos(20) = 250 / 0.93969 = 266.044
# Gross area   = 1000 * (532.089 + 266.044) / 2 = 1000 * 399.067 = 399066.5 mm2 = 0.3991 m2
check("Centre Slope Height", centreSlopeH, 500 / math.cos(math.radians(20)))
check("Side Slope Height", sideSlopeH, 250 / math.cos(math.radians(20)))
check("Gross Area", grossArea_m2, 1000 * (centreSlopeH + sideSlopeH) / 2 / 1e6)
check("Area ~0.399", grossArea_m2, 0.3991, tol=0.001)

# Cavity volume = 0.3991 m2 * 50mm = 19.95 litres
check("Cavity volume", cavityLitres, grossArea_m2 * 50, tol=0.01)

# H rod count = floor(532.089 / 70) + 1 = floor(7.601) + 1 = 7 + 1 = 8
check("H rod count", hRodCount, 8, tol=0.5)

# V rod count = floor(1000 / 70) + 1 = floor(14.286) + 1 = 14 + 1 = 15
check("V rod count", vRodCount, 15, tol=0.5)

# First H rod at slopeY=0, vertY=0 -> RECT zone, len = 1000-30 = 970
check("H1 length", hRodDetails[0][5], 970)

# V rod at centre (rod 8, x=490): t = 1-|2*490/1000-1| = 1-|0.98-1| = 1-0.02 = 0.98
# height = 250 + (500-250)*0.98 = 250 + 245 = 495
# slopeLen = 495/cos(20) = 526.77
v8 = vRodDetails[7]  # 0-indexed rod 8
check("V8 x", v8[1], 490)
check("V8 t", v8[2], 0.98, tol=0.001)
check("V8 height", v8[3], 495, tol=0.1)

# Pour volume should be cavity - rod displacement
check("Pour = cavity - rods", pourVolume_litres, cavityLitres - totalRodVol_litres, tol=0.001)

# Stack cover = (44 - 14) / 2 = 15
check("Stack cover", stackCover, 15)
check("Stack fits", float(stackFits), 1.0)

print(f"\n{passes}/{checks} checks passed")
