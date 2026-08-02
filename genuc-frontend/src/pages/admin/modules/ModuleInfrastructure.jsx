// src/pages/admin/modules/ModuleInfrastructure.jsx
// Infrastructure physique de l'université : campus → bâtiments → salles.
import { FaBuilding } from 'react-icons/fa';
import ModulePage from '../../../components/common/ModulePage';
import ModuleCrud from '../../../components/common/ModuleCrud';

// Valeurs de l'enum Java Salle.TypeSalle (table partagée avec les horaires)
const TYPES_SALLE = [
  { v: 'COURS', l: 'Salle de cours' },
  { v: 'AUDITOIRE', l: 'Auditoire / Amphithéâtre' },
  { v: 'LABO', l: 'Laboratoire' },
  { v: 'BIBLIOTHEQUE', l: 'Bibliothèque' },
  { v: 'REUNION', l: 'Salle de réunion' },
];

export default function ModuleInfrastructure() {
  return (
    <ModulePage
      titre="Infrastructure"
      description="Campus, bâtiments et salles de votre université."
      icone={FaBuilding}
      accent="#185FA5"
      onglets={[
        {
          cle: 'campus',
          libelle: 'Campus',
          rendu: (uid) => (
            <ModuleCrud
              ressource="campus"
              universiteId={uid}
              champs={[
                { cle: 'nom', libelle: 'Nom du campus', type: 'texte', requis: true },
                { cle: 'adresse', libelle: 'Adresse', type: 'texte' },
                { cle: 'description', libelle: 'Description', type: 'textarea' },
              ]}
              colonnes={[
                { cle: 'nom', libelle: 'Campus' },
                { cle: 'adresse', libelle: 'Adresse' },
              ]}
            />
          ),
        },
        {
          cle: 'batiments',
          libelle: 'Bâtiments',
          rendu: (uid) => (
            <ModuleCrud
              ressource="batiments"
              universiteId={uid}
              champs={[
                { cle: 'nom', libelle: 'Nom du bâtiment', type: 'texte', requis: true },
                { cle: 'code', libelle: 'Code', type: 'texte' },
                { cle: 'campus_id', libelle: 'Campus', type: 'ref', refRessource: 'campus', refLibelle: 'nom' },
                { cle: 'niveaux', libelle: 'Nombre de niveaux', type: 'nombre' },
                { cle: 'description', libelle: 'Description', type: 'textarea' },
              ]}
              colonnes={[
                { cle: 'nom', libelle: 'Bâtiment' },
                { cle: 'code', libelle: 'Code' },
                { cle: 'campus_id', libelle: 'Campus' },
                { cle: 'niveaux', libelle: 'Niveaux' },
              ]}
            />
          ),
        },
        {
          cle: 'salles',
          libelle: 'Salles',
          rendu: (uid) => (
            <ModuleCrud
              ressource="salles"
              universiteId={uid}
              champs={[
                { cle: 'nom', libelle: 'Nom de la salle', type: 'texte', requis: true },
                { cle: 'type', libelle: 'Type', type: 'select', options: TYPES_SALLE, requis: true },
                { cle: 'batiment_id', libelle: 'Bâtiment', type: 'ref', refRessource: 'batiments', refLibelle: 'nom' },
                { cle: 'capacite', libelle: 'Capacité (places)', type: 'nombre' },
                { cle: 'equipements', libelle: 'Équipements', type: 'textarea' },
              ]}
              colonnes={[
                { cle: 'nom', libelle: 'Salle' },
                { cle: 'type', libelle: 'Type' },
                { cle: 'batiment_id', libelle: 'Bâtiment' },
                { cle: 'capacite', libelle: 'Capacité' },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
