// src/pages/admin/modules/ModuleRecherche.jsx
// Recherche : laboratoires, projets et production scientifique
// (publications, conférences, brevets).
import { FaFlask } from 'react-icons/fa';
import ModulePage from '../../../components/common/ModulePage';
import ModuleCrud from '../../../components/common/ModuleCrud';

const STATUTS_PROJET = [
  { v: 'EN_COURS', l: 'En cours' },
  { v: 'TERMINE', l: 'Terminé' },
  { v: 'SUSPENDU', l: 'Suspendu' },
];

const TYPES_PUBLICATION = [
  { v: 'PUBLICATION', l: 'Publication' },
  { v: 'CONFERENCE', l: 'Conférence' },
  { v: 'BREVET', l: 'Brevet' },
];

export default function ModuleRecherche() {
  return (
    <ModulePage
      titre="Recherche"
      description="Laboratoires, projets de recherche et production scientifique."
      icone={FaFlask}
      accent="#0F6E56"
      onglets={[
        {
          cle: 'laboratoires',
          libelle: 'Laboratoires',
          rendu: (uid) => (
            <ModuleCrud
              ressource="laboratoires"
              universiteId={uid}
              champs={[
                { cle: 'nom', libelle: 'Nom du laboratoire', type: 'texte', requis: true },
                { cle: 'domaine', libelle: 'Domaine de recherche', type: 'texte' },
                { cle: 'responsable', libelle: 'Responsable', type: 'texte' },
                { cle: 'localisation', libelle: 'Localisation', type: 'texte' },
              ]}
              colonnes={[
                { cle: 'nom', libelle: 'Laboratoire' },
                { cle: 'domaine', libelle: 'Domaine' },
                { cle: 'responsable', libelle: 'Responsable' },
              ]}
            />
          ),
        },
        {
          cle: 'projets',
          libelle: 'Projets',
          rendu: (uid) => (
            <ModuleCrud
              ressource="projets"
              universiteId={uid}
              champs={[
                { cle: 'titre', libelle: 'Titre du projet', type: 'texte', requis: true },
                { cle: 'laboratoire_id', libelle: 'Laboratoire', type: 'ref', refRessource: 'laboratoires', refLibelle: 'nom' },
                { cle: 'statut', libelle: 'Statut', type: 'select', options: STATUTS_PROJET, requis: true },
                { cle: 'date_debut', libelle: 'Début', type: 'date' },
                { cle: 'date_fin', libelle: 'Fin (prévue)', type: 'date' },
                { cle: 'montant', libelle: 'Budget (USD)', type: 'decimal' },
                { cle: 'description', libelle: 'Description', type: 'textarea' },
              ]}
              colonnes={[
                { cle: 'titre', libelle: 'Projet' },
                { cle: 'laboratoire_id', libelle: 'Laboratoire' },
                { cle: 'statut', libelle: 'Statut' },
                { cle: 'date_debut', libelle: 'Début' },
                { cle: 'montant', libelle: 'Budget (USD)' },
              ]}
            />
          ),
        },
        {
          cle: 'publications',
          libelle: 'Publications & brevets',
          rendu: (uid) => (
            <ModuleCrud
              ressource="publications"
              universiteId={uid}
              champs={[
                { cle: 'titre', libelle: 'Titre', type: 'texte', requis: true },
                { cle: 'type', libelle: 'Type', type: 'select', options: TYPES_PUBLICATION, requis: true },
                { cle: 'auteurs', libelle: 'Auteurs', type: 'texte' },
                { cle: 'annee', libelle: 'Année', type: 'nombre' },
                { cle: 'reference', libelle: 'Référence (revue, DOI, n° brevet…)', type: 'texte' },
                { cle: 'lien', libelle: 'Lien', type: 'texte' },
              ]}
              colonnes={[
                { cle: 'titre', libelle: 'Titre' },
                { cle: 'type', libelle: 'Type' },
                { cle: 'auteurs', libelle: 'Auteurs' },
                { cle: 'annee', libelle: 'Année' },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
