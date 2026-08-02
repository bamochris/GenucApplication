// src/pages/admin/modules/ModuleCommunication.jsx
// Communication : annonces, actualités et événements de l'université.
// La publication notifie automatiquement tous les membres de l'université.
import { FaBullhorn } from 'react-icons/fa';
import ModulePage from '../../../components/common/ModulePage';
import ModuleCrud from '../../../components/common/ModuleCrud';

const CHAMPS = [
  { cle: 'titre', libelle: 'Titre', type: 'texte', requis: true },
  {
    cle: 'type', libelle: 'Type', type: 'select', requis: true,
    options: [
      { v: 'ACTUALITE', l: 'Actualité' },
      { v: 'EVENEMENT', l: 'Événement' },
      { v: 'COMMUNIQUE', l: 'Communiqué officiel' },
    ],
  },
  { cle: 'date_evenement', libelle: "Date (si événement)", type: 'datetime' },
  { cle: 'lieu', libelle: 'Lieu', type: 'texte' },
  { cle: 'publie_par', libelle: 'Publié par', type: 'texte' },
  { cle: 'contenu', libelle: 'Contenu', type: 'textarea', requis: true },
];

const COLONNES = [
  { cle: 'titre', libelle: 'Titre' },
  { cle: 'type', libelle: 'Type' },
  { cle: 'date_evenement', libelle: 'Date événement' },
  { cle: 'lieu', libelle: 'Lieu' },
  { cle: 'publie_par', libelle: 'Publié par' },
];

export default function ModuleCommunication() {
  return (
    <ModulePage
      titre="Communication"
      description="Annonces, actualités et événements — chaque publication notifie les membres de l'université."
      icone={FaBullhorn}
      accent="#6D28D9"
      onglets={[{
        cle: 'annonces',
        libelle: 'Annonces & événements',
        rendu: (universiteId) => (
          <ModuleCrud ressource="annonces" universiteId={universiteId} champs={CHAMPS} colonnes={COLONNES} />
        ),
      }]}
    />
  );
}
