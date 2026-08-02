-- V8 : transactions de paiement des FRAIS DE DOSSIER (candidats sans compte).
-- Un dossier n'a pas encore d'Inscription : il ne peut pas passer par
-- paiements/transactions_externes (inscription_id NOT NULL). Cette table
-- porte le cycle PENDING -> SUCCESS/FAILED, la confirmation ne venant QUE
-- du webhook opérateur signé (TachPayWebhookService).

CREATE TABLE IF NOT EXISTS transactions_dossier (
    id             BIGSERIAL PRIMARY KEY,
    numero_dossier VARCHAR(255) NOT NULL,
    reference      VARCHAR(255) NOT NULL UNIQUE,
    provider       VARCHAR(50)  NOT NULL,
    external_id    VARCHAR(255),
    telephone      VARCHAR(50),
    montant        DOUBLE PRECISION,
    devise         VARCHAR(5),
    status         VARCHAR(20)  NOT NULL,
    raw_response   TEXT,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tx_dossier_provider_external
    ON transactions_dossier (provider, external_id);

CREATE INDEX IF NOT EXISTS idx_tx_dossier_numero
    ON transactions_dossier (numero_dossier);
