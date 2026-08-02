#!/bin/sh
# Génère la configuration Nginx à partir de nginx.conf.template, puis démarre Nginx.
#
# Deux valeurs varient selon l'hébergeur :
#
#   PORT         port d'écoute. Docker Compose fixe 80 ; Railway, Render et la
#                plupart des PaaS imposent un port arbitraire via $PORT et
#                ignorent EXPOSE. Un service qui n'écoute pas sur $PORT y est
#                déclaré « unhealthy » puis tué.
#
#   BACKEND_URL  origine du backend. En Compose, le nom de service « backend »
#                est résolu par le DNS interne. Sur Railway il n'existe pas :
#                les services se joignent en <nom>.railway.internal, et le port
#                est celui que le backend expose, pas 8082 par défaut.
#
# La substitution se fait sur des marqueurs __PORT__ / __BACKEND_URL__ et NON
# via envsubst : le gabarit contient $host, $remote_addr, $scheme et
# $proxy_add_x_forwarded_for, qui sont des variables Nginx. envsubst les
# viderait, et le proxy perdrait ses en-têtes sans la moindre erreur visible.
set -e

PORT="${PORT:-80}"
BACKEND_URL="${BACKEND_URL:-http://backend:8082}"

# Une barre oblique finale produirait « http://host//api/ » : Spring répondrait
# 404 sur toutes les routes, sans que Nginx ne signale quoi que ce soit.
BACKEND_URL="${BACKEND_URL%/}"

sed -e "s|__PORT__|${PORT}|g" \
    -e "s|__BACKEND_URL__|${BACKEND_URL}|g" \
    /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx : ecoute sur ${PORT}, /api/ proxifie vers ${BACKEND_URL}"

# Échoue tout de suite si le rendu est invalide, plutôt qu'en boucle de redémarrage.
nginx -t

exec nginx -g 'daemon off;'
