-- V10 : processus d'admission — code EXETAT et attribution à un agent.
-- Code EXETAT du Diplôme d'État (obligatoire côté applicatif si année >= 2022),
-- vérifié manuellement par l'agent d'admissions ; et attribution automatique du
-- dossier à un secrétaire académique dès le paiement des frais confirmé.

ALTER TABLE dossiers_inscription
    ADD COLUMN IF NOT EXISTS code_exetat            VARCHAR(255),
    ADD COLUMN IF NOT EXISTS exetat_verifie         BOOLEAN,
    ADD COLUMN IF NOT EXISTS exetat_verifie_le      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS exetat_verifie_par     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS agent_admission_id     BIGINT,
    ADD COLUMN IF NOT EXISTS agent_admission_nom    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS attribue_le            TIMESTAMP;
