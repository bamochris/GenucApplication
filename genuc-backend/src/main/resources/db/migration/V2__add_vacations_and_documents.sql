-- Vacations proposées par promotion (CSV de TypeVacation : JOUR, SOIR ou JOUR,SOIR)
-- Contexte RDC : chaque promotion (L1, L2, …) peut être organisée en vacation
-- de jour, du soir, ou les deux.
ALTER TABLE public.promotions
    ADD COLUMN IF NOT EXISTS vacations VARCHAR(50);

-- Documents légaux de l'université (chemins des PDF envoyés à l'enregistrement)
ALTER TABLE public.universites
    ADD COLUMN IF NOT EXISTS document_agrement TEXT,
    ADD COLUMN IF NOT EXISTS document_arrete TEXT,
    ADD COLUMN IF NOT EXISTS document_statuts TEXT;

-- Contrainte héritée erronée : le libellé d'une année académique (ex. « 2025-2026 »)
-- doit être unique PAR UNIVERSITÉ, pas globalement. La contrainte composite
-- (libelle, universite_id) existe déjà (ukji5uwn27uhjgqwsman4ypdfft, cf. V1).
ALTER TABLE public.annees_academiques
    DROP CONSTRAINT IF EXISTS annees_academiques_libelle_key;
