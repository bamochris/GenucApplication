-- V15 — Colonnes présentes dans le modèle JPA mais absentes des migrations.
--
-- Suite de V14. Après création des tables manquantes, la validation du schéma
-- échouait encore :
--   Schema-validation: missing column [date_paiement_inscription] in table [dossiers_inscription]
--
-- Écart mesuré en comparant le schéma produit par Flyway (V1→V14) à celui
-- qu'Hibernate génère à partir des entités : 14 colonnes, dont 10 sur
-- dossiers_inscription. Elles correspondent au paiement des frais de dossier et
-- au rattachement à une vacation, ajoutés au modèle en juillet 2026 sans
-- migration (seule V8 avait créé la table transactions_dossier).
--
-- Note : la comparaison remonte aussi ~228 différences de longueur varchar
-- (Flyway déclare varchar(20)/(50)/text là où l'entité n'impose rien et
-- Hibernate suppose varchar(255)). Elles ne sont PAS corrigées ici : le
-- validateur Hibernate compare le type JDBC, pas la longueur, et les longueurs
-- de Flyway sont les plus proches du métier. Les élargir ferait perdre une
-- contrainte d'intégrité utile sans rien résoudre.

-- ─── Paiement des frais de dossier et rattachement vacation ──────────────
ALTER TABLE dossiers_inscription
    ADD COLUMN date_paiement_inscription timestamp,
    ADD COLUMN devise_inscription        varchar(255),
    ADD COLUMN documents_demandes        varchar(255),
    ADD COLUMN frais_inscription_payes   boolean,
    ADD COLUMN message_secretaire        text,
    ADD COLUMN montant_inscription       double precision,
    ADD COLUMN reference_paiement        varchar(255),
    ADD COLUMN test_admission_reussi     boolean,
    ADD COLUMN url_attestation_reussite  varchar(255),
    ADD COLUMN vacation_id               bigint;

-- La vacation est facultative : elle n'est imposée que si l'établissement en a
-- d'ouvertes au moment du dépôt (InscriptionPubliqueService).
ALTER TABLE dossiers_inscription
    ADD CONSTRAINT fk_dossiers_inscription_vacation
        FOREIGN KEY (vacation_id) REFERENCES vacations (id);

CREATE INDEX idx_dossiers_inscription_vacation ON dossiers_inscription (vacation_id);

-- ─── Documents exigés par filière ────────────────────────────────────────
ALTER TABLE filieres
    ADD COLUMN documents_requis text;

-- ─── Modules activés par établissement ───────────────────────────────────
ALTER TABLE universites
    ADD COLUMN modules_actifs text;

-- ─── Photos de profil et de passeport ────────────────────────────────────
ALTER TABLE utilisateurs
    ADD COLUMN photo_profil    text,
    ADD COLUMN photo_passeport text;
