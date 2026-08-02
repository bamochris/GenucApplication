ALTER TABLE public.parametres_universite
    ADD COLUMN IF NOT EXISTS email_messagerie VARCHAR(150),
    ADD COLUMN IF NOT EXISTS nom_expediteur_messagerie VARCHAR(150);