#!/usr/bin/env python3
"""Cross-reference pour breakdown maths.

Test 1: Rectangle 1000 x 500 (sideH = centreH = 500) at 140mm pours
  - Should give simple W * bandHeight * thickness / cos(angle) per band
  - Easy to verify by hand

Test 2: Pentagon 1000 x 500(centre) x 250(side) at 140mm pours
  - Triangle zone at bottom, rectangle zone at top
"""
import sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def compute_pour_bands(W, centreH, sideH, angle_deg, thickness, maxPourH):
    angleRad = angle_deg * math.pi / 180
    cosAngle = math.cos(angleRad)
    triH = centreH - sideH  # triangle zone height (vertical)

    numPours = math.ceil(centreH / maxPourH)
    bands = []
    cumulative = 0

    for p in range(numPours):
        y1 = p * maxPourH
        y2 = min((p + 1) * maxPourH, centreH)

        # Integrate width(y) dy from y1 to y2
        vertArea_mm2 = 0

        if triH > 0:
            # Triangle zone: width = W * y / triH
            tLo = max(y1, 0)
            tHi = min(y2, triH)
            if tHi > tLo:
                vertArea_mm2 += (W / triH) * (tHi**2 - tLo**2) / 2

        # Rectangle zone: width = W
        rLo = max(y1, triH)
        rHi = y2
        if rHi > rLo:
            vertArea_mm2 += W * (rHi - rLo)

        # Volume = vertArea * thickness / cos(angle)
        bandVol_mm3 = vertArea_mm2 * thickness / cosAngle
        bandVol_litres = bandVol_mm3 / 1e6
        cumulative += bandVol_litres
        bands.append({
            'pour': p + 1,
            'y1': y1, 'y2': y2,
            'height': y2 - y1,
            'litres': bandVol_litres,
            'cumulative': cumulative,
        })

    return bands

# ══════════════════════════════════════════════
# TEST 1: RECTANGLE 1000 x 500 (sideH = centreH = 500)
# ══════════════════════════════════════════════
print("=" * 70)
print("TEST 1: RECTANGLE 1000 x 500 x 500, 20 deg, 50mm thick, 140mm pours")
print("=" * 70)

W, centreH, sideH, angle, thick, maxPour = 1000, 500, 500, 20, 50, 140
cosA = math.cos(math.radians(angle))

bands = compute_pour_bands(W, centreH, sideH, angle, thick, maxPour)

print(f"\nTriangle zone height: {centreH - sideH} mm (no triangle for rectangle)")
print(f"Number of pours: {len(bands)}")
print()

for b in bands:
    print(f"  Pour #{b['pour']}: {b['y1']:.0f}-{b['y2']:.0f}mm  "
          f"h={b['height']:.0f}mm  "
          f"vol={b['litres']:.4f} L  "
          f"cumul={b['cumulative']:.4f} L")

# Hand calculation for rectangle:
# Each full band (140mm): vol = W * 140 * thick / cos(20) / 1e6
# = 1000 * 140 * 50 / 0.93969 / 1e6
# = 7,000,000 / 0.93969 / 1e6 = 7.449 litres
expected_full = 1000 * 140 * 50 / cosA / 1e6
expected_last = 1000 * 80 * 50 / cosA / 1e6  # last band is 80mm (500 - 3*140 = 80)
total_expected = 1000 * 500 * 50 / cosA / 1e6

print(f"\n--- HAND CHECK (rectangle) ---")
print(f"  Full 140mm band: W*140*thick/cos(20)/1e6 = {expected_full:.4f} L")
print(f"  Last 80mm band:  W*80*thick/cos(20)/1e6  = {expected_last:.4f} L")
print(f"  Total expected:   W*500*thick/cos(20)/1e6 = {total_expected:.4f} L")
print(f"  Sum of bands:     {bands[-1]['cumulative']:.4f} L")
print(f"  Match: {'YES' if abs(bands[-1]['cumulative'] - total_expected) < 0.001 else 'NO'}")

# Check individual bands
errors = 0
for b in bands:
    if b['height'] == 140:
        if abs(b['litres'] - expected_full) > 0.001:
            print(f"  FAIL: Band {b['pour']} = {b['litres']:.4f}, expected {expected_full:.4f}")
            errors += 1
    else:
        if abs(b['litres'] - expected_last) > 0.001:
            print(f"  FAIL: Last band = {b['litres']:.4f}, expected {expected_last:.4f}")
            errors += 1

# Also cross-check with area formula
# For rectangle: area = W * slopeH = W * H / cos(angle)
area_m2 = W * (500 / cosA) / 1e6
cavityL = area_m2 * thick
print(f"\n  Cross-check: area = {area_m2:.4f} m2, cavity = {cavityL:.4f} L")
print(f"  Band sum matches cavity: {'YES' if abs(bands[-1]['cumulative'] - cavityL) < 0.001 else 'NO'}")

# ══════════════════════════════════════════════
# TEST 2: PENTAGON 1000 x 500(centre) x 250(side), same params
# ══════════════════════════════════════════════
print("\n" + "=" * 70)
print("TEST 2: PENTAGON 1000 x 500(centre) x 250(side), 20 deg, 50mm thick, 140mm pours")
print("=" * 70)

W, centreH, sideH, angle, thick, maxPour = 1000, 500, 250, 20, 50, 140
cosA = math.cos(math.radians(angle))
triH = centreH - sideH  # = 250mm

bands = compute_pour_bands(W, centreH, sideH, angle, thick, maxPour)

print(f"\nTriangle zone height: {triH} mm")
print(f"Number of pours: {len(bands)}")
print()

for b in bands:
    print(f"  Pour #{b['pour']}: {b['y1']:.0f}-{b['y2']:.0f}mm  "
          f"h={b['height']:.0f}mm  "
          f"vol={b['litres']:.4f} L  "
          f"cumul={b['cumulative']:.4f} L")

# Hand calculation:
# Pour 1: 0-140mm (all in triangle zone)
#   vertArea = W/triH * (140^2 - 0^2) / 2 = 1000/250 * 19600/2 = 4 * 9800 = 39200 mm2
#   vol = 39200 * 50 / cos(20) / 1e6 = 1960000 / 0.93969 / 1e6 = 2.0859 L
pour1_area = (W / triH) * (140**2) / 2
pour1_vol = pour1_area * thick / cosA / 1e6

# Pour 2: 140-250mm (triangle) + 250-280mm (rectangle)
#   tri part: W/triH * (250^2 - 140^2) / 2 = 4 * (62500-19600)/2 = 4 * 21450 = 85800 mm2
#   rect part: W * (280 - 250) = 1000 * 30 = 30000 mm2
#   total vertArea = 115800 mm2
#   vol = 115800 * 50 / cos(20) / 1e6 = 6.1612 L
pour2_tri = (W / triH) * (250**2 - 140**2) / 2
pour2_rect = W * (280 - 250)
pour2_area = pour2_tri + pour2_rect
pour2_vol = pour2_area * thick / cosA / 1e6

# Pour 3: 280-420mm (all rectangle)
#   vertArea = W * 140 = 140000 mm2
#   vol = 140000 * 50 / cos(20) / 1e6 = 7.4497 L
pour3_area = W * 140
pour3_vol = pour3_area * thick / cosA / 1e6

# Pour 4: 420-500mm (all rectangle)
#   vertArea = W * 80 = 80000 mm2
#   vol = 80000 * 50 / cos(20) / 1e6 = 4.2570 L
pour4_area = W * 80
pour4_vol = pour4_area * thick / cosA / 1e6

print(f"\n--- HAND CHECK (pentagon) ---")
print(f"  Pour 1 (0-140, triangle):      vertArea={pour1_area:.0f} mm2, vol={pour1_vol:.4f} L")
print(f"  Pour 2 (140-280, tri+rect):     vertArea={pour2_area:.0f} mm2, vol={pour2_vol:.4f} L")
print(f"  Pour 3 (280-420, rectangle):    vertArea={pour3_area:.0f} mm2, vol={pour3_vol:.4f} L")
print(f"  Pour 4 (420-500, rectangle):    vertArea={pour4_area:.0f} mm2, vol={pour4_vol:.4f} L")
hand_total = pour1_vol + pour2_vol + pour3_vol + pour4_vol
print(f"  Hand total: {hand_total:.4f} L")
print(f"  Band total: {bands[-1]['cumulative']:.4f} L")
print(f"  Match: {'YES' if abs(bands[-1]['cumulative'] - hand_total) < 0.001 else 'NO'}")

# Cross-check with pentagon area formula
centreSlopeH = centreH / cosA
sideSlopeH = sideH / cosA
area_m2 = W * (centreSlopeH + sideSlopeH) / 2 / 1e6
cavityL = area_m2 * thick
print(f"\n  Pentagon area = {area_m2:.4f} m2, cavity = {cavityL:.4f} L")
print(f"  Band sum matches cavity: {'YES' if abs(bands[-1]['cumulative'] - cavityL) < 0.001 else 'NO'}")

# Check each band matches hand calc
print(f"\n--- PER-BAND MATCH ---")
hand = [pour1_vol, pour2_vol, pour3_vol, pour4_vol]
all_ok = True
for i, b in enumerate(bands):
    ok = abs(b['litres'] - hand[i]) < 0.001
    status = "PASS" if ok else "FAIL"
    print(f"  {status}: Pour {b['pour']}: calc={b['litres']:.4f} L, hand={hand[i]:.4f} L")
    if not ok: all_ok = False

print(f"\nAll checks: {'PASS' if all_ok and errors == 0 else 'FAIL'}")
