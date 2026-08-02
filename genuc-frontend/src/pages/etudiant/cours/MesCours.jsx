// src/pages/etudiant/cours/MesCours.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function MesCours() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadCours();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/etudiant/portal/${inscriptionId}/cours`);
      setCours(res.data);
    } catch (err) {
      console.error('Erreur chargement cours:', err);
      setMessage('❌ Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const getProgressionColor = (progression) => {
    if (progression >= 80) return '#1D9E75';
    if (progression >= 50) return '#185FA5';
    if (progression >= 30) return '#854F0B';
    return '#cc0000';
  };

  const getProgressionLabel = (progression) => {
    if (progression >= 80) return 'Excellent';
    if (progression >= 50) return 'Bon';
    if (progression >= 30) return 'En cours';
    return 'À commencer';
  };

  const niveaux = [...new Set(cours.map(c => c.niveau).filter(Boolean))];

  const coursFiltres = cours.filter(c => {
    const matchSearch = c.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.professeur?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNiveau = filterNiveau ? c.niveau === filterNiveau : true;
    return matchSearch && matchNiveau;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos cours...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📚 Mes Cours</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {cours.length} cours disponibles
        </span>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un cours..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <select
            value={filterNiveau}
            onChange={e => setFilterNiveau(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous niveaux</option>
            {niveaux.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={() => { setSearchTerm(''); setFilterNiveau(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des cours */}
      {coursFiltres.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            {cours.length === 0 
              ? 'Aucun cours disponible pour votre niveau. Les cours apparaîtront ici une fois publiés par vos professeurs.'
              : 'Aucun cours ne correspond à vos critères de recherche.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {coursFiltres.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* En-tête du cours */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>{c.code}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{c.titre}</div>
                </div>
                {c.estComplete && (
                  <span className="badge badge-success" style={{ fontSize: 10 }}>✅ Terminé</span>
                )}
              </div>

              {/* Professeur */}
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                👨‍🏫 {c.professeur || 'Professeur non assigné'}
                <span style={{ marginLeft: 12 }}>🎓 {c.credits} crédits</span>
              </div>

              {/* Description */}
              {c.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                  {c.description.substring(0, 100)}...
                </p>
              )}

              {/* Progression */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Progression</span>
                  <span style={{ fontWeight: 600, color: getProgressionColor(c.progression) }}>
                    {c.progression || 0}% - {getProgressionLabel(c.progression)}
                  </span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.progression || 0}%`,
                      background: getProgressionColor(c.progression),
                      height: '100%',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>{c.leconsCompletees || 0} leçons complétées</span>
                  <span>{c.nbLecons || 0} leçons totales</span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Link
                  to={`/etudiant/cours/${c.id}`}
                  className="btn-primary"
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 13, padding: '8px' }}
                >
                  {(c.progression || 0) > 0 ? '📖 Continuer' : '🚀 Commencer'}
                </Link>
                <Link
                  to={`/etudiant/quiz/cours/${c.id}`}
                  className="btn-outline"
                  style={{ textDecoration: 'none', fontSize: 13, padding: '8px 12px' }}
                  title="Voir les quiz"
                >
                  📝
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
