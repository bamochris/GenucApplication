// src/pages/secretaire/GestionTestAdmission.jsx
// Panneau « moindre privilège » : le secrétaire académique (ou l'admin) active
// ou désactive, filière par filière, l'exigence d'un test d'admission — sans
// pouvoir modifier les autres champs de la filière. Une filière « test exigé »
// impose le test à TOUS ses candidats (en plus de la règle automatique < 60 %).
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GestionTestAdmission() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [recherche, setRecherche] = useState('');
  const [enCours, setEnCours] = useState(null); // id de la filière en cours de bascule

  const charger = useCallback(async () => {
    if (!universiteId) {
      setLoading(false);
      setError('Aucune université associée à votre compte.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/filieres/universite/${universiteId}`);
      setFilieres(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.erreur || 'Impossible de charger les filières.');
      setFilieres([]);
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => { charger(); }, [charger]);

  const basculer = async (filiere) => {
    setEnCours(filiere.id);
    setMessage('');
    setError('');
    try {
      const res = await api.patch(`/api/filieres/${filiere.id}/toggle-test-admission`);
      const nouvelEtat = !!res.data?.testAdmissionRequis;
      setFilieres(prev => prev.map(f => f.id === filiere.id ? { ...f, testAdmissionRequis: nouvelEtat } : f));
      setMessage(nouvelEtat
        ? `✅ Test d'admission désormais exigé pour « ${filiere.nom} ».`
        : `✅ Test d'admission retiré pour « ${filiere.nom} ».`);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la mise à jour.');
    } finally {
      setEnCours(null);
    }
  };

  const filtrees = filieres.filter(f => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return (f.nom || '').toLowerCase().includes(q) || (f.code || '').toLowerCase().includes(q);
  });
  const nbExigees = filieres.filter(f => f.testAdmissionRequis).length;

  if (loading) return <div className="page"><div className="loading">Chargement des filières...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Test d'admission par filière</h1>
          <p className="page-sub">
            Activez l'exigence d'un test d'admission pour les filières concernées.
            Une filière « test exigé » impose le test à tous ses candidats avant validation du dossier.
          </p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="card">
        <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h2 className="card-title">
            Filières ({filieres.length}) • <span style={{ color: '#c07a2b' }}>{nbExigees} avec test</span>
          </h2>
          <input
            type="search"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher une filière..."
            style={{ maxWidth: 260 }}
          />
        </div>

        {filtrees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            {filieres.length === 0 ? 'Aucune filière trouvée pour votre université.' : 'Aucune filière ne correspond à la recherche.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtrees.map(f => {
              const actif = !!f.testAdmissionRequis;
              const busy = enCours === f.id;
              return (
                <div
                  key={f.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px',
                    background: actif ? 'rgba(192,122,43,0.08)' : 'transparent',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {f.nom} {f.code && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({f.code})</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {f.niveau}{!f.actif && ' • filière désactivée'}
                      {actif && <span style={{ color: '#c07a2b', fontWeight: 600 }}> • 📝 test d'admission exigé</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => basculer(f)}
                    disabled={busy}
                    title={actif ? "Retirer l'exigence du test" : 'Exiger le test pour cette filière'}
                    className={actif ? 'btn-primary' : 'btn-outline'}
                    style={{ flexShrink: 0, minWidth: 150, opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer', background: actif ? '#c07a2b' : undefined, border: actif ? 'none' : undefined }}
                  >
                    {busy ? '⏳...' : actif ? '✓ Test exigé' : 'Exiger le test'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
