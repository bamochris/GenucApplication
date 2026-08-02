// src/components/settings/PasswordDialog.jsx
// Boîte de dialogue « Mot de passe » — seule action de la sidebar à rester une
// boîte de dialogue (courte, ponctuelle, sans liste ni tableau). Toutes les
// autres anciennes options des Paramètres (2FA, utilisateurs, signataires,
// historiques, admin système…) sont désormais de vraies pages du portail.
import SettingsDialog from './SettingsDialog';
import PasswordPanel from './PasswordPanel';
import { FaKey } from 'react-icons/fa';

const MENU = [
  {
    id: 'securite',
    label: 'Sécurité & accès',
    items: [
      {
        id: 'password',
        icone: FaKey,
        titre: 'Mot de passe',
        desc: 'Met à jour le mot de passe et déconnecte toutes les autres sessions',
        accent: 'amber',
      },
    ],
  },
];

export default function PasswordDialog({ onClose }) {
  return (
    <SettingsDialog
      titre="Mot de passe"
      sousTitre="Sécurité de votre compte"
      note="Cette opération déconnecte toutes vos autres sessions actives."
      menu={MENU}
      onClose={onClose}
      renderPanel={(actif, { applyRef, onDirtyChange }) => (
        <PasswordPanel applyRef={applyRef} onDirtyChange={onDirtyChange} />
      )}
    />
  );
}
