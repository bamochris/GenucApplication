// src/pages/professeur/tfc/SuiviMemoire.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function SuiviMemoire() {
  const { user } = useAuth();
  const [memoires, setMemoires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/tfc/memoires/suivi/${user.id}`);
      setMemoires(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (id) => {
    if (!commentaire.trim()) {
      setMessage('⚠️ Veuillez saisir un commentaire');
      return;
    }
    try {
      await api.post(`/api/tfc/memoires/${id}/commentaire`, {
        commentaire,
        auteurId: user.id,
        auteurNom: user.nomComplet
      });
      setMessage('✅ Commentaire ajouté');
      setCommentaire('');
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout');
    }
  };

  const handleUpdateProgression = async (id, progression) => {
    try {
      await api.patch(`/api/tfc/memoires/${id}/progression`, { progression });
      setMessage(`✅ Progression mise à jour : ${progression}%`);
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Suivi des mémoires</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="card-title">Mémoires en suivi</h3>
          {memoires.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun mémoire en suivi</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {memoires.map(m => (
                <button
                  key={m.id}
                  className={`btn-outline ${selected?.id === m.id ? 'active' : ''}`}
                  onClick={() => setSelected(m)}
                  style={{
                    textAlign: 'left',
                    background: selected?.id === m.id ? '#0B1F4A' : '',
                    color: selected?.id === m.id ? 'white' : '',
                    padding: '12px 16px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{m.etudiant}</div>
                  <div style={{ fontSize: 12 }}>{m.sujet}</div>
                  <div style={{ fontSize: 11, color: selected?.id === m.id ? '#9FE1CB' : '#888' }}>
                    Progression : {m.progression || 0}%
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {!selected ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Sélectionnez un mémoire pour voir les détails
            </p>
          ) : (
            <>
              <h3 className="card-title">{selected.etudiant} - {selected.sujet}</h3>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Progression</span>
                  <span style={{ fontWeight: 600 }}>{selected.progression || 0}%</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    width: `${selected.progression || 0}%`,
                    background: selected.progression >= 80 ? '#1D9E75' : selected.progression >= 50 ? '#ff9800' : '#cc0000',
                    height: '100%',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[25, 50, 75, 100].map(p => (
                    <button
                      key={p}
                      className="btn-outline"
                      style={{ fontSize: 11, padding: '4px 12px' }}
                      onClick={() => handleUpdateProgression(selected.id, p)}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Ajouter un commentaire</label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                  placeholder="Commentaire sur l'avancement..."
                />
                <button
                  className="btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={() => handleAddComment(selected.id)}
                >
                  📤 Envoyer
                </button>
              </div>

              {selected.commentaires && selected.commentaires.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Historique des commentaires</h4>
                  {selected.commentaires.map((c, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ fontSize: 13 }}>{c.texte}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.auteurNom} - {new Date(c.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}