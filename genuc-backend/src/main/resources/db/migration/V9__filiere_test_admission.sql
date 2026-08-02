-- V9 : exigence d'un test d'admission au niveau de la filière.
-- Le secrétaire académique ou l'admin peut cocher cette exigence, filière par
-- filière. Quand test_admission_requis = TRUE, tout candidat à cette filière
-- doit réussir le test d'admission avant validation du dossier — en plus de la
-- règle automatique existante (< 60 % au diplôme d'État), qui reste inchangée.

ALTER TABLE filieres
    ADD COLUMN IF NOT EXISTS test_admission_requis BOOLEAN NOT NULL DEFAULT FALSE;
