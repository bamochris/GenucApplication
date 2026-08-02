// src/pages/CoursPublics.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

export default function CoursPublics() {
  const [universites, setUniversites] = useState([]);
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursParDept, setCoursParDept] = useState({});

  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => setUniversites(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUniversites([]));
  }, []);

  const handleUniClick = async (uni) => {
    setSelectedUni(uni);
    setSelectedDept(null);
    setCours([]);
    try {
      const response = await api.get(`/api/universites/public/${uni.id}/departements`);
      setDepartements(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerCoursDepartement = async (dept) => {
    if (coursParDept[dept.id]) {
      setSelectedDept(dept);
      setCours(coursParDept[dept.id]);
      return;
    }
    
    setLoading(true);
    setSelectedDept(dept);
    try {
      const response = await api.get(`/api/cours/public/departement/${dept.id}`);
      const coursData = response.data.filter(c => c.statut === 'PUBLIE');
      setCoursParDept(prev => ({ ...prev, [dept.id]: coursData }));
      setCours(coursData);
    } catch (err) {
      console.error(err);
      setCours([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Étudier en ligne</h1>
          <p className="page-sub">Accédez gratuitement aux cours en ligne publiés par les départements</p>
        </div>
        <Link to="/" className="btn-outline">← Retour à l'accueil</Link>
      </div>

      {/* Universités */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="card-title">🏛️ Universités</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {universites.map(uni => (
            <button
              key={uni.id}
              className={`btn-outline ${selectedUni?.id === uni.id ? 'active' : ''}`}
              onClick={() => handleUniClick(uni)}
              style={{
                background: selectedUni?.id === uni.id ? '#0B1F4A' : '',
                color: selectedUni?.id === uni.id ? 'white' : ''
              }}
            >
              {uni.code}
            </button>
          ))}
        </div>
      </div>

      {/* Départements */}
      {selectedUni && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">📚 Départements / Facultés</h2>
          {departements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucun département</p>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {departements.map(dept => (
                <button
                  key={dept.id}
                  className={`btn-outline ${selectedDept?.id === dept.id ? 'active' : ''}`}
                  onClick={() => chargerCoursDepartement(dept)}
                  style={{
                    background: selectedDept?.id === dept.id ? '#185FA5' : '',
                    color: selectedDept?.id === dept.id ? 'white' : ''
                  }}
                >
                  {dept.nom}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cours */}
      {selectedDept && (
        <div className="card">
          <h2 className="card-title">
            📖 Cours disponibles - {selectedDept.nom}
            {coursParDept[selectedDept.id] && (
              <span style={{ fontSize: 12, marginLeft: 10, color: 'var(--text-muted)' }}>
                ({coursParDept[selectedDept.id].length} cours)
              </span>
            )}
          </h2>
          
          {loading ? (
            <div className="loading">Chargement des cours...</div>
          ) : cours.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Aucun cours en ligne disponible pour ce département.
              <br />
              <span style={{ fontSize: 12 }}>Les cours apparaîtront ici une fois publiés par le professeur ou le chef de département.</span>
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {cours.map(c => (
                <div key={c.id} className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>{c.code}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {c.professeurNom} • {c.niveau} • {c.credits} crédits
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                    {c.description?.substring(0, 120)}...
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link 
                      to={`/cours-public/${c.id}`}
                      className="btn-primary" 
                      style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 12, padding: '8px' }}
                    >
                      Voir le cours →
                    </Link>
                    <Link 
                      to="/login"
                      className="btn-outline" 
                      style={{ textDecoration: 'none', fontSize: 12, padding: '7px 12px' }}
                    >
                      S'inscrire
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}