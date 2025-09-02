#!/usr/bin/env bash
set -e
cd /mnt/c/Users/clebe/Desktop/kokoro-site
URL="$(sed -n 's/^POSTGRES_URL="\([^"]*\)".*$/\1/p' .env.prod | sed 's/[?&]pooler=true//')"
if [ -z "$URL" ]; then
  URL="$(sed -n 's/^DATABASE_URL="\([^"]*\)".*$/\1/p' .env.prod)"
fi
exec psql "$URL" "$@"
