#!/bin/bash
# Provisionne l'infrastructure GENUC sur Tencent Cloud et déploie la pile.
#
# Le script est IDEMPOTENT : relancé, il réutilise ce qui existe déjà (clé SSH,
# groupe de sécurité, instance) au lieu de créer des doublons — donc facturer
# deux fois. Chaque ressource est retrouvée par son nom.
#
# Prérequis :
#   pip install tccli
#   tccli configure          # SecretId / SecretKey / région eu-frankfurt
#
# Usage :
#   bash deploy/tencent/provision-cvm.sh
#
# Variables ajustables :
#   REGION, ZONE, INSTANCE_TYPE, DISK_SIZE, NOM
set -euo pipefail

REGION="${REGION:-eu-frankfurt}"
ZONE="${ZONE:-${REGION}-1}"
INSTANCE_TYPE="${INSTANCE_TYPE:-S5.MEDIUM4}"   # 2 vCPU / 4 Go
DISK_SIZE="${DISK_SIZE:-50}"
BANDWIDTH="${BANDWIDTH:-5}"
NOM="${NOM:-genuc}"
CLE_SSH="${HOME}/.ssh/genuc_tencent"

bleu()  { printf "\033[1;34m▸ %s\033[0m\n" "$*"; }
vert()  { printf "\033[1;32m  ✓ %s\033[0m\n" "$*"; }
rouge() { printf "\033[1;31m  ✗ %s\033[0m\n" "$*" >&2; }

# tccli s'invoque normalement par son lanceur. Mais « pip install --user » ne
# le crée pas toujours (constaté avec Python 3.14 sous Windows : le paquet est
# installé, le .exe absent). On retombe alors sur le module, qui fait le même
# travail. TCCLI est fixé plus bas, une fois l'interpréteur connu.
TCCLI=""
tc() { $TCCLI "$@" --region "$REGION" --output json; }

# Le script tourne aussi bien sous Git Bash (Windows) que sous Linux. Windows
# n'expose que « python » — et y invoquer « python3 » ne renvoie pas une erreur
# franche mais l'alias du Microsoft Store, qui écrit sur stdout et produit un
# résultat vide silencieux. On résout donc l'interpréteur une seule fois.
PY=""
for candidat in python3 python py; do
  if command -v "$candidat" >/dev/null 2>&1 && "$candidat" -c 'import sys; sys.exit(0 if sys.version_info[0]==3 else 1)' 2>/dev/null; then
    PY="$candidat"; break
  fi
done

# Extraction JSON via Python plutôt que jq : tccli est lui-même un paquet
# Python, l'interpréteur est donc forcément présent — une dépendance de moins.
# Usage : ... | jval 'InstanceSet.0.InstanceId'   (chemin pointé, indices inclus)
jval() {
  "$PY" -c '
import json,sys
d=json.load(sys.stdin)
for cle in sys.argv[1].split("."):
    if d is None: break
    try: d = d[int(cle)] if cle.isdigit() else d.get(cle)
    except (IndexError, KeyError, TypeError, AttributeError): d=None
print("" if d is None else d)
' "$1"
}

# ─── 0. Vérifications ────────────────────────────────────────────────
[ -n "$PY" ] || { rouge "Aucun interpreteur Python 3 trouve (python3, python ou py)"; exit 1; }

if command -v tccli >/dev/null 2>&1; then
  TCCLI="tccli"
elif "$PY" -c 'import tccli.main' 2>/dev/null; then
  # Lanceur de secours : reconstitue argv[0] pour que tccli s'analyse lui-même
  # correctement, puis appelle son point d'entrée.
  LANCEUR="$(mktemp)"
  cat > "${LANCEUR}" <<'PYEOF'
import sys
sys.argv[0] = "tccli"
import tccli.main
tccli.main.main()
PYEOF
  trap 'rm -f "${LANCEUR}"' EXIT
  TCCLI="$PY ${LANCEUR}"
  vert "tccli utilise via son module (lanceur non cree par pip)"
else
  rouge "tccli absent : pip install --user tccli"
  exit 1
fi

bleu "Vérification des identifiants Tencent…"
# tccli sort en code 0 même quand l'appel échoue (« secretId is invalid » est
# écrit sur stdout avec un statut 0). Se fier au code de retour laisserait le
# script continuer jusqu'à la création d'instance avec des identifiants morts :
# on valide donc sur le contenu de la réponse.
SONDE="$(tc cvm DescribeRegions 2>&1 || true)"
if ! printf '%s' "${SONDE}" | grep -q '"RegionSet"'; then
  rouge "Identifiants Tencent invalides ou absents."
  rouge "Detail : $(printf '%s' "${SONDE}" | grep -viE '^usage|^ *tccli|^to tccli|^$' | head -1)"
  echo "" >&2
  echo "  Creer une cle API : Console Tencent > Gestion des acces > Cles API" >&2
  echo "  Puis la configurer : tccli configure" >&2
  exit 1
fi
vert "Identifiants valides (région ${REGION})"

# ─── 1. Clé SSH ──────────────────────────────────────────────────────
bleu "Clé SSH…"
if [ ! -f "${CLE_SSH}" ]; then
  ssh-keygen -t ed25519 -f "${CLE_SSH}" -N "" -C "genuc-tencent" >/dev/null
  vert "Clé générée : ${CLE_SSH}"
else
  vert "Clé existante réutilisée : ${CLE_SSH}"
fi

KEY_ID=$(tc cvm DescribeKeyPairs --Filters '[{"Name":"key-name","Values":["'"${NOM}"'"]}]' \
         | jval 'KeyPairSet.0.KeyId')
if [ -z "${KEY_ID}" ]; then
  KEY_ID=$(tc cvm ImportKeyPair --KeyName "${NOM}" --ProjectId 0 \
           --PublicKey "$(cat "${CLE_SSH}.pub")" | jval 'KeyId')
  vert "Clé importée dans Tencent : ${KEY_ID}"
else
  vert "Clé déjà présente dans Tencent : ${KEY_ID}"
fi

# ─── 2. Groupe de sécurité ───────────────────────────────────────────
bleu "Groupe de sécurité…"
SG_ID=$(tc vpc DescribeSecurityGroups --Filters '[{"Name":"security-group-name","Values":["'"${NOM}"'"]}]' \
        | jval 'SecurityGroupSet.0.SecurityGroupId')
if [ -z "${SG_ID}" ]; then
  SG_ID=$(tc vpc CreateSecurityGroup --GroupName "${NOM}" \
          --GroupDescription "GENUC : SSH restreint, HTTP/HTTPS publics" \
          | jval 'SecurityGroup.SecurityGroupId')
  vert "Groupe créé : ${SG_ID}"

  # L'IP publique de l'opérateur, pour restreindre SSH.
  MON_IP=$(curl -s -m 10 https://checkip.amazonaws.com | tr -d '[:space:]')
  [ -z "${MON_IP}" ] && { rouge "IP publique indéterminée"; exit 1; }
  vert "SSH restreint à ${MON_IP}/32"

  # 5432 et 6379 ne sont JAMAIS ouverts : la pile ne publie pas ces ports,
  # Postgres et Redis ne sont joignables que sur le réseau Docker interne.
  tc vpc CreateSecurityGroupPolicies --SecurityGroupId "${SG_ID}" --SecurityGroupPolicySet '{
    "Ingress": [
      {"Protocol":"TCP","Port":"22","CidrBlock":"'"${MON_IP}"'/32","Action":"ACCEPT","PolicyDescription":"SSH administration"},
      {"Protocol":"TCP","Port":"80","CidrBlock":"0.0.0.0/0","Action":"ACCEPT","PolicyDescription":"HTTP"},
      {"Protocol":"TCP","Port":"443","CidrBlock":"0.0.0.0/0","Action":"ACCEPT","PolicyDescription":"HTTPS"},
      {"Protocol":"ALL","Port":"ALL","CidrBlock":"0.0.0.0/0","Action":"DROP","PolicyDescription":"Refus par defaut"}
    ]}' >/dev/null
  vert "Règles appliquées : 22 (restreint), 80, 443 — reste refusé"
else
  vert "Groupe existant réutilisé : ${SG_ID}"
fi

# ─── 3. Instance CVM ─────────────────────────────────────────────────
bleu "Instance CVM…"
INSTANCE_ID=$(tc cvm DescribeInstances --Filters '[{"Name":"instance-name","Values":["'"${NOM}"'"]}]' \
              | jval 'InstanceSet.0.InstanceId')

if [ -z "${INSTANCE_ID}" ]; then
  # Le nom exact de l'image varie d'une région à l'autre : on sélectionne la
  # première image publique Ubuntu dont le nom mentionne 22.04, plutôt que de
  # figer un ImageId qui ne serait valable que dans une seule région.
  IMAGE_ID=$(tc cvm DescribeImages \
             --Filters '[{"Name":"image-type","Values":["PUBLIC_IMAGE"]},{"Name":"platform","Values":["Ubuntu"]}]' \
             | "$PY" -c '
import json,sys
images = json.load(sys.stdin).get("ImageSet") or []
trouve = next((i for i in images if "22.04" in i.get("ImageName","")), None)
print(trouve["ImageId"] if trouve else "")
')
  [ -z "${IMAGE_ID}" ] && { rouge "Image Ubuntu 22.04 introuvable dans ${REGION}"; exit 1; }
  vert "Image : ${IMAGE_ID}"

  echo ""
  echo "  ┌──────────────────────────────────────────────────────────┐"
  echo "  │  CREATION D'UNE INSTANCE FACTUREE                         │"
  echo "  ├──────────────────────────────────────────────────────────┤"
  printf "  │  Region   : %-44s│\n" "${REGION} / ${ZONE}"
  printf "  │  Type     : %-44s│\n" "${INSTANCE_TYPE}"
  printf "  │  Disque   : %-44s│\n" "${DISK_SIZE} Go SSD"
  printf "  │  Reseau   : %-44s│\n" "IP publique, ${BANDWIDTH} Mbps a l'usage"
  echo "  └──────────────────────────────────────────────────────────┘"
  echo ""
  read -rp "  Confirmer la creation ? (oui/non) " reponse
  [ "${reponse}" = "oui" ] || { echo "  Annule."; exit 0; }

  INSTANCE_ID=$(tc cvm RunInstances \
    --InstanceChargeType POSTPAID_BY_HOUR \
    --Placement '{"Zone":"'"${ZONE}"'"}' \
    --InstanceType "${INSTANCE_TYPE}" \
    --ImageId "${IMAGE_ID}" \
    --SystemDisk '{"DiskType":"CLOUD_PREMIUM","DiskSize":'"${DISK_SIZE}"'}' \
    --InternetAccessible '{"InternetChargeType":"TRAFFIC_POSTPAID_BY_HOUR","InternetMaxBandwidthOut":'"${BANDWIDTH}"',"PublicIpAssigned":true}' \
    --InstanceName "${NOM}" \
    --LoginSettings '{"KeyIds":["'"${KEY_ID}"'"]}' \
    --SecurityGroupIds '["'"${SG_ID}"'"]' \
    | jval 'InstanceIdSet.0')
  vert "Instance créée : ${INSTANCE_ID}"
else
  vert "Instance existante réutilisée : ${INSTANCE_ID}"
fi

bleu "Attente de l'état RUNNING…"
for _ in $(seq 1 60); do
  ETAT=$(tc cvm DescribeInstances --InstanceIds '["'"${INSTANCE_ID}"'"]' | jval 'InstanceSet.0.InstanceState')
  [ "${ETAT}" = "RUNNING" ] && break
  sleep 10
done
[ "${ETAT}" = "RUNNING" ] || { rouge "Instance non démarrée (état: ${ETAT})"; exit 1; }

IP=$(tc cvm DescribeInstances --InstanceIds '["'"${INSTANCE_ID}"'"]' | jval 'InstanceSet.0.PublicIpAddresses.0')
vert "Instance active — IP publique : ${IP}"

bleu "Attente du service SSH…"
for _ in $(seq 1 40); do
  ssh -i "${CLE_SSH}" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 \
      ubuntu@"${IP}" true 2>/dev/null && break
  sleep 10
done
vert "SSH disponible"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Infrastructure prête."
echo ""
echo "  IP publique : ${IP}"
echo "  Connexion   : ssh -i ${CLE_SSH} ubuntu@${IP}"
echo ""
echo "  Déploiement de la pile :"
echo "    bash deploy/tencent/deploy-cvm.sh ${IP}"
echo "════════════════════════════════════════════════════════════════"
