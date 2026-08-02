// src/pages/professeur/documents/Arretes.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Arretes() {
  const { user } = useAuth();
  const [arretes, setArretes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/documents/arretes/${user.id}`);
      setArretes(res.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ Impossible de charger les arrêtés');
    } finally {
      setLoading(false);
    }
  };

  const telecharger = async (id) => {
    try {
      const response = await api.get(`/api/documents/arretes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `arrete_${id}.pdf`);
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
        <h2 className="section-title">📜 Arrêtés de nomination</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card">
        {arretes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun arrêté disponible</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Arrêté</th>
                <th>Objet</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {arretes.map(a => (
                <tr key={a.id}>
                  <td className="uni-code">{a.numero}</td>
                  <td>{a.objet}</td>
                  <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => telecharger(a.id)}>
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