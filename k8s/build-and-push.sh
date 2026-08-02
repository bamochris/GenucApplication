cat > build-and-push.sh << 'EOF'
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
REGISTRY="${REGISTRY:-registry.tencentcloudcr.com/genuc}"
TAG="${TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

echo "═══════════════════════════════════════════════════════════════"
echo "  Registre cible : ${REGISTRY}"
echo "  Tag            : ${TAG}"
echo "  Plateforme     : ${PLATFORM}"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "▸ Build du backend (Spring Boot)..."
docker build \
  -t "${REGISTRY}/genuc-backend:${TAG}" \
  -f "${REPO_DIR}/genuc-backend/Dockerfile.backend" \
  --platform "${PLATFORM}" \
  "${REPO_DIR}/genuc-backend"
echo "  ✓ Backend buildé : ${REGISTRY}/genuc-backend:${TAG}"

echo ""
echo "▸ Build du frontend (React + Nginx)..."
docker build \
  -t "${REGISTRY}/genuc-frontend:${TAG}" \
  -f "${REPO_DIR}/genuc-backend/Dockerfile.frontend" \
  --platform "${PLATFORM}" \
  "${REPO_DIR}/genuc-backend"
echo "  ✓ Frontend buildé : ${REGISTRY}/genuc-frontend:${TAG}"

echo ""
echo "▸ Push des images vers TCR..."
docker push "${REGISTRY}/genuc-backend:${TAG}"
echo "  ✓ Backend poussé"
docker push "${REGISTRY}/genuc-frontend:${TAG}"
echo "  ✓ Frontend poussé"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Build et push terminés avec succès !"
echo "  Backend  : ${REGISTRY}/genuc-backend:${TAG}"
echo "  Frontend : ${REGISTRY}/genuc-frontend:${TAG}"
echo "═══════════════════════════════════════════════════════════════"
EOF
