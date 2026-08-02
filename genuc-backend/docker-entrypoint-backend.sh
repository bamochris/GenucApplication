#!/bin/sh
# Prépare le répertoire des pièces jointes, puis lance l'application en tant
# qu'utilisateur non privilégié.
#
# Pourquoi ce script existe :
#
# Le conteneur déclarait « USER genuc », mais /app appartient à root en 0755
# (WORKDIR crée le répertoire en root ; seul son CONTENU est copié en
# --chown=genuc). L'utilisateur genuc ne pouvait donc pas créer /app/uploads :
# tout dépôt de pièce jointe échouait en « Permission denied », sans que rien
# ne le signale au démarrage.
#
# S'y ajoute le cas des volumes : Railway, Kubernetes et « docker -v » montent
# un volume neuf en root:root. Même si l'image préparait le répertoire, le
# montage masque cette préparation et réintroduit exactement le même blocage.
#
# La seule correction qui couvre les deux cas est de rester root le temps
# d'ajuster le propriétaire du point de montage, puis d'abandonner les
# privilèges — ce que fait su-exec, sans processus intermédiaire (le java
# lancé reste PID 1 et continue de recevoir SIGTERM à l'arrêt).
set -e

# genuc.uploads.racine vaut « uploads » par défaut, relatif au répertoire de
# travail : on résout de la même façon pour viser le même dossier.
UPLOADS="${UPLOADS_ROOT:-uploads}"
case "${UPLOADS}" in
  /*) ;;
  *) UPLOADS="/app/${UPLOADS}" ;;
esac

mkdir -p "${UPLOADS}"
chown -R genuc:genuc "${UPLOADS}"
echo "uploads : ${UPLOADS} pret (proprietaire genuc)"

# ⚠️ NE PAS transformer ces options en « ${VAR:-défaut} » : elles sont ici dans
# un shell, donc développées — mais toute reprise vers un ENTRYPOINT exec-form
# les recevrait littéralement (voir l'avertissement du Dockerfile).
exec su-exec genuc java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseG1GC \
  -XX:G1HeapRegionSize=16m \
  -XX:+ExitOnOutOfMemoryError \
  -Djava.security.egd=file:/dev/./urandom \
  org.springframework.boot.loader.launch.JarLauncher
