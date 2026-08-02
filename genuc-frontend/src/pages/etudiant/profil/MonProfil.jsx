// src/pages/etudiant/profil/MonProfil.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

const isRequestCanceled = (err) => (
  err?.code === 'ERR_CANCELED' ||
  err?.name === 'CanceledError' ||
  axios.isCancel(err)
);

export default function MonProfil() {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadProfil();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadProfil = async () => {
    try {
      const res = await api.get(`/api/etudiant/portal/profil/${inscriptionId}`);
      setProfil(res.data);
      setForm(res.data);
    } catch (err) {
      if (isRequestCanceled(err)) {
        return;
      }
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.put(`/api/etudiant/portal/profil/${inscriptionId}`, form);
      setMessage('✅ Profil mis à jour avec succès');
      setIsEditing(false);
      loadProfil();
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="etudiant-dashboard">
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune information de profil disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">👤 Mon Profil</h2>
        {!isEditing && (
          <button className="btn-primary" onClick={() => setIsEditing(true)}>
            ✏️ Modifier
          </button>
        )}
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {isEditing ? (
        // ─── Formulaire de modification ──────────────────
        <div className="card">
          <h3 className="card-title">Modifier mes informations</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Nom</label>
              <input name="nom" value={form.nom || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input name="prenom" value={form.prenom || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input name="telephone" value={form.telephone || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input name="dateNaissance" type="date" value={form.dateNaissance || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Lieu de naissance</label>
              <input name="lieuNaissance" value={form.lieuNaissance || ''} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Adresse</label>
              <input name="adresse" value={form.adresse || ''} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setIsEditing(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">💾 Enregistrer</button>
            </div>
          </form>
        </div>
      ) : (
        // ─── Affichage du profil ──────────────────────────
        <>
          <div className="dash-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            {/* Photo et identité */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #185FA5, #0B1F4A)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
                color: 'white',
                fontWeight: 700
              }}>
                {profil.prenom?.[0]}{profil.nom?.[0]}
              </div>
              <h3 style={{ marginBottom: 4, fontSize: 20 }}>{profil.prenom} {profil.nom}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>{profil.matricule}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-info">{profil.promotion}</span>
                <span className="badge badge-neutral">{profil.filiere}</span>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Informations personnelles</h3>
              <div className="detail-grid">
                <div>
                  <div className="detail-lbl">Nom complet</div>
                  <div style={{ fontWeight: 500 }}>{profil.prenom} {profil.nom}</div>
                </div>
                <div>
                  <div className="detail-lbl">Matricule</div>
                  <div style={{ fontWeight: 600, color: '#185FA5' }}>{profil.matricule}</div>
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
                  <div className="detail-lbl">Sexe</div>
                  <div>{profil.sexe || 'Non renseigné'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h3 className="card-title" style={{ margin: 0 }}>📎 Documents personnels</h3>
              <Link to="/etudiant/profil/documents" className="link-more">Gérer →</Link>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="doc-status">
                <span className={`badge ${profil.bulletin ? 'badge-success' : 'badge-neutral'}`}>
                  {profil.bulletin ? '✅ Bulletin' : '❌ Bulletin'}
                </span>
              </div>
              <div className="doc-status">
                <span className={`badge ${profil.photo ? 'badge-success' : 'badge-neutral'}`}>
                  {profil.photo ? '✅ Photo' : '❌ Photo'}
                </span>
              </div>
              <div className="doc-status">
                <span className={`badge ${profil.acte ? 'badge-success' : 'badge-neutral'}`}>
                  {profil.acte ? '✅ Acte naissance' : '❌ Acte naissance'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
