#!/bin/bash
# publish-blogg-queue.sh - publiserer bloggutkast fra content/blogg-drafts/
# naar frontmatter-datoen er naadd. Kjoeres av cron daglig 09:00.
# Satt opp 24.08.2026 etter Frodes klarsignar (front-lastet droppplan).
set -euo pipefail
# 26/8-fix: cron har minimal PATH (PIL/node ikke funnet 26/8 09:00) - sett eksplisitt
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$(dirname "$0")/.."
LOG="$HOME/Projects/MacMiniHub/logs/dronelappen-blogg-queue.log"
TODAY=$(date +%Y-%m-%d)
export BARLOW_DIR="$PWD/scripts/fonts"
shopt -s nullglob
published=0
for f in content/blogg-drafts/*.md; do
  d=$(grep -m1 '^date:' "$f" | awk '{print $2}')
  [ -z "$d" ] && continue
  if [[ ! "$d" > "$TODAY" ]]; then
    slug=$(basename "$f" .md)
    title=$(grep -m1 '^title:' "$f" | sed 's/^title: //')
    mv "$f" "content/blogg/$slug.md"
    /opt/homebrew/bin/python3 scripts/make-blogg-og.py "$title" "$slug" >> "$LOG" 2>&1 || true
    published=1
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
