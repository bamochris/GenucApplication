// src/pages/etudiant/EtudiantProfil.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function EtudiantProfil() {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadProfil();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadProfil = async () => {
    try {
      const response = await api.get(`/api/etudiant/profil/${inscriptionId}`);
      setProfil(response.data);
      setForm(response.data);
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const updateProfil = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    
    try {
      await api.put(`/api/etudiant/profil/${inscriptionId}`, form);
      setMessage('Profil mis à jour avec succès');
      setIsEditing(false);
      loadProfil();
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement de votre profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  if (!profil) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Mon profil</h1>
          <p className="page-sub">Consultez et modifiez vos informations personnelles</p>
        </div>
        {!isEditing && (
          <button className="btn-primary" onClick={() => setIsEditing(true)}>
            ✏️ Modifier mon profil
          </button>
        )}
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {isEditing ? (
        <div className="card">
          <h2 className="card-title">Modification des informations</h2>
          <form onSubmit={updateProfil} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Nom</label>
              <input value={form.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input value={form.prenom || ''} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input type="date" value={form.dateNaissance || ''} onChange={e => setForm({ ...form, dateNaissance: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lieu de naissance</label>
              <input value={form.lieuNaissance || ''} onChange={e => setForm({ ...form, lieuNaissance: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Adresse</label>
              <input value={form.adresse || ''} onChange={e => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setIsEditing(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Informations académiques */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="card-title">🎓 Informations académiques</h2>
            <div className="detail-grid">
              <div>
                <div className="detail-lbl">Matricule</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profil.matricule}</div>
              </div>
              <div>
                <div className="detail-lbl">Université</div>
                <div>{profil.universite}</div>
              </div>
              <div>
                <div className="detail-lbl">Département</div>
                <div>{profil.departement}</div>
              </div>
              <div>
                <div className="detail-lbl">Filière</div>
                <div>{profil.filiere}</div>
              </div>
              <div>
                <div className="detail-lbl">Promotion</div>
                <div>{profil.promotion}</div>
              </div>
              <div>
                <div className="detail-lbl">Année académique</div>
                <div>{profil.anneeAcademique}</div>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="card">
            <h2 className="card-title">📋 Informations personnelles</h2>
            <div className="detail-grid">
              <div>
                <div className="detail-lbl">Nom complet</div>
                <div style={{ fontWeight: 500 }}>{profil.prenom} {profil.nom}</div>
              </div>
              <div>
                <div className="detail-lbl">Email</div>
                <div>{profil.email}</div>
              </div>
              <div>
                <div className="detail-lbl">Téléphone</div>
                <div>{profil.telephone || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="detail-lbl">Date de naissance</div>
                <div>{profil.dateNaissance ? new Date(profil.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'}</div>
              </div>
              <div>
                <div className="detail-lbl">Lieu de naissance</div>
                <div>{profil.lieuNaissance || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="detail-lbl">Adresse</div>
                <div>{profil.adresse || 'Non renseignée'}</div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="card-title">📎 Mes documents</h2>
            <div className="detail-grid">
              <div>
                <div className="detail-lbl">Bulletin</div>
                <div>
                  {profil.bulletin ? (
                    <span className="badge badge-success">✓ Déposé</span>
                  ) : (
                    <span className="badge badge-neutral">Non déposé</span>
                  )}
                </div>
              </div>
              <div>
                <div className="detail-lbl">Photo</div>
                <div>
                  {profil.photo ? (
                    <span className="badge badge-success">✓ Déposée</span>
                  ) : (
                    <span className="badge badge-neutral">Non déposée</span>
                  )}
                </div>
              </div>
              <div>
                <div className="detail-lbl">Acte de naissance</div>
                <div>
                  {profil.acte ? (
                    <span className="badge badge-success">✓ Déposé</span>
                  ) : (
                    <span className="badge badge-neutral">Non déposé</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
