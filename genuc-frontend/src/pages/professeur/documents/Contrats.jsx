// src/pages/professeur/documents/Contrats.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Contrats() {
  const { user } = useAuth();
  const [contrats, setContrats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/documents/contrats/${user.id}`);
      setContrats(res.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ Impossible de charger les contrats');
    } finally {
      setLoading(false);
    }
  };

  const telecharger = async (id) => {
    try {
      const response = await api.get(`/api/documents/contrats/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrat_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📄 Contrats</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card">
        {contrats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun contrat disponible</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Contrat</th>
                <th>Type</th>
                <th>Période</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contrats.map(c => (
                <tr key={c.id}>
                  <td className="uni-code">{c.numero}</td>
                  <td>{c.type}</td>
                  <td>{new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${c.statut === 'ACTIF' ? 'badge-success' : c.statut === 'EXPIRE' ? 'badge-danger' : 'badge-neutral'}`}>
                      {c.statut}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => telecharger(c.id)}>
                      📥 PDF
                    </button>
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