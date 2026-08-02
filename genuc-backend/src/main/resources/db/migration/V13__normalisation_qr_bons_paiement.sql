-- ═══════════════════════════════════════════════════════════════════
-- Normalisation du QR code des bons de caisse
--
-- Le champ bons_paiement.codeqr doit contenir l'image PNG en base64 NU : ce sont
-- ses lecteurs (PDF du bon, portail admin) qui ajoutent « data:image/png;base64, ».
--
-- TachPayPaiementService enregistrait ce préfixe dans la colonne ET l'ajoutait de
-- nouveau à l'impression. Le décodeur recevait « data:image/png;base64,data:… »,
-- rejetait la valeur (« Illegal base64 character 3a ») et le bon s'imprimait SANS
-- QR CODE — sans autre trace qu'un avertissement dans les logs. Côté portail admin,
-- le même doublon donnait une image cassée.
--
-- La source est corrigée ; cette migration remet d'aplomb les bons déjà émis, qui
-- restent imprimables des jours durant (validité de 7 jours) et consultables bien
-- au-delà. Le générateur PDF sait par ailleurs retirer les préfixes résiduels : une
-- base non migrée reste exploitable, la donnée est simplement laissée sale.
-- ═══════════════════════════════════════════════════════════════════

-- Retrait des préfixes data URI, quel qu'en soit le nombre (deux au maximum en
-- pratique, mais l'expression régulière ne fait aucune hypothèse là-dessus).
UPDATE public.bons_paiement
   SET codeqr = regexp_replace(codeqr, '^(data:[^,]*,)+', '')
 WHERE codeqr LIKE 'data:%';

-- Sentinelle textuelle des échecs de génération : elle n'a jamais porté d'image et
-- se retrouvait telle quelle dans un <img src>. NULL exprime l'absence, que tous
-- les lecteurs traitent déjà.
UPDATE public.bons_paiement
   SET codeqr = NULL
 WHERE codeqr IN ('QR non disponible', '—', '');
