# DroneLappen feed-kreativ 1080x1080 — «Instrumentpanel»-filosofien
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

W = H = 1080
SS = 3  # supersample for crisp lines
w, h = W*SS, H*SS

import sys, os

# ---- Parametere ------------------------------------------------------------
# Prislinjen er BEVISST parameterisert og prisnøytral som standard.
# Lærdom 24.07.2026: den opprinnelige kreativen hadde «249 kr én gang» brent
# inn i bildet. Da prisen ble varslet økt til 349 kr fra 15.08.2026, betydde
# det at den annonsen som tok 73 % av Meta-forbruket ville reklamert med feil
# pris fra den datoen — og feil pris i en annonse er villedende markedsføring
# (mfl. § 7). Regelen videre: ALDRI brenn et kronebeløp inn i et annonsebilde.
# Prisen hører hjemme i annonseteksten, som kan endres via API på sekunder.
PRISLINJE = sys.argv[1] if len(sys.argv) > 1 else "DroneLappen: 12 mnd øving, under halve prisen"
UT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "feed-1080-instrumentpanel.png")

# Fonter fra canvas-design-skillen. Sett DL_FONTS hvis skillen ligger et annet sted.
F = os.environ.get("DL_FONTS", os.path.expanduser("~/.claude/skills/canvas-design/canvas-fonts/"))
if not os.path.isdir(F):
    raise SystemExit(f"Fant ikke fontmappa: {F}\nSett DL_FONTS til canvas-design/canvas-fonts/")
def font(name, size): return ImageFont.truetype(F+name, int(size*SS))

NAVY_D=(10,22,40); NAVY=(8,53,84); GOLD=(232,159,30); CREAM=(244,232,202)
WHITE=(250,251,252); SLATE=(143,163,184); DIM=(94,114,138)

img = Image.new("RGB",(w,h), NAVY_D)
d = ImageDraw.Draw(img)

# ── Bakgrunn: vertikal gradient natt → horisont
top=NAVY_D; bot=(11,38,61)
for y in range(h):
    t=y/h
    d.line([(0,y),(w,y)], fill=tuple(int(top[i]+(bot[i]-top[i])*t) for i in range(3)))

# ── Radar/propell-motiv øverst til høyre (svakt gull)
cx, cy, R = int(w*0.865), int(h*0.135), int(w*0.30)
ov = Image.new("RGBA",(w,h),(0,0,0,0)); od = ImageDraw.Draw(ov)
for r,alpha,width in [(R,46,2),(int(R*0.72),36,2),(int(R*0.45),30,2),(int(R*0.18),40,2)]:
    od.ellipse([cx-r,cy-r,cx+r,cy+r], outline=(232,159,30,alpha), width=width*SS)
# fire propellblad (ellipser rotert)
for ang in [18,108,198,288]:
    blade = Image.new("RGBA",(w,h),(0,0,0,0)); bd=ImageDraw.Draw(blade)
    bl=int(R*0.62); bw=int(R*0.14)
    bd.ellipse([cx-bl,cy-bw,cx,cy+bw], fill=(232,159,30,26), outline=(232,159,30,60), width=2*SS)
    blade=blade.rotate(ang, center=(cx,cy), resample=Image.BICUBIC)
    ov.alpha_composite(blade)
od.ellipse([cx-9*SS,cy-9*SS,cx+9*SS,cy+9*SS], fill=(232,159,30,150))
# siktekors gjennom senter
od.line([(cx-R,cy),(cx+R,cy)], fill=(232,159,30,28), width=1*SS)
od.line([(cx,cy-R),(cx,cy+R)], fill=(232,159,30,28), width=1*SS)
img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
d = ImageDraw.Draw(img)

M = int(80*SS/SS)*SS  # 80px marg
def track(dr, xy, text, f, fill, tracking):
    x,y=xy
    for ch in text:
        dr.text((x,y), ch, font=f, fill=fill)
        x += dr.textlength(ch, font=f) + tracking*SS
    return x

# ── Topp: mono-etikett
f_lab = font("GeistMono-Regular.ttf", 25)
track(d,(M,int(84*SS)), "DRONEEKSAMEN · A1/A3 + A2", f_lab, GOLD, 6)

# ── Overskrift
# ── Overskrift (målt inn: krymp til den passer innenfor margene)
def fit(text, fname, start, maxw):
    s = start
    while s > 40:
        f = font(fname, s)
        if d.textlength(text, font=f) <= maxw: return f, s
        s -= 2
    return font(fname, 40), 40
maxw = w - 2*M
f_h1a, s1 = fit("Bestå droneeksamen", "InstrumentSans-Bold.ttf", 108, maxw)
d.text((M,int(150*SS)), "Bestå droneeksamen", font=f_h1a, fill=WHITE)
y2 = int(150*SS) + int(s1*1.12*SS)
d.text((M,y2), "på første forsøk.", font=f_h1a, fill=GOLD)

# serif italic signatur
f_sig = font("InstrumentSerif-Italic.ttf", 40)
d.text((M,int(404*SS)), "Bli en bedre dronepilot", font=f_sig, fill=SLATE)

# ── Statlinje (instrumentavlesninger)
sy = int(505*SS)
f_num = font("GeistMono-Bold.ttf", 52); f_sub = font("GeistMono-Regular.ttf", 21)
stats = [("241","norske spørsmål"),("40/30","offisielt format"),("25","gratis å prøve")]
sx = M
for i,(num,sub) in enumerate(stats):
    d.text((sx,sy), num, font=f_num, fill=WHITE)
    d.text((sx,sy+int(62*SS)), sub.upper(), font=f_sub, fill=DIM)
    nw = max(d.textlength(num,font=f_num), d.textlength(sub.upper(),font=f_sub))
    sx += nw + int(58*SS)
    if i<2:
        d.line([(sx,sy+int(8*SS)),(sx,sy+int(82*SS))], fill=(255,255,255,30), width=1*SS)
        sx += int(58*SS)

# ── Pris-anker-kort (hvitt kort, gull venstrekant, siktekors i hjørnene)
ky0,ky1 = int(650*SS), int(852*SS)
kx0,kx1 = M, w-M
d.rounded_rectangle([kx0,ky0,kx1,ky1], radius=int(14*SS), fill=WHITE)
d.rectangle([kx0,ky0+int(14*SS),kx0+int(6*SS),ky1-int(14*SS)], fill=GOLD)
# siktekors-hjørner
chl=int(16*SS); co=int(10*SS)
for (px,py,dx,dy) in [(kx0-co,ky0-co,1,1),(kx1+co,ky0-co,-1,1),(kx0-co,ky1+co,1,-1),(kx1+co,ky1+co,-1,-1)]:
    d.line([(px,py),(px+chl*dx,py)], fill=GOLD, width=2*SS)
    d.line([(px,py),(px,py+chl*dy)], fill=GOLD, width=2*SS)
f_klab = font("GeistMono-Regular.ttf", 20)
f_kbig = font("InstrumentSans-Bold.ttf", 46)
f_kmed = font("InstrumentSans-Regular.ttf", 46)
pad = int(44*SS)
track(d,(kx0+pad,ky0+int(30*SS)), "REGN PÅ DET:", f_klab, (122,79,5), 5)
d.text((kx0+pad,ky0+int(66*SS)), "A2-eksamen: 970 kr per forsøk", font=f_kmed, fill=(61,79,99))
# Autokrymp: prisnøytrale formuleringer er lengre enn «249 kr én gang»
_maxw = (kx1 - kx0) - 2*pad
_sz = 46
while _sz > 26:
    f_kbig = font("InstrumentSans-Bold.ttf", _sz)
    if d.textlength(PRISLINJE, font=f_kbig) <= _maxw:
        break
    _sz -= 2
d.text((kx0+pad,ky0+int(124*SS)), PRISLINJE, font=f_kbig, fill=NAVY)

# ── CTA-pille + wordmark bunn
by = int(936*SS)
f_cta = font("InstrumentSans-Bold.ttf", 38)
cta = "Prøv 25 spørsmål gratis  →"
ctw = d.textlength(cta, font=f_cta)
pw, ph = ctw+int(76*SS), int(84*SS)
d.rounded_rectangle([M,by,M+pw,by+ph], radius=int(12*SS), fill=GOLD)
d.text((M+int(38*SS),by+int(18*SS)), cta, font=f_cta, fill=NAVY_D)
# wordmark høyre
f_wm  = font("InstrumentSans-Bold.ttf", 40)
f_app = font("GeistMono-Regular.ttf", 30)
wm="DroneLappen"; app=".app"
wmw=d.textlength(wm,font=f_wm); appw=d.textlength(app,font=f_app)
d.text((w-M-wmw-appw-int(6*SS), by+int(20*SS)), wm, font=f_wm, fill=WHITE)
d.text((w-M-appw, by+int(30*SS)), app, font=f_app, fill=GOLD)

img = img.resize((W,H), Image.LANCZOS)
img.save(UT)
print("skrev", UT, "—", PRISLINJE)
