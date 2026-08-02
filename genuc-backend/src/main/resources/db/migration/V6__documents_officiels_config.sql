CREATE TABLE IF NOT EXISTS public.documents_officiels_config (
    id                BIGSERIAL PRIMARY KEY,
    universite_id     BIGINT NOT NULL REFERENCES public.universites(id),
    code              VARCHAR(80) NOT NULL,
    libelle           VARCHAR(200) NOT NULL,
    description       TEXT,
    type_source       VARCHAR(30) NOT NULL,
    attestation_type  VARCHAR(30),
    frais_code_requis VARCHAR(80),
    modele_contenu    TEXT,
    actif             BOOLEAN DEFAULT TRUE,
    ordre_affichage   INTEGER DEFAULT 0,
    cree_le           TIMESTAMP DEFAULT now(),
    modifie_le        TIMESTAMP DEFAULT now(),
    CONSTRAINT uk_documents_officiels_config_uni_code UNIQUE (universite_id, code)
);

ALTER TABLE public.attestations
    ADD COLUMN IF NOT EXISTS code_document VARCHAR(80),
    ADD COLUMN IF NOT EXISTS libelle_document VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_documents_officiels_config_uni_actif
    ON public.documents_officiels_config (universite_id, actif, ordre_affichage);

CREATE INDEX IF NOT EXISTS idx_attestations_code_document
    ON public.attestations (inscription_id, code_document, date_demande DESC);