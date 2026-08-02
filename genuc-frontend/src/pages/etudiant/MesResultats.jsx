// src/pages/etudiant/MesResultats.jsx
import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CertificatPDF from '../../components/CertificatPDF';
import '../Dashboard.css';

export default function MesResultats() {
  const { user } = useAuth();
  const [annees, setAnnees] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');


  useEffect(() => {
    api.get('/api/annees-academiques')
      .then(res => {
        setAnnees(res.data);
        const active = res.data.find(a => a.active);
        if (active) setSelectedAnnee(active.libelle);
      })
      .catch(console.error);
  }, []);

  const consulter = async () => {
    if (!selectedAnnee) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/deliberation/etudiant/resultats?anneeAcademique=${selectedAnnee}`);
      setResultats(res.data);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.erreur || "Aucun résultat disponible pour cette année.");
      setResultats(null);
    } finally {
      setLoading(false);
    }
  };

  const telechargerPdf = async () => {
    try {
      const response = await api.get(`/api/deliberation/etudiant/pdf?anneeAcademique=${selectedAnnee}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `releve_${selectedAnnee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage("Erreur lors du téléchargement du PDF");
    }
  };

  const downloadCertificate = async (cours) => {
    const blob = await pdf(
      <CertificatPDF
        nomComplet={user?.nomComplet || 'Étudiant'}
        coursTitre={cours.titre}
        code={cours.code}
        date={new Date().toLocaleDateString('fr-FR')}
        mention={cours.mention || 'Satisfaction'}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificat_${cours.code}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Mes résultats académiques</h1>
        <p className="page-sub">Consultez vos notes, votre moyenne, vos crédits et votre situation.</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Année académique</label>
          <select value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value)}>
            {annees.map(a => <option key={a.id} value={a.libelle}>{a.libelle}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-primary" onClick={consulter} disabled={loading}>
            {loading ? 'Chargement...' : 'Consulter mes résultats'}
          </button>
          {resultats?.pdfDisponible && (
            <button className="btn-success" onClick={telechargerPdf}>
              📄 Télécharger mon relevé
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert-erreur">{message}</div>}

      {resultats && (
        <div className="card">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value">{resultats.moyenneGenerale?.toFixed(2) || '-'}</div>
              <div className="stat-label">Moyenne générale</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultats.creditsValides || 0}</div>
              <div className="stat-label">Crédits validés</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultats.mention}</div>
              <div className="stat-label">Mention</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultats.decision}</div>
              <div className="stat-label">Décision</div>
            </div>
          </div>

          <h3 className="card-title">Phase de délibération : <strong>{resultats.phase}</strong></h3>

          {resultats.notesManquantes?.length > 0 && (
            <div className="alert-erreur">
              <p>⚠️ Cours sans note finale :</p>
              <ul>
                {resultats.notesManquantes.map((c, i) => <li key={i}>{c.cours} ({c.code})</li>)}
              </ul>
            </div>
          )}

          {/* Certificats des cours terminés */}
          {resultats.coursTermines && resultats.coursTermines.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>📜 Certificats disponibles</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {resultats.coursTermines.map((c, idx) => (
                  <button
                    key={idx}
                    className="btn-outline"
                    style={{ fontSize: 12 }}
                    onClick={() => downloadCertificate(c)}
                  >
                    📄 {c.titre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}