// src/pages/admin/modules/ModulePatrimoine.jsx
// Patrimoine : inventaire des actifs (immobilisations, matériels, véhicules),
// fournisseurs et maintenances.
import { FaWarehouse } from 'react-icons/fa';
import ModulePage from '../../../components/common/ModulePage';
import ModuleCrud from '../../../components/common/ModuleCrud';

const TYPES_ACTIF = [
  { v: 'IMMOBILISATION', l: 'Immobilisation' },
  { v: 'MATERIEL', l: 'Matériel' },
  { v: 'VEHICULE', l: 'Véhicule' },
];

const ETATS = [
  { v: 'NEUF', l: 'Neuf' },
  { v: 'BON', l: 'Bon état' },
  { v: 'USAGE', l: 'Usagé' },
  { v: 'HORS_SERVICE', l: 'Hors service' },
];

const STATUTS_MAINTENANCE = [
  { v: 'PLANIFIEE', l: 'Planifiée' },
  { v: 'EN_COURS', l: 'En cours' },
  { v: 'TERMINEE', l: 'Terminée' },
];

export default function ModulePatrimoine() {
  return (
    <ModulePage
      titre="Patrimoine"
      description="Inventaire des actifs, fournisseurs et suivi des maintenances."
      icone={FaWarehouse}
      accent="#B45309"
      onglets={[
        {
          cle: 'actifs',
          libelle: 'Inventaire',
          rendu: (uid) => (
            <ModuleCrud
              ressource="actifs"
              universiteId={uid}
              champs={[
                { cle: 'designation', libelle: 'Désignation', type: 'texte', requis: true },
                { cle: 'type', libelle: 'Type', type: 'select', options: TYPES_ACTIF, requis: true },
                { cle: 'code', libelle: 'Code inventaire', type: 'texte' },
                { cle: 'valeur', libelle: 'Valeur (USD)', type: 'decimal' },
                { cle: 'date_acquisition', libelle: "Date d'acquisition", type: 'date' },
                { cle: 'etat', libelle: 'État', type: 'select', options: ETATS },
                { cle: 'localisation', libelle: 'Localisation', type: 'texte' },
                { cle: 'fournisseur_id', libelle: 'Fournisseur', type: 'ref', refRessource: 'fournisseurs', refLibelle: 'nom' },
              ]}
              colonnes={[
                { cle: 'designation', libelle: 'Désignation' },
                { cle: 'type', libelle: 'Type' },
                { cle: 'code', libelle: 'Code' },
                { cle: 'etat', libelle: 'État' },
                { cle: 'valeur', libelle: 'Valeur (USD)' },
                { cle: 'localisation', libelle: 'Localisation' },
              ]}
            />
          ),
        },
        {
          cle: 'fournisseurs',
          libelle: 'Fournisseurs',
          rendu: (uid) => (
            <ModuleCrud
              ressource="fournisseurs"
              universiteId={uid}
              champs={[
                { cle: 'nom', libelle: 'Nom / Raison sociale', type: 'texte', requis: true },
                { cle: 'contact', libelle: 'Personne de contact', type: 'texte' },
                { cle: 'telephone', libelle: 'Téléphone', type: 'texte' },
                { cle: 'email', libelle: 'Email', type: 'texte' },
                { cle: 'adresse', libelle: 'Adresse', type: 'texte' },
              ]}
              colonnes={[
                { cle: 'nom', libelle: 'Fournisseur' },
                { cle: 'contact', libelle: 'Contact' },
                { cle: 'telephone', libelle: 'Téléphone' },
                { cle: 'email', libelle: 'Email' },
              ]}
            />
          ),
        },
        {
          cle: 'maintenances',
          libelle: 'Maintenances',
          rendu: (uid) => (
            <ModuleCrud
              ressource="maintenances"
              universiteId={uid}
              champs={[
                { cle: 'actif_id', libelle: 'Actif concerné', type: 'ref', refRessource: 'actifs', refLibelle: 'designation', requis: true },
                { cle: 'description', libelle: 'Description des travaux', type: 'textarea', requis: true },
                { cle: 'statut', libelle: 'Statut', type: 'select', options: STATUTS_MAINTENANCE, requis: true },
                { cle: 'date_maintenance', libelle: 'Date', type: 'date' },
                { cle: 'cout', libelle: 'Coût (USD)', type: 'decimal' },
              ]}
              colonnes={[
                { cle: 'actif_id', libelle: 'Actif' },
                { cle: 'description', libelle: 'Travaux' },
                { cle: 'statut', libelle: 'Statut' },
                { cle: 'date_maintenance', libelle: 'Date' },
                { cle: 'cout', libelle: 'Coût (USD)' },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
