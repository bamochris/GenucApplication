-- ═══════════════════════════════════════════════════════════════════
-- Banque(s) de règlement figée(s) sur le bon de caisse
--
-- L'admin désigne, sur chaque frais, la ou les banques où le règlement doit
-- être déposé. Un bon ne regroupe que des frais partageant au moins une banque
-- (cf. TachPayPaiementService.genererBonsDePaiement) : le bon porte donc la
-- banque où l'étudiant doit se présenter.
--
-- Ces identifiants sont FIGÉS à l'émission plutôt que recalculés à l'impression :
-- le PDF est régénéré à partir du seul numéro de bon, parfois plusieurs jours
-- après, et la configuration des frais a pu changer entre-temps. Un bon remis à
-- un étudiant doit rester encaissable au guichet qui y est imprimé.
--
-- Absence de ligne = aucune restriction (tous les comptes actifs).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.bon_paiement_banques (
    bon_paiement_id         bigint NOT NULL,
    information_bancaire_id bigint NOT NULL,
    CONSTRAINT bon_paiement_banques_pkey PRIMARY KEY (bon_paiement_id, information_bancaire_id),
    CONSTRAINT bon_paiement_banques_bon_fk FOREIGN KEY (bon_paiement_id)
        REFERENCES public.bons_paiement (id) ON DELETE CASCADE
    -- Pas de clé étrangère vers informations_bancaires : un compte fermé après
    -- l'émission ne doit pas faire disparaître la mention du guichet sur un bon
    -- déjà entre les mains d'un étudiant. Le libellé est résolu à l'impression,
    -- et son absence est simplement ignorée.
);

CREATE INDEX IF NOT EXISTS idx_bon_paiement_banques_bon
    ON public.bon_paiement_banques (bon_paiement_id);
