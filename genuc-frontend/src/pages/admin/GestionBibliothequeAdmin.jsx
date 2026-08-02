// src/pages/admin/GestionBibliothequeAdmin.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPES_OUVRAGE = ['LIVRE', 'REVUE', 'MEMOIRE', 'THESE'];

export default function GestionBibliothequeAdmin() {
  const { user } = useAuth();
  const [ouvrages, setOuvrages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [empruntsActifs, setEmpruntsActifs] = useState([]);
  const [reservationsActives, setReservationsActives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategorieForm, setShowCategorieForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [onglet, setOnglet] = useState('ouvrages');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    titre: '',
    auteur: '',
    isbn: '',
    categorie: '',
    typeOuvrage: 'LIVRE',
    editeur: '',
    langue: 'Français',
    nbPages: '',
    resume: '',
    quantiteTotale: 1,
    quantiteDisponible: 1,
    anneePublication: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [actionModal, setActionModal] = useState({ open: false, type: null, id: null, message: '' });

  const confirmerAction = async () => {
    const { type, id } = actionModal;
    setActionModal({ open: false, type: null, id: null, message: '' });
    try {
      if (type === 'rendre') {
        await api.put(`/api/bibliotheque/retourner/${id}`);
        setMessage('✅ Livre rendu');
      } else if (type === 'annulerResa') {
        await api.delete(`/api/bibliotheque/reserver/${id}`);
        setMessage('Réservation annulée');
      }
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const [categorieForm, setCategorieForm] = useState({
    nom: '',
    code: '',
    description: ''
  });

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ouvragesRes, categoriesRes, statsRes, empruntsRes, reservationsRes] = await Promise.all([
        api.get(`/api/bibliotheque/ouvrages/${universiteId}`),
        api.get(`/api/bibliotheque/categories/${universiteId}`),
        api.get(`/api/bibliotheque/stats/${universiteId}`).catch(() => ({ data: {} })),
        api.get(`/api/bibliotheque/emprunts/actifs/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/bibliotheque/reservations/actives/${universiteId}`).catch(() => ({ data: [] }))
      ]);
      setOuvrages(ouvragesRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      setEmpruntsActifs(empruntsRes.data || []);
      setReservationsActives(reservationsRes.data || []);
    } catch (err) {
      setError('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      ...form,
      universite: { id: parseInt(universiteId) },
      quantiteTotale: parseInt(form.quantiteTotale),
      quantiteDisponible: parseInt(form.quantiteDisponible),
      nbPages: parseInt(form.nbPages) || null,
      anneePublication: parseInt(form.anneePublication) || null
    };

    try {
      if (editingId) {
        await api.put(`/api/bibliotheque/admin/ouvrages/${editingId}`, payload);
        setMessage('✅ Ouvrage modifié avec succès');
      } else {
        await api.post('/api/bibliotheque/admin/ouvrages', payload);
        setMessage('✅ Ouvrage ajouté avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        titre: '', auteur: '', isbn: '', categorie: '',
        typeOuvrage: 'LIVRE', editeur: '', langue: 'Français',
        nbPages: '', resume: '', quantiteTotale: 1, quantiteDisponible: 1,
        anneePublication: ''
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || `Erreur lors de la ${editingId ? 'modification' : 'création'}`);
    }
  };

  const handleEditOuvrage = (o) => {
    setEditingId(o.id);
    setForm({
      titre: o.titre || '',
      auteur: o.auteur || '',
      isbn: o.isbn || '',
      categorie: o.categorie || '',
      typeOuvrage: o.typeOuvrage || 'LIVRE',
      editeur: o.editeur || '',
      langue: o.langue || 'Français',
      nbPages: o.nbPages || '',
      resume: o.resume || '',
      quantiteTotale: o.quantiteTotale || 1,
      quantiteDisponible: o.quantiteDisponible || 1,
      anneePublication: o.anneePublication || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerFormulaireOuvrage = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      titre: '', auteur: '', isbn: '', categorie: '',
      typeOuvrage: 'LIVRE', editeur: '', langue: 'Français',
      nbPages: '', resume: '', quantiteTotale: 1, quantiteDisponible: 1,
      anneePublication: ''
    });
  };

  const handleCategorieSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/bibliotheque/categories', {
        ...categorieForm,
        universite: { id: parseInt(universiteId) }
      });
      setMessage('✅ Catégorie ajoutée avec succès');
      setShowCategorieForm(false);
      setCategorieForm({ nom: '', code: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const supprimerOuvrage = (id) => setDeleteModal({ open: true, id });

  const confirmerSuppression = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null });
    try {
      await api.delete(`/api/bibliotheque/admin/ouvrages/${id}`);
      setMessage('Ouvrage supprimé');
      loadData();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const gererRetards = async () => {
    try {
      await api.post('/api/bibliotheque/admin/gerer-retards');
      setMessage('✅ Gestion des retards effectuée');
      loadData();
    } catch (err) {
      setError('Erreur');
    }
  };

  const transformerReservation = async (reservationId) => {
    try {
      await api.post(`/api/bibliotheque/reserver/${reservationId}/emprunter`);
      setMessage('✅ Réservation transformée en emprunt');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_COURS': 'badge-success',
      'RENDU': 'badge-neutral',
      'RETARD': 'badge-danger',
      'PERDU': 'badge-danger',
      'ACTIVE': 'badge-success',
      'ANNULEE': 'badge-neutral',
      'EXPIREE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const filteredOuvrages = ouvrages.filter(o =>
    o.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.auteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Gestion de la bibliothèque</h1>
          <p className="page-sub">Gérez les ouvrages, les catégories, les emprunts et les réservations</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={gererRetards}>
            ⏰ Gérer les retards
          </button>
          <button className="btn-primary" onClick={() => (showForm ? annulerFormulaireOuvrage() : setShowForm(true))}>
            {showForm ? 'Annuler' : '➕ Ajouter un ouvrage'}
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Formulaire ajout ouvrage */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editingId ? 'Modifier l\'ouvrage' : 'Ajouter un ouvrage'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Titre *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Auteur *</label>
              <input value={form.auteur} onChange={e => setForm({...form, auteur: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.typeOuvrage} onChange={e => setForm({...form, typeOuvrage: e.target.value})} required>
                {TYPES_OUVRAGE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})}>
                <option value="">-- Choisir une catégorie --</option>
                {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Éditeur</label>
              <input value={form.editeur} onChange={e => setForm({...form, editeur: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Langue</label>
              <input value={form.langue} onChange={e => setForm({...form, langue: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Nombre de pages</label>
              <input type="number" value={form.nbPages} onChange={e => setForm({...form, nbPages: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Année publication</label>
              <input type="number" value={form.anneePublication} onChange={e => setForm({...form, anneePublication: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Quantité totale *</label>
              <input type="number" min="1" value={form.quantiteTotale} onChange={e => setForm({...form, quantiteTotale: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Quantité disponible *</label>
              <input type="number" min="0" value={form.quantiteDisponible} onChange={e => setForm({...form, quantiteDisponible: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Résumé</label>
              <textarea value={form.resume} onChange={e => setForm({...form, resume: e.target.value})} rows="3" />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={annulerFormulaireOuvrage}>Annuler</button>
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Modifier l\'ouvrage' : 'Ajouter l\'ouvrage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalOuvrages || 0}</div>
          <div className="stat-label">Total ouvrages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats?.totalDisponibles || 0}</div>
          <div className="stat-label">Disponibles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#185FA5' }}>{stats?.totalEmpruntsEnCours || 0}</div>
          <div className="stat-label">Emprunts en cours</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats?.totalReservations || 0}</div>
          <div className="stat-label">Réservations</div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={onglet === 'ouvrages' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('ouvrages')}>
          📖 Ouvrages ({ouvrages.length})
        </button>
        <button className={onglet === 'emprunts' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('emprunts')}>
          📤 Emprunts actifs ({empruntsActifs.length})
        </button>
        <button className={onglet === 'reservations' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('reservations')}>
          📥 Réservations ({reservationsActives.length})
        </button>
        <button className={onglet === 'categories' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('categories')}>
          📂 Catégories ({categories.length})
        </button>
      </div>

      {/* Onglet Ouvrages */}
      {onglet === 'ouvrages' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un ouvrage..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
            <button className="btn-outline" onClick={() => setShowCategorieForm(!showCategorieForm)}>
              {showCategorieForm ? 'Annuler' : '📂 Nouvelle catégorie'}
            </button>
          </div>

          {/* Formulaire catégorie */}
          {showCategorieForm && (
            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <h4>Nouvelle catégorie</h4>
              <div className="form-grid" style={{ marginTop: 8 }}>
                <div className="form-group">
                  <label>Nom *</label>
                  <input value={categorieForm.nom} onChange={e => setCategorieForm({...categorieForm, nom: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Code</label>
                  <input value={categorieForm.code} onChange={e => setCategorieForm({...categorieForm, code: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Description</label>
                  <textarea value={categorieForm.description} onChange={e => setCategorieForm({...categorieForm, description: e.target.value})} rows="2" />
                </div>
                <button className="btn-primary" onClick={handleCategorieSubmit}>Ajouter la catégorie</button>
              </div>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteur</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Disponible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOuvrages.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.titre}</td>
                  <td>{o.auteur}</td>
                  <td><span className="badge badge-neutral">{o.typeOuvrage}</span></td>
                  <td>{o.categorie || '-'}</td>
                  <td>
                    <span className={`badge ${o.quantiteDisponible > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {o.quantiteDisponible}/{o.quantiteTotale}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => handleEditOuvrage(o)}>✏️</button>
                      <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => supprimerOuvrage(o.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOuvrages.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun ouvrage trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Onglet Emprunts */}
      {onglet === 'emprunts' && (
        <div className="card">
          <h2 className="card-title">📤 Emprunts en cours</h2>
          {empruntsActifs.length === 0 ? (
            <p>Aucun emprunt en cours.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Ouvrage</th>
                  <th>Date emprunt</th>
                  <th>Retour prévu</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {empruntsActifs.map(e => {
                  const enRetard = new Date(e.dateRetourPrevue) < new Date();
                  return (
                    <tr key={e.id} style={{ background: enRetard ? '#fff0f0' : 'transparent' }}>
                      <td>{e.etudiant?.prenom} {e.etudiant?.nom}</td>
                      <td>{e.livre?.titre}</td>
                      <td>{new Date(e.dateEmprunt).toLocaleDateString('fr-FR')}</td>
                      <td style={{ color: enRetard ? '#cc0000' : '#333' }}>
                        {new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}
                        {enRetard && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 10 }}>⚠️ Retard</span>}
                      </td>
                      <td>
                        <span className={`badge ${getStatutBadge(e.statut)}`}>
                          {e.statut}
                        </span>
                        {e.penalite > 0 && <span style={{ marginLeft: 8, color: '#cc0000' }}>+{e.penalite} USD</span>}
                      </td>
                      <td>
                        <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => setActionModal({ open: true, type: 'rendre', id: e.id, message: 'Marquer ce livre comme rendu ?' })}>
                          Rendre
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Réservations */}
      {onglet === 'reservations' && (
        <div className="card">
          <h2 className="card-title">📥 Réservations actives</h2>
          {reservationsActives.length === 0 ? (
            <p>Aucune réservation active.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Ouvrage</th>
                  <th>Date réservation</th>
                  <th>Expiration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservationsActives.map(r => {
                  const expiree = new Date(r.dateExpiration) < new Date();
                  return (
                    <tr key={r.id} style={{ background: expiree ? '#fff0f0' : 'transparent' }}>
                      <td>{r.etudiant?.prenom} {r.etudiant?.nom}</td>
                      <td>{r.livre?.titre}</td>
                      <td>{new Date(r.dateReservation).toLocaleDateString('fr-FR')}</td>
                      <td style={{ color: expiree ? '#cc0000' : '#333' }}>
                        {new Date(r.dateExpiration).toLocaleDateString('fr-FR')}
                        {expiree && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 10 }}>Expirée</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-success" style={{ fontSize: 11 }} onClick={() => transformerReservation(r.id)} disabled={expiree}>
                            📥 Emprunter
                          </button>
                          <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => setActionModal({ open: true, type: 'annulerResa', id: r.id, message: 'Annuler cette réservation ?' })}>
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Catégories */}
      {onglet === 'categories' && (
        <div className="card">
          <h2 className="card-title">📂 Catégories</h2>
          {categories.length === 0 ? (
            <p>Aucune catégorie.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {categories.map(c => (
                <div key={c.id} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600 }}>{c.nom}</div>
                  {c.code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.code}</div>}
                  {c.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {actionModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Confirmation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>{actionModal.message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setActionModal({ open: false, type: null, id: null, message: '' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerAction}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Supprimer l'ouvrage</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Cette action est irréversible. Confirmer la suppression ?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerSuppression}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}