// src/pages/bibliothecaire/BibliothecaireDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import BibliothequeRecherche from '../../components/BibliothequeRecherche';
import BibliothecaireDashboardPremium from './BibliothecaireDashboardPremium';
import '../Dashboard.css';

const TYPES_OUVRAGE = [
  { value: 'LIVRE', label: 'Livre' },
  { value: 'REVUE', label: 'Revue' },
  { value: 'MEMOIRE', label: 'Mémoire' },
  { value: 'THESE', label: 'Thèse' },
];

export default function BibliothecaireDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [tab, setTab] = useState('apercu');
  const [stats, setStats] = useState(null);
  const [ouvrages, setOuvrages] = useState([]);
  const [echeances, setEcheances] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [gestionRetardsLoading, setGestionRetardsLoading] = useState(false);

  // Ouvrages : recherche / formulaire
  const [ouvragesAffiches, setOuvragesAffiches] = useState([]);
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [showOuvrageForm, setShowOuvrageForm] = useState(false);
  const [editingOuvrage, setEditingOuvrage] = useState(null);
  const [ouvrageForm, setOuvrageForm] = useState({
    titre: '', auteur: '', isbn: '', editeur: '', categorie: '',
    typeOuvrage: 'LIVRE', quantiteTotale: 1,
  });

  // Catégories : formulaire
  const [showCategorieForm, setShowCategorieForm] = useState(false);
  const [categorieForm, setCategorieForm] = useState({ nom: '', description: '', code: '' });

  const universiteId = user?.universiteId;

  const loadData = useCallback(async () => {
    if (!universiteId) { setLoading(false); setError('Aucune université associée.'); return; }
    try {
      setLoading(true);
      const [statsRes, ouvRes, echRes, resaRes, catRes] = await Promise.all([
        api.get(`/api/bibliotheque/stats/${universiteId}`).catch(() => ({ data: {} })),
        api.get(`/api/bibliotheque/ouvrages/${universiteId}`).catch(() => ({ data: [] })),
        // Pas d'endpoint pour lister tous les emprunts en cours : on réutilise l'endpoint
        // des échéances avec une fenêtre large pour obtenir l'ensemble des prêts actifs.
        api.get(`/api/bibliotheque/echeances/${universiteId}?jours=3650`).catch(() => ({ data: [] })),
        api.get(`/api/bibliotheque/admin/reservations/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/bibliotheque/categories/${universiteId}`).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data || {});
      setOuvrages(ouvRes.data || []);
      setOuvragesAffiches(ouvRes.data || []);
      setEcheances(echRes.data || []);
      setReservations(resaRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      setError('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Ouvrages ───────────────────────────────────────────────────
  const handleRechercheOuvrages = async ({ searchTerm, filterType, filterCategorie, filterDisponibilite }) => {
    setRechercheLoading(true);
    try {
      let resultats;
      if (!searchTerm && !filterType && !filterCategorie) {
        resultats = ouvrages;
      } else {
        const res = await api.get('/api/bibliotheque/recherche', {
          params: { motCle: searchTerm || '', categorie: filterCategorie || undefined, type: filterType || undefined, universiteId }
        });
        resultats = res.data || [];
      }
      if (filterDisponibilite === 'disponible') resultats = resultats.filter(o => (o.quantiteDisponible || 0) > 0);
      else if (filterDisponibilite === 'indisponible') resultats = resultats.filter(o => (o.quantiteDisponible || 0) === 0);
      setOuvragesAffiches(resultats);
    } catch (err) {
      setError('Erreur lors de la recherche.');
    } finally {
      setRechercheLoading(false);
    }
  };

  const handleResetRecherche = () => setOuvragesAffiches(ouvrages);

  const openNouvelOuvrage = () => {
    setEditingOuvrage(null);
    setOuvrageForm({ titre: '', auteur: '', isbn: '', editeur: '', categorie: '', typeOuvrage: 'LIVRE', quantiteTotale: 1 });
    setShowOuvrageForm(true);
  };

  const openEditOuvrage = (o) => {
    setEditingOuvrage(o);
    setOuvrageForm({
      titre: o.titre || '', auteur: o.auteur || '', isbn: o.isbn || '', editeur: o.editeur || '',
      categorie: o.categorie || '', typeOuvrage: o.typeOuvrage || 'LIVRE', quantiteTotale: o.quantiteTotale || 1,
    });
    setShowOuvrageForm(true);
  };

  const submitOuvrage = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...ouvrageForm,
        quantiteTotale: parseInt(ouvrageForm.quantiteTotale) || 1,
        universite: { id: parseInt(universiteId) },
      };
      if (editingOuvrage) {
        await api.put(`/api/bibliotheque/admin/ouvrages/${editingOuvrage.id}`, payload);
        setMessage('✅ Ouvrage modifié avec succès');
      } else {
        await api.post('/api/bibliotheque/admin/ouvrages', payload);
        setMessage('✅ Ouvrage ajouté avec succès');
      }
      setShowOuvrageForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const supprimerOuvrage = async (id) => {
    if (!window.confirm('Supprimer définitivement cet ouvrage ?')) return;
    try {
      await api.delete(`/api/bibliotheque/admin/ouvrages/${id}`);
      setMessage('✅ Ouvrage supprimé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la suppression');
    }
  };

  // ─── Retards ────────────────────────────────────────────────────
  const gererRetards = async () => {
    setGestionRetardsLoading(true);
    try {
      await api.post('/api/bibliotheque/admin/gerer-retards');
      setMessage('✅ Pénalités de retard recalculées');
      loadData();
    } catch (err) {
      setError('Erreur lors du calcul des retards');
    } finally {
      setGestionRetardsLoading(false);
    }
  };

  // ─── Catégories ─────────────────────────────────────────────────
  const submitCategorie = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/bibliotheque/categories', {
        ...categorieForm,
        universite: { id: parseInt(universiteId) },
      });
      setMessage('✅ Catégorie créée');
      setShowCategorieForm(false);
      setCategorieForm({ nom: '', description: '', code: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création de la catégorie');
    }
  };

  const supprimerCategorie = async (id) => {
    if (!window.confirm('Désactiver cette catégorie ?')) return;
    try {
      await api.delete(`/api/bibliotheque/categories/${id}`);
      setMessage('✅ Catégorie désactivée');
      loadData();
    } catch (err) {
      setError('Erreur lors de la désactivation');
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;
  if (!universiteId) return <div className="page"><div className="alert-erreur">{error}</div></div>;

  const retards = echeances.filter(e => e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date());

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <BibliothecaireDashboardPremium
        user={user}
        stats={stats}
        ouvrages={ouvrages}
        ouvragesAffiches={ouvragesAffiches}
        echeances={echeances}
        reservations={reservations}
        categories={categories}
        retards={retards}
        message={message}
        error={error}
        onClearMessage={() => setMessage('')}
        onClearError={() => setError('')}
        onRefresh={loadData}
        gestionRetardsLoading={gestionRetardsLoading}
        onGererRetards={gererRetards}
        rechercheLoading={rechercheLoading}
        onRecherche={handleRechercheOuvrages}
        onResetRecherche={handleResetRecherche}
        showOuvrageForm={showOuvrageForm}
        editingOuvrage={editingOuvrage}
        ouvrageForm={ouvrageForm}
        setOuvrageForm={setOuvrageForm}
        onOpenNouvelOuvrage={openNouvelOuvrage}
        onOpenEditOuvrage={openEditOuvrage}
        onSubmitOuvrage={submitOuvrage}
        onCloseOuvrageForm={() => setShowOuvrageForm(false)}
        onSupprimerOuvrage={supprimerOuvrage}
        showCategorieForm={showCategorieForm}
        categorieForm={categorieForm}
        setCategorieForm={setCategorieForm}
        onToggleCategorieForm={() => setShowCategorieForm(!showCategorieForm)}
        onSubmitCategorie={submitCategorie}
        onSupprimerCategorie={supprimerCategorie}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Bibliothèque</h1>
          <p className="page-sub">{user?.nomComplet || 'Bibliothécaire'} – Gestion des ouvrages, emprunts et catégories</p>
        </div>
        <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-value">{stats?.totalOuvrages || 0}</div><div className="stat-label">Total ouvrages</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats?.totalDisponibles || 0}</div><div className="stat-label">Disponibles</div></div>
        <div className="stat-card"><div className="stat-value">{stats?.totalEmpruntsEnCours || 0}</div><div className="stat-label">Emprunts en cours</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: retards.length > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>{retards.length}</div><div className="stat-label">Retards</div></div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className={tab === 'apercu' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('apercu')}>Aperçu</button>
        <button className={tab === 'ouvrages' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('ouvrages')}>Catalogue ({ouvrages.length})</button>
        <button className={tab === 'emprunts' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('emprunts')}>Emprunts en cours ({echeances.length})</button>
        <button className={tab === 'reservations' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('reservations')}>Réservations ({reservations.length})</button>
        <button className={tab === 'categories' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('categories')}>Catégories ({categories.length})</button>
      </div>

      {/* Aperçu */}
      {tab === 'apercu' && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">⚠️ Emprunts en retard ({retards.length})</h2>
              <button className="btn-outline" onClick={gererRetards} disabled={gestionRetardsLoading}>
                {gestionRetardsLoading ? '⏳ Calcul...' : '⚙️ Recalculer les pénalités'}
              </button>
            </div>
            {retards.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun retard.</p> : (
              <table className="data-table">
                <thead><tr><th>N° emprunt</th><th>Retour prévu</th><th>Jours de retard</th><th>Pénalité</th></tr></thead>
                <tbody>
                  {retards.map(e => (
                    <tr key={e.id}>
                      <td className="uni-code">#{e.id}</td>
                      <td>{new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}</td>
                      <td>{Math.floor((Date.now() - new Date(e.dateRetourPrevue)) / 86400000)}</td>
                      <td>{e.penalite ? `${e.penalite} FC` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">📖 Derniers ouvrages ajoutés</h2>
            {ouvrages.length === 0 ? <p>Aucun ouvrage.</p> :
              <table className="data-table">
                <thead><tr><th>Titre</th><th>Auteur</th><th>Type</th><th>Disponible</th></tr></thead>
                <tbody>
                  {ouvrages.slice(0, 5).map(o => (
                    <tr key={o.id}>
                      <td>{o.titre}</td>
                      <td>{o.auteur}</td>
                      <td>{o.typeOuvrage}</td>
                      <td>{o.quantiteDisponible > 0 ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        </>
      )}

      {/* Catalogue */}
      {tab === 'ouvrages' && (
        <>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div />
            <button className="btn-primary" onClick={openNouvelOuvrage}>➕ Nouvel ouvrage</button>
          </div>

          <BibliothequeRecherche onSearch={handleRechercheOuvrages} onReset={handleResetRecherche} loading={rechercheLoading} />

          {showOuvrageForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="card-title">{editingOuvrage ? 'Modifier l\'ouvrage' : 'Ajouter un ouvrage'}</h2>
              <form onSubmit={submitOuvrage} className="form-grid">
                <div className="form-group">
                  <label>Titre *</label>
                  <input value={ouvrageForm.titre} onChange={e => setOuvrageForm({...ouvrageForm, titre: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Auteur</label>
                  <input value={ouvrageForm.auteur} onChange={e => setOuvrageForm({...ouvrageForm, auteur: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>ISBN</label>
                  <input value={ouvrageForm.isbn} onChange={e => setOuvrageForm({...ouvrageForm, isbn: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Éditeur</label>
                  <input value={ouvrageForm.editeur} onChange={e => setOuvrageForm({...ouvrageForm, editeur: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select value={ouvrageForm.typeOuvrage} onChange={e => setOuvrageForm({...ouvrageForm, typeOuvrage: e.target.value})} required>
                    {TYPES_OUVRAGE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select value={ouvrageForm.categorie} onChange={e => setOuvrageForm({...ouvrageForm, categorie: e.target.value})}>
                    <option value="">-- Aucune --</option>
                    {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nombre d'exemplaires</label>
                  <input type="number" min="1" value={ouvrageForm.quantiteTotale} onChange={e => setOuvrageForm({...ouvrageForm, quantiteTotale: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary">{editingOuvrage ? 'Enregistrer' : 'Créer l\'ouvrage'}</button>
                  <button type="button" className="btn-outline" onClick={() => setShowOuvrageForm(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h2 className="card-title">📚 Catalogue ({ouvragesAffiches.length})</h2>
            {ouvragesAffiches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun ouvrage trouvé.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Titre</th><th>Auteur</th><th>Type</th><th>Catégorie</th><th>Dispo.</th><th>Actions</th></tr></thead>
                <tbody>
                  {ouvragesAffiches.map(o => (
                    <tr key={o.id}>
                      <td>{o.titre}</td>
                      <td>{o.auteur || '-'}</td>
                      <td>{o.typeOuvrage}</td>
                      <td>{o.categorie || '-'}</td>
                      <td>
                        <span className={`badge ${o.quantiteDisponible > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {o.quantiteDisponible ?? 0} / {o.quantiteTotale ?? 0}
                        </span>
                      </td>
                      <td>
                        <button className="btn-outline" style={{ fontSize: 11, marginRight: 4 }} onClick={() => openEditOuvrage(o)}>✏️ Modifier</button>
                        <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => supprimerOuvrage(o.id)}>🗑️ Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Emprunts en cours */}
      {tab === 'emprunts' && (
        <div className="card">
          <h2 className="card-title">📤 Emprunts en cours ({echeances.length})</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 12 }}>
            Le retour et la prolongation d'un emprunt sont effectués par l'étudiant depuis son propre compte.
          </p>
          {echeances.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun emprunt en cours.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>N° emprunt</th><th>Livre</th><th>Étudiant</th><th>Emprunté le</th><th>Retour prévu</th><th>Statut</th></tr></thead>
              <tbody>
                {echeances.map(e => {
                  const retard = e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date();
                  return (
                    <tr key={e.id}>
                      <td className="uni-code">#{e.id}</td>
                      <td>{e.livreTitre || '-'}</td>
                      <td>{[e.etudiantPrenom, e.etudiantNom].filter(Boolean).join(' ') || '-'} {e.etudiantMatricule ? `(${e.etudiantMatricule})` : ''}</td>
                      <td>{e.dateEmprunt ? new Date(e.dateEmprunt).toLocaleDateString('fr-FR') : '-'}</td>
                      <td>{e.dateRetourPrevue ? new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR') : '-'}</td>
                      <td><span className={`badge ${retard ? 'badge-danger' : 'badge-success'}`}>{retard ? '⚠ Retard' : '✅ En cours'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Réservations */}
      {tab === 'reservations' && (
        <div className="card">
          <h2 className="card-title">🔖 Réservations ({reservations.length})</h2>
          {reservations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune réservation.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>N°</th><th>Livre</th><th>Étudiant</th><th>Réservé le</th><th>Expire le</th><th>Statut</th></tr></thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.id}>
                    <td className="uni-code">#{r.id}</td>
                    <td>{r.livreTitre || '-'}</td>
                    <td>{[r.etudiantPrenom, r.etudiantNom].filter(Boolean).join(' ') || '-'} {r.etudiantMatricule ? `(${r.etudiantMatricule})` : ''}</td>
                    <td>{r.dateReservation ? new Date(r.dateReservation).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{r.dateExpiration ? new Date(r.dateExpiration).toLocaleDateString('fr-FR') : '-'}</td>
                    <td><span className="badge">{r.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Catégories */}
      {tab === 'categories' && (
        <>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div />
            <button className="btn-primary" onClick={() => setShowCategorieForm(!showCategorieForm)}>
              {showCategorieForm ? 'Annuler' : '➕ Nouvelle catégorie'}
            </button>
          </div>

          {showCategorieForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="card-title">Ajouter une catégorie</h2>
              <form onSubmit={submitCategorie} className="form-grid">
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
                  <textarea rows="2" value={categorieForm.description} onChange={e => setCategorieForm({...categorieForm, description: e.target.value})} />
                </div>
                <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary">Créer</button>
                  <button type="button" className="btn-outline" onClick={() => setShowCategorieForm(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h2 className="card-title">📂 Catégories ({categories.length})</h2>
            {categories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune catégorie.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Nom</th><th>Code</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>{c.nom}</td>
                      <td>{c.code || '-'}</td>
                      <td>{c.description || '-'}</td>
                      <td>
                        <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => supprimerCategorie(c.id)}>🗑️ Désactiver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
