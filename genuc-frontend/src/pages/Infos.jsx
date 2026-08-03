// src/pages/Infos.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

export default function Infos() {
  // Ces chiffres etaient ecrits en dur : « 14 universites », « 48 000+
  // etudiants », « 1 204 cours en ligne », « 850+ professeurs ». Aucun ne
  // correspondait a la base. Les deux qui ont une source publique sont
  // desormais calcules ; les deux autres ont ete retires plutot qu'inventes.
  const [chiffres, setChiffres] = useState(null);

  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => {
        const unis = r.data || [];
        setChiffres({
          etablissements: unis.length,
          etudiants: unis.reduce((acc, u) => acc + (u.nbEtudiants || 0), 0),
        });
      })
      .catch(() => setChiffres(null));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">ℹ️ À propos de GENUC</h1>
          <p className="page-sub">Plateforme nationale de gestion universitaire du Congo</p>
        </div>
        <Link to="/" className="btn-outline">← Retour à l'accueil</Link>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Présentation */}
        <div className="card">
          <h2 className="card-title">🎓 GENUC - Genie Universitaire du Congo</h2>
          <p style={{ lineHeight: 1.6, marginTop: 12 }}>
            GENUC est une plateforme innovante qui centralise la gestion académique 
            de l'ensemble des universités de la République Démocratique du Congo.
          </p>
          <p style={{ lineHeight: 1.6, marginTop: 12 }}>
            Développée par <strong>Amtach (Christian & Tabitha)</strong>, cette solution 
            permet aux étudiants, professeurs et administrateurs de gérer efficacement 
            les inscriptions, les paiements, les cours en ligne, les notes et les diplômes.
          </p>
        </div>

        {/* Chiffres clés */}
        <div className="card">
          <h2 className="card-title">📊 Chiffres clés</h2>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>🏛️ Établissements connectés</span>
              <strong>{chiffres ? chiffres.etablissements : '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>👨‍🎓 Étudiants inscrits</span>
              <strong>{chiffres ? chiffres.etudiants.toLocaleString() : '—'}</strong>
            </div>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="card">
          <h2 className="card-title">✨ Fonctionnalités principales</h2>
          <ul style={{ marginTop: 12, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>📝 Inscriptions en ligne avec téléversement de documents</li>
            <li>💳 Gestion des frais académiques et paiements</li>
            <li>📚 Cours en ligne avec vidéos et supports</li>
            <li>📊 Relevés de notes et bulletins</li>
            <li>🎓 Génération de diplômes certifiés</li>
            <li>💬 Messagerie interne avec l'administration</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="card">
          <h2 className="card-title">📞 Contact & Support</h2>
          <div style={{ marginTop: 12 }}>
            <p><strong>Développé par :</strong> Amtach (Christian & Tabitha)</p>
            <p><strong>Email :</strong> support@genuc.cd</p>
            <p><strong>Téléphone :</strong> +243 XXX XXX XXX</p>
            <p><strong>Adresse :</strong> Kinshasa, République Démocratique du Congo</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="card" style={{ gridColumn: '1 / span 2' }}>
          <h2 className="card-title">❓ Foire aux questions</h2>
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>Comment créer un compte étudiant ?</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Rendez-vous sur la page "Inscription", remplissez le formulaire et soumettez votre dossier. 
                L'administration validera votre inscription et vous recevrez vos identifiants.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Comment accéder aux cours en ligne ?</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Une fois votre compte validé, connectez-vous et allez dans "Mes cours" pour accéder 
                aux modules disponibles selon votre filière.
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Comment effectuer un paiement ?</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Connectez-vous à votre compte étudiant, puis allez dans la section "Mes paiements" 
                pour voir votre situation et déclarer un versement.
              </p>
            </div>
            <div>
              <strong>Comment obtenir mon diplôme ?</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Les diplômes sont générés automatiquement après validation de toutes les années d'études. 
                Vous pouvez vérifier l'authenticité de votre diplôme via la page "Diplômes".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}