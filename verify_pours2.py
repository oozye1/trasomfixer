"""Verify pour breakdown with cutout subtraction."""
import math

def verify(label, W, centreH, sideH, thickness, angle, maxPour, cutoutW=0, cutoutH=0, cutoutCount=1):
    cosA = math.cos(math.radians(angle))
    triH = centreH - sideH

    # Cavity volume (same formula as app)
    centreSlopeH = centreH / cosA
    sideSlopeH = sideH / cosA
    grossArea = W * (centreSlopeH + sideSlopeH) / 2
    cutoutSlopeH = cutoutH / cosA if cutoutW > 0 else 0
    cutoutArea = cutoutW * cutoutSlopeH * cutoutCount
    netArea = grossArea - cutoutArea
    cavityLitres = netArea / 1e6 * thickness

    # Pour bands (matching fixed app logic)
    cutoutYStart = centreH - cutoutH if cutoutW > 0 else centreH
    numPours = math.ceil(centreH / maxPour)
    bands = []
    cumVol = 0
    for p in range(numPours):
        y1 = p * maxPour
        y2 = min((p + 1) * maxPour, centreH)
        vertArea = 0
        # Triangle zone
        if triH > 0:
            tLo = max(y1, 0)
            tHi = min(y2, triH)
            if tHi > tLo:
                vertArea += (W / triH) * (tHi**2 - tLo**2) / 2
        # Rectangle zone
        rLo = max(y1, triH)
        rHi = y2
        if rHi > rLo:
            vertArea += W * (rHi - rLo)
        # Subtract cutout
        if cutoutW > 0:
            cLo = max(y1, cutoutYStart)
            cHi = min(y2, centreH)
            if cHi > cLo:
                vertArea -= cutoutW * (cHi - cLo) * cutoutCount
        vol = vertArea * thickness / cosA / 1e6
        cumVol += vol
        bands.append((p + 1, y1, y2, vol, cumVol))

    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  W={W} centreH={centreH} sideH={sideH} thick={thickness} angle={angle}")
    print(f"  cutout: {cutoutW}x{cutoutH} x{cutoutCount}")
    print(f"{'='*60}")
    print(f"  Cavity volume: {cavityLitres:.2f} L")
    print(f"  Pour bands:")
    for pour, y1, y2, vol, cum in bands:
        print(f"    #{pour}: {y1:.0f}-{y2:.0f}mm  {vol:.2f} L  (cum: {cum:.2f} L)")
    print(f"  Band total: {cumVol:.2f} L")
    diff = abs(cumVol - cavityLitres)
    print(f"  Difference from cavity: {diff:.6f} L")
    ok = diff < 0.01
    print(f"  MATCH: {'YES' if ok else 'NO'}")
    return ok

results = []

# Test 1: Rectangle (no triangle, no cutout)
results.append(verify("Rectangle 1000x500, no cutout", 1000, 500, 500, 50, 20, 140))

# Test 2: Pentagon, no cutout
results.append(verify("Pentagon 1000x500x250, no cutout", 1000, 500, 250, 50, 20, 140))

# Test 3: Pentagon with cutout
results.append(verify("Pentagon 1000x500x250, cutout 300x150", 1000, 500, 250, 50, 20, 140, 300, 150, 1))

# Test 4: Pentagon with large cutout
results.append(verify("Pentagon 1800x508x350, cutout 400x200", 1800, 508, 350, 50, 20, 140, 400, 200, 1))

# Test 5: Pentagon with 2 cutouts
results.append(verify("Pentagon 1800x508x350, 2x cutout 200x150", 1800, 508, 350, 50, 20, 140, 200, 150, 2))

print(f"\n{'='*60}")
print(f"  ALL PASSED: {all(results)}")
print(f"{'='*60}")
