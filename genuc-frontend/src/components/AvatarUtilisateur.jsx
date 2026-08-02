// src/components/AvatarUtilisateur.jsx
// Avatar du compte connecté : photo de profil si définie, sinon initiales.
// Se met à jour tout seul quand une nouvelle photo est enregistrée
// (événement global « photos-maj » via usePhotosIdentite).
import { useAuth } from '../context/AuthContext';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';

export default function AvatarUtilisateur({ taille = 24, style }) {
  const { user } = useAuth();
  const photos = usePhotosIdentite(!!user);
  const photo = urlPhoto(photos.photoProfil || user?.photoProfil);

  const nom = user?.nomComplet || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email || '?';
  const initiales = nom.split(/\s+/).slice(0, 2).map(m => m[0]).join('').toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: taille, height: taille, borderRadius: '50%', flexShrink: 0,
        overflow: 'hidden', verticalAlign: 'middle',
        background: photo ? 'transparent' : 'linear-gradient(135deg, #185FA5, #0B1F4A)',
        color: '#fff', fontWeight: 800, fontSize: Math.max(9, taille * 0.4),
        ...style,
      }}
    >
      {photo ? (
        <img key={photo} src={photo} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : initiales}
    </span>
  );
}
