-- ============================================================================
-- GENUC Platform — Schéma de référence (baseline)
-- Généré depuis le schéma dev (PostgreSQL) le 2026-07-02, aligné sur les
-- entités JPA (124 entités). Remplace les anciennes migrations V1–V7 qui ne
-- couvraient qu'une partie du schéma et échouaient sur base vierge
-- (références vers des tables créées uniquement par Hibernate ddl-auto).
-- Les données (comptes de test, rôles) sont créées par les seeders Java
-- (config/DataInitializer, DataLoader, PaiementDataInitializer).
-- ============================================================================

--
-- PostgreSQL database dump
--

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

--
-- Name: affectations_frais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations_frais (
    id bigint NOT NULL,
    commentaire character varying(255),
    cree_le timestamp(6) without time zone,
    date_echeance date,
    modifie_le timestamp(6) without time zone,
    montant double precision NOT NULL,
    reste double precision NOT NULL,
    statut character varying(255),
    frais_id bigint NOT NULL,
    inscription_id bigint NOT NULL,
    paiement_id bigint,
    promotion_id bigint,
    CONSTRAINT affectations_frais_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'PARTIEL'::character varying, 'PAYE'::character varying, 'ANNULE'::character varying])::text[])))
);

--
-- Name: affectations_frais_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.affectations_frais_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: affectations_frais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.affectations_frais_id_seq OWNED BY public.affectations_frais.id;

--
-- Name: aides_sociales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aides_sociales (
    id bigint NOT NULL,
    type character varying(30) NOT NULL,
    description text,
    montant_estime double precision,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    date_demande date DEFAULT CURRENT_DATE,
    date_traitement date,
    commentaire text,
    etudiant_id bigint NOT NULL,
    dossier_social_id bigint,
    traite_par_id bigint,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: aides_sociales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aides_sociales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: aides_sociales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aides_sociales_id_seq OWNED BY public.aides_sociales.id;

--
-- Name: alertes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alertes (
    id bigint NOT NULL,
    categorie character varying(255),
    cree_le timestamp(6) without time zone,
    message character varying(255) NOT NULL,
    niveau character varying(255) NOT NULL,
    universite_id bigint,
    vue boolean NOT NULL,
    CONSTRAINT alertes_categorie_check CHECK (((categorie)::text = ANY ((ARRAY['INSCRIPTION'::character varying, 'PAIEMENT'::character varying, 'DELIBERATION'::character varying, 'SYSTEME'::character varying])::text[]))),
    CONSTRAINT alertes_niveau_check CHECK (((niveau)::text = ANY ((ARRAY['INFO'::character varying, 'WARNING'::character varying, 'CRITICAL'::character varying])::text[])))
);

--
-- Name: alertes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alertes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: alertes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alertes_id_seq OWNED BY public.alertes.id;

--
-- Name: annees_academiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annees_academiques (
    id bigint NOT NULL,
    libelle character varying(20) NOT NULL,
    active boolean DEFAULT false,
    cloturee boolean DEFAULT false,
    universite_id bigint NOT NULL
);

--
-- Name: annees_academiques_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annees_academiques_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: annees_academiques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annees_academiques_id_seq OWNED BY public.annees_academiques.id;

--
-- Name: association_membres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.association_membres (
    id bigint NOT NULL,
    date_adhesion timestamp(6) without time zone,
    association_id bigint NOT NULL,
    inscription_id bigint NOT NULL
);

--
-- Name: association_membres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.association_membres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: association_membres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.association_membres_id_seq OWNED BY public.association_membres.id;

--
-- Name: associations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.associations (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    createur_utilisateur_id bigint,
    cree_le timestamp(6) without time zone,
    description text,
    domaine character varying(255),
    email character varying(255),
    nom character varying(255) NOT NULL,
    responsable character varying(255),
    universite_id bigint NOT NULL
);

--
-- Name: associations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.associations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: associations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.associations_id_seq OWNED BY public.associations.id;

--
-- Name: attestations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attestations (
    id bigint NOT NULL,
    numero_attestation character varying(50) NOT NULL,
    type character varying(30) NOT NULL,
    contenu text,
    motif text,
    demande_par_id bigint,
    demande_par_nom character varying(100),
    valide_par_id bigint,
    valide_par_nom character varying(100),
    date_demande date DEFAULT CURRENT_DATE,
    date_validation date,
    date_emission date,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    url_fichier character varying(255),
    uuid_verification character varying(36) NOT NULL,
    publiee boolean DEFAULT false,
    inscription_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: attestations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attestations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: attestations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attestations_id_seq OWNED BY public.attestations.id;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    action character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id bigint,
    old_value text,
    new_value text,
    user_id bigint,
    user_email character varying(255),
    ip_address character varying(50),
    user_agent character varying(255),
    success boolean DEFAULT true,
    error_message text,
    module character varying(50),
    duration_ms bigint,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;

--
-- Name: bareme_evaluation_lignes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bareme_evaluation_lignes (
    bareme_id bigint NOT NULL,
    description text,
    max integer,
    mention character varying(255),
    min integer,
    points character varying(255)
);

--
-- Name: baremes_evaluation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baremes_evaluation (
    id bigint NOT NULL,
    cours_id bigint,
    cours_nom character varying(255),
    cree_le timestamp(6) without time zone,
    modifie_le timestamp(6) without time zone,
    nom character varying(255) NOT NULL,
    ponderation_examen integer,
    ponderation_interro integer,
    ponderationtp integer,
    professeur_id bigint NOT NULL
);

--
-- Name: baremes_evaluation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.baremes_evaluation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: baremes_evaluation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.baremes_evaluation_id_seq OWNED BY public.baremes_evaluation.id;

--
-- Name: baremes_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baremes_paiement (
    id bigint NOT NULL,
    annee_academique character varying(20) NOT NULL,
    niveau character varying(10) NOT NULL,
    type_paiement character varying(30) NOT NULL,
    montant_attendu double precision NOT NULL,
    devise character varying(5) DEFAULT 'USD'::character varying,
    departement_id bigint,
    actif boolean DEFAULT true,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: baremes_paiement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.baremes_paiement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: baremes_paiement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.baremes_paiement_id_seq OWNED BY public.baremes_paiement.id;

--
-- Name: bons_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bons_paiement (
    id bigint NOT NULL,
    numero character varying(50) NOT NULL,
    inscription_id bigint NOT NULL,
    montant double precision NOT NULL,
    date_emission date NOT NULL,
    date_expiration date NOT NULL,
    utilise boolean DEFAULT false,
    code_qr text,
    observations text,
    cree_le timestamp without time zone,
    codeqr text,
    contenu_texte text
);

--
-- Name: bons_paiement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bons_paiement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: bons_paiement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bons_paiement_id_seq OWNED BY public.bons_paiement.id;

--
-- Name: bourse_offre_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bourse_offre_conditions (
    bourse_offre_id bigint NOT NULL,
    condition_texte text
);

--
-- Name: bourse_offres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bourse_offres (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    cree_le timestamp(6) without time zone,
    date_limite date,
    description text,
    devise character varying(255),
    libelle character varying(255) NOT NULL,
    montant double precision,
    places_disponibles integer,
    places_restantes integer,
    pourcentage integer,
    type character varying(255),
    universite_id bigint,
    CONSTRAINT bourse_offres_type_check CHECK (((type)::text = ANY ((ARRAY['EXCELLENCE'::character varying, 'SOCIALE'::character varying, 'SPORT'::character varying, 'MINISTERIELLE'::character varying, 'REDUCTION'::character varying])::text[])))
);

--
-- Name: bourse_offres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bourse_offres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: bourse_offres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bourse_offres_id_seq OWNED BY public.bourse_offres.id;

--
-- Name: bourses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bourses (
    id bigint NOT NULL,
    numero_bourse character varying(50) NOT NULL,
    type character varying(30) NOT NULL,
    montant_total double precision,
    montant_par_mois double precision,
    duree_mois integer,
    date_debut date,
    date_fin date,
    statut character varying(20) DEFAULT 'ACTIVE'::character varying,
    conditions text,
    type_paiement character varying(20),
    dossier_social_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: bourses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bourses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: bourses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bourses_id_seq OWNED BY public.bourses.id;

--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id bigint NOT NULL,
    annee integer,
    categorie character varying(255),
    cree_le timestamp(6) without time zone,
    libelle character varying(255) NOT NULL,
    montant_total double precision NOT NULL,
    montant_utilise double precision,
    universite_id bigint,
    CONSTRAINT budgets_categorie_check CHECK (((categorie)::text = ANY ((ARRAY['FONCTIONNEMENT'::character varying, 'INVESTISSEMENT'::character varying, 'SALAIRE'::character varying, 'BOURSE'::character varying, 'AUTRE'::character varying])::text[])))
);

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.budgets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;

--
-- Name: caisses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caisses (
    id bigint NOT NULL,
    commentaire text,
    cree_le timestamp(6) without time zone,
    date_fermeture date,
    date_ouverture date,
    fermee_par_id bigint,
    ouverte_par_id bigint,
    solde_final double precision,
    solde_initial double precision NOT NULL,
    statut character varying(255),
    universite_id bigint NOT NULL,
    CONSTRAINT caisses_statut_check CHECK (((statut)::text = ANY ((ARRAY['OUVERTE'::character varying, 'FERMEE'::character varying])::text[])))
);

--
-- Name: caisses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.caisses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: caisses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.caisses_id_seq OWNED BY public.caisses.id;

--
-- Name: calendrier_academique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendrier_academique (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    type character varying(30) NOT NULL,
    couleur character varying(20) DEFAULT 'BLEU'::character varying,
    actif boolean DEFAULT true,
    universite_id bigint NOT NULL,
    annee_academique_id bigint,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: calendrier_academique_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendrier_academique_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: calendrier_academique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendrier_academique_id_seq OWNED BY public.calendrier_academique.id;

--
-- Name: candidatures_bourse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidatures_bourse (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    date_decision timestamp(6) without time zone,
    date_demande date NOT NULL,
    motif_rejet text,
    motivation text,
    piece_justificative_url character varying(255),
    statut character varying(255),
    bourse_offre_id bigint NOT NULL,
    etudiant_id bigint NOT NULL,
    CONSTRAINT candidatures_bourse_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'APPROUVEE'::character varying, 'REJETEE'::character varying])::text[])))
);

--
-- Name: candidatures_bourse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidatures_bourse_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: candidatures_bourse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.candidatures_bourse_id_seq OWNED BY public.candidatures_bourse.id;

--
-- Name: candidatures_stage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidatures_stage (
    id bigint NOT NULL,
    date_candidature timestamp(6) without time zone,
    statut character varying(255) NOT NULL,
    inscription_id bigint NOT NULL,
    offre_id bigint NOT NULL,
    CONSTRAINT candidatures_stage_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'ACCEPTEE'::character varying, 'REFUSEE'::character varying])::text[])))
);

--
-- Name: candidatures_stage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidatures_stage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: candidatures_stage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.candidatures_stage_id_seq OWNED BY public.candidatures_stage.id;

--
-- Name: categories_frais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_frais (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    code character varying(20) NOT NULL,
    cree_le timestamp(6) without time zone,
    description text,
    designation character varying(100) NOT NULL,
    universite_id bigint NOT NULL
);

--
-- Name: categories_frais_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_frais_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: categories_frais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_frais_id_seq OWNED BY public.categories_frais.id;

--
-- Name: categories_ouvrage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_ouvrage (
    id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    code character varying(20),
    universite_id bigint,
    actif boolean DEFAULT true
);

--
-- Name: categories_ouvrage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_ouvrage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: categories_ouvrage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_ouvrage_id_seq OWNED BY public.categories_ouvrage.id;

--
-- Name: chapitres_tfc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapitres_tfc (
    id bigint NOT NULL,
    date_depot timestamp(6) without time zone,
    description text,
    nom_fichier character varying(255),
    ordre integer,
    retour text,
    statut character varying(255) NOT NULL,
    titre character varying(255) NOT NULL,
    url character varying(255),
    tfc_id bigint NOT NULL,
    CONSTRAINT chapitres_tfc_statut_check CHECK (((statut)::text = ANY ((ARRAY['A_DEPOSER'::character varying, 'DEPOSE'::character varying, 'VALIDE'::character varying, 'REVISION'::character varying])::text[])))
);

--
-- Name: chapitres_tfc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chapitres_tfc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: chapitres_tfc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chapitres_tfc_id_seq OWNED BY public.chapitres_tfc.id;

--
-- Name: charges_horaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.charges_horaires (
    id bigint NOT NULL,
    annee_academique integer,
    cree_le timestamp(6) without time zone,
    semestre character varying(255),
    volume_horaire integer NOT NULL,
    cours_id bigint NOT NULL,
    personnel_id bigint NOT NULL,
    promotion_id bigint
);

--
-- Name: charges_horaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.charges_horaires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: charges_horaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.charges_horaires_id_seq OWNED BY public.charges_horaires.id;

--
-- Name: commentaires_tfc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commentaires_tfc (
    id bigint NOT NULL,
    auteur_id bigint,
    auteur_nom character varying(255),
    date timestamp(6) without time zone,
    texte text NOT NULL,
    type character varying(255) NOT NULL,
    tfc_id bigint NOT NULL,
    CONSTRAINT commentaires_tfc_type_check CHECK (((type)::text = ANY ((ARRAY['POSITIF'::character varying, 'NEGATIF'::character varying, 'NEUTRE'::character varying])::text[])))
);

--
-- Name: commentaires_tfc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commentaires_tfc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: commentaires_tfc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commentaires_tfc_id_seq OWNED BY public.commentaires_tfc.id;

--
-- Name: comptes_comptables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comptes_comptables (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    code character varying(20) NOT NULL,
    libelle character varying(255) NOT NULL,
    solde_initial double precision,
    type character varying(255),
    universite_id bigint,
    CONSTRAINT comptes_comptables_type_check CHECK (((type)::text = ANY ((ARRAY['ACTIF'::character varying, 'PASSIF'::character varying, 'CHARGE'::character varying, 'PRODUIT'::character varying])::text[])))
);

--
-- Name: comptes_comptables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comptes_comptables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: comptes_comptables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comptes_comptables_id_seq OWNED BY public.comptes_comptables.id;

--
-- Name: conferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conferences (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    date date,
    description text,
    lien character varying(255),
    lieu character varying(255),
    organisateur character varying(255),
    professeur_id bigint,
    professeur_nom character varying(255),
    titre character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT conferences_type_check CHECK (((type)::text = ANY ((ARRAY['CONFERENCE'::character varying, 'SEMINAIRE'::character varying, 'ATELIER'::character varying, 'COLLOQUE'::character varying])::text[])))
);

--
-- Name: conferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conferences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: conferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conferences_id_seq OWNED BY public.conferences.id;

--
-- Name: conges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conges (
    id bigint NOT NULL,
    commentaire character varying(255),
    cree_le timestamp without time zone,
    date_debut date,
    date_demande date,
    date_fin date,
    date_validation date,
    demandeur_id bigint,
    libelle character varying(255),
    motif_rejet character varying(255),
    nb_jours_ouvrables integer,
    personnel_id bigint,
    statut character varying(50),
    valide_par_id bigint
);

--
-- Name: connexion_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connexion_logs (
    id bigint NOT NULL,
    email character varying(255),
    ip_address character varying(50),
    user_agent character varying(255),
    success boolean DEFAULT false,
    error_message text,
    utilisateur_id bigint,
    created_at timestamp without time zone DEFAULT now(),
    date_connexion timestamp(6) without time zone,
    motif_echec character varying(255),
    succes boolean NOT NULL
);

--
-- Name: connexion_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.connexion_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: connexion_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.connexion_logs_id_seq OWNED BY public.connexion_logs.id;

--
-- Name: contrats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrats (
    id bigint NOT NULL,
    numero_contrat character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    date_debut date NOT NULL,
    date_fin date,
    statut character varying(20) DEFAULT 'ACTIF'::character varying,
    salaire_base double precision,
    devise character varying(5) DEFAULT 'USD'::character varying,
    description text,
    document_url character varying(255),
    personnel_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: contrats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contrats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: contrats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contrats_id_seq OWNED BY public.contrats.id;

--
-- Name: controle_cours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.controle_cours (
    id bigint NOT NULL,
    commentaire_correction text,
    date_retour timestamp(6) without time zone,
    date_validation timestamp(6) without time zone,
    modifie_le timestamp(6) without time zone,
    motif_retour text,
    statut character varying(255) NOT NULL,
    valide_par_id bigint,
    cours_id bigint NOT NULL,
    CONSTRAINT controle_cours_statut_check CHECK (((statut)::text = ANY ((ARRAY['RECU'::character varying, 'EN_ATTENTE'::character varying, 'VALIDE'::character varying, 'RETOURNE'::character varying])::text[])))
);

--
-- Name: controle_cours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.controle_cours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: controle_cours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.controle_cours_id_seq OWNED BY public.controle_cours.id;

--
-- Name: cours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cours (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    niveau character varying(10) NOT NULL,
    credits integer DEFAULT 3,
    statut character varying(20) DEFAULT 'BROUILLON'::character varying,
    en_ligne_seulement boolean DEFAULT false,
    thumbnail character varying(255),
    langue character varying(20) DEFAULT 'Français'::character varying,
    annee_academique character varying(20),
    duree_totale_minutes integer DEFAULT 0,
    nombre_lecons integer DEFAULT 0,
    objectifs text,
    prerequis text,
    public_cible text,
    plan_du_cours text,
    nb_inscrits integer DEFAULT 0,
    note_moyenne double precision,
    certificat_disponible boolean DEFAULT false,
    video_introduction character varying(255),
    niveau_difficulte character varying(20) DEFAULT 'INTERMEDIAIRE'::character varying,
    prix double precision DEFAULT 0.0,
    rating_moyen double precision,
    nb_evaluations integer DEFAULT 0,
    universite_id bigint NOT NULL,
    departement_id bigint NOT NULL,
    professeur_id bigint,
    professeur_nom character varying(100),
    promotion_id bigint,
    cree_le timestamp without time zone DEFAULT now(),
    modifie_le timestamp without time zone,
    publie_le timestamp without time zone
);

--
-- Name: cours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cours_id_seq OWNED BY public.cours.id;

--
-- Name: cours_vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cours_vacations (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    cree_le timestamp(6) without time zone,
    heure_debut character varying(255) NOT NULL,
    heure_fin character varying(255) NOT NULL,
    jour character varying(255) NOT NULL,
    salle character varying(100),
    cours_id bigint NOT NULL,
    professeur_id bigint,
    promotion_id bigint NOT NULL,
    vacation_id bigint NOT NULL
);

--
-- Name: cours_vacations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cours_vacations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cours_vacations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cours_vacations_id_seq OWNED BY public.cours_vacations.id;

--
-- Name: criteres_deliberation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.criteres_deliberation (
    id bigint NOT NULL,
    seuil_moyenne double precision DEFAULT 10.0,
    seuil_credits double precision DEFAULT 60.0,
    seuil_rattrapage double precision DEFAULT 8.0,
    ponderation_tp double precision DEFAULT 0.30,
    ponderation_interro double precision DEFAULT 0.20,
    ponderation_examen double precision DEFAULT 0.50,
    actif boolean DEFAULT true,
    promotion_id bigint NOT NULL,
    annee_academique_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now(),
    ponderationtp double precision
);

--
-- Name: criteres_deliberation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.criteres_deliberation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: criteres_deliberation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.criteres_deliberation_id_seq OWNED BY public.criteres_deliberation.id;

--
-- Name: deliberations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliberations (
    id bigint NOT NULL,
    annee_academique character varying(255) NOT NULL,
    code_diplome character varying(255),
    commentaire_jury text,
    cours_reussis integer,
    cours_totaux integer,
    credits_requis integer,
    credits_valides integer,
    cree_le timestamp(6) without time zone,
    date_deliberation date,
    date_diplome date,
    date_publication date,
    decision character varying(255) NOT NULL,
    diplome_genere boolean NOT NULL,
    mention character varying(255),
    moyenne_generale double precision,
    niveau character varying(255),
    niveau_suivant character varying(255),
    phase character varying(255),
    president_jury_id bigint,
    president_jury_nom character varying(255),
    publiee boolean NOT NULL,
    statut character varying(255),
    uuid_verification character varying(255),
    departement_id bigint,
    inscription_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    CONSTRAINT deliberations_decision_check CHECK (((decision)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'ADMIS'::character varying, 'ADMIS_RATTRAPAGE'::character varying, 'REDOUBLE'::character varying, 'EXCLU'::character varying, 'DIPLOME'::character varying])::text[]))),
    CONSTRAINT deliberations_mention_check CHECK (((mention)::text = ANY ((ARRAY['TRES_GRANDE_DISTINCTION'::character varying, 'GRANDE_DISTINCTION'::character varying, 'DISTINCTION'::character varying, 'SATISFACTION'::character varying, 'REUSSITE'::character varying, 'AJOURNE'::character varying])::text[]))),
    CONSTRAINT deliberations_phase_check CHECK (((phase)::text = ANY ((ARRAY['PREPARATION'::character varying, 'PREMIERE'::character varying, 'RATTRAPAGE'::character varying, 'PUBLIEE'::character varying, 'CLOTUREE'::character varying])::text[]))),
    CONSTRAINT deliberations_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_PREPARATION'::character varying, 'PRÊTE'::character varying, 'TENUE'::character varying, 'PUBLIEE'::character varying])::text[])))
);

--
-- Name: deliberations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deliberations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: deliberations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deliberations_id_seq OWNED BY public.deliberations.id;

--
-- Name: delibererations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delibererations (
    id bigint NOT NULL,
    annee_academique character varying(20) NOT NULL,
    niveau character varying(10),
    moyenne_generale double precision,
    credits_valides integer DEFAULT 0,
    credits_requis integer DEFAULT 60,
    cours_reussis integer DEFAULT 0,
    cours_totaux integer DEFAULT 0,
    decision character varying(20) NOT NULL,
    mention character varying(30),
    niveau_suivant character varying(10),
    commentaire_jury text,
    code_diplome character varying(50),
    uuid_verification character varying(36),
    diplome_genere boolean DEFAULT false,
    date_diplome date,
    date_deliberation date,
    president_jury_id bigint,
    president_jury_nom character varying(100),
    statut character varying(20) DEFAULT 'EN_PREPARATION'::character varying,
    phase character varying(20) DEFAULT 'PREPARATION'::character varying,
    publiee boolean DEFAULT false,
    date_publication date,
    inscription_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    departement_id bigint,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: delibererations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delibererations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: delibererations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delibererations_id_seq OWNED BY public.delibererations.id;

--
-- Name: departements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departements (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(50),
    type character varying(20) DEFAULT 'DEPARTEMENT'::character varying,
    description text,
    frais_specifiques double precision,
    actif boolean DEFAULT true,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now(),
    parent_id bigint,
    chef_email character varying(150),
    chef_nom character varying(100),
    chef_postnom character varying(100),
    chef_prenom character varying(100),
    chef_telephone character varying(30),
    type_dept character varying(255),
    updated_at timestamp(6) without time zone,
    faculte_id bigint,
    created_at timestamp without time zone NOT NULL,
    CONSTRAINT departements_type_dept_check CHECK (((type_dept)::text = ANY ((ARRAY['FACULTE'::character varying, 'DEPARTEMENT'::character varying, 'ECOLE'::character varying, 'INSTITUT'::character varying])::text[])))
);

--
-- Name: departements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: departements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departements_id_seq OWNED BY public.departements.id;

--
-- Name: depenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.depenses (
    id bigint NOT NULL,
    libelle character varying(255) NOT NULL,
    montant double precision NOT NULL,
    date_depense date DEFAULT CURRENT_DATE,
    categorie character varying(30),
    description text,
    justificatif_url character varying(255),
    valide_par_id bigint,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: depenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.depenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: depenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.depenses_id_seq OWNED BY public.depenses.id;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_tokens (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    cree_le timestamp(6) without time zone,
    derniere_utilisation timestamp(6) without time zone,
    plateforme character varying(255),
    token character varying(512) NOT NULL,
    utilisateur_id bigint NOT NULL,
    CONSTRAINT device_tokens_plateforme_check CHECK (((plateforme)::text = ANY ((ARRAY['ANDROID'::character varying, 'IOS'::character varying, 'WEB'::character varying])::text[])))
);

--
-- Name: device_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: device_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_tokens_id_seq OWNED BY public.device_tokens.id;

--
-- Name: documents_etudiants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents_etudiants (
    id bigint NOT NULL,
    type character varying(30) NOT NULL,
    nom_fichier character varying(255),
    url character varying(255),
    valide boolean DEFAULT false,
    etudiant_id bigint NOT NULL,
    date_upload timestamp without time zone DEFAULT now()
);

--
-- Name: documents_etudiants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_etudiants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: documents_etudiants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_etudiants_id_seq OWNED BY public.documents_etudiants.id;

--
-- Name: dossiers_inscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossiers_inscription (
    id bigint NOT NULL,
    numero_dossier character varying(20) NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(50),
    mot_de_passe character varying(255),
    sexe character varying(10),
    lieu_naissance character varying(100),
    date_naissance date,
    adresse text,
    nationalite character varying(50),
    etat_civil character varying(20),
    telephone2 character varying(50),
    province character varying(50),
    ville character varying(50),
    commune character varying(50),
    quartier character varying(50),
    avenue character varying(50),
    numero_residence character varying(20),
    niveau_vise character varying(20) NOT NULL,
    universite_id bigint,
    departement_id bigint,
    filiere_id bigint,
    type_inscription character varying(20),
    ecole_secondaire character varying(100),
    province_ecole character varying(50),
    annee_obtention character varying(10),
    numero_diplome character varying(50),
    pourcentage character varying(10),
    option character varying(50),
    pere_nom character varying(100),
    pere_profession character varying(100),
    pere_telephone character varying(50),
    mere_nom character varying(100),
    mere_profession character varying(100),
    mere_telephone character varying(50),
    tuteur_nom character varying(100),
    tuteur_lien character varying(50),
    tuteur_telephone character varying(50),
    tuteur_adresse character varying(255),
    urgence_nom character varying(100),
    urgence_telephone character varying(50),
    allergies character varying(255),
    handicap character varying(255),
    url_photo character varying(255),
    url_photo_passeport character varying(255),
    url_diplome_etat character varying(255),
    url_releve_notes character varying(255),
    url_acte_naissance character varying(255),
    url_attestation_nationalite character varying(255),
    url_carte_identite character varying(255),
    url_lettre_recommandation character varying(255),
    url_attestation_physique character varying(255),
    url_attestation_conduite character varying(255),
    mode_paiement character varying(20),
    numero_transaction character varying(50),
    bourse boolean,
    montant_paye double precision,
    commentaire text,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    motif_rejet text,
    cree_le timestamp without time zone DEFAULT now(),
    pays_residence character varying(100),
    pays_origine character varying(100),
    code_telephone character varying(20),
    type_piece_identite character varying(50),
    numero_piece_identite character varying(100),
    resident_etranger boolean DEFAULT false,
    visa_numero character varying(50),
    date_expiration_visa date
);

--
-- Name: dossiers_inscription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossiers_inscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: dossiers_inscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossiers_inscription_id_seq OWNED BY public.dossiers_inscription.id;

--
-- Name: dossiers_sociaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossiers_sociaux (
    id bigint NOT NULL,
    numero_dossier character varying(50) NOT NULL,
    situation_familiale character varying(30),
    nombre_enfants integer DEFAULT 0,
    nombre_personnes_charge integer DEFAULT 0,
    profession_parent character varying(100),
    revenu_mensuel_foyer double precision,
    source_revenu character varying(100),
    logement_propre boolean,
    type_logement character varying(30),
    handicap boolean DEFAULT false,
    type_handicap character varying(100),
    problemes_sante text,
    demande_bourse boolean DEFAULT false,
    type_bourse_demandee character varying(30),
    montant_demande double precision,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    commentaire_admin text,
    url_certificat_scolarite character varying(255),
    url_bulletin_notes character varying(255),
    url_attestation_revenus character varying(255),
    url_certificat_handicap character varying(255),
    url_lettre_motivation character varying(255),
    etudiant_id bigint NOT NULL,
    inscription_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: dossiers_sociaux_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dossiers_sociaux_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: dossiers_sociaux_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dossiers_sociaux_id_seq OWNED BY public.dossiers_sociaux.id;

--
-- Name: echeances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echeances (
    id bigint NOT NULL,
    numero_echeance integer NOT NULL,
    montant double precision NOT NULL,
    date_echeance date NOT NULL,
    date_paiement date,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    commentaire text,
    penalite double precision DEFAULT 0.0,
    echeancier_id bigint NOT NULL,
    paiement_id bigint,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: echeances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echeances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: echeances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.echeances_id_seq OWNED BY public.echeances.id;

--
-- Name: echeanciers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echeanciers (
    id bigint NOT NULL,
    libelle character varying(255) NOT NULL,
    montant_total double precision NOT NULL,
    nombre_echeances integer DEFAULT 3,
    description text,
    statut character varying(20) DEFAULT 'ACTIF'::character varying,
    inscription_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: echeanciers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echeanciers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: echeanciers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.echeanciers_id_seq OWNED BY public.echeanciers.id;

--
-- Name: ecritures_comptables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecritures_comptables (
    id bigint NOT NULL,
    commentaire text,
    cree_le timestamp(6) without time zone,
    date_ecriture date NOT NULL,
    libelle character varying(255) NOT NULL,
    montant double precision NOT NULL,
    reference character varying(255),
    universite_id bigint,
    valide_par_id bigint,
    validee boolean NOT NULL,
    compte_credit_id bigint NOT NULL,
    compte_debit_id bigint NOT NULL
);

--
-- Name: ecritures_comptables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ecritures_comptables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: ecritures_comptables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ecritures_comptables_id_seq OWNED BY public.ecritures_comptables.id;

--
-- Name: emprunts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emprunts (
    id bigint NOT NULL,
    date_emprunt date,
    date_retour_prevue date,
    date_retour_reelle date,
    statut character varying(20) DEFAULT 'EN_COURS'::character varying,
    penalite double precision DEFAULT 0.0,
    livre_id bigint NOT NULL,
    etudiant_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: emprunts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emprunts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: emprunts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emprunts_id_seq OWNED BY public.emprunts.id;

--
-- Name: equivalences_diplomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equivalences_diplomes (
    id bigint NOT NULL,
    annee_obtention integer,
    date_decision timestamp(6) without time zone,
    date_soumission timestamp(6) without time zone,
    decision_motif text,
    diplome_document_url character varying(255),
    diplome_obtenu character varying(255) NOT NULL,
    domaine_etude character varying(255),
    etablissement_origine character varying(255) NOT NULL,
    niveau_accorde character varying(255),
    niveau_demande character varying(255),
    niveau_obtenu character varying(255),
    pays_origine character varying(255) NOT NULL,
    releve_notes_document_url character varying(255),
    statut character varying(255) NOT NULL,
    traite_par_id bigint,
    etudiant_id bigint NOT NULL,
    filiere_id bigint,
    universite_id bigint NOT NULL,
    CONSTRAINT equivalences_diplomes_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'EN_EXAMEN'::character varying, 'APPROUVEE'::character varying, 'APPROUVEE_PARTIELLE'::character varying, 'REJETEE'::character varying])::text[])))
);

--
-- Name: equivalences_diplomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equivalences_diplomes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: equivalences_diplomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equivalences_diplomes_id_seq OWNED BY public.equivalences_diplomes.id;

--
-- Name: etudiants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etudiants (
    id bigint NOT NULL,
    matricule_permanent character varying(50),
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(50),
    date_naissance date,
    lieu_naissance character varying(100),
    sexe character varying(10),
    adresse text,
    photo_url character varying(255),
    actif boolean DEFAULT true,
    archive boolean DEFAULT false,
    cree_le timestamp without time zone DEFAULT now(),
    mot_de_passe_temporaire character varying(255)
);

--
-- Name: etudiants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.etudiants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: etudiants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.etudiants_id_seq OWNED BY public.etudiants.id;

--
-- Name: evenement_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenement_participants (
    id bigint NOT NULL,
    date_inscription timestamp(6) without time zone,
    evenement_id bigint NOT NULL,
    inscription_id bigint NOT NULL
);

--
-- Name: evenement_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evenement_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: evenement_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evenement_participants_id_seq OWNED BY public.evenement_participants.id;

--
-- Name: evenements_universitaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenements_universitaires (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    cree_par_utilisateur_id bigint,
    date date NOT NULL,
    description text,
    heure character varying(255),
    lieu character varying(255),
    titre character varying(255) NOT NULL,
    association_id bigint,
    universite_id bigint NOT NULL
);

--
-- Name: evenements_universitaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evenements_universitaires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: evenements_universitaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evenements_universitaires_id_seq OWNED BY public.evenements_universitaires.id;

--
-- Name: examens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examens (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    date date NOT NULL,
    heure_debut time without time zone,
    heure_fin time without time zone,
    duree_minutes integer DEFAULT 120,
    type character varying(30) DEFAULT 'EXAMEN_SESSION'::character varying,
    statut character varying(20) DEFAULT 'PLANIFIE'::character varying,
    salle character varying(100),
    capacite_salle integer,
    nb_inscrits integer DEFAULT 0,
    instructions text,
    annee_academique character varying(20),
    session integer DEFAULT 1,
    professeur_id bigint,
    professeur_nom character varying(100),
    cours_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    departement_id bigint,
    cree_le timestamp without time zone DEFAULT now(),
    coefficient double precision,
    nb_groupes integer,
    nb_questions integer
);

--
-- Name: examens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.examens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: examens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.examens_id_seq OWNED BY public.examens.id;

--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    effective_at timestamp(6) without time zone NOT NULL,
    from_currency character varying(3) NOT NULL,
    is_active boolean,
    rate numeric(10,4) NOT NULL,
    rate_date date NOT NULL,
    source character varying(100),
    to_currency character varying(3) NOT NULL,
    updated_by bigint
);

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_rates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;

--
-- Name: facultes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facultes (
    id bigint NOT NULL,
    universite_id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    active boolean NOT NULL,
    adresse text,
    code character varying(50) NOT NULL,
    couleur_principale character varying(7),
    description character varying(500),
    doyen_email character varying(150),
    doyen_nom character varying(100),
    doyen_postnom character varying(100),
    doyen_prenom character varying(100),
    doyen_telephone character varying(50),
    email character varying(150),
    localisation character varying(255),
    logo text,
    nombre_departements integer,
    nombre_enseignants integer,
    nombre_etudiants integer,
    nombre_programmes integer,
    telephone character varying(100),
    updated_at timestamp(6) without time zone
);

--
-- Name: facultes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facultes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: facultes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facultes_id_seq OWNED BY public.facultes.id;

--
-- Name: filieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filieres (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(50),
    description text,
    niveau character varying(20) DEFAULT 'LICENCE'::character varying,
    duree_annees integer DEFAULT 3,
    credits_total integer DEFAULT 180,
    actif boolean DEFAULT true,
    inscriptions_ouvertes boolean DEFAULT true,
    departement_id bigint,
    cree_le timestamp without time zone DEFAULT now(),
    frais_annee1 double precision,
    frais_annee2 double precision,
    frais_annee3 double precision,
    devise_frais character varying(5) DEFAULT 'USD'::character varying,
    debouches text,
    conditions_admission text,
    programme_resume text
);

--
-- Name: filieres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.filieres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: filieres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.filieres_id_seq OWNED BY public.filieres.id;

--
-- Name: frais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frais (
    id bigint NOT NULL,
    annee_academique character varying(255) NOT NULL,
    code character varying(30) NOT NULL,
    cree_le timestamp(6) without time zone,
    date_limite date,
    description text,
    devise character varying(5),
    faculte_id bigint,
    libelle character varying(200) NOT NULL,
    modifie_le timestamp(6) without time zone,
    montant double precision NOT NULL,
    promotion_id bigint NOT NULL,
    statut character varying(255),
    type character varying(255),
    categorie_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    CONSTRAINT frais_statut_check CHECK (((statut)::text = ANY ((ARRAY['ACTIF'::character varying, 'INACTIF'::character varying, 'ARCHIVE'::character varying])::text[]))),
    CONSTRAINT frais_type_check CHECK (((type)::text = ANY ((ARRAY['ACADEMIQUE'::character varying, 'INSCRIPTION'::character varying, 'LABORATOIRE'::character varying, 'BIBLIOTHEQUE'::character varying, 'STAGE'::character varying, 'SOUTENANCE'::character varying, 'CARTE_ETUDIANT'::character varying, 'SESSION_SPECIALE'::character varying, 'AUTRE'::character varying])::text[])))
);

--
-- Name: frais_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.frais_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: frais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.frais_id_seq OWNED BY public.frais.id;

--
-- Name: hierarchical_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hierarchical_access (
    id bigint NOT NULL,
    can_export_data boolean,
    can_manage_staff boolean,
    can_modify_grades boolean,
    can_process_payments boolean,
    can_view_all_students boolean,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone,
    departement_id bigint,
    faculty_id bigint,
    universite_id bigint NOT NULL,
    user_id bigint NOT NULL
);

--
-- Name: hierarchical_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hierarchical_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: hierarchical_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hierarchical_access_id_seq OWNED BY public.hierarchical_access.id;

--
-- Name: horaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horaires (
    id bigint NOT NULL,
    jour character varying(20) NOT NULL,
    heure_debut time without time zone NOT NULL,
    heure_fin time without time zone NOT NULL,
    type character varying(20) DEFAULT 'COURS'::character varying,
    promotion_libelle character varying(50),
    universite_id bigint,
    cours_id bigint NOT NULL,
    salle_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: horaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horaires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: horaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horaires_id_seq OWNED BY public.horaires.id;

--
-- Name: informations_bancaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.informations_bancaires (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    code_banque character varying(255),
    cree_le timestamp(6) without time zone,
    devise character varying(10) NOT NULL,
    iban character varying(255),
    instructions_paiement text,
    intitule_compte character varying(255) NOT NULL,
    nom_banque character varying(255) NOT NULL,
    numero_compte character varying(255) NOT NULL,
    swift_code character varying(255),
    universite_id bigint NOT NULL
);

--
-- Name: informations_bancaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.informations_bancaires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: informations_bancaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.informations_bancaires_id_seq OWNED BY public.informations_bancaires.id;

--
-- Name: inscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions (
    id bigint NOT NULL,
    nom character varying(100),
    prenom character varying(100),
    email character varying(255),
    telephone character varying(50),
    date_naissance date,
    lieu_naissance character varying(100),
    sexe character varying(10),
    adresse text,
    niveau character varying(10),
    matricule character varying(30),
    dossier_inscription_id bigint,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    archive boolean DEFAULT false,
    commentaire text,
    motif_rejet text,
    bulletin boolean DEFAULT false,
    photo boolean DEFAULT false,
    acte boolean DEFAULT false,
    etudiant_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    departement_id bigint NOT NULL,
    filiere_id bigint NOT NULL,
    promotion_id bigint NOT NULL,
    annee_academique_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: inscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: inscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscriptions_id_seq OWNED BY public.inscriptions.id;

--
-- Name: inscriptions_vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_vacations (
    id bigint NOT NULL,
    commentaire text,
    cree_le timestamp(6) without time zone,
    modifie_le timestamp(6) without time zone,
    statut character varying(255),
    annee_academique_id bigint NOT NULL,
    etudiant_id bigint NOT NULL,
    inscription_id bigint,
    promotion_id bigint NOT NULL,
    vacation_id bigint NOT NULL,
    CONSTRAINT inscriptions_vacations_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VALIDE'::character varying, 'REJETE'::character varying])::text[])))
);

--
-- Name: inscriptions_vacations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscriptions_vacations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: inscriptions_vacations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscriptions_vacations_id_seq OWNED BY public.inscriptions_vacations.id;

--
-- Name: laboratoires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laboratoires (
    id bigint NOT NULL,
    capacite integer,
    cree_le timestamp(6) without time zone,
    description text,
    domaine character varying(255),
    email character varying(255),
    equipements character varying(255),
    nom character varying(255) NOT NULL,
    professeur_id bigint,
    professeur_nom character varying(255),
    responsable character varying(255),
    statut character varying(255) NOT NULL,
    telephone character varying(255),
    CONSTRAINT laboratoires_statut_check CHECK (((statut)::text = ANY ((ARRAY['ACTIF'::character varying, 'INACTIF'::character varying, 'EN_CONSTRUCTION'::character varying])::text[])))
);

--
-- Name: laboratoires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laboratoires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: laboratoires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laboratoires_id_seq OWNED BY public.laboratoires.id;

--
-- Name: lecons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecons (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    ordre integer NOT NULL,
    type character varying(20) NOT NULL,
    video_url character varying(255),
    video_externe_url character varying(255),
    duree_secondes integer,
    document_url character varying(255),
    document_nom character varying(255),
    document_taille_octets bigint,
    contenu_html text,
    apercu_gratuit boolean DEFAULT false,
    actif boolean DEFAULT true,
    cours_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now(),
    "aperçu_gratuit" boolean NOT NULL
);

--
-- Name: lecons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lecons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: lecons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lecons_id_seq OWNED BY public.lecons.id;

--
-- Name: lettres_acceptation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lettres_acceptation (
    id bigint NOT NULL,
    contenu text,
    cree_le timestamp(6) without time zone,
    date_emission date,
    emise boolean NOT NULL,
    modifie_le timestamp(6) without time zone,
    numero_lettre character varying(50) NOT NULL,
    uuid_verification character varying(255),
    etudiant_id bigint NOT NULL,
    inscription_vacation_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    vacation_id bigint NOT NULL
);

--
-- Name: lettres_acceptation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lettres_acceptation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: lettres_acceptation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lettres_acceptation_id_seq OWNED BY public.lettres_acceptation.id;

--
-- Name: lignes_releve; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lignes_releve (
    id bigint NOT NULL,
    note_tp double precision,
    note_interrogation double precision,
    note_examen double precision,
    note_finale double precision,
    note_rattrapage double precision,
    note_retenue double precision,
    credits integer,
    session integer,
    mention character varying(30),
    reussi boolean DEFAULT false,
    rang_classe integer,
    total_classe integer,
    releve_id bigint NOT NULL,
    cours_id bigint NOT NULL,
    notetp double precision
);

--
-- Name: lignes_releve_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lignes_releve_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: lignes_releve_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lignes_releve_id_seq OWNED BY public.lignes_releve.id;

--
-- Name: livres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.livres (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    auteur character varying(100),
    isbn character varying(20),
    editeur character varying(100),
    annee_publication integer,
    description text,
    categorie character varying(50),
    emplacement character varying(100),
    couverture_url character varying(255),
    fichier_pdf_url character varying(255),
    quantite_totale integer DEFAULT 1,
    quantite_disponible integer DEFAULT 1,
    actif boolean DEFAULT true,
    type_ouvrage character varying(20) DEFAULT 'LIVRE'::character varying,
    collection character varying(100),
    langue character varying(20) DEFAULT 'Français'::character varying,
    nb_pages integer,
    resume text,
    directeur_memoire character varying(100),
    universite_origine character varying(100),
    annee_soutenance integer,
    universite_id bigint,
    cree_le timestamp without time zone DEFAULT now(),
    dtype character varying(31) NOT NULL
);

--
-- Name: livres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.livres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: livres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.livres_id_seq OWNED BY public.livres.id;

--
-- Name: meilleurs_etudiants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meilleurs_etudiants (
    id bigint NOT NULL,
    nom_complet character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(50),
    biographie text,
    photo_url character varying(255),
    universite_nom character varying(255),
    filiere_nom character varying(255),
    niveau character varying(10),
    annee_obtention character varying(20),
    moyenne_generale double precision,
    mention character varying(30),
    rang integer,
    publie boolean DEFAULT true,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    certificat_url character varying(255),
    date_validation date,
    valide_par_id bigint,
    valide_par_nom character varying(100),
    motif_rejet text,
    date_notification date,
    notifie boolean DEFAULT false,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: meilleurs_etudiants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meilleurs_etudiants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: meilleurs_etudiants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meilleurs_etudiants_id_seq OWNED BY public.meilleurs_etudiants.id;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    sujet character varying(255) NOT NULL,
    contenu text NOT NULL,
    expediteur_id bigint,
    expediteur_nom character varying(100),
    expediteur_role character varying(30),
    destinataire_id bigint,
    destinataire_nom character varying(100),
    destinataire_type character varying(50),
    inscription_id bigint,
    universite_id bigint,
    lu boolean DEFAULT false,
    date_lecture timestamp without time zone,
    reponse text,
    reponse_par_id bigint,
    reponse_par_nom character varying(100),
    date_reponse timestamp without time zone,
    date_envoi timestamp without time zone DEFAULT now()
);

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id bigint NOT NULL,
    note_tp double precision,
    note_interrogation double precision,
    note_examen double precision,
    note_finale double precision,
    note_max double precision DEFAULT 20.0,
    note_rattrapage double precision,
    note_retenue double precision,
    mention character varying(30),
    statut character varying(20) DEFAULT 'EN_COURS'::character varying,
    appreciation text,
    nb_absences integer DEFAULT 0,
    exclu_absences boolean DEFAULT false,
    annee_academique character varying(20) NOT NULL,
    session integer DEFAULT 1,
    credits integer,
    professeur_id bigint,
    inscription_id bigint NOT NULL,
    cours_id bigint NOT NULL,
    universite_id bigint,
    cree_le timestamp without time zone DEFAULT now(),
    modifie_le timestamp without time zone,
    notetp double precision
);

--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;

--
-- Name: notes_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes_questions (
    tentative_id bigint NOT NULL,
    question_id bigint NOT NULL,
    note_obtenue double precision,
    tentative_quiz_id bigint NOT NULL
);

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    titre character varying(255),
    message text,
    type character varying(20),
    lue boolean DEFAULT false,
    date_envoi timestamp without time zone DEFAULT now(),
    date_lecture timestamp without time zone,
    destinataire_id bigint,
    universite_id bigint,
    cours_id bigint,
    inscription_id bigint,
    lien_action text
);

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

--
-- Name: offres_stage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offres_stage (
    id bigint NOT NULL,
    date_publication timestamp(6) without time zone,
    description text,
    duree_semaines integer,
    entreprise character varying(255) NOT NULL,
    localisation character varying(255),
    publie_par_id bigint,
    remuneration double precision,
    statut character varying(255) NOT NULL,
    titre character varying(255) NOT NULL,
    CONSTRAINT offres_stage_statut_check CHECK (((statut)::text = ANY ((ARRAY['OUVERTE'::character varying, 'FERMEE'::character varying])::text[])))
);

--
-- Name: offres_stage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offres_stage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: offres_stage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offres_stage_id_seq OWNED BY public.offres_stage.id;

--
-- Name: operations_caisse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operations_caisse (
    id bigint NOT NULL,
    date_operation timestamp(6) without time zone NOT NULL,
    description text,
    montant double precision NOT NULL,
    operateur_id bigint NOT NULL,
    reference character varying(255),
    solde_apres_operation double precision,
    type character varying(255) NOT NULL,
    caisse_id bigint NOT NULL,
    depense_id bigint,
    paiement_id bigint,
    CONSTRAINT operations_caisse_type_check CHECK (((type)::text = ANY ((ARRAY['ENCAISSEMENT'::character varying, 'REMBOURSEMENT'::character varying, 'DEPENSE'::character varying])::text[])))
);

--
-- Name: operations_caisse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operations_caisse_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: operations_caisse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operations_caisse_id_seq OWNED BY public.operations_caisse.id;

--
-- Name: options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.options (
    id bigint NOT NULL,
    departement_id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

--
-- Name: options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.options_id_seq OWNED BY public.options.id;

--
-- Name: paiements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiements (
    id bigint NOT NULL,
    reference character varying(50) NOT NULL,
    montant double precision NOT NULL,
    devise character varying(5) DEFAULT 'USD'::character varying,
    mode_paiement character varying(30) NOT NULL,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    type character varying(30) NOT NULL,
    date_paiement date,
    date_validation date,
    numero_transaction character varying(50),
    operateur character varying(50),
    notes_caisse text,
    motif_rejet text,
    inscription_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    agent_id bigint,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: paiements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paiements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: paiements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paiements_id_seq OWNED BY public.paiements.id;

--
-- Name: paies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paies (
    id bigint NOT NULL,
    numero_bulletin character varying(50) NOT NULL,
    mois character varying(20) NOT NULL,
    annee integer NOT NULL,
    salaire_base double precision,
    prime double precision DEFAULT 0,
    heures_supplementaires double precision DEFAULT 0,
    indemnite double precision DEFAULT 0,
    total_brut double precision,
    retenue_cnss double precision DEFAULT 0,
    retenue_impots double precision DEFAULT 0,
    retenue_mutuelle double precision DEFAULT 0,
    total_retenues double precision,
    net_a_payer double precision,
    statut character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    date_paiement date,
    commentaire text,
    personnel_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now(),
    netapayer double precision
);

--
-- Name: paies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: paies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paies_id_seq OWNED BY public.paies.id;

--
-- Name: parametres_lmd; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametres_lmd (
    id bigint NOT NULL,
    compensation_autorisee boolean NOT NULL,
    credits_annuels_requis integer NOT NULL,
    credits_par_ue integer NOT NULL,
    date_modification timestamp(6) without time zone,
    dette_max integer NOT NULL,
    seuil_reussite double precision NOT NULL,
    universite_id bigint NOT NULL
);

--
-- Name: parametres_lmd_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametres_lmd_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: parametres_lmd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametres_lmd_id_seq OWNED BY public.parametres_lmd.id;

--
-- Name: parametres_notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametres_notification (
    id bigint NOT NULL,
    email_active boolean NOT NULL,
    notif_cours boolean NOT NULL,
    notif_deliberation boolean NOT NULL,
    notif_inscription boolean NOT NULL,
    notif_note boolean NOT NULL,
    notif_paiement boolean NOT NULL,
    push_active boolean NOT NULL,
    sms_active boolean NOT NULL,
    utilisateur_id bigint NOT NULL
);

--
-- Name: parametres_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametres_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: parametres_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametres_notification_id_seq OWNED BY public.parametres_notification.id;

--
-- Name: parametres_palmares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametres_palmares (
    id bigint NOT NULL,
    annee_academique character varying(20) NOT NULL,
    niveaux_cibles text,
    seuil_moyenne double precision DEFAULT 14.0,
    top_n_par_filiere integer DEFAULT 3,
    date_generation date,
    auto_generation boolean DEFAULT false,
    email_template text,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now(),
    topnpar_filiere integer
);

--
-- Name: parametres_palmares_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametres_palmares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: parametres_palmares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametres_palmares_id_seq OWNED BY public.parametres_palmares.id;

--
-- Name: parametres_universite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametres_universite (
    id bigint NOT NULL,
    frais_inscription double precision DEFAULT 50.0,
    frais_releve double precision DEFAULT 5.0,
    frais_diplome double precision DEFAULT 20.0,
    frais_par_credit double precision DEFAULT 0.0,
    deliberation_automatique boolean DEFAULT true,
    nb_jours_publication integer DEFAULT 5,
    inscription_multiple boolean DEFAULT false,
    delai_validation_dossier integer DEFAULT 15,
    email_notification boolean DEFAULT true,
    sms_notification boolean DEFAULT false,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: parametres_universite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametres_universite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: parametres_universite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametres_universite_id_seq OWNED BY public.parametres_universite.id;

--
-- Name: payment_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_providers (
    id bigint NOT NULL,
    api_key character varying(255) NOT NULL,
    api_secret character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    is_active boolean,
    max_retries integer,
    name character varying(255) NOT NULL,
    priority integer,
    provider_type character varying(255) NOT NULL,
    timeout_seconds integer,
    updated_at timestamp(6) without time zone,
    webhook_secret character varying(255),
    webhook_url character varying(255),
    created_by bigint,
    CONSTRAINT payment_providers_provider_type_check CHECK (((provider_type)::text = ANY ((ARRAY['VODACOM_MPESA'::character varying, 'AIRTEL_MONEY'::character varying, 'ORANGE_MONEY'::character varying, 'BANK_TRANSFER'::character varying, 'CARD'::character varying, 'CASH'::character varying, 'CHEQUE'::character varying])::text[])))
);

--
-- Name: payment_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: payment_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_providers_id_seq OWNED BY public.payment_providers.id;

--
-- Name: payment_reconciliation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_reconciliation (
    id bigint NOT NULL,
    bank_statement_date date NOT NULL,
    bank_statement_file character varying(500),
    created_at timestamp(6) without time zone NOT NULL,
    difference numeric(15,2),
    notes text,
    reconciliation_code character varying(100) NOT NULL,
    reconciliation_date date,
    status character varying(255),
    total_expected numeric(15,2),
    total_received numeric(15,2),
    updated_at timestamp(6) without time zone,
    reconciled_by bigint,
    universite_id bigint NOT NULL,
    CONSTRAINT payment_reconciliation_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'MATCHED'::character varying, 'UNMATCHED'::character varying, 'DISPUTED'::character varying, 'RESOLVED'::character varying])::text[])))
);

--
-- Name: payment_reconciliation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_reconciliation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: payment_reconciliation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_reconciliation_id_seq OWNED BY public.payment_reconciliation.id;

--
-- Name: payment_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_reports (
    id bigint NOT NULL,
    collection_rate numeric(5,2),
    generated_at timestamp(6) without time zone NOT NULL,
    number_of_students_paid integer,
    number_of_transactions integer,
    payment_method_breakdown jsonb,
    period_end date NOT NULL,
    period_start date NOT NULL,
    report_code character varying(100) NOT NULL,
    report_date date NOT NULL,
    report_type character varying(50) NOT NULL,
    total_collected_fc numeric(15,2),
    total_collected_usd numeric(15,2),
    total_pending_fc numeric(15,2),
    total_pending_usd numeric(15,2),
    total_refunded_fc numeric(15,2),
    total_refunded_usd numeric(15,2),
    generated_by bigint,
    universite_id bigint NOT NULL
);

--
-- Name: payment_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: payment_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_reports_id_seq OWNED BY public.payment_reports.id;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    action character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    module character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    resource_type character varying(255) NOT NULL,
    created_by bigint
);

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;

--
-- Name: personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnel (
    id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(50),
    date_naissance date,
    lieu_naissance character varying(100),
    sexe character varying(10),
    adresse text,
    matricule_personnel character varying(50),
    type character varying(20) NOT NULL,
    statut character varying(20) DEFAULT 'ACTIF'::character varying,
    universite_id bigint NOT NULL,
    departement_id bigint,
    specialite character varying(100),
    grade character varying(50),
    description text,
    date_embauche date,
    date_fin_contrat date,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnel_id_seq OWNED BY public.personnel.id;

--
-- Name: presences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presences (
    id bigint NOT NULL,
    date_cours date NOT NULL,
    heure_arrivee time without time zone,
    present boolean DEFAULT false,
    justifie boolean DEFAULT false,
    motif_absence text,
    code_qr_scanne character varying(255),
    scan_timestamp timestamp without time zone,
    cours_id bigint NOT NULL,
    etudiant_id bigint NOT NULL,
    seance_id bigint
);

--
-- Name: presences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: presences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presences_id_seq OWNED BY public.presences.id;

--
-- Name: presences_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presences_personnel (
    id bigint NOT NULL,
    date_presence date NOT NULL,
    heure_arrivee time without time zone,
    heure_depart time without time zone,
    statut character varying(20) DEFAULT 'PRESENT'::character varying,
    motif_absence text,
    personnel_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: presences_personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presences_personnel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: presences_personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presences_personnel_id_seq OWNED BY public.presences_personnel.id;

--
-- Name: progressions_etudiants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progressions_etudiants (
    id bigint NOT NULL,
    pourcentage_completion integer DEFAULT 0,
    lecons_completees integer DEFAULT 0,
    lecons_total integer DEFAULT 0,
    lecons_completees_list text DEFAULT '[]'::text,
    dernier_acces timestamp without time zone,
    date_completion timestamp without time zone,
    temps_passe_minutes integer DEFAULT 0,
    cours_complete boolean DEFAULT false,
    inscription_id bigint NOT NULL,
    cours_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: progressions_etudiants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.progressions_etudiants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: progressions_etudiants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.progressions_etudiants_id_seq OWNED BY public.progressions_etudiants.id;

--
-- Name: projets_recherche; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projets_recherche (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    date_debut date,
    date_fin date,
    description text,
    financement character varying(255),
    montant double precision,
    professeur_id bigint,
    professeur_nom character varying(255),
    statut character varying(255) NOT NULL,
    titre character varying(255) NOT NULL,
    CONSTRAINT projets_recherche_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_COURS'::character varying, 'TERMINE'::character varying, 'SUSPENDU'::character varying])::text[])))
);

--
-- Name: projets_recherche_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projets_recherche_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: projets_recherche_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projets_recherche_id_seq OWNED BY public.projets_recherche.id;

--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id bigint NOT NULL,
    libelle character varying(50) NOT NULL,
    code character varying(50),
    description text,
    niveau character varying(10) NOT NULL,
    credits_requis integer DEFAULT 60,
    duree_annees integer DEFAULT 1,
    actif boolean DEFAULT true,
    filiere_id bigint NOT NULL,
    annee_academique_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: promotions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotions_id_seq OWNED BY public.promotions.id;

--
-- Name: publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publications (
    id bigint NOT NULL,
    annee integer,
    auteurs character varying(255),
    cree_le timestamp(6) without time zone,
    doi character varying(255),
    professeur_id bigint,
    professeur_nom character varying(255),
    resume text,
    revue character varying(255),
    titre character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT publications_type_check CHECK (((type)::text = ANY ((ARRAY['ARTICLE'::character varying, 'LIVRE'::character varying, 'CHAPITRE'::character varying, 'CONFERENCE'::character varying, 'RAPPORT'::character varying])::text[])))
);

--
-- Name: publications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.publications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: publications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.publications_id_seq OWNED BY public.publications.id;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id bigint NOT NULL,
    texte text NOT NULL,
    type character varying(20) DEFAULT 'QCM'::character varying,
    points integer DEFAULT 1,
    explication text,
    quiz_id bigint NOT NULL
);

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;

--
-- Name: quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    duree_minutes integer,
    note_sur integer DEFAULT 20,
    seuil_reussite integer DEFAULT 10,
    tentative_max integer DEFAULT 3,
    statut character varying(20) DEFAULT 'BROUILLON'::character varying,
    date_debut timestamp without time zone,
    date_fin timestamp without time zone,
    cours_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;

--
-- Name: reconciliation_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reconciliation_details (
    id bigint NOT NULL,
    bank_amount numeric(15,2),
    bank_reference character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    is_matched boolean,
    match_date timestamp(6) without time zone,
    transaction_amount numeric(15,2),
    reconciliation_id bigint NOT NULL,
    transaction_id bigint
);

--
-- Name: reconciliation_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reconciliation_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: reconciliation_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reconciliation_details_id_seq OWNED BY public.reconciliation_details.id;

--
-- Name: recours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recours (
    id bigint NOT NULL,
    annee_academique character varying(255),
    date_reponse timestamp(6) without time zone,
    date_soumission timestamp(6) without time zone,
    description text NOT NULL,
    piece_jointe_url character varying(255),
    reponse text,
    statut character varying(255) NOT NULL,
    traite_par_id bigint,
    type character varying(255) NOT NULL,
    cours_id bigint,
    inscription_id bigint NOT NULL,
    CONSTRAINT recours_statut_check CHECK (((statut)::text = ANY ((ARRAY['SOUMIS'::character varying, 'EN_COURS'::character varying, 'ACCEPTE'::character varying, 'REFUSE'::character varying])::text[]))),
    CONSTRAINT recours_type_check CHECK (((type)::text = ANY ((ARRAY['ERREUR_NOTE'::character varying, 'ERREUR_MATRICULE'::character varying, 'COURS_MANQUANT'::character varying, 'CONTESTATION'::character varying, 'AUTRE'::character varying])::text[])))
);

--
-- Name: recours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: recours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recours_id_seq OWNED BY public.recours.id;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    cree_le timestamp(6) with time zone NOT NULL,
    expire_le timestamp(6) with time zone NOT NULL,
    revoque boolean,
    token character varying(512) NOT NULL,
    utilisateur_id bigint NOT NULL
);

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id bigint NOT NULL,
    amount_fc numeric(15,2) NOT NULL,
    amount_usd numeric(15,2),
    created_at timestamp(6) without time zone NOT NULL,
    processed_at timestamp(6) without time zone,
    reason character varying(500),
    refund_code character varying(100) NOT NULL,
    refund_method character varying(255),
    status character varying(255),
    updated_at timestamp(6) without time zone,
    approved_by bigint,
    requested_by bigint,
    transaction_id bigint NOT NULL,
    CONSTRAINT refunds_refund_method_check CHECK (((refund_method)::text = ANY ((ARRAY['VODACOM_MPESA'::character varying, 'AIRTEL_MONEY'::character varying, 'ORANGE_MONEY'::character varying, 'BANK_TRANSFER'::character varying, 'CARD'::character varying, 'CASH'::character varying, 'CHEQUE'::character varying])::text[]))),
    CONSTRAINT refunds_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'CONFIRMED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying, 'DISPUTED'::character varying, 'RECONCILED'::character varying])::text[])))
);

--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refunds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: refunds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;

--
-- Name: regles_signature_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regles_signature_document (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    modifie_le timestamp(6) without time zone,
    type_document character varying(255) NOT NULL,
    signataire_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    CONSTRAINT regles_signature_document_type_document_check CHECK (((type_document)::text = ANY ((ARRAY['ATTESTATION'::character varying, 'DIPLOME'::character varying, 'LETTRE_ACCEPTATION'::character varying, 'RELEVE_NOTES'::character varying, 'BULLETIN'::character varying])::text[])))
);

--
-- Name: regles_signature_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.regles_signature_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: regles_signature_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.regles_signature_document_id_seq OWNED BY public.regles_signature_document.id;

--
-- Name: releves_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.releves_notes (
    id bigint NOT NULL,
    numero_releve character varying(50) NOT NULL,
    annee_academique character varying(20) NOT NULL,
    moyenne_generale double precision,
    moyenne_arithmetique double precision,
    moyenne_ponderee double precision,
    credits_acquis integer,
    credits_totaux integer,
    credits_manquants integer,
    nb_cours_reussis integer,
    nb_cours_echoues integer,
    nb_cours_total integer,
    mention character varying(30),
    decision character varying(20),
    date_generation timestamp without time zone,
    appreciation_generale text,
    signataire_nom character varying(100),
    signataire_titre character varying(100),
    uuid_verification character varying(36),
    publie boolean DEFAULT false,
    inscription_id bigint NOT NULL
);

--
-- Name: releves_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.releves_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: releves_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.releves_notes_id_seq OWNED BY public.releves_notes.id;

--
-- Name: remboursements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remboursements (
    id bigint NOT NULL,
    autorisateur_id bigint,
    commentaire_autorisation character varying(255),
    commentaire_validation_motif character varying(255),
    commentaire_verification character varying(255),
    cree_le timestamp(6) without time zone,
    date_autorisation timestamp(6) without time zone,
    date_demande timestamp(6) without time zone,
    date_execution timestamp(6) without time zone,
    date_validation_motif timestamp(6) without time zone,
    date_verification timestamp(6) without time zone,
    demandeur_id bigint,
    executeur_id bigint,
    montant double precision,
    motif text,
    reference_remboursement character varying(255),
    statut character varying(255),
    validateur_motif_id bigint,
    verificateur_id bigint,
    etudiant_id bigint NOT NULL,
    paiement_id bigint NOT NULL,
    CONSTRAINT remboursements_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VERIFIE'::character varying, 'MOTIF_VALIDE'::character varying, 'AUTORISE'::character varying, 'EXECUTE'::character varying, 'REJETE'::character varying])::text[])))
);

--
-- Name: remboursements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remboursements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: remboursements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remboursements_id_seq OWNED BY public.remboursements.id;

--
-- Name: reponses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reponses (
    id bigint NOT NULL,
    texte text NOT NULL,
    correcte boolean DEFAULT false,
    question_id bigint NOT NULL
);

--
-- Name: reponses_etudiant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reponses_etudiant (
    tentative_id bigint NOT NULL,
    question_id bigint NOT NULL,
    reponse_texte text,
    tentative_quiz_id bigint NOT NULL
);

--
-- Name: reponses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reponses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: reponses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reponses_id_seq OWNED BY public.reponses.id;

--
-- Name: reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations (
    id bigint NOT NULL,
    date_reservation date DEFAULT CURRENT_DATE NOT NULL,
    date_expiration date,
    statut character varying(20) DEFAULT 'ACTIVE'::character varying,
    livre_id bigint NOT NULL,
    etudiant_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id bigint NOT NULL,
    granted_at timestamp(6) without time zone NOT NULL,
    granted_by bigint,
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    display_name character varying(255) NOT NULL,
    is_active boolean,
    is_system_role boolean,
    name character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    created_by bigint,
    universite_id bigint,
    CONSTRAINT roles_name_check CHECK (((name)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'ADMIN_UNIVERSITE'::character varying, 'UNIVERSITY_ADMIN'::character varying, 'RECTEUR'::character varying, 'DOYEN'::character varying, 'DEAN'::character varying, 'CHEF_DEPARTEMENT'::character varying, 'DEPARTMENT_HEAD'::character varying, 'CHEF_PROMOTION'::character varying, 'COORDINATEUR'::character varying, 'PROFESSEUR'::character varying, 'PROFESSOR'::character varying, 'ENSEIGNANT'::character varying, 'LECTURER'::character varying, 'CORRECTEUR'::character varying, 'SECRETAIRE_ACADEMIQUE'::character varying, 'REGISTRAR'::character varying, 'CAISSIER'::character varying, 'AGENT'::character varying, 'COMPTABLE'::character varying, 'FINANCE_MANAGER'::character varying, 'RH'::character varying, 'HR_MANAGER'::character varying, 'PERSONNEL'::character varying, 'BIBLIOTHECAIRE'::character varying, 'LIBRARIAN'::character varying, 'APPARITEUR'::character varying, 'SERVICE_SOCIAL'::character varying, 'ADMIN_SYSTEME'::character varying, 'AUDITEUR'::character varying, 'ETUDIANT'::character varying, 'STUDENT'::character varying, 'PARENT'::character varying, 'INVITE'::character varying, 'GUEST'::character varying, 'STAFF'::character varying])::text[])))
);

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

--
-- Name: salles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salles (
    id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    capacite integer,
    batiment character varying(100),
    etage character varying(20),
    code character varying(20),
    type character varying(20) DEFAULT 'COURS'::character varying,
    est_disponible boolean DEFAULT true,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: salles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: salles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salles_id_seq OWNED BY public.salles.id;

--
-- Name: seances_live; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seances_live (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    date_debut timestamp without time zone NOT NULL,
    duree_prevue_minutes integer DEFAULT 90,
    statut character varying(20) DEFAULT 'PLANIFIEE'::character varying,
    plateforme character varying(30) DEFAULT 'JITSI'::character varying,
    lien_reunion character varying(255),
    code_acces character varying(50),
    id_reunion_externe character varying(100),
    enregistrable boolean DEFAULT true,
    url_enregistrement character varying(255),
    nb_participants integer DEFAULT 0,
    professeur_id bigint,
    professeur_nom character varying(100),
    cours_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: seances_live_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seances_live_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: seances_live_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seances_live_id_seq OWNED BY public.seances_live.id;

--
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    event_type character varying(100) NOT NULL,
    ip_address character varying(50),
    metadata jsonb,
    status character varying(50),
    user_agent character varying(500),
    universite_id bigint,
    user_id bigint
);

--
-- Name: security_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.security_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: security_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.security_events_id_seq OWNED BY public.security_events.id;

--
-- Name: services_universite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services_universite (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(20),
    description text,
    type character varying(30) DEFAULT 'SCOLARITE'::character varying,
    responsable_nom character varying(100),
    responsable_email character varying(255),
    telephone character varying(50),
    actif boolean DEFAULT true,
    universite_id bigint NOT NULL,
    cree_le timestamp without time zone DEFAULT now()
);

--
-- Name: services_universite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_universite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: services_universite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_universite_id_seq OWNED BY public.services_universite.id;

--
-- Name: signataires_universite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signataires_universite (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    cree_le timestamp(6) without time zone,
    fonction character varying(255) NOT NULL,
    modifie_le timestamp(6) without time zone,
    nom_complet character varying(255) NOT NULL,
    role_rattache character varying(255),
    signature_image text,
    utilisateur_id bigint,
    universite_id bigint NOT NULL,
    CONSTRAINT signataires_universite_role_rattache_check CHECK (((role_rattache)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'ADMIN_UNIVERSITE'::character varying, 'UNIVERSITY_ADMIN'::character varying, 'RECTEUR'::character varying, 'DOYEN'::character varying, 'DEAN'::character varying, 'CHEF_DEPARTEMENT'::character varying, 'DEPARTMENT_HEAD'::character varying, 'CHEF_PROMOTION'::character varying, 'COORDINATEUR'::character varying, 'PROFESSEUR'::character varying, 'PROFESSOR'::character varying, 'ENSEIGNANT'::character varying, 'LECTURER'::character varying, 'CORRECTEUR'::character varying, 'SECRETAIRE_ACADEMIQUE'::character varying, 'REGISTRAR'::character varying, 'CAISSIER'::character varying, 'AGENT'::character varying, 'COMPTABLE'::character varying, 'FINANCE_MANAGER'::character varying, 'RH'::character varying, 'HR_MANAGER'::character varying, 'PERSONNEL'::character varying, 'BIBLIOTHECAIRE'::character varying, 'LIBRARIAN'::character varying, 'APPARITEUR'::character varying, 'SERVICE_SOCIAL'::character varying, 'ADMIN_SYSTEME'::character varying, 'AUDITEUR'::character varying, 'ETUDIANT'::character varying, 'STUDENT'::character varying, 'PARENT'::character varying, 'INVITE'::character varying, 'GUEST'::character varying, 'STAFF'::character varying])::text[])))
);

--
-- Name: signataires_universite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signataires_universite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: signataires_universite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signataires_universite_id_seq OWNED BY public.signataires_universite.id;

--
-- Name: signatures_electroniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signatures_electroniques (
    id bigint NOT NULL,
    applique_par_id bigint,
    applique_par_nom character varying(255),
    code_verification character varying(255) NOT NULL,
    date_revocation timestamp(6) without time zone,
    date_signature timestamp(6) without time zone,
    document_id bigint NOT NULL,
    hash_document character varying(64) NOT NULL,
    motif_revocation character varying(255),
    revoquee boolean NOT NULL,
    type_document character varying(255) NOT NULL,
    signataire_id bigint NOT NULL,
    CONSTRAINT signatures_electroniques_type_document_check CHECK (((type_document)::text = ANY ((ARRAY['ATTESTATION'::character varying, 'DIPLOME'::character varying, 'LETTRE_ACCEPTATION'::character varying, 'RELEVE_NOTES'::character varying, 'BULLETIN'::character varying])::text[])))
);

--
-- Name: signatures_electroniques_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signatures_electroniques_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: signatures_electroniques_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signatures_electroniques_id_seq OWNED BY public.signatures_electroniques.id;

--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_logs (
    id bigint NOT NULL,
    telephone character varying(50),
    message text,
    status character varying(20),
    erreur text,
    utilisateur_id bigint,
    date_envoi timestamp without time zone DEFAULT now()
);

--
-- Name: sms_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: sms_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_logs_id_seq OWNED BY public.sms_logs.id;

--
-- Name: soumissions_travaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.soumissions_travaux (
    id bigint NOT NULL,
    commentaire text,
    commentaire_correction text,
    date_correction timestamp(6) without time zone,
    date_soumission timestamp(6) without time zone,
    fichier_url character varying(255) NOT NULL,
    nom_fichier character varying(255),
    nom_fichier_correction character varying(255),
    note double precision,
    statut character varying(255) NOT NULL,
    url_correction character varying(255),
    inscription_id bigint NOT NULL,
    travail_id bigint NOT NULL,
    CONSTRAINT soumissions_travaux_statut_check CHECK (((statut)::text = ANY ((ARRAY['SOUMIS'::character varying, 'CORRIGE'::character varying])::text[])))
);

--
-- Name: soumissions_travaux_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.soumissions_travaux_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: soumissions_travaux_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.soumissions_travaux_id_seq OWNED BY public.soumissions_travaux.id;

--
-- Name: stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stages (
    id bigint NOT NULL,
    adresse text,
    avis text,
    avis_date timestamp(6) without time zone,
    convention_nom_fichier character varying(255),
    convention_url character varying(255),
    date_creation timestamp(6) without time zone,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    description text,
    email_responsable character varying(255),
    entreprise character varying(255) NOT NULL,
    motif_rejet character varying(255),
    progression integer,
    rapport_date timestamp(6) without time zone,
    rapport_nom_fichier character varying(255),
    rapport_resume text,
    rapport_statut character varying(255) NOT NULL,
    rapport_titre character varying(255),
    rapport_url character varying(255),
    responsable character varying(255),
    statut character varying(255) NOT NULL,
    telephone character varying(255),
    tuteur_id bigint,
    tuteur_nom character varying(255),
    valide_par_id bigint,
    inscription_id bigint NOT NULL,
    CONSTRAINT stages_rapport_statut_check CHECK (((rapport_statut)::text = ANY ((ARRAY['AUCUN'::character varying, 'EN_ATTENTE'::character varying, 'VALIDE'::character varying])::text[]))),
    CONSTRAINT stages_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VALIDE'::character varying, 'EN_COURS'::character varying, 'TERMINE'::character varying, 'REJETE'::character varying, 'SUSPENDU'::character varying])::text[])))
);

--
-- Name: stages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stages_id_seq OWNED BY public.stages.id;

--
-- Name: sujets_tfc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sujets_tfc (
    id bigint NOT NULL,
    date_creation timestamp(6) without time zone,
    description text NOT NULL,
    domaine character varying(255),
    niveau character varying(255),
    professeur_id bigint NOT NULL,
    professeur_nom character varying(255),
    statut character varying(255) NOT NULL,
    titre character varying(255) NOT NULL,
    CONSTRAINT sujets_tfc_statut_check CHECK (((statut)::text = ANY ((ARRAY['PROPOSE'::character varying, 'VALIDE'::character varying, 'REFUSE'::character varying, 'ATTRIBUE'::character varying])::text[])))
);

--
-- Name: sujets_tfc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sujets_tfc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: sujets_tfc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sujets_tfc_id_seq OWNED BY public.sujets_tfc.id;

--
-- Name: supports_cours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supports_cours (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    description text,
    nom_fichier_original character varying(255),
    professeur_id bigint NOT NULL,
    s3_key character varying(500) NOT NULL,
    taille_octets bigint,
    titre character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    url character varying(1000),
    cours_id bigint NOT NULL,
    CONSTRAINT supports_cours_type_check CHECK (((type)::text = ANY ((ARRAY['PDF'::character varying, 'VIDEO'::character varying, 'DOCUMENT'::character varying, 'PPT'::character varying])::text[])))
);

--
-- Name: supports_cours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supports_cours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: supports_cours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supports_cours_id_seq OWNED BY public.supports_cours.id;

--
-- Name: surveillances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surveillances (
    id bigint NOT NULL,
    cree_le timestamp(6) without time zone,
    date_surveillance date,
    heure_debut character varying(255),
    heure_fin character varying(255),
    examen_id bigint NOT NULL,
    salle_id bigint NOT NULL,
    surveillant_id bigint NOT NULL
);

--
-- Name: surveillances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.surveillances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: surveillances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.surveillances_id_seq OWNED BY public.surveillances.id;

--
-- Name: tentatives_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tentatives_quiz (
    id bigint NOT NULL,
    tentative_numero integer DEFAULT 1,
    note_totale double precision,
    reussi boolean DEFAULT false,
    date_debut timestamp without time zone,
    date_fin timestamp without time zone,
    statut character varying(20) DEFAULT 'EN_COURS'::character varying,
    quiz_id bigint NOT NULL,
    inscription_id bigint NOT NULL
);

--
-- Name: tentatives_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tentatives_quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: tentatives_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tentatives_quiz_id_seq OWNED BY public.tentatives_quiz.id;

--
-- Name: tfc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tfc (
    id bigint NOT NULL,
    annee_academique character varying(255),
    date_creation timestamp(6) without time zone,
    date_limite date,
    date_soutenance timestamp(6) without time zone,
    motif_rejet character varying(255),
    professeur_id bigint NOT NULL,
    professeur_nom character varying(255),
    progression integer,
    statut character varying(255) NOT NULL,
    sujet character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    inscription_id bigint NOT NULL,
    sujet_ref_id bigint,
    CONSTRAINT tfc_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'EN_COURS'::character varying, 'SOUTENU'::character varying, 'VALIDE'::character varying, 'REJETE'::character varying])::text[]))),
    CONSTRAINT tfc_type_check CHECK (((type)::text = ANY ((ARRAY['MEMOIRE'::character varying, 'TFC'::character varying, 'THESE'::character varying])::text[])))
);

--
-- Name: tfc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tfc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: tfc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tfc_id_seq OWNED BY public.tfc.id;

--
-- Name: transaction_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_logs (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone,
    message text,
    status_from character varying(30),
    status_to character varying(30) NOT NULL,
    transaction_id bigint NOT NULL,
    CONSTRAINT transaction_logs_status_from_check CHECK (((status_from)::text = ANY ((ARRAY['INITIATED'::character varying, 'PENDING'::character varying, 'PROCESSING'::character varying, 'CONFIRMED'::character varying, 'SUCCESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying, 'DISPUTED'::character varying, 'RECONCILED'::character varying, 'EXPIRED'::character varying, 'REJECTED'::character varying, 'VERIFIED'::character varying])::text[]))),
    CONSTRAINT transaction_logs_status_to_check CHECK (((status_to)::text = ANY ((ARRAY['INITIATED'::character varying, 'PENDING'::character varying, 'PROCESSING'::character varying, 'CONFIRMED'::character varying, 'SUCCESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying, 'DISPUTED'::character varying, 'RECONCILED'::character varying, 'EXPIRED'::character varying, 'REJECTED'::character varying, 'VERIFIED'::character varying])::text[])))
);

--
-- Name: transaction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: transaction_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaction_logs_id_seq OWNED BY public.transaction_logs.id;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id bigint NOT NULL,
    amount_fc numeric(15,2) NOT NULL,
    amount_usd numeric(15,2),
    callback_data text,
    completed_at timestamp(6) without time zone,
    confirmed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    currency_used character varying(3),
    description character varying(500),
    exchange_rate_used numeric(10,4),
    initiated_at timestamp(6) without time zone NOT NULL,
    notes text,
    payment_method character varying(255) NOT NULL,
    payment_status character varying(255),
    provider_transaction_id character varying(255),
    receipt_number character varying(100),
    reference_number character varying(100),
    transaction_code character varying(100) NOT NULL,
    transaction_status character varying(255),
    transaction_type character varying(50) NOT NULL,
    updated_at timestamp(6) without time zone,
    created_by bigint,
    payment_provider_id bigint,
    processed_by bigint,
    student_id bigint,
    universite_id bigint NOT NULL,
    CONSTRAINT transactions_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['VODACOM_MPESA'::character varying, 'AIRTEL_MONEY'::character varying, 'ORANGE_MONEY'::character varying, 'BANK_TRANSFER'::character varying, 'CARD'::character varying, 'CASH'::character varying, 'CHEQUE'::character varying])::text[]))),
    CONSTRAINT transactions_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['PENDING'::character varying, 'PROCESSING'::character varying, 'CONFIRMED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying, 'DISPUTED'::character varying, 'RECONCILED'::character varying])::text[]))),
    CONSTRAINT transactions_transaction_status_check CHECK (((transaction_status)::text = ANY ((ARRAY['INITIATED'::character varying, 'PENDING'::character varying, 'PROCESSING'::character varying, 'CONFIRMED'::character varying, 'SUCCESS'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying, 'DISPUTED'::character varying, 'RECONCILED'::character varying, 'EXPIRED'::character varying, 'REJECTED'::character varying, 'VERIFIED'::character varying])::text[])))
);

--
-- Name: transactions_externes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_externes (
    id bigint NOT NULL,
    paiement_id bigint NOT NULL,
    provider character varying(50) NOT NULL,
    external_id character varying(255) NOT NULL,
    status character varying(30) NOT NULL,
    raw_response text,
    raw_request text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone
);

--
-- Name: transactions_externes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_externes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: transactions_externes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_externes_id_seq OWNED BY public.transactions_externes.id;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;

--
-- Name: travaux_devoirs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.travaux_devoirs (
    id bigint NOT NULL,
    annee_academique character varying(255),
    annule boolean NOT NULL,
    coefficient double precision,
    cree_le timestamp(6) without time zone,
    date_echeance timestamp(6) without time zone NOT NULL,
    description text,
    nom_fichier_consignes character varying(255),
    professeur_id bigint NOT NULL,
    professeur_nom character varying(255),
    titre character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    url_consignes character varying(255),
    cours_id bigint NOT NULL,
    CONSTRAINT travaux_devoirs_type_check CHECK (((type)::text = ANY ((ARRAY['DEVOIR'::character varying, 'TP'::character varying, 'PROJET'::character varying, 'EXERCICE'::character varying])::text[])))
);

--
-- Name: travaux_devoirs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.travaux_devoirs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: travaux_devoirs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.travaux_devoirs_id_seq OWNED BY public.travaux_devoirs.id;

--
-- Name: universite_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universite_configurations (
    id bigint NOT NULL,
    academic_year_format character varying(20),
    created_at timestamp(6) without time zone NOT NULL,
    credit_hours_per_course integer,
    footer_text text,
    grading_system character varying(50),
    language character varying(20),
    logo_url character varying(500),
    minimum_passing_grade numeric(5,2),
    primary_currency character varying(3),
    secondary_currency character varying(3),
    timezone character varying(100),
    updated_at timestamp(6) without time zone,
    universite_id bigint NOT NULL,
    updated_by bigint
);

--
-- Name: universite_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.universite_configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: universite_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.universite_configurations_id_seq OWNED BY public.universite_configurations.id;

--
-- Name: universite_departements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universite_departements (
    universite_id bigint NOT NULL,
    nom character varying(255) NOT NULL
);

--
-- Name: universite_facultes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universite_facultes (
    universite_id bigint NOT NULL,
    nom character varying(255) NOT NULL
);

--
-- Name: universite_payment_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universite_payment_settings (
    id bigint NOT NULL,
    allow_partial_payments boolean,
    created_at timestamp(6) without time zone NOT NULL,
    discount_if_paid_early numeric(5,2),
    late_payment_interest numeric(5,2),
    max_payment_delay_days integer,
    payment_methods text[],
    primary_currency character varying(3),
    updated_at timestamp(6) without time zone,
    webhook_secret character varying(255),
    universite_id bigint NOT NULL,
    updated_by bigint
);

--
-- Name: universite_payment_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.universite_payment_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: universite_payment_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.universite_payment_settings_id_seq OWNED BY public.universite_payment_settings.id;

--
-- Name: universite_promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universite_promotions (
    universite_id bigint NOT NULL,
    nom character varying(255) NOT NULL
);

--
-- Name: universites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universites (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    ville character varying(100) NOT NULL,
    adresse text,
    telephone character varying(50),
    email character varying(255),
    site_web character varying(255),
    logo text,
    annee_fondation integer,
    description text,
    inscriptions_ouvertes boolean DEFAULT false,
    frais_base double precision DEFAULT 0.0,
    actif boolean DEFAULT true,
    cree_le timestamp without time zone DEFAULT now(),
    agrement_date date,
    type_etablissement character varying(50),
    statut character varying(50),
    agrement_numero character varying(50),
    rccm character varying(50),
    id_nat character varying(50),
    nif character varying(50),
    province character varying(100),
    commune character varying(100),
    quartier character varying(100),
    avenue character varying(150),
    parcelle character varying(50),
    gps character varying(100),
    telephone_secondaire character varying(50),
    facebook character varying(150),
    linkedin character varying(150),
    sceau text,
    couleur_principale character varying(7),
    signature text,
    recteur_nom character varying(100),
    recteur_postnom character varying(100),
    recteur_prenom character varying(100),
    recteur_telephone character varying(50),
    recteur_email character varying(150),
    annee_academique character varying(20),
    systeme_notation character varying(20),
    seuil_reussite integer,
    max_sessions integer,
    lmd boolean,
    devise character varying(10),
    frais_academiques double precision,
    frais_inscription double precision,
    frais_laboratoire double precision,
    frais_bibliotheque double precision,
    logo_url character varying(255),
    document_agrement_url character varying(255),
    document_arrete_url character varying(255),
    document_statuts_url character varying(255)
);

--
-- Name: universites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.universites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: universites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.universites_id_seq OWNED BY public.universites.id;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id bigint NOT NULL,
    assigned_at timestamp(6) without time zone NOT NULL,
    assigned_until timestamp(6) without time zone,
    is_active boolean,
    assigned_by bigint,
    role_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    user_id bigint NOT NULL
);

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;

--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateurs (
    id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    telephone character varying(50),
    role character varying(30) NOT NULL,
    universite_id bigint,
    departement_id bigint,
    inscription_id bigint,
    actif boolean DEFAULT true,
    compte_active boolean DEFAULT false,
    token_activation character varying(255),
    token_expiration timestamp without time zone,
    date_activation timestamp without time zone,
    dernier_login timestamp without time zone,
    cree_le timestamp without time zone DEFAULT now(),
    two_factor_enabled boolean,
    two_factor_secret character varying(255)
);

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utilisateurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: utilisateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utilisateurs_id_seq OWNED BY public.utilisateurs.id;

--
-- Name: vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacations (
    id bigint NOT NULL,
    actif boolean NOT NULL,
    capacite_max integer,
    cree_le timestamp(6) without time zone,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    description text,
    devise_frais character varying(255),
    frais_inscription double precision,
    inscriptions_ouvertes boolean NOT NULL,
    modifie_le timestamp(6) without time zone,
    nom character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    annee_academique_id bigint NOT NULL,
    universite_id bigint NOT NULL,
    CONSTRAINT vacations_type_check CHECK (((type)::text = ANY ((ARRAY['JOUR'::character varying, 'SOIR'::character varying])::text[])))
);

--
-- Name: vacations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vacations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: vacations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vacations_id_seq OWNED BY public.vacations.id;

--
-- Name: validations_paie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validations_paie (
    id bigint NOT NULL,
    paie_id bigint NOT NULL,
    statut character varying(50),
    commentaire text,
    valide_par_id bigint,
    cree_par_id bigint,
    date_validation timestamp without time zone,
    date_creation timestamp without time zone
);

--
-- Name: validations_paie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.validations_paie_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: validations_paie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.validations_paie_id_seq OWNED BY public.validations_paie.id;

--
-- Name: affectations_frais id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais ALTER COLUMN id SET DEFAULT nextval('public.affectations_frais_id_seq'::regclass);

--
-- Name: aides_sociales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aides_sociales ALTER COLUMN id SET DEFAULT nextval('public.aides_sociales_id_seq'::regclass);

--
-- Name: alertes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertes ALTER COLUMN id SET DEFAULT nextval('public.alertes_id_seq'::regclass);

--
-- Name: annees_academiques id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_academiques ALTER COLUMN id SET DEFAULT nextval('public.annees_academiques_id_seq'::regclass);

--
-- Name: association_membres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_membres ALTER COLUMN id SET DEFAULT nextval('public.association_membres_id_seq'::regclass);

--
-- Name: associations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associations ALTER COLUMN id SET DEFAULT nextval('public.associations_id_seq'::regclass);

--
-- Name: attestations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations ALTER COLUMN id SET DEFAULT nextval('public.attestations_id_seq'::regclass);

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);

--
-- Name: baremes_evaluation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baremes_evaluation ALTER COLUMN id SET DEFAULT nextval('public.baremes_evaluation_id_seq'::regclass);

--
-- Name: baremes_paiement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baremes_paiement ALTER COLUMN id SET DEFAULT nextval('public.baremes_paiement_id_seq'::regclass);

--
-- Name: bons_paiement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_paiement ALTER COLUMN id SET DEFAULT nextval('public.bons_paiement_id_seq'::regclass);

--
-- Name: bourse_offres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourse_offres ALTER COLUMN id SET DEFAULT nextval('public.bourse_offres_id_seq'::regclass);

--
-- Name: bourses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourses ALTER COLUMN id SET DEFAULT nextval('public.bourses_id_seq'::regclass);

--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);

--
-- Name: caisses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caisses ALTER COLUMN id SET DEFAULT nextval('public.caisses_id_seq'::regclass);

--
-- Name: calendrier_academique id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendrier_academique ALTER COLUMN id SET DEFAULT nextval('public.calendrier_academique_id_seq'::regclass);

--
-- Name: candidatures_bourse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_bourse ALTER COLUMN id SET DEFAULT nextval('public.candidatures_bourse_id_seq'::regclass);

--
-- Name: candidatures_stage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_stage ALTER COLUMN id SET DEFAULT nextval('public.candidatures_stage_id_seq'::regclass);

--
-- Name: categories_frais id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_frais ALTER COLUMN id SET DEFAULT nextval('public.categories_frais_id_seq'::regclass);

--
-- Name: categories_ouvrage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_ouvrage ALTER COLUMN id SET DEFAULT nextval('public.categories_ouvrage_id_seq'::regclass);

--
-- Name: chapitres_tfc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapitres_tfc ALTER COLUMN id SET DEFAULT nextval('public.chapitres_tfc_id_seq'::regclass);

--
-- Name: charges_horaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges_horaires ALTER COLUMN id SET DEFAULT nextval('public.charges_horaires_id_seq'::regclass);

--
-- Name: commentaires_tfc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaires_tfc ALTER COLUMN id SET DEFAULT nextval('public.commentaires_tfc_id_seq'::regclass);

--
-- Name: comptes_comptables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_comptables ALTER COLUMN id SET DEFAULT nextval('public.comptes_comptables_id_seq'::regclass);

--
-- Name: conferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conferences ALTER COLUMN id SET DEFAULT nextval('public.conferences_id_seq'::regclass);

--
-- Name: connexion_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connexion_logs ALTER COLUMN id SET DEFAULT nextval('public.connexion_logs_id_seq'::regclass);

--
-- Name: contrats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats ALTER COLUMN id SET DEFAULT nextval('public.contrats_id_seq'::regclass);

--
-- Name: controle_cours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controle_cours ALTER COLUMN id SET DEFAULT nextval('public.controle_cours_id_seq'::regclass);

--
-- Name: cours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours ALTER COLUMN id SET DEFAULT nextval('public.cours_id_seq'::regclass);

--
-- Name: cours_vacations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations ALTER COLUMN id SET DEFAULT nextval('public.cours_vacations_id_seq'::regclass);

--
-- Name: criteres_deliberation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criteres_deliberation ALTER COLUMN id SET DEFAULT nextval('public.criteres_deliberation_id_seq'::regclass);

--
-- Name: deliberations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations ALTER COLUMN id SET DEFAULT nextval('public.deliberations_id_seq'::regclass);

--
-- Name: delibererations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations ALTER COLUMN id SET DEFAULT nextval('public.delibererations_id_seq'::regclass);

--
-- Name: departements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements ALTER COLUMN id SET DEFAULT nextval('public.departements_id_seq'::regclass);

--
-- Name: depenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses ALTER COLUMN id SET DEFAULT nextval('public.depenses_id_seq'::regclass);

--
-- Name: device_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens ALTER COLUMN id SET DEFAULT nextval('public.device_tokens_id_seq'::regclass);

--
-- Name: documents_etudiants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents_etudiants ALTER COLUMN id SET DEFAULT nextval('public.documents_etudiants_id_seq'::regclass);

--
-- Name: dossiers_inscription id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_inscription ALTER COLUMN id SET DEFAULT nextval('public.dossiers_inscription_id_seq'::regclass);

--
-- Name: dossiers_sociaux id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_sociaux ALTER COLUMN id SET DEFAULT nextval('public.dossiers_sociaux_id_seq'::regclass);

--
-- Name: echeances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances ALTER COLUMN id SET DEFAULT nextval('public.echeances_id_seq'::regclass);

--
-- Name: echeanciers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers ALTER COLUMN id SET DEFAULT nextval('public.echeanciers_id_seq'::regclass);

--
-- Name: ecritures_comptables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables ALTER COLUMN id SET DEFAULT nextval('public.ecritures_comptables_id_seq'::regclass);

--
-- Name: emprunts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts ALTER COLUMN id SET DEFAULT nextval('public.emprunts_id_seq'::regclass);

--
-- Name: equivalences_diplomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalences_diplomes ALTER COLUMN id SET DEFAULT nextval('public.equivalences_diplomes_id_seq'::regclass);

--
-- Name: etudiants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etudiants ALTER COLUMN id SET DEFAULT nextval('public.etudiants_id_seq'::regclass);

--
-- Name: evenement_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_participants ALTER COLUMN id SET DEFAULT nextval('public.evenement_participants_id_seq'::regclass);

--
-- Name: evenements_universitaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_universitaires ALTER COLUMN id SET DEFAULT nextval('public.evenements_universitaires_id_seq'::regclass);

--
-- Name: examens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens ALTER COLUMN id SET DEFAULT nextval('public.examens_id_seq'::regclass);

--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);

--
-- Name: facultes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facultes ALTER COLUMN id SET DEFAULT nextval('public.facultes_id_seq'::regclass);

--
-- Name: filieres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres ALTER COLUMN id SET DEFAULT nextval('public.filieres_id_seq'::regclass);

--
-- Name: frais id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais ALTER COLUMN id SET DEFAULT nextval('public.frais_id_seq'::regclass);

--
-- Name: hierarchical_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access ALTER COLUMN id SET DEFAULT nextval('public.hierarchical_access_id_seq'::regclass);

--
-- Name: horaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horaires ALTER COLUMN id SET DEFAULT nextval('public.horaires_id_seq'::regclass);

--
-- Name: informations_bancaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informations_bancaires ALTER COLUMN id SET DEFAULT nextval('public.informations_bancaires_id_seq'::regclass);

--
-- Name: inscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions ALTER COLUMN id SET DEFAULT nextval('public.inscriptions_id_seq'::regclass);

--
-- Name: inscriptions_vacations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations ALTER COLUMN id SET DEFAULT nextval('public.inscriptions_vacations_id_seq'::regclass);

--
-- Name: laboratoires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratoires ALTER COLUMN id SET DEFAULT nextval('public.laboratoires_id_seq'::regclass);

--
-- Name: lecons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons ALTER COLUMN id SET DEFAULT nextval('public.lecons_id_seq'::regclass);

--
-- Name: lettres_acceptation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation ALTER COLUMN id SET DEFAULT nextval('public.lettres_acceptation_id_seq'::regclass);

--
-- Name: lignes_releve id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_releve ALTER COLUMN id SET DEFAULT nextval('public.lignes_releve_id_seq'::regclass);

--
-- Name: livres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livres ALTER COLUMN id SET DEFAULT nextval('public.livres_id_seq'::regclass);

--
-- Name: meilleurs_etudiants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meilleurs_etudiants ALTER COLUMN id SET DEFAULT nextval('public.meilleurs_etudiants_id_seq'::regclass);

--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);

--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);

--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

--
-- Name: offres_stage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_stage ALTER COLUMN id SET DEFAULT nextval('public.offres_stage_id_seq'::regclass);

--
-- Name: operations_caisse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations_caisse ALTER COLUMN id SET DEFAULT nextval('public.operations_caisse_id_seq'::regclass);

--
-- Name: options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options ALTER COLUMN id SET DEFAULT nextval('public.options_id_seq'::regclass);

--
-- Name: paiements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements ALTER COLUMN id SET DEFAULT nextval('public.paiements_id_seq'::regclass);

--
-- Name: paies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paies ALTER COLUMN id SET DEFAULT nextval('public.paies_id_seq'::regclass);

--
-- Name: parametres_lmd id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_lmd ALTER COLUMN id SET DEFAULT nextval('public.parametres_lmd_id_seq'::regclass);

--
-- Name: parametres_notification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_notification ALTER COLUMN id SET DEFAULT nextval('public.parametres_notification_id_seq'::regclass);

--
-- Name: parametres_palmares id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_palmares ALTER COLUMN id SET DEFAULT nextval('public.parametres_palmares_id_seq'::regclass);

--
-- Name: parametres_universite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_universite ALTER COLUMN id SET DEFAULT nextval('public.parametres_universite_id_seq'::regclass);

--
-- Name: payment_providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_providers ALTER COLUMN id SET DEFAULT nextval('public.payment_providers_id_seq'::regclass);

--
-- Name: payment_reconciliation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reconciliation ALTER COLUMN id SET DEFAULT nextval('public.payment_reconciliation_id_seq'::regclass);

--
-- Name: payment_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports ALTER COLUMN id SET DEFAULT nextval('public.payment_reports_id_seq'::regclass);

--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);

--
-- Name: personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel ALTER COLUMN id SET DEFAULT nextval('public.personnel_id_seq'::regclass);

--
-- Name: presences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences ALTER COLUMN id SET DEFAULT nextval('public.presences_id_seq'::regclass);

--
-- Name: presences_personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_personnel ALTER COLUMN id SET DEFAULT nextval('public.presences_personnel_id_seq'::regclass);

--
-- Name: progressions_etudiants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants ALTER COLUMN id SET DEFAULT nextval('public.progressions_etudiants_id_seq'::regclass);

--
-- Name: projets_recherche id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projets_recherche ALTER COLUMN id SET DEFAULT nextval('public.projets_recherche_id_seq'::regclass);

--
-- Name: promotions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions ALTER COLUMN id SET DEFAULT nextval('public.promotions_id_seq'::regclass);

--
-- Name: publications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publications ALTER COLUMN id SET DEFAULT nextval('public.publications_id_seq'::regclass);

--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);

--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);

--
-- Name: reconciliation_details id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_details ALTER COLUMN id SET DEFAULT nextval('public.reconciliation_details_id_seq'::regclass);

--
-- Name: recours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recours ALTER COLUMN id SET DEFAULT nextval('public.recours_id_seq'::regclass);

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);

--
-- Name: refunds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);

--
-- Name: regles_signature_document id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_signature_document ALTER COLUMN id SET DEFAULT nextval('public.regles_signature_document_id_seq'::regclass);

--
-- Name: releves_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releves_notes ALTER COLUMN id SET DEFAULT nextval('public.releves_notes_id_seq'::regclass);

--
-- Name: remboursements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remboursements ALTER COLUMN id SET DEFAULT nextval('public.remboursements_id_seq'::regclass);

--
-- Name: reponses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses ALTER COLUMN id SET DEFAULT nextval('public.reponses_id_seq'::regclass);

--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);

--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);

--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);

--
-- Name: salles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salles ALTER COLUMN id SET DEFAULT nextval('public.salles_id_seq'::regclass);

--
-- Name: seances_live id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seances_live ALTER COLUMN id SET DEFAULT nextval('public.seances_live_id_seq'::regclass);

--
-- Name: security_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events ALTER COLUMN id SET DEFAULT nextval('public.security_events_id_seq'::regclass);

--
-- Name: services_universite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services_universite ALTER COLUMN id SET DEFAULT nextval('public.services_universite_id_seq'::regclass);

--
-- Name: signataires_universite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signataires_universite ALTER COLUMN id SET DEFAULT nextval('public.signataires_universite_id_seq'::regclass);

--
-- Name: signatures_electroniques id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures_electroniques ALTER COLUMN id SET DEFAULT nextval('public.signatures_electroniques_id_seq'::regclass);

--
-- Name: sms_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_logs ALTER COLUMN id SET DEFAULT nextval('public.sms_logs_id_seq'::regclass);

--
-- Name: soumissions_travaux id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_travaux ALTER COLUMN id SET DEFAULT nextval('public.soumissions_travaux_id_seq'::regclass);

--
-- Name: stages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stages ALTER COLUMN id SET DEFAULT nextval('public.stages_id_seq'::regclass);

--
-- Name: sujets_tfc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sujets_tfc ALTER COLUMN id SET DEFAULT nextval('public.sujets_tfc_id_seq'::regclass);

--
-- Name: supports_cours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supports_cours ALTER COLUMN id SET DEFAULT nextval('public.supports_cours_id_seq'::regclass);

--
-- Name: surveillances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveillances ALTER COLUMN id SET DEFAULT nextval('public.surveillances_id_seq'::regclass);

--
-- Name: tentatives_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentatives_quiz ALTER COLUMN id SET DEFAULT nextval('public.tentatives_quiz_id_seq'::regclass);

--
-- Name: tfc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tfc ALTER COLUMN id SET DEFAULT nextval('public.tfc_id_seq'::regclass);

--
-- Name: transaction_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs ALTER COLUMN id SET DEFAULT nextval('public.transaction_logs_id_seq'::regclass);

--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);

--
-- Name: transactions_externes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_externes ALTER COLUMN id SET DEFAULT nextval('public.transactions_externes_id_seq'::regclass);

--
-- Name: travaux_devoirs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_devoirs ALTER COLUMN id SET DEFAULT nextval('public.travaux_devoirs_id_seq'::regclass);

--
-- Name: universite_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_configurations ALTER COLUMN id SET DEFAULT nextval('public.universite_configurations_id_seq'::regclass);

--
-- Name: universite_payment_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_payment_settings ALTER COLUMN id SET DEFAULT nextval('public.universite_payment_settings_id_seq'::regclass);

--
-- Name: universites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universites ALTER COLUMN id SET DEFAULT nextval('public.universites_id_seq'::regclass);

--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);

--
-- Name: utilisateurs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs ALTER COLUMN id SET DEFAULT nextval('public.utilisateurs_id_seq'::regclass);

--
-- Name: vacations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations ALTER COLUMN id SET DEFAULT nextval('public.vacations_id_seq'::regclass);

--
-- Name: validations_paie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations_paie ALTER COLUMN id SET DEFAULT nextval('public.validations_paie_id_seq'::regclass);

--
-- Name: affectations_frais affectations_frais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais
    ADD CONSTRAINT affectations_frais_pkey PRIMARY KEY (id);

--
-- Name: aides_sociales aides_sociales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aides_sociales
    ADD CONSTRAINT aides_sociales_pkey PRIMARY KEY (id);

--
-- Name: alertes alertes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertes
    ADD CONSTRAINT alertes_pkey PRIMARY KEY (id);

--
-- Name: annees_academiques annees_academiques_libelle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_academiques
    ADD CONSTRAINT annees_academiques_libelle_key UNIQUE (libelle);

--
-- Name: annees_academiques annees_academiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_academiques
    ADD CONSTRAINT annees_academiques_pkey PRIMARY KEY (id);

--
-- Name: association_membres association_membres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_membres
    ADD CONSTRAINT association_membres_pkey PRIMARY KEY (id);

--
-- Name: associations associations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associations
    ADD CONSTRAINT associations_pkey PRIMARY KEY (id);

--
-- Name: attestations attestations_numero_attestation_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_numero_attestation_key UNIQUE (numero_attestation);

--
-- Name: attestations attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_pkey PRIMARY KEY (id);

--
-- Name: attestations attestations_uuid_verification_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_uuid_verification_key UNIQUE (uuid_verification);

--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

--
-- Name: baremes_evaluation baremes_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baremes_evaluation
    ADD CONSTRAINT baremes_evaluation_pkey PRIMARY KEY (id);

--
-- Name: baremes_paiement baremes_paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baremes_paiement
    ADD CONSTRAINT baremes_paiement_pkey PRIMARY KEY (id);

--
-- Name: bons_paiement bons_paiement_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_paiement
    ADD CONSTRAINT bons_paiement_numero_key UNIQUE (numero);

--
-- Name: bons_paiement bons_paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_paiement
    ADD CONSTRAINT bons_paiement_pkey PRIMARY KEY (id);

--
-- Name: bourse_offres bourse_offres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourse_offres
    ADD CONSTRAINT bourse_offres_pkey PRIMARY KEY (id);

--
-- Name: bourses bourses_numero_bourse_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourses
    ADD CONSTRAINT bourses_numero_bourse_key UNIQUE (numero_bourse);

--
-- Name: bourses bourses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourses
    ADD CONSTRAINT bourses_pkey PRIMARY KEY (id);

--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);

--
-- Name: caisses caisses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caisses
    ADD CONSTRAINT caisses_pkey PRIMARY KEY (id);

--
-- Name: calendrier_academique calendrier_academique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendrier_academique
    ADD CONSTRAINT calendrier_academique_pkey PRIMARY KEY (id);

--
-- Name: candidatures_bourse candidatures_bourse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_bourse
    ADD CONSTRAINT candidatures_bourse_pkey PRIMARY KEY (id);

--
-- Name: candidatures_stage candidatures_stage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_stage
    ADD CONSTRAINT candidatures_stage_pkey PRIMARY KEY (id);

--
-- Name: categories_frais categories_frais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_frais
    ADD CONSTRAINT categories_frais_pkey PRIMARY KEY (id);

--
-- Name: categories_ouvrage categories_ouvrage_nom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_ouvrage
    ADD CONSTRAINT categories_ouvrage_nom_key UNIQUE (nom);

--
-- Name: categories_ouvrage categories_ouvrage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_ouvrage
    ADD CONSTRAINT categories_ouvrage_pkey PRIMARY KEY (id);

--
-- Name: chapitres_tfc chapitres_tfc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapitres_tfc
    ADD CONSTRAINT chapitres_tfc_pkey PRIMARY KEY (id);

--
-- Name: charges_horaires charges_horaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges_horaires
    ADD CONSTRAINT charges_horaires_pkey PRIMARY KEY (id);

--
-- Name: commentaires_tfc commentaires_tfc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaires_tfc
    ADD CONSTRAINT commentaires_tfc_pkey PRIMARY KEY (id);

--
-- Name: comptes_comptables comptes_comptables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_comptables
    ADD CONSTRAINT comptes_comptables_pkey PRIMARY KEY (id);

--
-- Name: conferences conferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conferences
    ADD CONSTRAINT conferences_pkey PRIMARY KEY (id);

--
-- Name: conges conges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges
    ADD CONSTRAINT conges_pkey PRIMARY KEY (id);

--
-- Name: connexion_logs connexion_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connexion_logs
    ADD CONSTRAINT connexion_logs_pkey PRIMARY KEY (id);

--
-- Name: contrats contrats_numero_contrat_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_numero_contrat_key UNIQUE (numero_contrat);

--
-- Name: contrats contrats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_pkey PRIMARY KEY (id);

--
-- Name: controle_cours controle_cours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controle_cours
    ADD CONSTRAINT controle_cours_pkey PRIMARY KEY (id);

--
-- Name: cours cours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours
    ADD CONSTRAINT cours_pkey PRIMARY KEY (id);

--
-- Name: cours_vacations cours_vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations
    ADD CONSTRAINT cours_vacations_pkey PRIMARY KEY (id);

--
-- Name: criteres_deliberation criteres_deliberation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criteres_deliberation
    ADD CONSTRAINT criteres_deliberation_pkey PRIMARY KEY (id);

--
-- Name: criteres_deliberation criteres_deliberation_promotion_id_annee_academique_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criteres_deliberation
    ADD CONSTRAINT criteres_deliberation_promotion_id_annee_academique_id_key UNIQUE (promotion_id, annee_academique_id);

--
-- Name: deliberations deliberations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT deliberations_pkey PRIMARY KEY (id);

--
-- Name: delibererations delibererations_code_diplome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_code_diplome_key UNIQUE (code_diplome);

--
-- Name: delibererations delibererations_inscription_id_annee_academique_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_inscription_id_annee_academique_key UNIQUE (inscription_id, annee_academique);

--
-- Name: delibererations delibererations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_pkey PRIMARY KEY (id);

--
-- Name: delibererations delibererations_uuid_verification_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_uuid_verification_key UNIQUE (uuid_verification);

--
-- Name: departements departements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_pkey PRIMARY KEY (id);

--
-- Name: depenses depenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT depenses_pkey PRIMARY KEY (id);

--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);

--
-- Name: documents_etudiants documents_etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents_etudiants
    ADD CONSTRAINT documents_etudiants_pkey PRIMARY KEY (id);

--
-- Name: dossiers_inscription dossiers_inscription_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_inscription
    ADD CONSTRAINT dossiers_inscription_email_key UNIQUE (email);

--
-- Name: dossiers_inscription dossiers_inscription_numero_dossier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_inscription
    ADD CONSTRAINT dossiers_inscription_numero_dossier_key UNIQUE (numero_dossier);

--
-- Name: dossiers_inscription dossiers_inscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_inscription
    ADD CONSTRAINT dossiers_inscription_pkey PRIMARY KEY (id);

--
-- Name: dossiers_sociaux dossiers_sociaux_numero_dossier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_sociaux
    ADD CONSTRAINT dossiers_sociaux_numero_dossier_key UNIQUE (numero_dossier);

--
-- Name: dossiers_sociaux dossiers_sociaux_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_sociaux
    ADD CONSTRAINT dossiers_sociaux_pkey PRIMARY KEY (id);

--
-- Name: echeances echeances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances
    ADD CONSTRAINT echeances_pkey PRIMARY KEY (id);

--
-- Name: echeanciers echeanciers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers
    ADD CONSTRAINT echeanciers_pkey PRIMARY KEY (id);

--
-- Name: ecritures_comptables ecritures_comptables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT ecritures_comptables_pkey PRIMARY KEY (id);

--
-- Name: emprunts emprunts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts
    ADD CONSTRAINT emprunts_pkey PRIMARY KEY (id);

--
-- Name: equivalences_diplomes equivalences_diplomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalences_diplomes
    ADD CONSTRAINT equivalences_diplomes_pkey PRIMARY KEY (id);

--
-- Name: etudiants etudiants_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_email_key UNIQUE (email);

--
-- Name: etudiants etudiants_matricule_permanent_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_matricule_permanent_key UNIQUE (matricule_permanent);

--
-- Name: etudiants etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_pkey PRIMARY KEY (id);

--
-- Name: evenement_participants evenement_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_participants
    ADD CONSTRAINT evenement_participants_pkey PRIMARY KEY (id);

--
-- Name: evenements_universitaires evenements_universitaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_universitaires
    ADD CONSTRAINT evenements_universitaires_pkey PRIMARY KEY (id);

--
-- Name: examens examens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_pkey PRIMARY KEY (id);

--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);

--
-- Name: facultes facultes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facultes
    ADD CONSTRAINT facultes_pkey PRIMARY KEY (id);

--
-- Name: filieres filieres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_pkey PRIMARY KEY (id);

--
-- Name: frais frais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais
    ADD CONSTRAINT frais_pkey PRIMARY KEY (id);

--
-- Name: hierarchical_access hierarchical_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT hierarchical_access_pkey PRIMARY KEY (id);

--
-- Name: horaires horaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horaires
    ADD CONSTRAINT horaires_pkey PRIMARY KEY (id);

--
-- Name: informations_bancaires informations_bancaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informations_bancaires
    ADD CONSTRAINT informations_bancaires_pkey PRIMARY KEY (id);

--
-- Name: inscriptions inscriptions_matricule_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_matricule_key UNIQUE (matricule);

--
-- Name: inscriptions inscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_pkey PRIMARY KEY (id);

--
-- Name: inscriptions_vacations inscriptions_vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT inscriptions_vacations_pkey PRIMARY KEY (id);

--
-- Name: laboratoires laboratoires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratoires
    ADD CONSTRAINT laboratoires_pkey PRIMARY KEY (id);

--
-- Name: lecons lecons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons
    ADD CONSTRAINT lecons_pkey PRIMARY KEY (id);

--
-- Name: lettres_acceptation lettres_acceptation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT lettres_acceptation_pkey PRIMARY KEY (id);

--
-- Name: lignes_releve lignes_releve_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_releve
    ADD CONSTRAINT lignes_releve_pkey PRIMARY KEY (id);

--
-- Name: livres livres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livres
    ADD CONSTRAINT livres_pkey PRIMARY KEY (id);

--
-- Name: meilleurs_etudiants meilleurs_etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meilleurs_etudiants
    ADD CONSTRAINT meilleurs_etudiants_pkey PRIMARY KEY (id);

--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

--
-- Name: notes_questions notes_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_questions
    ADD CONSTRAINT notes_questions_pkey PRIMARY KEY (tentative_id, question_id);

--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--
-- Name: offres_stage offres_stage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_stage
    ADD CONSTRAINT offres_stage_pkey PRIMARY KEY (id);

--
-- Name: operations_caisse operations_caisse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations_caisse
    ADD CONSTRAINT operations_caisse_pkey PRIMARY KEY (id);

--
-- Name: options options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_pkey PRIMARY KEY (id);

--
-- Name: paiements paiements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_pkey PRIMARY KEY (id);

--
-- Name: paiements paiements_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_reference_key UNIQUE (reference);

--
-- Name: paies paies_numero_bulletin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paies
    ADD CONSTRAINT paies_numero_bulletin_key UNIQUE (numero_bulletin);

--
-- Name: paies paies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paies
    ADD CONSTRAINT paies_pkey PRIMARY KEY (id);

--
-- Name: parametres_lmd parametres_lmd_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_lmd
    ADD CONSTRAINT parametres_lmd_pkey PRIMARY KEY (id);

--
-- Name: parametres_notification parametres_notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_notification
    ADD CONSTRAINT parametres_notification_pkey PRIMARY KEY (id);

--
-- Name: parametres_palmares parametres_palmares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_palmares
    ADD CONSTRAINT parametres_palmares_pkey PRIMARY KEY (id);

--
-- Name: parametres_palmares parametres_palmares_universite_id_annee_academique_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_palmares
    ADD CONSTRAINT parametres_palmares_universite_id_annee_academique_key UNIQUE (universite_id, annee_academique);

--
-- Name: parametres_universite parametres_universite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_universite
    ADD CONSTRAINT parametres_universite_pkey PRIMARY KEY (id);

--
-- Name: parametres_universite parametres_universite_universite_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_universite
    ADD CONSTRAINT parametres_universite_universite_id_key UNIQUE (universite_id);

--
-- Name: payment_providers payment_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_providers
    ADD CONSTRAINT payment_providers_pkey PRIMARY KEY (id);

--
-- Name: payment_reconciliation payment_reconciliation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reconciliation
    ADD CONSTRAINT payment_reconciliation_pkey PRIMARY KEY (id);

--
-- Name: payment_reports payment_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports
    ADD CONSTRAINT payment_reports_pkey PRIMARY KEY (id);

--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);

--
-- Name: personnel personnel_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_email_key UNIQUE (email);

--
-- Name: personnel personnel_matricule_personnel_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_matricule_personnel_key UNIQUE (matricule_personnel);

--
-- Name: personnel personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_pkey PRIMARY KEY (id);

--
-- Name: presences_personnel presences_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_personnel
    ADD CONSTRAINT presences_personnel_pkey PRIMARY KEY (id);

--
-- Name: presences presences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_pkey PRIMARY KEY (id);

--
-- Name: progressions_etudiants progressions_etudiants_inscription_id_cours_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants
    ADD CONSTRAINT progressions_etudiants_inscription_id_cours_id_key UNIQUE (inscription_id, cours_id);

--
-- Name: progressions_etudiants progressions_etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants
    ADD CONSTRAINT progressions_etudiants_pkey PRIMARY KEY (id);

--
-- Name: projets_recherche projets_recherche_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projets_recherche
    ADD CONSTRAINT projets_recherche_pkey PRIMARY KEY (id);

--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);

--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (id);

--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);

--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);

--
-- Name: reconciliation_details reconciliation_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT reconciliation_details_pkey PRIMARY KEY (id);

--
-- Name: recours recours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recours
    ADD CONSTRAINT recours_pkey PRIMARY KEY (id);

--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);

--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);

--
-- Name: regles_signature_document regles_signature_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_signature_document
    ADD CONSTRAINT regles_signature_document_pkey PRIMARY KEY (id);

--
-- Name: releves_notes releves_notes_numero_releve_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releves_notes
    ADD CONSTRAINT releves_notes_numero_releve_key UNIQUE (numero_releve);

--
-- Name: releves_notes releves_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releves_notes
    ADD CONSTRAINT releves_notes_pkey PRIMARY KEY (id);

--
-- Name: releves_notes releves_notes_uuid_verification_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releves_notes
    ADD CONSTRAINT releves_notes_uuid_verification_key UNIQUE (uuid_verification);

--
-- Name: remboursements remboursements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remboursements
    ADD CONSTRAINT remboursements_pkey PRIMARY KEY (id);

--
-- Name: reponses_etudiant reponses_etudiant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_etudiant
    ADD CONSTRAINT reponses_etudiant_pkey PRIMARY KEY (tentative_id, question_id);

--
-- Name: reponses reponses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses
    ADD CONSTRAINT reponses_pkey PRIMARY KEY (id);

--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);

--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);

--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

--
-- Name: salles salles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salles
    ADD CONSTRAINT salles_pkey PRIMARY KEY (id);

--
-- Name: seances_live seances_live_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seances_live
    ADD CONSTRAINT seances_live_pkey PRIMARY KEY (id);

--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);

--
-- Name: services_universite services_universite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services_universite
    ADD CONSTRAINT services_universite_pkey PRIMARY KEY (id);

--
-- Name: signataires_universite signataires_universite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signataires_universite
    ADD CONSTRAINT signataires_universite_pkey PRIMARY KEY (id);

--
-- Name: signatures_electroniques signatures_electroniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures_electroniques
    ADD CONSTRAINT signatures_electroniques_pkey PRIMARY KEY (id);

--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);

--
-- Name: soumissions_travaux soumissions_travaux_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_travaux
    ADD CONSTRAINT soumissions_travaux_pkey PRIMARY KEY (id);

--
-- Name: stages stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_pkey PRIMARY KEY (id);

--
-- Name: sujets_tfc sujets_tfc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sujets_tfc
    ADD CONSTRAINT sujets_tfc_pkey PRIMARY KEY (id);

--
-- Name: supports_cours supports_cours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supports_cours
    ADD CONSTRAINT supports_cours_pkey PRIMARY KEY (id);

--
-- Name: surveillances surveillances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveillances
    ADD CONSTRAINT surveillances_pkey PRIMARY KEY (id);

--
-- Name: tentatives_quiz tentatives_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentatives_quiz
    ADD CONSTRAINT tentatives_quiz_pkey PRIMARY KEY (id);

--
-- Name: tfc tfc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tfc
    ADD CONSTRAINT tfc_pkey PRIMARY KEY (id);

--
-- Name: transaction_logs transaction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_pkey PRIMARY KEY (id);

--
-- Name: transactions_externes transactions_externes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_externes
    ADD CONSTRAINT transactions_externes_pkey PRIMARY KEY (id);

--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

--
-- Name: travaux_devoirs travaux_devoirs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_devoirs
    ADD CONSTRAINT travaux_devoirs_pkey PRIMARY KEY (id);

--
-- Name: user_roles uk3yrxeothmq02589fioj5c3ks8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uk3yrxeothmq02589fioj5c3ks8 UNIQUE (user_id, role_id, universite_id);

--
-- Name: notes uk43mwdcmk2g34efdrinvpei7hd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT uk43mwdcmk2g34efdrinvpei7hd UNIQUE (inscription_id, cours_id, annee_academique, session);

--
-- Name: progressions_etudiants uk6p16k9d6w71pihe5l4auvt86u; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants
    ADD CONSTRAINT uk6p16k9d6w71pihe5l4auvt86u UNIQUE (inscription_id, cours_id);

--
-- Name: device_tokens uk8se1i37nto56x9252rmrit8ib; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT uk8se1i37nto56x9252rmrit8ib UNIQUE (token);

--
-- Name: signatures_electroniques uk_26185p715slapoiy5ymiina7g; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures_electroniques
    ADD CONSTRAINT uk_26185p715slapoiy5ymiina7g UNIQUE (code_verification);

--
-- Name: frais uk_4gxpud0g3tmjukr5xo78gd6o0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais
    ADD CONSTRAINT uk_4gxpud0g3tmjukr5xo78gd6o0 UNIQUE (code);

--
-- Name: permissions uk_7lcb6glmvwlro3p2w2cewxtvd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uk_7lcb6glmvwlro3p2w2cewxtvd UNIQUE (code);

--
-- Name: comptes_comptables uk_bgpcm4mtx7c9jcqnypi27xov2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_comptables
    ADD CONSTRAINT uk_bgpcm4mtx7c9jcqnypi27xov2 UNIQUE (code);

--
-- Name: controle_cours uk_bmciw19xekcumh9efipdyx4bb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controle_cours
    ADD CONSTRAINT uk_bmciw19xekcumh9efipdyx4bb UNIQUE (cours_id);

--
-- Name: facultes uk_crpay7bud4k60gitdjo78it1h; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facultes
    ADD CONSTRAINT uk_crpay7bud4k60gitdjo78it1h UNIQUE (code);

--
-- Name: deliberations uk_e1lrfik11uyk116dpy1lnbv07; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT uk_e1lrfik11uyk116dpy1lnbv07 UNIQUE (code_diplome);

--
-- Name: lettres_acceptation uk_e1p8q6vn7sj6irvikdg5bky8l; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT uk_e1p8q6vn7sj6irvikdg5bky8l UNIQUE (numero_lettre);

--
-- Name: refresh_tokens uk_ghpmfn23vmxfu3spu3lfg4r2d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_ghpmfn23vmxfu3spu3lfg4r2d UNIQUE (token);

--
-- Name: parametres_lmd uk_gmaehsg7ssdaclcp9xf6sbxbr; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_lmd
    ADD CONSTRAINT uk_gmaehsg7ssdaclcp9xf6sbxbr UNIQUE (universite_id);

--
-- Name: transactions uk_hmrka43k7ijk56xcfcnscaq14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT uk_hmrka43k7ijk56xcfcnscaq14 UNIQUE (transaction_code);

--
-- Name: payment_reconciliation uk_j5mta4wcu1fp5nebs09uqo0qp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reconciliation
    ADD CONSTRAINT uk_j5mta4wcu1fp5nebs09uqo0qp UNIQUE (reconciliation_code);

--
-- Name: payment_reports uk_lhm08njca2fkjjv2lgajv2v6i; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports
    ADD CONSTRAINT uk_lhm08njca2fkjjv2lgajv2v6i UNIQUE (report_code);

--
-- Name: payment_providers uk_m92dmofcbou2h1u4bj1tclt48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_providers
    ADD CONSTRAINT uk_m92dmofcbou2h1u4bj1tclt48 UNIQUE (name);

--
-- Name: categories_frais uk_m9vhc71xrwipr90l0ipe3w02r; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_frais
    ADD CONSTRAINT uk_m9vhc71xrwipr90l0ipe3w02r UNIQUE (code);

--
-- Name: universite_configurations uk_or8fayn3qv5qgg5944he27bou; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_configurations
    ADD CONSTRAINT uk_or8fayn3qv5qgg5944he27bou UNIQUE (universite_id);

--
-- Name: refunds uk_pd2n1pgn76pxi1c93glxotks0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT uk_pd2n1pgn76pxi1c93glxotks0 UNIQUE (refund_code);

--
-- Name: deliberations uk_pjck8odhf7disuvyywyjmkdr3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT uk_pjck8odhf7disuvyywyjmkdr3 UNIQUE (uuid_verification);

--
-- Name: universite_payment_settings uk_q2ox3kg84twbpmrnmswl873uv; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_payment_settings
    ADD CONSTRAINT uk_q2ox3kg84twbpmrnmswl873uv UNIQUE (universite_id);

--
-- Name: payment_providers uk_shht0out0pqqn9yma12svt33a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_providers
    ADD CONSTRAINT uk_shht0out0pqqn9yma12svt33a UNIQUE (provider_type);

--
-- Name: parametres_notification uk_t8p1e9fjfh0hdwhdyxa76oknk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_notification
    ADD CONSTRAINT uk_t8p1e9fjfh0hdwhdyxa76oknk UNIQUE (utilisateur_id);

--
-- Name: association_membres ukapatgo2ilwqap575lnvwlvxui; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_membres
    ADD CONSTRAINT ukapatgo2ilwqap575lnvwlvxui UNIQUE (association_id, inscription_id);

--
-- Name: deliberations ukbl4hds5vdusspgtjc4wejoodn; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT ukbl4hds5vdusspgtjc4wejoodn UNIQUE (inscription_id, annee_academique);

--
-- Name: controle_cours ukbmciw19xekcumh9efipdyx4bb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controle_cours
    ADD CONSTRAINT ukbmciw19xekcumh9efipdyx4bb UNIQUE (cours_id);

--
-- Name: regles_signature_document ukce4cyb149nugh3npph6md9e02; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_signature_document
    ADD CONSTRAINT ukce4cyb149nugh3npph6md9e02 UNIQUE (universite_id, type_document);

--
-- Name: departements ukdwchckghj1sulwnqf1nw580yw; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT ukdwchckghj1sulwnqf1nw580yw UNIQUE (code, faculte_id);

--
-- Name: parametres_lmd ukgmaehsg7ssdaclcp9xf6sbxbr; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_lmd
    ADD CONSTRAINT ukgmaehsg7ssdaclcp9xf6sbxbr UNIQUE (universite_id);

--
-- Name: candidatures_stage ukgphgowl6fuxkm9x5y9yv753v6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_stage
    ADD CONSTRAINT ukgphgowl6fuxkm9x5y9yv753v6 UNIQUE (offre_id, inscription_id);

--
-- Name: annees_academiques ukji5uwn27uhjgqwsman4ypdfft; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_academiques
    ADD CONSTRAINT ukji5uwn27uhjgqwsman4ypdfft UNIQUE (libelle, universite_id);

--
-- Name: roles uklckechcftu154e1m4xkcy2xqe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uklckechcftu154e1m4xkcy2xqe UNIQUE (name, universite_id);

--
-- Name: payment_reports ukmam9me6qlvt838dfs5ik2rlym; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports
    ADD CONSTRAINT ukmam9me6qlvt838dfs5ik2rlym UNIQUE (universite_id, report_date, report_type);

--
-- Name: evenement_participants uknnm4d4lxa3j47cohojbmb7wrh; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_participants
    ADD CONSTRAINT uknnm4d4lxa3j47cohojbmb7wrh UNIQUE (evenement_id, inscription_id);

--
-- Name: hierarchical_access uknyj5lh861f1kd54vqv6rgmih; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT uknyj5lh861f1kd54vqv6rgmih UNIQUE (user_id, universite_id, departement_id);

--
-- Name: soumissions_travaux ukrwoqwv9lo3btuhjsxk3p7f6st; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_travaux
    ADD CONSTRAINT ukrwoqwv9lo3btuhjsxk3p7f6st UNIQUE (travail_id, inscription_id);

--
-- Name: role_permissions ukt43p6aampim70fxxnkid1mibj; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT ukt43p6aampim70fxxnkid1mibj UNIQUE (role_id, permission_id);

--
-- Name: universite_configurations universite_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_configurations
    ADD CONSTRAINT universite_configurations_pkey PRIMARY KEY (id);

--
-- Name: universite_payment_settings universite_payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_payment_settings
    ADD CONSTRAINT universite_payment_settings_pkey PRIMARY KEY (id);

--
-- Name: universites universites_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universites
    ADD CONSTRAINT universites_code_key UNIQUE (code);

--
-- Name: universites universites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universites
    ADD CONSTRAINT universites_pkey PRIMARY KEY (id);

--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);

--
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);

--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);

--
-- Name: vacations vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_pkey PRIMARY KEY (id);

--
-- Name: validations_paie validations_paie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations_paie
    ADD CONSTRAINT validations_paie_pkey PRIMARY KEY (id);

--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);

--
-- Name: idx_bons_inscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bons_inscription ON public.bons_paiement USING btree (inscription_id);

--
-- Name: idx_bons_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bons_numero ON public.bons_paiement USING btree (numero);

--
-- Name: idx_cours_departement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cours_departement ON public.cours USING btree (departement_id);

--
-- Name: idx_cours_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cours_statut ON public.cours USING btree (statut);

--
-- Name: idx_cours_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cours_universite ON public.cours USING btree (universite_id);

--
-- Name: idx_deliberations_inscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deliberations_inscription ON public.delibererations USING btree (inscription_id);

--
-- Name: idx_etudiants_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_etudiants_email ON public.etudiants USING btree (email);

--
-- Name: idx_etudiants_nom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_etudiants_nom ON public.etudiants USING btree (nom);

--
-- Name: idx_etudiants_prenom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_etudiants_prenom ON public.etudiants USING btree (prenom);

--
-- Name: idx_exchange_rates_active_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_active_date ON public.exchange_rates USING btree (is_active, rate_date);

--
-- Name: idx_exchange_rates_effective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_effective ON public.exchange_rates USING btree (effective_at);

--
-- Name: idx_inscriptions_cree_le; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_cree_le ON public.inscriptions USING btree (cree_le);

--
-- Name: idx_inscriptions_etudiant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_etudiant ON public.inscriptions USING btree (etudiant_id);

--
-- Name: idx_inscriptions_matricule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_matricule ON public.inscriptions USING btree (matricule);

--
-- Name: idx_inscriptions_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_statut ON public.inscriptions USING btree (statut);

--
-- Name: idx_notes_inscription; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_inscription ON public.notes USING btree (inscription_id);

--
-- Name: idx_notes_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_statut ON public.notes USING btree (statut);

--
-- Name: idx_paiements_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_date ON public.paiements USING btree (date_paiement);

--
-- Name: idx_paiements_date_validation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_date_validation ON public.paiements USING btree (date_validation);

--
-- Name: idx_paiements_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_reference ON public.paiements USING btree (reference);

--
-- Name: idx_paiements_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_statut ON public.paiements USING btree (statut);

--
-- Name: idx_payment_providers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_providers_active ON public.payment_providers USING btree (is_active);

--
-- Name: idx_payment_reconciliation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reconciliation_status ON public.payment_reconciliation USING btree (status);

--
-- Name: idx_payment_reconciliation_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reconciliation_universite ON public.payment_reconciliation USING btree (universite_id);

--
-- Name: idx_payment_reports_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reports_date ON public.payment_reports USING btree (report_date);

--
-- Name: idx_payment_reports_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reports_type ON public.payment_reports USING btree (report_type);

--
-- Name: idx_payment_reports_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_reports_universite ON public.payment_reports USING btree (universite_id);

--
-- Name: idx_permissions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_code ON public.permissions USING btree (code);

--
-- Name: idx_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);

--
-- Name: idx_refresh_token_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token_token ON public.refresh_tokens USING btree (token);

--
-- Name: idx_refresh_token_utilisateur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token_utilisateur ON public.refresh_tokens USING btree (utilisateur_id);

--
-- Name: idx_refunds_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refunds_status ON public.refunds USING btree (status);

--
-- Name: idx_refunds_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refunds_transaction ON public.refunds USING btree (transaction_id);

--
-- Name: idx_security_events_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_created ON public.security_events USING btree (created_at);

--
-- Name: idx_security_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_type ON public.security_events USING btree (event_type);

--
-- Name: idx_security_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user ON public.security_events USING btree (user_id);

--
-- Name: idx_transactions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_created ON public.transactions USING btree (created_at);

--
-- Name: idx_transactions_paiement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_paiement ON public.transactions_externes USING btree (paiement_id);

--
-- Name: idx_transactions_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_provider ON public.transactions_externes USING btree (provider, external_id);

--
-- Name: idx_transactions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_reference ON public.transactions USING btree (provider_transaction_id);

--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (payment_status);

--
-- Name: idx_transactions_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_student ON public.transactions USING btree (student_id);

--
-- Name: idx_transactions_universite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_universite ON public.transactions USING btree (universite_id);

--
-- Name: idx_universite_departements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universite_departements_id ON public.universite_departements USING btree (universite_id);

--
-- Name: idx_universite_facultes_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universite_facultes_id ON public.universite_facultes USING btree (universite_id);

--
-- Name: idx_universite_promotions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universite_promotions_id ON public.universite_promotions USING btree (universite_id);

--
-- Name: idx_universites_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_universites_code ON public.universites USING btree (code);

--
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_email ON public.utilisateurs USING btree (email);

--
-- Name: idx_utilisateurs_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_utilisateurs_role ON public.utilisateurs USING btree (role);

--
-- Name: aides_sociales aides_sociales_dossier_social_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aides_sociales
    ADD CONSTRAINT aides_sociales_dossier_social_id_fkey FOREIGN KEY (dossier_social_id) REFERENCES public.dossiers_sociaux(id) ON DELETE SET NULL;

--
-- Name: aides_sociales aides_sociales_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aides_sociales
    ADD CONSTRAINT aides_sociales_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: aides_sociales aides_sociales_traite_par_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aides_sociales
    ADD CONSTRAINT aides_sociales_traite_par_id_fkey FOREIGN KEY (traite_par_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

--
-- Name: attestations attestations_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: attestations attestations_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: baremes_paiement baremes_paiement_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baremes_paiement
    ADD CONSTRAINT baremes_paiement_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: bons_paiement bons_paiement_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_paiement
    ADD CONSTRAINT bons_paiement_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: bourses bourses_dossier_social_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourses
    ADD CONSTRAINT bourses_dossier_social_id_fkey FOREIGN KEY (dossier_social_id) REFERENCES public.dossiers_sociaux(id) ON DELETE CASCADE;

--
-- Name: calendrier_academique calendrier_academique_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendrier_academique
    ADD CONSTRAINT calendrier_academique_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: categories_ouvrage categories_ouvrage_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_ouvrage
    ADD CONSTRAINT categories_ouvrage_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: connexion_logs connexion_logs_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connexion_logs
    ADD CONSTRAINT connexion_logs_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

--
-- Name: contrats contrats_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats
    ADD CONSTRAINT contrats_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE CASCADE;

--
-- Name: cours cours_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours
    ADD CONSTRAINT cours_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;

--
-- Name: cours cours_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours
    ADD CONSTRAINT cours_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE SET NULL;

--
-- Name: cours cours_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours
    ADD CONSTRAINT cours_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: criteres_deliberation criteres_deliberation_annee_academique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criteres_deliberation
    ADD CONSTRAINT criteres_deliberation_annee_academique_id_fkey FOREIGN KEY (annee_academique_id) REFERENCES public.annees_academiques(id) ON DELETE CASCADE;

--
-- Name: criteres_deliberation criteres_deliberation_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.criteres_deliberation
    ADD CONSTRAINT criteres_deliberation_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;

--
-- Name: delibererations delibererations_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE SET NULL;

--
-- Name: delibererations delibererations_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: delibererations delibererations_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delibererations
    ADD CONSTRAINT delibererations_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: departements departements_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: depenses depenses_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT depenses_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: documents_etudiants documents_etudiants_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents_etudiants
    ADD CONSTRAINT documents_etudiants_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: dossiers_sociaux dossiers_sociaux_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_sociaux
    ADD CONSTRAINT dossiers_sociaux_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: dossiers_sociaux dossiers_sociaux_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_sociaux
    ADD CONSTRAINT dossiers_sociaux_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: echeances echeances_echeancier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances
    ADD CONSTRAINT echeances_echeancier_id_fkey FOREIGN KEY (echeancier_id) REFERENCES public.echeanciers(id) ON DELETE CASCADE;

--
-- Name: echeances echeances_paiement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances
    ADD CONSTRAINT echeances_paiement_id_fkey FOREIGN KEY (paiement_id) REFERENCES public.paiements(id) ON DELETE SET NULL;

--
-- Name: echeanciers echeanciers_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers
    ADD CONSTRAINT echeanciers_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: echeanciers echeanciers_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers
    ADD CONSTRAINT echeanciers_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: emprunts emprunts_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts
    ADD CONSTRAINT emprunts_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: emprunts emprunts_livre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts
    ADD CONSTRAINT emprunts_livre_id_fkey FOREIGN KEY (livre_id) REFERENCES public.livres(id) ON DELETE CASCADE;

--
-- Name: examens examens_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: examens examens_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE SET NULL;

--
-- Name: examens examens_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: facultes facultes_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facultes
    ADD CONSTRAINT facultes_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: filieres filieres_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;

--
-- Name: remboursements fk16okw7w8q0vciy1r86yek6mfi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remboursements
    ADD CONSTRAINT fk16okw7w8q0vciy1r86yek6mfi FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id);

--
-- Name: tfc fk19lnuiqo4q5rcvnb8c5ucdjdw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tfc
    ADD CONSTRAINT fk19lnuiqo4q5rcvnb8c5ucdjdw FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: cours_vacations fk1k95310x0v2v6vjf3tlqlavu5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations
    ADD CONSTRAINT fk1k95310x0v2v6vjf3tlqlavu5 FOREIGN KEY (professeur_id) REFERENCES public.utilisateurs(id);

--
-- Name: universite_payment_settings fk1mhqv7gmc3cejcfjj6cowwk5g; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_payment_settings
    ADD CONSTRAINT fk1mhqv7gmc3cejcfjj6cowwk5g FOREIGN KEY (updated_by) REFERENCES public.utilisateurs(id);

--
-- Name: equivalences_diplomes fk1psap1pvw1kcgkfy2ls8ixojo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalences_diplomes
    ADD CONSTRAINT fk1psap1pvw1kcgkfy2ls8ixojo FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: hierarchical_access fk1y6yuqdqnlf237nkvx5orfini; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT fk1y6yuqdqnlf237nkvx5orfini FOREIGN KEY (user_id) REFERENCES public.utilisateurs(id);

--
-- Name: candidatures_stage fk258l2tgrkwbt1fhwud76k8hil; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_stage
    ADD CONSTRAINT fk258l2tgrkwbt1fhwud76k8hil FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: permissions fk26gl8xt7wuyc204pyopn6y9xf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk26gl8xt7wuyc204pyopn6y9xf FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id);

--
-- Name: candidatures_bourse fk27350socrb24tm1f9w2w947g5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_bourse
    ADD CONSTRAINT fk27350socrb24tm1f9w2w947g5 FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id);

--
-- Name: signataires_universite fk2te5mxajsgekp1jymrxk1gpo9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signataires_universite
    ADD CONSTRAINT fk2te5mxajsgekp1jymrxk1gpo9 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: evenements_universitaires fk2thev0uisjtgesh5bxa5pbv6r; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_universitaires
    ADD CONSTRAINT fk2thev0uisjtgesh5bxa5pbv6r FOREIGN KEY (association_id) REFERENCES public.associations(id);

--
-- Name: user_roles fk2wk927vb0ncxbwru4ke3t5u4w; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk2wk927vb0ncxbwru4ke3t5u4w FOREIGN KEY (assigned_by) REFERENCES public.utilisateurs(id);

--
-- Name: laboratoires fk2wss46wh9rn7oes5wip88ny20; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratoires
    ADD CONSTRAINT fk2wss46wh9rn7oes5wip88ny20 FOREIGN KEY (professeur_id) REFERENCES public.utilisateurs(id);

--
-- Name: vacations fk2wxh77bi0suvfy1bm9ksonu6k; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT fk2wxh77bi0suvfy1bm9ksonu6k FOREIGN KEY (annee_academique_id) REFERENCES public.annees_academiques(id);

--
-- Name: departements fk4oaetbybq8e5f2sm1fljfki1l; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT fk4oaetbybq8e5f2sm1fljfki1l FOREIGN KEY (faculte_id) REFERENCES public.facultes(id);

--
-- Name: notes_questions fk4r0n9tl8w410dpwblypcasgmp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_questions
    ADD CONSTRAINT fk4r0n9tl8w410dpwblypcasgmp FOREIGN KEY (tentative_quiz_id) REFERENCES public.tentatives_quiz(id);

--
-- Name: parametres_notification fk4snfmsn6gwlahiu2ux6hvqr3a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_notification
    ADD CONSTRAINT fk4snfmsn6gwlahiu2ux6hvqr3a FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id);

--
-- Name: roles fk53pwedcskakv9me9usy2x4b8x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk53pwedcskakv9me9usy2x4b8x FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: affectations_frais fk6ih27tgfx7p6anvr1guaf7unb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais
    ADD CONSTRAINT fk6ih27tgfx7p6anvr1guaf7unb FOREIGN KEY (frais_id) REFERENCES public.frais(id);

--
-- Name: lettres_acceptation fk6rn21ewctjjmnfk1gyygcdjty; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT fk6rn21ewctjjmnfk1gyygcdjty FOREIGN KEY (inscription_vacation_id) REFERENCES public.inscriptions_vacations(id);

--
-- Name: chapitres_tfc fk6wr4ac4vbbms40fs2a9fkqyit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapitres_tfc
    ADD CONSTRAINT fk6wr4ac4vbbms40fs2a9fkqyit FOREIGN KEY (tfc_id) REFERENCES public.tfc(id);

--
-- Name: affectations_frais fk72rr57xb635gni2jcd55poe5l; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais
    ADD CONSTRAINT fk72rr57xb635gni2jcd55poe5l FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);

--
-- Name: cours_vacations fk7cj4aj2sq7jwodaaju0owwchv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations
    ADD CONSTRAINT fk7cj4aj2sq7jwodaaju0owwchv FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: lettres_acceptation fk7we3mdbfe7qaj8tm9mj7f8514; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT fk7we3mdbfe7qaj8tm9mj7f8514 FOREIGN KEY (vacation_id) REFERENCES public.vacations(id);

--
-- Name: ecritures_comptables fk7wix3hrec2i3a87bq2w1wem50; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT fk7wix3hrec2i3a87bq2w1wem50 FOREIGN KEY (compte_credit_id) REFERENCES public.comptes_comptables(id);

--
-- Name: association_membres fk8b902m1dfj84sxa7eotg0ksy6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_membres
    ADD CONSTRAINT fk8b902m1dfj84sxa7eotg0ksy6 FOREIGN KEY (association_id) REFERENCES public.associations(id);

--
-- Name: payment_reports fk8glrnu9hm1m7uatercx67l6ky; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports
    ADD CONSTRAINT fk8glrnu9hm1m7uatercx67l6ky FOREIGN KEY (generated_by) REFERENCES public.utilisateurs(id);

--
-- Name: commentaires_tfc fk8h7fhmacs3vap7mr9pdg8su4j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commentaires_tfc
    ADD CONSTRAINT fk8h7fhmacs3vap7mr9pdg8su4j FOREIGN KEY (tfc_id) REFERENCES public.tfc(id);

--
-- Name: conferences fk9b5vq3myuclb97u6n15ec1ilf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conferences
    ADD CONSTRAINT fk9b5vq3myuclb97u6n15ec1ilf FOREIGN KEY (professeur_id) REFERENCES public.utilisateurs(id);

--
-- Name: projets_recherche fk9bq765x7mx4cga4dmvvk11ljt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projets_recherche
    ADD CONSTRAINT fk9bq765x7mx4cga4dmvvk11ljt FOREIGN KEY (professeur_id) REFERENCES public.utilisateurs(id);

--
-- Name: evenement_participants fk9duu10awu1x4a1qerxx5krv5r; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_participants
    ADD CONSTRAINT fk9duu10awu1x4a1qerxx5krv5r FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: refunds fk9hi0lvojcyhjd2ex7qmb5wu9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk9hi0lvojcyhjd2ex7qmb5wu9 FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);

--
-- Name: annees_academiques fk_annee_universite; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_academiques
    ADD CONSTRAINT fk_annee_universite FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: departements fk_departement_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT fk_departement_parent FOREIGN KEY (parent_id) REFERENCES public.departements(id);

--
-- Name: validations_paie fk_validation_paie; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations_paie
    ADD CONSTRAINT fk_validation_paie FOREIGN KEY (paie_id) REFERENCES public.paies(id);

--
-- Name: affectations_frais fkat0dalitp58kipjhuehf54ca0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais
    ADD CONSTRAINT fkat0dalitp58kipjhuehf54ca0 FOREIGN KEY (paiement_id) REFERENCES public.paiements(id);

--
-- Name: association_membres fkax8rau5b2833rli3a07bp1879; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.association_membres
    ADD CONSTRAINT fkax8rau5b2833rli3a07bp1879 FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: transactions fkb1tss3mjmh9gj54dhmg8bypy5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkb1tss3mjmh9gj54dhmg8bypy5 FOREIGN KEY (processed_by) REFERENCES public.utilisateurs(id);

--
-- Name: role_permissions fkblxir1453qoe5dl6eimrhdam; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkblxir1453qoe5dl6eimrhdam FOREIGN KEY (granted_by) REFERENCES public.utilisateurs(id);

--
-- Name: transactions fkbpo8yc394vlu6dal11xw8mdxc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkbpo8yc394vlu6dal11xw8mdxc FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id);

--
-- Name: exchange_rates fkbrpls1ne0kab8g0vpca10iugt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT fkbrpls1ne0kab8g0vpca10iugt FOREIGN KEY (updated_by) REFERENCES public.utilisateurs(id);

--
-- Name: bareme_evaluation_lignes fkbxqup2s2t8w3ri0rrbpavp2cq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bareme_evaluation_lignes
    ADD CONSTRAINT fkbxqup2s2t8w3ri0rrbpavp2cq FOREIGN KEY (bareme_id) REFERENCES public.baremes_evaluation(id);

--
-- Name: hierarchical_access fkc0igfmkytdphmc42hst3eh8ar; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT fkc0igfmkytdphmc42hst3eh8ar FOREIGN KEY (faculty_id) REFERENCES public.facultes(id);

--
-- Name: supports_cours fkcgx22t316q893q8swb24pnlqg; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supports_cours
    ADD CONSTRAINT fkcgx22t316q893q8swb24pnlqg FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: caisses fkcl7c6609pvdursa3k42m2iftr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caisses
    ADD CONSTRAINT fkcl7c6609pvdursa3k42m2iftr FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: deliberations fkcn99vibyqyaukk2bsgoagqetc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT fkcn99vibyqyaukk2bsgoagqetc FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: inscriptions_vacations fkd4qep0pk9jn3e9iy6e4x3mhte; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT fkd4qep0pk9jn3e9iy6e4x3mhte FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id);

--
-- Name: lettres_acceptation fkdj1sqjuxtukrpj92jukvxqwia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT fkdj1sqjuxtukrpj92jukvxqwia FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id);

--
-- Name: inscriptions_vacations fkdlmepy3v5pv85xqss3u6hs9uq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT fkdlmepy3v5pv85xqss3u6hs9uq FOREIGN KEY (annee_academique_id) REFERENCES public.annees_academiques(id);

--
-- Name: payment_reconciliation fkduwt4oman8qwlvkc4w434raqa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reconciliation
    ADD CONSTRAINT fkduwt4oman8qwlvkc4w434raqa FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: travaux_devoirs fke5al06608o5s2ktw15vqc2pa0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.travaux_devoirs
    ADD CONSTRAINT fke5al06608o5s2ktw15vqc2pa0 FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: charges_horaires fke8ox6mumxc27fq2rlkbpm09yp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges_horaires
    ADD CONSTRAINT fke8ox6mumxc27fq2rlkbpm09yp FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: soumissions_travaux fkeaqwifl62496elp8sbd8w3rav; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_travaux
    ADD CONSTRAINT fkeaqwifl62496elp8sbd8w3rav FOREIGN KEY (travail_id) REFERENCES public.travaux_devoirs(id);

--
-- Name: role_permissions fkegdk29eiy7mdtefy5c7eirr6e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkegdk29eiy7mdtefy5c7eirr6e FOREIGN KEY (permission_id) REFERENCES public.permissions(id);

--
-- Name: reponses_etudiant fkekct4v0dcbcr3igreid0j6t1v; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_etudiant
    ADD CONSTRAINT fkekct4v0dcbcr3igreid0j6t1v FOREIGN KEY (tentative_quiz_id) REFERENCES public.tentatives_quiz(id);

--
-- Name: deliberations fkekf713h0b5urd22y4362maev4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT fkekf713h0b5urd22y4362maev4 FOREIGN KEY (departement_id) REFERENCES public.departements(id);

--
-- Name: bourse_offre_conditions fkev7wh29ascs4s024c3s172qew; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourse_offre_conditions
    ADD CONSTRAINT fkev7wh29ascs4s024c3s172qew FOREIGN KEY (bourse_offre_id) REFERENCES public.bourse_offres(id);

--
-- Name: transaction_logs fkevg1hops6077gc61w0fcsldjo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT fkevg1hops6077gc61w0fcsldjo FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);

--
-- Name: user_roles fkfcyyb2hb5c89klb6j22comi2w; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fkfcyyb2hb5c89klb6j22comi2w FOREIGN KEY (user_id) REFERENCES public.utilisateurs(id);

--
-- Name: signatures_electroniques fkfkb2hjscj1g1ubkn9y05m8ib; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures_electroniques
    ADD CONSTRAINT fkfkb2hjscj1g1ubkn9y05m8ib FOREIGN KEY (signataire_id) REFERENCES public.signataires_universite(id);

--
-- Name: candidatures_stage fkfktlitm89cesomuisn525p6hd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_stage
    ADD CONSTRAINT fkfktlitm89cesomuisn525p6hd FOREIGN KEY (offre_id) REFERENCES public.offres_stage(id);

--
-- Name: operations_caisse fkfv8g5ks8glnchrnqc7p8ssoht; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations_caisse
    ADD CONSTRAINT fkfv8g5ks8glnchrnqc7p8ssoht FOREIGN KEY (paiement_id) REFERENCES public.paiements(id);

--
-- Name: soumissions_travaux fkh39xinlny69hjrr0j0xwaoqk6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_travaux
    ADD CONSTRAINT fkh39xinlny69hjrr0j0xwaoqk6 FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: user_roles fkh8ciramu9cc9q3qcqiv4ue8a6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fkh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES public.roles(id);

--
-- Name: regles_signature_document fkhkney27ipr6ie3k75y1n8u1yx; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_signature_document
    ADD CONSTRAINT fkhkney27ipr6ie3k75y1n8u1yx FOREIGN KEY (signataire_id) REFERENCES public.signataires_universite(id);

--
-- Name: inscriptions_vacations fkhs35bd50bqaa7eiaix4stxjc2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT fkhs35bd50bqaa7eiaix4stxjc2 FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);

--
-- Name: security_events fkhvc75r5twvd5r34tn3xtl6dru; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT fkhvc75r5twvd5r34tn3xtl6dru FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: associations fkhwbajcvhgl6vmytjtipsnx5j9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.associations
    ADD CONSTRAINT fkhwbajcvhgl6vmytjtipsnx5j9 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: deliberations fki23kb47pa5vcu4fl23aqibqhx; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT fki23kb47pa5vcu4fl23aqibqhx FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: tfc fkik1efiv1rkhof6o87l7ketebd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tfc
    ADD CONSTRAINT fkik1efiv1rkhof6o87l7ketebd FOREIGN KEY (sujet_ref_id) REFERENCES public.sujets_tfc(id);

--
-- Name: ecritures_comptables fkim45dawjhhavn2429vb6xu4ng; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT fkim45dawjhhavn2429vb6xu4ng FOREIGN KEY (compte_debit_id) REFERENCES public.comptes_comptables(id);

--
-- Name: universite_payment_settings fkiyu3cjnxt1htvf2nut3ufxpsb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_payment_settings
    ADD CONSTRAINT fkiyu3cjnxt1htvf2nut3ufxpsb FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: reconciliation_details fkjcwvbu9dttrkrljdicxudt4wh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT fkjcwvbu9dttrkrljdicxudt4wh FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);

--
-- Name: hierarchical_access fkjmyenkcesob96hp5aa8sk7bqw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT fkjmyenkcesob96hp5aa8sk7bqw FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: operations_caisse fkjsdrhum952rtwdoltyqrclrwt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations_caisse
    ADD CONSTRAINT fkjsdrhum952rtwdoltyqrclrwt FOREIGN KEY (depense_id) REFERENCES public.depenses(id);

--
-- Name: equivalences_diplomes fkl7u7sf45oxbneuy3i44288gak; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalences_diplomes
    ADD CONSTRAINT fkl7u7sf45oxbneuy3i44288gak FOREIGN KEY (filiere_id) REFERENCES public.filieres(id);

--
-- Name: evenement_participants fklhuml7fcv8lhxjt41wqqhf4u8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenement_participants
    ADD CONSTRAINT fklhuml7fcv8lhxjt41wqqhf4u8 FOREIGN KEY (evenement_id) REFERENCES public.evenements_universitaires(id);

--
-- Name: vacations fklll91u6cqu72npji1or73e7k6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT fklll91u6cqu72npji1or73e7k6 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: payment_reports fkmbbidspfr8f6igycqgsxm43kd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reports
    ADD CONSTRAINT fkmbbidspfr8f6igycqgsxm43kd FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: universite_configurations fkmdv0c58x6eo8so0ksyw06u1iu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_configurations
    ADD CONSTRAINT fkmdv0c58x6eo8so0ksyw06u1iu FOREIGN KEY (updated_by) REFERENCES public.utilisateurs(id);

--
-- Name: refunds fkmq0q7aiafo5nhbh6ifd8qrnk6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fkmq0q7aiafo5nhbh6ifd8qrnk6 FOREIGN KEY (requested_by) REFERENCES public.utilisateurs(id);

--
-- Name: equivalences_diplomes fkmvmd2u8xl0bbmebr5u6r23eap; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalences_diplomes
    ADD CONSTRAINT fkmvmd2u8xl0bbmebr5u6r23eap FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id);

--
-- Name: user_roles fkmylgavt9xcg6ius0yn4c78ysi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fkmylgavt9xcg6ius0yn4c78ysi FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: role_permissions fkn5fotdgk8d1xvo8nav9uv3muc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkn5fotdgk8d1xvo8nav9uv3muc FOREIGN KEY (role_id) REFERENCES public.roles(id);

--
-- Name: operations_caisse fkna9bn36ernv5k4nv68b8wsj15; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations_caisse
    ADD CONSTRAINT fkna9bn36ernv5k4nv68b8wsj15 FOREIGN KEY (caisse_id) REFERENCES public.caisses(id);

--
-- Name: frais fknh5k1xdp6yw67pmjpat98genu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais
    ADD CONSTRAINT fknh5k1xdp6yw67pmjpat98genu FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: universite_configurations fknjm7nmahinretwsg1e917o8r7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_configurations
    ADD CONSTRAINT fknjm7nmahinretwsg1e917o8r7 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: stages fknuaenjh5iang0h4rdoaqrlepn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT fknuaenjh5iang0h4rdoaqrlepn FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: controle_cours fknwq2eekgw0b5diajvvmh1adtp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controle_cours
    ADD CONSTRAINT fknwq2eekgw0b5diajvvmh1adtp FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: publications fko6txegf209p777ehoy3g0x0oa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT fko6txegf209p777ehoy3g0x0oa FOREIGN KEY (professeur_id) REFERENCES public.utilisateurs(id);

--
-- Name: refresh_tokens fko9ravf3kjwndwkp9h72i01yy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fko9ravf3kjwndwkp9h72i01yy FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id);

--
-- Name: reconciliation_details fkoa5c190hitnsmt669edrcnbw4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_details
    ADD CONSTRAINT fkoa5c190hitnsmt669edrcnbw4 FOREIGN KEY (reconciliation_id) REFERENCES public.payment_reconciliation(id);

--
-- Name: bourse_offres fkoawrkrsaxqaresw34bbwgerbj; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bourse_offres
    ADD CONSTRAINT fkoawrkrsaxqaresw34bbwgerbj FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: recours fkofbl67n2kfu4epgrojn8ydrp9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recours
    ADD CONSTRAINT fkofbl67n2kfu4epgrojn8ydrp9 FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: inscriptions_vacations fkogc0npw7fol5t7ge147wtvnr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT fkogc0npw7fol5t7ge147wtvnr FOREIGN KEY (vacation_id) REFERENCES public.vacations(id);

--
-- Name: evenements_universitaires fkons8322ayth8xq82eblgk7hks; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_universitaires
    ADD CONSTRAINT fkons8322ayth8xq82eblgk7hks FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: recours fkosdc2jv6ainrh6m6n4g2c10hl; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recours
    ADD CONSTRAINT fkosdc2jv6ainrh6m6n4g2c10hl FOREIGN KEY (cours_id) REFERENCES public.cours(id);

--
-- Name: frais fkp23fgmhndulbypyuojwox28fo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais
    ADD CONSTRAINT fkp23fgmhndulbypyuojwox28fo FOREIGN KEY (categorie_id) REFERENCES public.categories_frais(id);

--
-- Name: payment_providers fkp7fqihcvxa50uu5w4ma8g4ygr; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_providers
    ADD CONSTRAINT fkp7fqihcvxa50uu5w4ma8g4ygr FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id);

--
-- Name: candidatures_bourse fkpl2tibsgwbk3j0pyj86prv7gm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures_bourse
    ADD CONSTRAINT fkpl2tibsgwbk3j0pyj86prv7gm FOREIGN KEY (bourse_offre_id) REFERENCES public.bourse_offres(id);

--
-- Name: informations_bancaires fkpsl4t3hhg8ci7o684q5dir4kb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.informations_bancaires
    ADD CONSTRAINT fkpsl4t3hhg8ci7o684q5dir4kb FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: transactions fkq1sx12nv5y7crxkeoubdhb1r3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkq1sx12nv5y7crxkeoubdhb1r3 FOREIGN KEY (payment_provider_id) REFERENCES public.payment_providers(id);

--
-- Name: cours_vacations fkq34e3j5c8x92aof4wn1tr0k18; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations
    ADD CONSTRAINT fkq34e3j5c8x92aof4wn1tr0k18 FOREIGN KEY (vacation_id) REFERENCES public.vacations(id);

--
-- Name: surveillances fkq6re7axvixpal6wn97m378xxy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveillances
    ADD CONSTRAINT fkq6re7axvixpal6wn97m378xxy FOREIGN KEY (surveillant_id) REFERENCES public.personnel(id);

--
-- Name: conges fkq7b12s59ffx6pbhy332bxqbps; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges
    ADD CONSTRAINT fkq7b12s59ffx6pbhy332bxqbps FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);

--
-- Name: transactions fkqaaun8kxd73vekp17xr6ium9i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkqaaun8kxd73vekp17xr6ium9i FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: inscriptions_vacations fkqaimhlik7lgc90r2xqh2h0qme; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_vacations
    ADD CONSTRAINT fkqaimhlik7lgc90r2xqh2h0qme FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: roles fkqb4bsn3b845xn62p8rabw1r8w; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fkqb4bsn3b845xn62p8rabw1r8w FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id);

--
-- Name: security_events fkqds4nbgsfbopcae6y9ikesoi6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT fkqds4nbgsfbopcae6y9ikesoi6 FOREIGN KEY (user_id) REFERENCES public.utilisateurs(id);

--
-- Name: device_tokens fkqh618k3lttj90afkydy8l3chs; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT fkqh618k3lttj90afkydy8l3chs FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id);

--
-- Name: regles_signature_document fkqo5prghe20wyy28vujh1o0uf5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_signature_document
    ADD CONSTRAINT fkqo5prghe20wyy28vujh1o0uf5 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: surveillances fkqtp3gbd1d1ukkxdvnwila9y9w; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveillances
    ADD CONSTRAINT fkqtp3gbd1d1ukkxdvnwila9y9w FOREIGN KEY (examen_id) REFERENCES public.examens(id);

--
-- Name: lettres_acceptation fkr5ibjuxax8ur21sqm1a4suud0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lettres_acceptation
    ADD CONSTRAINT fkr5ibjuxax8ur21sqm1a4suud0 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: categories_frais fkr71a24bgprtr1qeio2643jlc6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_frais
    ADD CONSTRAINT fkr71a24bgprtr1qeio2643jlc6 FOREIGN KEY (universite_id) REFERENCES public.universites(id);

--
-- Name: payment_reconciliation fkr99ilu76ketaqs022tyy0hrfo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reconciliation
    ADD CONSTRAINT fkr99ilu76ketaqs022tyy0hrfo FOREIGN KEY (reconciled_by) REFERENCES public.utilisateurs(id);

--
-- Name: surveillances fkrbhxaqr2tdnxbcs2p2531xiub; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surveillances
    ADD CONSTRAINT fkrbhxaqr2tdnxbcs2p2531xiub FOREIGN KEY (salle_id) REFERENCES public.salles(id);

--
-- Name: cours_vacations fkrbibw5jn1wpnmvgrhyyxi06re; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cours_vacations
    ADD CONSTRAINT fkrbibw5jn1wpnmvgrhyyxi06re FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);

--
-- Name: remboursements fkrkxiebcgsu886c00oqf8ib4pn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remboursements
    ADD CONSTRAINT fkrkxiebcgsu886c00oqf8ib4pn FOREIGN KEY (paiement_id) REFERENCES public.paiements(id);

--
-- Name: refunds fkrta225hxjtg5pgsncj9rsbvf1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fkrta225hxjtg5pgsncj9rsbvf1 FOREIGN KEY (approved_by) REFERENCES public.utilisateurs(id);

--
-- Name: hierarchical_access fks3g9t2o2xeqq5lmdbgbmx2blc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchical_access
    ADD CONSTRAINT fks3g9t2o2xeqq5lmdbgbmx2blc FOREIGN KEY (departement_id) REFERENCES public.departements(id);

--
-- Name: charges_horaires fks4xpkbuygna8rxvbni6p8xntb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges_horaires
    ADD CONSTRAINT fks4xpkbuygna8rxvbni6p8xntb FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);

--
-- Name: charges_horaires fksrurmjxdlkxij9xcpee1c0q9m; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges_horaires
    ADD CONSTRAINT fksrurmjxdlkxij9xcpee1c0q9m FOREIGN KEY (personnel_id) REFERENCES public.personnel(id);

--
-- Name: affectations_frais fkt0ex025hyqo802jer92d2jmge; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_frais
    ADD CONSTRAINT fkt0ex025hyqo802jer92d2jmge FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id);

--
-- Name: transactions fkxloq0675ejnxf1ecfxxnbm7h; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkxloq0675ejnxf1ecfxxnbm7h FOREIGN KEY (student_id) REFERENCES public.etudiants(id);

--
-- Name: horaires horaires_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horaires
    ADD CONSTRAINT horaires_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: horaires horaires_salle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horaires
    ADD CONSTRAINT horaires_salle_id_fkey FOREIGN KEY (salle_id) REFERENCES public.salles(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_annee_academique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_annee_academique_id_fkey FOREIGN KEY (annee_academique_id) REFERENCES public.annees_academiques(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;

--
-- Name: inscriptions inscriptions_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: lecons lecons_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons
    ADD CONSTRAINT lecons_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: lignes_releve lignes_releve_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_releve
    ADD CONSTRAINT lignes_releve_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: lignes_releve lignes_releve_releve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_releve
    ADD CONSTRAINT lignes_releve_releve_id_fkey FOREIGN KEY (releve_id) REFERENCES public.releves_notes(id) ON DELETE CASCADE;

--
-- Name: livres livres_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livres
    ADD CONSTRAINT livres_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: notes notes_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: notes notes_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: notes_questions notes_questions_tentative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes_questions
    ADD CONSTRAINT notes_questions_tentative_id_fkey FOREIGN KEY (tentative_id) REFERENCES public.tentatives_quiz(id) ON DELETE CASCADE;

--
-- Name: notes notes_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: notifications notifications_destinataire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_destinataire_id_fkey FOREIGN KEY (destinataire_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;

--
-- Name: options options_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;

--
-- Name: paiements paiements_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: paiements paiements_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: paies paies_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paies
    ADD CONSTRAINT paies_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE CASCADE;

--
-- Name: parametres_palmares parametres_palmares_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_palmares
    ADD CONSTRAINT parametres_palmares_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: parametres_universite parametres_universite_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_universite
    ADD CONSTRAINT parametres_universite_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: personnel personnel_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE SET NULL;

--
-- Name: personnel personnel_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnel
    ADD CONSTRAINT personnel_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: presences presences_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: presences presences_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: presences_personnel presences_personnel_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_personnel
    ADD CONSTRAINT presences_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnel(id) ON DELETE CASCADE;

--
-- Name: presences presences_seance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_seance_id_fkey FOREIGN KEY (seance_id) REFERENCES public.seances_live(id) ON DELETE SET NULL;

--
-- Name: progressions_etudiants progressions_etudiants_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants
    ADD CONSTRAINT progressions_etudiants_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: progressions_etudiants progressions_etudiants_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_etudiants
    ADD CONSTRAINT progressions_etudiants_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: promotions promotions_annee_academique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_annee_academique_id_fkey FOREIGN KEY (annee_academique_id) REFERENCES public.annees_academiques(id) ON DELETE CASCADE;

--
-- Name: promotions promotions_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;

--
-- Name: questions questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;

--
-- Name: quiz quiz_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: releves_notes releves_notes_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.releves_notes
    ADD CONSTRAINT releves_notes_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: reponses_etudiant reponses_etudiant_tentative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_etudiant
    ADD CONSTRAINT reponses_etudiant_tentative_id_fkey FOREIGN KEY (tentative_id) REFERENCES public.tentatives_quiz(id) ON DELETE CASCADE;

--
-- Name: reponses reponses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses
    ADD CONSTRAINT reponses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

--
-- Name: reservations reservations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;

--
-- Name: reservations reservations_livre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_livre_id_fkey FOREIGN KEY (livre_id) REFERENCES public.livres(id) ON DELETE CASCADE;

--
-- Name: salles salles_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salles
    ADD CONSTRAINT salles_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: seances_live seances_live_cours_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seances_live
    ADD CONSTRAINT seances_live_cours_id_fkey FOREIGN KEY (cours_id) REFERENCES public.cours(id) ON DELETE CASCADE;

--
-- Name: services_universite services_universite_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services_universite
    ADD CONSTRAINT services_universite_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: tentatives_quiz tentatives_quiz_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentatives_quiz
    ADD CONSTRAINT tentatives_quiz_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;

--
-- Name: tentatives_quiz tentatives_quiz_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentatives_quiz
    ADD CONSTRAINT tentatives_quiz_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;

--
-- Name: transactions_externes transactions_externes_paiement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_externes
    ADD CONSTRAINT transactions_externes_paiement_id_fkey FOREIGN KEY (paiement_id) REFERENCES public.paiements(id);

--
-- Name: universite_departements universite_departements_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_departements
    ADD CONSTRAINT universite_departements_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: universite_facultes universite_facultes_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_facultes
    ADD CONSTRAINT universite_facultes_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- Name: universite_promotions universite_promotions_universite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universite_promotions
    ADD CONSTRAINT universite_promotions_universite_id_fkey FOREIGN KEY (universite_id) REFERENCES public.universites(id) ON DELETE CASCADE;

--
-- PostgreSQL database dump complete
--


