// src/pages/finances/etudiant/Recus.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function Recus() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recus, setRecus] = useState([]);
  const [message, setMessage] = useState('');

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) loadRecus();
  }, [inscriptionId]);

  const loadRecus = async () => {
    try {
      const res = await api.get(`/api/etudiant/frais/historique`);
      setRecus(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, reference) => {
    try {
      const response = await api.get(`/api/etudiant/frais/recu/${id}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu_${reference || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('✅ Reçu téléchargé');
    } catch (err) {
      setMessage('❌ Erreur de téléchargement');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">🧾 Mes reçus</h2>
      </div>
      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}
      <div className="card">
        {recus.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun reçu disponible.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recus.map(r => (
                <tr key={r.id}>
                  <td className="uni-code">{r.reference}</td>
                  <td>{new Date(r.datePaiement).toLocaleDateString('fr-FR')}</td>
                  <td>{r.montant} {r.devise || 'USD'}</td>
                  <td><span className={`badge ${r.statut === 'VALIDE' ? 'badge-success' : 'badge-warning'}`}>{r.statut}</span></td>
                  <td>
                    {r.statut === 'VALIDE' && (
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => handleDownload(r.id, r.reference)}>
                        📥 PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
