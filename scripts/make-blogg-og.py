#!/usr/bin/env python3
"""Generer brandet og:image (1200x630) for bloggartikler.
Bruk: python3 make-blogg-og.py "Tittel her" slug-navn
Skriver content/blogg/assets/<slug>.png. Krever Pillow + Barlow TTF
(sti via env BARLOW_DIR, default /tmp/fonts)."""
import os, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

NAVY = (10, 22, 40)        # --da-navy-dark
NAVY_MID = (8, 53, 84)     # --da-navy
GOLD = (232, 159, 30)      # --da-gold
CREAM = (244, 232, 202)
WHITE = (255, 255, 255)
MUTED = (156, 174, 192)

title, slug = sys.argv[1], sys.argv[2]
fontdir = Path(os.environ.get("BARLOW_DIR", "/tmp/fonts"))
bold = lambda s: ImageFont.truetype(str(fontdir / "Barlow-Bold.ttf"), s)
med = lambda s: ImageFont.truetype(str(fontdir / "Barlow-Medium.ttf"), s)

img = Image.new("RGB", (1200, 630), NAVY)
d = ImageDraw.Draw(img)

# Diagonal navy-mid felt nederst til høyre for dybde
d.polygon([(1200, 630), (1200, 230), (640, 630)], fill=NAVY_MID)
# Gull aksent-stripe venstre
d.rectangle([0, 0, 14, 630], fill=GOLD)

# Wordmark
d.text((70, 60), "Drone", font=bold(46), fill=WHITE)
w = d.textlength("Drone", font=bold(46))
d.text((70 + w, 60), "Lappen", font=bold(46), fill=GOLD)
d.text((70, 118), "BLOGG", font=med(26), fill=MUTED)

# Tittel, wrappet
size = 72
while size >= 48:
    f = bold(size)
    words, lines, cur = title.split(), [], ""
    for word in words:
        t = (cur + " " + word).strip()
        if d.textlength(t, font=f) <= 1040:
            cur = t
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    if len(lines) <= 3:
        break
    size -= 6
y = 230
for line in lines:
    d.text((70, y), line, font=f, fill=CREAM)
    y += int(size * 1.22)

# Bunnlinje
d.text((70, 540), "dronelappen.app", font=med(32), fill=GOLD)
d.text((70 + d.textlength("dronelappen.app", font=med(32)) + 24, 544),
       "· Gratis øving til droneeksamen", font=med(28), fill=MUTED)

out = Path(__file__).parent.parent / "content" / "blogg" / "assets" / f"{slug}.png"
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, "PNG", optimize=True)
print(f"Skrev {out} ({out.stat().st_size // 1024} kB)")
