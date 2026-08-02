// src/pages/professeur/cours/EtudiantsCours.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function EtudiantsCours() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState(null);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/cours/professeur/${user.id}`);
      setCours(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEtudiants = async (coursId) => {
    try {
      const res = await api.get(`/api/cours/${coursId}/etudiants`);
      setEtudiants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCours = (c) => {
    setSelectedCours(c);
    loadEtudiants(c.id);
  };

  const getMoyenne = (notes) => {
    if (!notes || notes.length === 0) return '-';
    const total = notes.reduce((sum, n) => sum + n.noteFinale, 0);
    return (total / notes.length).toFixed(2);
  };

  const filteredEtudiants = etudiants.filter(e => 
    e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">👨‍🎓 Étudiants inscrits</h2>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '280px 1fr' }}>
        <div className="card">
          <h3 className="card-title">Mes cours</h3>
          {cours.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucun cours</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.map(c => (
                <button
                  key={c.id}
                  className={`btn-outline ${selectedCours?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCours(c)}
                  style={{
                    textAlign: 'left',
                    background: selectedCours?.id === c.id ? '#0B1F4A' : '',
                    color: selectedCours?.id === c.id ? 'white' : '',
                    padding: '10px 14px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{c.code}</div>
                  <div style={{ fontSize: 12 }}>{c.titre}</div>
                  <div style={{ fontSize: 11, color: selectedCours?.id === c.id ? '#9FE1CB' : '#888' }}>
                    {c.nbEtudiants || 0} étudiants
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {!selectedCours ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Sélectionnez un cours pour voir ses étudiants
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  {selectedCours.titre} - {etudiants.length} étudiants
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>

              {filteredEtudiants.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun étudiant trouvé</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Notes</th>
                      <th>Moyenne</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEtudiants.map(e => (
                      <tr key={e.id}>
                        <td className="uni-code">{e.matricule}</td>
                        <td>{e.nom}</td>
                        <td>{e.prenom}</td>
                        <td>{e.notes?.length || 0}</td>
                        <td style={{ fontWeight: 600, color: getMoyenne(e.notes) >= 10 ? '#1D9E75' : '#cc0000' }}>
                          {getMoyenne(e.notes)}/20
                        </td>
                        <td>
                          <Link to={`/professeur/etudiants/${e.id}`} className="btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>
                            📋 Détails
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}