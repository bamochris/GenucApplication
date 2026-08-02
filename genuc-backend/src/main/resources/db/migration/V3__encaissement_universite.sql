-- Comptes d'encaissement de l'université : numéros marchands mobile money
-- (M-Pesa, Orange Money, Airtel Money) et compte bancaire pour les paiements
-- par carte / virement. Configurés par l'admin de l'université.
ALTER TABLE public.universite_payment_settings
    ADD COLUMN IF NOT EXISTS mpesa_numero        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS orange_money_numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS airtel_money_numero VARCHAR(20),
    ADD COLUMN IF NOT EXISTS banque_nom          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS banque_compte       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS banque_swift        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS banque_titulaire    VARCHAR(150),
    ADD COLUMN IF NOT EXISTS accepte_especes     BOOLEAN DEFAULT TRUE;
