#!/usr/bin/env bash
set -euo pipefail
DOMAIN="planckkokoro.com"

# garante o 'dig'
if ! command -v dig >/dev/null 2>&1; then
  echo "Instalando dnsutils (dig)..."
  sudo apt-get update -y && sudo apt-get install -y dnsutils
fi

echo "=== DKIM e SPF (Required pela Resend) ==="
echo "- MX send.$DOMAIN"
dig +short MX send.$DOMAIN
echo
echo "- TXT send.$DOMAIN"
dig +short TXT send.$DOMAIN
echo
echo "- TXT resend._domainkey.$DOMAIN"
dig +short TXT resend._domainkey.$DOMAIN
echo

echo "=== DMARC (Recommended) ==="
echo "- TXT _dmarc.$DOMAIN"
dig +short TXT _dmarc.$DOMAIN
echo

# Heurística simples de presença
MX_PRESENT=$(dig +short MX send.$DOMAIN | wc -l)
SPF_PRESENT=$(dig +short TXT send.$DOMAIN | grep -i 'v=spf1' -c || true)
DKIM_PRESENT=$(dig +short TXT resend._domainkey.$DOMAIN | grep -i 'p=' -c || true)
DMARC_PRESENT=$(dig +short TXT _dmarc.$DOMAIN | grep -i 'v=DMARC1' -c || true)

echo "=== Resumo ==="
printf "MX (send.%s): %s\n" "$DOMAIN" "$( [ "$MX_PRESENT" -gt 0 ] && echo OK || echo 'FALTA' )"
printf "SPF (TXT send.%s): %s\n" "$DOMAIN" "$( [ "$SPF_PRESENT" -gt 0 ] && echo OK || echo 'FALTA' )"
printf "DKIM (TXT resend._domainkey.%s): %s\n" "$DOMAIN" "$( [ "$DKIM_PRESENT" -gt 0 ] && echo OK || echo 'FALTA' )"
printf "DMARC (TXT _dmarc.%s): %s\n" "$DOMAIN" "$( [ "$DMARC_PRESENT" -gt 0 ] && echo OK || echo 'FALTA' )"
