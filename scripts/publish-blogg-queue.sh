#!/bin/bash
# publish-blogg-queue.sh - publiserer bloggutkast fra content/blogg-drafts/
# naar frontmatter-datoen er naadd. Kjoeres av cron daglig 09:00.
# Satt opp 24.08.2026 etter Frodes klarsignar (front-lastet droppplan).
#
# 16.10.2026 (Frodes ja): heartbeat til logs/scheduled-heartbeat.log med
# taggen "dronelappen-blogg", slik at Mission Control viser koestatus.
#   - tom koe OG siste post eldre enn GRENSE_DAGER  -> FAIL paa brettet
#   - skriptet feiler (build, git push osv.)         -> FAIL paa brettet
#   - ingen kjoering paa 28 t                         -> late paa brettet
# Bakgrunn: koeen sto tom i 38 dager (siste post 08.09.2026) uten at noe sa fra.
set -Eeuo pipefail
# 26/8-fix: cron har minimal PATH (PIL/node ikke funnet 26/8 09:00) - sett eksplisitt
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$(dirname "$0")/.."
LOG="$HOME/Projects/MacMiniHub/logs/dronelappen-blogg-queue.log"
HB="$HOME/Projects/MacMiniHub/logs/scheduled-heartbeat.log"
TAG="dronelappen-blogg"
GRENSE_DAGER=7
heartbeat() { echo "$(date '+%Y-%m-%d %H:%M') $TAG $1" >> "$HB"; }
trap 'heartbeat "FAIL - skriptet feilet paa linje $LINENO (se logs/dronelappen-blogg-queue.log)"' ERR
TODAY=$(date +%Y-%m-%d)
export BARLOW_DIR="$PWD/scripts/fonts"
shopt -s nullglob
published=0
slugs=""
for f in content/blogg-drafts/*.md; do
  d=$(grep -m1 '^date:' "$f" | awk '{print $2}' || true)
  [ -z "$d" ] && continue
  if [[ ! "$d" > "$TODAY" ]]; then
    slug=$(basename "$f" .md)
    title=$(grep -m1 '^title:' "$f" | sed 's/^title: //')
    mv "$f" "content/blogg/$slug.md"
    /opt/homebrew/bin/python3 scripts/make-blogg-og.py "$title" "$slug" >> "$LOG" 2>&1 || true
    published=1
    slugs="$slugs $slug"
    echo "$(date '+%F %T') publiserer: $slug ($d)" >> "$LOG"
  fi
done
if [ "$published" = 1 ]; then
  node scripts/build-blogg.mjs >> "$LOG" 2>&1
  git add -A && git commit -m "Blogg: auto-publisering fra koe ($TODAY)" --quiet
  git push origin main >> "$LOG" 2>&1
  echo "$(date '+%F %T') deploy pushet" >> "$LOG"
else
  echo "$(date '+%F %T') ingen i koe for $TODAY" >> "$LOG"
fi

# ---- Koestatus til Mission Control ----
queued=(content/blogg-drafts/*.md)
n=${#queued[@]}
last=$(grep -h -m1 '^date:' content/blogg/*.md | awk '{print $2}' | sort | tail -1)
age=$(( ( $(date +%s) - $(date -j -f '%Y-%m-%d %H:%M' "$last 00:00" +%s) ) / 86400 ))
if [ "$published" = 1 ]; then
  heartbeat "OK - publiserte${slugs}; $n igjen i koe"
elif [ "$n" -gt 0 ]; then
  next=$(grep -h -m1 '^date:' "${queued[@]}" | awk '{print $2}' | sort | head -1 || true)
  heartbeat "OK - $n i koe, neste $next (siste post $last)"
elif [ "$age" -ge "$GRENSE_DAGER" ]; then
  heartbeat "FAIL - bloggkoeen er tom, siste post $last ($age dager siden)"
else
  heartbeat "OK - koeen er tom, siste post $last ($age dager siden)"
fi
