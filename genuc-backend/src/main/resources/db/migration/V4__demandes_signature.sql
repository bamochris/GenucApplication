-- Demandes de signature : un responsable valide un document ou un lot de
-- documents pour que sa signature électronique y soit apposée.
CREATE TABLE IF NOT EXISTS public.demandes_signature (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    signataire_id   BIGINT NOT NULL REFERENCES public.signataires_universite(id),
    type_document   VARCHAR(40) NOT NULL,
    document_ids    TEXT NOT NULL,
    commentaire     TEXT,
    statut          VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    demande_par_id  BIGINT,
    demande_par_nom VARCHAR(150),
    motif_refus     TEXT,
    cree_le         TIMESTAMP,
    traite_le       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demandes_signature_signataire
    ON public.demandes_signature (signataire_id, statut);
