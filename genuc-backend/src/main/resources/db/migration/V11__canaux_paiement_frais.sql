-- ═══════════════════════════════════════════════════════════════════
-- Canaux de paiement ouverts par frais
--
-- L'admin de l'université choisit, en créant un frais (et donc son affectation
-- aux inscriptions de la promotion), quels modes de paiement sont acceptés et
-- sur quelles banques le règlement peut être déposé.
--
-- Ces tables portent la configuration au niveau du FRAIS, pas de chaque
-- affectation : l'affectation est dérivée du frais (montant et échéance y sont
-- déjà recopiés), et une promotion compte des centaines d'inscriptions.
--
-- Absence de ligne = aucune restriction (tous les canaux de l'établissement),
-- ce qui préserve le comportement des frais existants.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.frais_modes_paiement (
    frais_id      bigint                 NOT NULL,
    mode_paiement character varying(30)  NOT NULL,
    CONSTRAINT frais_modes_paiement_pkey PRIMARY KEY (frais_id, mode_paiement),
    CONSTRAINT frais_modes_paiement_frais_fk FOREIGN KEY (frais_id)
        REFERENCES public.frais (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.frais_banques (
    frais_id                bigint NOT NULL,
    information_bancaire_id bigint NOT NULL,
    CONSTRAINT frais_banques_pkey PRIMARY KEY (frais_id, information_bancaire_id),
    CONSTRAINT frais_banques_frais_fk FOREIGN KEY (frais_id)
        REFERENCES public.frais (id) ON DELETE CASCADE,
    -- Le compte retiré de la liste des coordonnées disparaît des frais qui le
    -- référençaient, plutôt que de laisser un identifiant mort qui ferait
    -- afficher une banque inexistante sur un bon de caisse.
    CONSTRAINT frais_banques_compte_fk FOREIGN KEY (information_bancaire_id)
        REFERENCES public.informations_bancaires (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_frais_modes_paiement_frais ON public.frais_modes_paiement (frais_id);
CREATE INDEX IF NOT EXISTS idx_frais_banques_frais        ON public.frais_banques (frais_id);
