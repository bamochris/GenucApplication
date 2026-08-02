#!/bin/bash
# Déploie la pile GENUC sur un CVM déjà provisionné.
#
# Usage :
#   bash deploy/tencent/deploy-cvm.sh <IP_PUBLIQUE>
#
# Idempotent : relancé, il met à jour le code et reconstruit les images sans
# toucher aux volumes (base et pièces jointes conservées). Les secrets ne sont
# générés qu'au premier passage, puis réutilisés — les régénérer invaliderait
# la base et déconnecterait tous les utilisateurs.
set -euo pipefail

IP="${1:-}"
[ -z "${IP}" ] && { echo "Usage : bash $0 <IP_PUBLIQUE>" >&2; exit 1; }

CLE_SSH="${CLE_SSH:-${HOME}/.ssh/genuc_tencent}"
DEPOT="${DEPOT:-https://github.com/bamochris/GenucApplication.git}"

bleu()  { printf "\033[1;34m▸ %s\033[0m\n" "$*"; }
vert()  { printf "\033[1;32m  ✓ %s\033[0m\n" "$*"; }

sshc() { ssh -i "${CLE_SSH}" -o StrictHostKeyChecking=accept-new ubuntu@"${IP}" "$@"; }

# ─── 1. Docker ───────────────────────────────────────────────────────
bleu "Installation de Docker…"
sshc 'bash -s' <<'DISTANT'
set -e
if ! command -v docker >/dev/null; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
  curl -fsSL https://get.docker.com | sudo sh >/dev/null
  sudo usermod -aG docker ubuntu
  echo "docker installe"
else
  echo "docker deja present"
fi
DISTANT
vert "Docker prêt"

# ─── 2. Code source ──────────────────────────────────────────────────
bleu "Récupération du code…"
sshc "bash -s" <<DISTANT
set -e
if [ -d ~/genuc/.git ]; then
  cd ~/genuc && git fetch --quiet origin && git reset --hard origin/main --quiet
  echo "depot mis a jour"
else
  git clone --quiet --depth 1 "${DEPOT}" ~/genuc
  echo "depot clone"
fi
DISTANT
vert "Code à jour"

# ─── 3. Secrets ──────────────────────────────────────────────────────
# Générés sur le CVM, jamais transmis depuis le poste : ils ne transitent donc
# ni par le terminal local, ni par l'historique shell.
bleu "Configuration des secrets…"
sshc "IP_PUBLIQUE=${IP} bash -s" <<'DISTANT'
set -e
cd ~/genuc
if [ -f deploy/tencent/.env ]; then
  echo "fichier .env existant conserve (ne pas regenerer : invaliderait la base)"
else
  cp deploy/tencent/.env.example deploy/tencent/.env
  DBP=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  RDP=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  JWT=$(openssl rand -base64 64 | tr -d '\n')
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DBP}|"        deploy/tencent/.env
  sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${RDP}|"  deploy/tencent/.env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|"          deploy/tencent/.env
  sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=http://${IP_PUBLIQUE}|"                 deploy/tencent/.env
  sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://${IP_PUBLIQUE}|" deploy/tencent/.env
  chmod 600 deploy/tencent/.env
  echo "secrets generes sur le CVM"
fi
DISTANT
vert "Secrets en place"

# ─── 4. Build et démarrage ───────────────────────────────────────────
bleu "Construction et démarrage (10 à 20 min au premier passage)…"
sshc 'cd ~/genuc && sg docker -c "docker compose -f deploy/tencent/docker-compose.prod.yml --env-file deploy/tencent/.env up -d --build"' \
  2>&1 | tail -15
vert "Conteneurs lancés"

# ─── 5. Attente et vérification ──────────────────────────────────────
bleu "Attente du démarrage applicatif…"
for _ in $(seq 1 60); do
  ETAT=$(sshc 'sg docker -c "docker inspect --format={{.State.Health.Status}} genuc_backend"' 2>/dev/null | tr -d '[:space:]' || true)
  [ "${ETAT}" = "healthy" ] && break
  sleep 15
done

echo ""
bleu "Vérification depuis l'extérieur"
for chemin in "/" "/api/universites/public"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 20 "http://${IP}${chemin}" || echo "000")
  printf "  %-34s -> HTTP %s\n" "${chemin}" "${CODE}"
done
CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 20 -X POST -H 'Content-Type: application/json' \
       -d '{}' "http://${IP}/api/payments/mobile/initiate" || echo "000")
printf "  %-34s -> HTTP %s (503 attendu : mode pilote)\n" "/api/payments/mobile/initiate" "${CODE}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  GENUC est en ligne : http://${IP}"
echo ""
echo "  Journaux : ssh -i ${CLE_SSH} ubuntu@${IP} \\"
echo "               'cd genuc && docker compose -f deploy/tencent/docker-compose.prod.yml logs -f backend'"
echo ""
echo "  Prochaine etape : pointer le domaine sur ${IP}, puis HTTPS"
echo "  (section 7 de deploy/tencent/README.md)."
echo "════════════════════════════════════════════════════════════════"
