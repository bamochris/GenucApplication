#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NAMESPACE="${NAMESPACE:-genuc}"
REGISTRY="${REGISTRY:-registry.tencentcloudcr.com/genuc}"
TAG="${TAG:-latest}"

echo "═══════════════════════════════════════════════════════════════"
echo "  Déploiement Genuc sur TKE"
echo "  Namespace : ${NAMESPACE}"
echo "  Registre  : ${REGISTRY}"
echo "  Tag       : ${TAG}"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "▸ 1/6 Namespace..."
kubectl apply -f "${SCRIPT_DIR}/00-namespace.yaml"

echo ""
echo "▸ 2/6 ConfigMaps et Secrets..."
kubectl apply -f "${SCRIPT_DIR}/01-configmap.yaml"

# 02-secrets.yaml n'est PAS versionné (il porte des valeurs réelles) : il se
# fabrique à partir de 02-secrets.example.yaml. Échouer ici est volontaire —
# mieux vaut interrompre le déploiement que d'appliquer un Secret incomplet.
if [ ! -f "${SCRIPT_DIR}/02-secrets.yaml" ]; then
  echo "  ✗ ${SCRIPT_DIR}/02-secrets.yaml est absent." >&2
  echo "    cp ${SCRIPT_DIR}/02-secrets.example.yaml ${SCRIPT_DIR}/02-secrets.yaml" >&2
  echo "    puis renseigner les valeurs avant de relancer." >&2
  exit 1
fi
kubectl apply -f "${SCRIPT_DIR}/02-secrets.yaml"

echo ""
echo "▸ 3/6 PersistentVolumeClaims..."
kubectl apply -f "${SCRIPT_DIR}/03-storage.yaml"

echo ""
echo "▸ 4/6 Infrastructure (PostgreSQL, Redis, Kafka, Tempo)..."
kubectl apply -f "${SCRIPT_DIR}/04-postgres.yaml"
kubectl apply -f "${SCRIPT_DIR}/05-pgbouncer.yaml"
kubectl apply -f "${SCRIPT_DIR}/06-redis.yaml"
kubectl apply -f "${SCRIPT_DIR}/07-kafka.yaml"
kubectl apply -f "${SCRIPT_DIR}/08-tempo.yaml"

echo ""
echo "▸ 5/6 Application (Backend + Frontend)..."
sed -e "s|\${REGISTRY}|${REGISTRY}|g" \
    -e "s|\${TAG:-latest}|${TAG}|g" \
    "${SCRIPT_DIR}/09-app.yaml" | kubectl apply -n "${NAMESPACE}" -f -

echo ""
echo "▸ 6/6 Ingress, HPA, PDB, NetworkPolicies..."
kubectl apply -f "${SCRIPT_DIR}/10-ingress-hpa.yaml"
kubectl apply -f "${SCRIPT_DIR}/11-network-policies.yaml"
kubectl apply -f "${SCRIPT_DIR}/12-pdb.yaml"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Déploiement terminé ! Vérification du statut..."
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "▸ Pods :"
kubectl get pods -n "${NAMESPACE}"
echo ""
echo "▸ Services :"
kubectl get svc -n "${NAMESPACE}"
echo ""
echo "▸ Ingress :"
kubectl get ingress -n "${NAMESPACE}"
echo ""
echo "▸ HPA :"
kubectl get hpa -n "${NAMESPACE}"
