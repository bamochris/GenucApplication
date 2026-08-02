-- Modules Administration : Communication, Infrastructure (campus/bâtiments/
-- salles), Patrimoine (actifs/fournisseurs/maintenances) et Recherche
-- (laboratoires/projets/publications). CRUD générique via ModulesController.

-- ─── Communication ───
CREATE TABLE IF NOT EXISTS public.annonces (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    titre           VARCHAR(200) NOT NULL,
    contenu         TEXT,
    type            VARCHAR(30) NOT NULL DEFAULT 'ACTUALITE',  -- ACTUALITE | EVENEMENT | COMMUNIQUE
    date_evenement  TIMESTAMP,
    lieu            VARCHAR(150),
    publie_par      VARCHAR(150),
    actif           BOOLEAN DEFAULT TRUE,
    cree_le         TIMESTAMP DEFAULT now()
);

-- ─── Infrastructure ───
CREATE TABLE IF NOT EXISTS public.campus (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    nom             VARCHAR(150) NOT NULL,
    adresse         VARCHAR(250),
    description     TEXT,
    actif           BOOLEAN DEFAULT TRUE,
    cree_le         TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.batiments (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    campus_id       BIGINT REFERENCES public.campus(id),
    nom             VARCHAR(150) NOT NULL,
    code            VARCHAR(30),
    niveaux         INTEGER,
    description     TEXT,
    actif           BOOLEAN DEFAULT TRUE,
    cree_le         TIMESTAMP DEFAULT now()
);

-- La table salles existe déjà (entité JPA Salle, référencée par horaires et
-- surveillances) : on l'ÉTEND au lieu de la dupliquer. Le type reste l'enum
-- Java TypeSalle : COURS | LABO | AUDITOIRE | BIBLIOTHEQUE | REUNION.
ALTER TABLE public.salles
    ADD COLUMN IF NOT EXISTS batiment_id BIGINT REFERENCES public.batiments(id),
    ADD COLUMN IF NOT EXISTS equipements TEXT,
    ADD COLUMN IF NOT EXISTS actif       BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS cree_le     TIMESTAMP DEFAULT now();

-- ─── Patrimoine ───
CREATE TABLE IF NOT EXISTS public.fournisseurs (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    nom             VARCHAR(150) NOT NULL,
    contact         VARCHAR(150),
    telephone       VARCHAR(30),
    email           VARCHAR(150),
    adresse         VARCHAR(250),
    actif           BOOLEAN DEFAULT TRUE,
    cree_le         TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actifs_patrimoine (
    id                BIGSERIAL PRIMARY KEY,
    universite_id     BIGINT NOT NULL REFERENCES public.universites(id),
    type              VARCHAR(30) NOT NULL DEFAULT 'MATERIEL',  -- IMMOBILISATION | MATERIEL | VEHICULE
    designation       VARCHAR(200) NOT NULL,
    code              VARCHAR(50),
    valeur            NUMERIC(14,2),
    date_acquisition  DATE,
    etat              VARCHAR(30) DEFAULT 'BON',  -- NEUF | BON | USAGE | HORS_SERVICE
    localisation      VARCHAR(200),
    fournisseur_id    BIGINT REFERENCES public.fournisseurs(id),
    actif             BOOLEAN DEFAULT TRUE,
    cree_le           TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenances_actifs (
    id                BIGSERIAL PRIMARY KEY,
    universite_id     BIGINT NOT NULL REFERENCES public.universites(id),
    actif_id          BIGINT REFERENCES public.actifs_patrimoine(id),
    description       TEXT NOT NULL,
    cout              NUMERIC(14,2),
    date_maintenance  DATE,
    statut            VARCHAR(30) DEFAULT 'PLANIFIEE',  -- PLANIFIEE | EN_COURS | TERMINEE
    actif             BOOLEAN DEFAULT TRUE,
    cree_le           TIMESTAMP DEFAULT now()
);

-- ─── Recherche ───
-- laboratoires et projets_recherche existent déjà (module recherche du
-- professeur, entités Laboratoire / ProjetRecherche) : on les ÉTEND pour
-- que l'université puisse aussi déclarer ses structures officielles.
-- professeur_id devient nullable (un labo institutionnel n'a pas de
-- propriétaire) ; statut reçoit un défaut car la colonne est NOT NULL.
ALTER TABLE public.laboratoires
    ADD COLUMN IF NOT EXISTS universite_id BIGINT REFERENCES public.universites(id),
    ADD COLUMN IF NOT EXISTS localisation  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS actif         BOOLEAN DEFAULT TRUE;
ALTER TABLE public.laboratoires ALTER COLUMN professeur_id DROP NOT NULL;
ALTER TABLE public.laboratoires ALTER COLUMN statut SET DEFAULT 'ACTIF';

-- Le budget du module admin utilise la colonne existante « montant ».
ALTER TABLE public.projets_recherche
    ADD COLUMN IF NOT EXISTS universite_id  BIGINT REFERENCES public.universites(id),
    ADD COLUMN IF NOT EXISTS laboratoire_id BIGINT REFERENCES public.laboratoires(id),
    ADD COLUMN IF NOT EXISTS actif          BOOLEAN DEFAULT TRUE;
ALTER TABLE public.projets_recherche ALTER COLUMN professeur_id DROP NOT NULL;
ALTER TABLE public.projets_recherche ALTER COLUMN statut SET DEFAULT 'EN_COURS';

CREATE TABLE IF NOT EXISTS public.publications_recherche (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES public.universites(id),
    type            VARCHAR(30) NOT NULL DEFAULT 'PUBLICATION',  -- PUBLICATION | CONFERENCE | BREVET
    titre           VARCHAR(250) NOT NULL,
    auteurs         VARCHAR(300),
    annee           INTEGER,
    reference       VARCHAR(250),
    lien            VARCHAR(300),
    actif           BOOLEAN DEFAULT TRUE,
    cree_le         TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annonces_universite       ON public.annonces (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_campus_universite         ON public.campus (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_batiments_universite      ON public.batiments (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_salles_universite         ON public.salles (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_universite   ON public.fournisseurs (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_actifs_universite         ON public.actifs_patrimoine (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_maintenances_universite   ON public.maintenances_actifs (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_laboratoires_universite   ON public.laboratoires (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_projets_universite        ON public.projets_recherche (universite_id, actif);
CREATE INDEX IF NOT EXISTS idx_publications_universite   ON public.publications_recherche (universite_id, actif);
