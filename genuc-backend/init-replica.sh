#!/bin/bash
# Crée l'utilisateur de réplication sur le primary PostgreSQL
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '${REPLICATOR_PASSWORD:-replicator_password}';
    SELECT pg_create_physical_replication_slot('genuc_replica_slot');
EOSQL

# Autoriser la connexion du replica dans pg_hba.conf
echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"
