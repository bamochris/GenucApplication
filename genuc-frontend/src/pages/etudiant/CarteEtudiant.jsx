// src/pages/etudiant/CarteEtudiant.jsx
import { useState } from 'react';
import { FaDownload, FaIdCard, FaQrcode, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';
import './CarteEtudiant.css';

export default function CarteEtudiant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inscriptionId = user?.inscriptionId;
  const nomComplet = user?.nomComplet || user?.email || 'Etudiant GENUC';
  const initiales = nomComplet
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'GE';

  const telechargerCarte = async () => {
    if (!inscriptionId) {
      setError('Aucune inscription trouvée');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.get(`/api/carte-etudiant/${inscriptionId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carte_etudiant_${inscriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ Carte téléchargée avec succès !');
    } catch (err) {
      setError('Erreur lors du téléchargement de la carte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🪪 Ma carte d'étudiant</h1>
          <p className="page-sub">Téléchargez votre carte d'étudiant officielle au format PDF</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="student-card-page-grid">
        <section className="student-card-preview-panel" aria-label="Aperçu de la carte étudiant">
          <div className="student-card-preview">
            <div className="student-card-preview-top">
              <div>
                <span>REPUBLIQUE DEMOCRATIQUE DU CONGO</span>
                <small>MINISTERE DE L'ESU</small>
                <strong>CARTE D'ETUDIANT GENUC</strong>
              </div>
              <div className="student-card-preview-marks" aria-hidden="true">
                <span className="student-card-esu">ESU</span>
                <span className="student-card-flag"><i /></span>
              </div>
            </div>

            <div className="student-card-preview-body">
              <div className="student-card-photo">{initiales}</div>
              <div className="student-card-fields">
                <p>STUDENT NAME: <strong>{nomComplet}</strong></p>
                <p>MATRICULE: <strong>{inscriptionId ? `INS-${inscriptionId}` : 'GENUC'}</strong></p>
                <p>CYCLE: <strong>LMD</strong></p>
                <p>PROMOTION: <strong>GENUC</strong></p>
                <p>FILIERE: <strong>Données officielles dans le PDF</strong></p>
                <p>CAMPUS: <strong>Université connectée</strong></p>
              </div>
            </div>

            <div className="student-card-preview-verify">
              <div className="student-card-qr"><FaQrcode /></div>
              <strong>SCAN TO VERIFY</strong>
              <span>Année académique active</span>
            </div>
          </div>
        </section>

        <section className="card student-card-actions-panel">
          <div className="student-card-action-icon"><FaIdCard /></div>
          <h2>Carte d'étudiant officielle</h2>
          <p>
            Le PDF généré reprend les données réelles de votre inscription GENUC : université,
            photo, matricule, cycle, promotion, filière, département, contact et QR code de vérification.
          </p>

          <button
            className="btn-primary student-card-download"
            onClick={telechargerCarte}
            disabled={loading}
          >
            <FaDownload />
            <span>{loading ? 'Génération...' : 'Télécharger ma carte'}</span>
          </button>

          <div className="student-card-note">
            <FaShieldAlt />
            <span>Format carte bancaire 85.6 x 54 mm, avec drapeau RDC, badge ESU et QR code vérifiable.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
