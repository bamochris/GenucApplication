import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import {
  FaBriefcase, FaPlus, FaUsers, FaCheckCircle, FaTimesCircle,
  FaFileContract, FaMoneyBillWave, FaTrash
} from 'react-icons/fa';

const CATEGORIES = [
  { id: 'moniteur', label: 'Moniteur / Répétiteur' },
  { id: 'labo',     label: 'Assistant de Laboratoire' },
  { id: 'biblio',   label: 'Bibliothécaire Assistant' },
  { id: 'it',       label: 'Technicien IT' },
  { id: 'admin',    label: 'Assistant Administratif' },
  { id: 'culture',  label: 'Animateur Culturel' },
  { id: 'securite', label: "Agent d'Accueil" },
  { id: 'maintenance', label: 'Agent de Maintenance' },
];

export default function GestionEmploiEtudiant() {
  const [tab, setTab] = useState('offres');
  const [offres, setOffres] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [offreSelectionnee, setOffreSelectionnee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); /* 'creer' | 'candidature' */
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mois, setMois] = useState(new Date().toISOString().substring(0, 7));
  const [rapportSalaires, setRapportSalaires] = useState(null);

  /* Formulaire offre */
  const [form, setForm] = useState({ titre: '', categorie: '', description: '', heures: '', remuneration: '', nbPostes: 1, campus: '', dateDebut: '' });

  useEffect(() => {
    api.get('/api/emploi-universitaire/admin/offres')
      .then(r => setOffres(r.data || []))
      .catch(err => { console.error(err); setError('Erreur lors du chargement des postes.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!offreSelectionnee) return;
    api.get(`/api/emploi-universitaire/admin/candidatures/${offreSelectionnee.id}`)
      .then(r => setCandidatures(r.data || []))
      .catch(err => { console.error(err); setError('Erreur lors du chargement des candidatures.'); });
  }, [offreSelectionnee]);

  useEffect(() => {
    if (tab !== 'salaires') return;
    api.get(`/api/emploi-universitaire/admin/salaires/${mois}`)
      .then(r => setRapportSalaires(r.data))
      .catch(err => { console.error(err); setError('Erreur lors du chargement du rapport de salaires.'); });
  }, [tab, mois]);

  const creerOffre = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/emploi-universitaire/admin/offres', form);
      setOffres(prev => [...prev, res.data]);
      setModal(null);
      setForm({ titre: '', categorie: '', description: '', heures: '', remuneration: '', nbPostes: 1, campus: '', dateDebut: '' });
      setMessage('Offre créée et publiée avec succès.');
    } catch { setError('Erreur lors de la création du poste.'); }
  };

  const supprimerOffre = async (id) => {
    if (!window.confirm('Supprimer définitivement ce poste ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/api/emploi-universitaire/admin/offres/${id}`);
      setOffres(prev => prev.filter(o => o.id !== id));
      setMessage('Poste supprimé avec succès.');
    } catch {
      setError('Erreur lors de la suppression du poste.');
    }
  };

  const exporterSalairesCSV = () => {
    if (!rapportSalaires?.details?.length) return;
    const entetes = ['Etudiant', 'Poste', 'Heures', 'Taux horaire', 'Devise', 'Total brut', 'Statut paiement'];
    const lignes = rapportSalaires.details.map(d => [
      `${d.prenom} ${d.nom}`,
      d.poste,
      d.heures,
      d.tauxHoraire,
      d.devise,
      d.totalBrut,
      d.paye ? 'Payé' : 'En attente'
    ]);
    const csv = [entetes, ...lignes]
      .map(ligne => ligne.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salaires_${mois}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const traiterCandidature = async (candidatureId, decision) => {
    try {
      await api.post(`/api/emploi-universitaire/admin/candidatures/${candidatureId}/traiter`, { decision });
      setCandidatures(prev => prev.map(c => c.id === candidatureId ? { ...c, statut: decision } : c));
      setMessage(decision === 'ACCEPTEE' ? 'Candidature acceptée. Contrat envoyé à l\'étudiant.' : 'Candidature rejetée. L\'étudiant est notifié.');
    } catch {
      setError('Erreur lors du traitement de la candidature.');
    }
  };

  const stats = {
    postes: offres.length,
    actifs: offres.filter(o => o.statut === 'ACTIVE').length,
    candidaturesTotal: offres.reduce((s, o) => s + (o.nbCandidatures || 0), 0),
    enContrat: offres.reduce((s, o) => s + (o.nbEnContrat || 0), 0),
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Service Emploi Étudiant</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gérez les postes, candidatures et contrats des étudiants-employés.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/emploi-universitaire" target="_blank" rel="noreferrer"
            style={{ padding: '9px 16px', border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13 }}>
            Voir page publique
          </Link>
          <button onClick={() => setModal('creer')} style={{ padding: '9px 18px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaPlus /> Nouveau poste
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {message} <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.10)', color: '#cc0000', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error} <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#cc0000' }}>✕</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Postes créés', val: stats.postes, icon: <FaBriefcase />, color: '#185FA5' },
          { label: 'Postes actifs', val: stats.actifs, icon: <FaCheckCircle />, color: '#1D9E75' },
          { label: 'Candidatures reçues', val: stats.candidaturesTotal, icon: <FaUsers />, color: '#854F0B' },
          { label: 'Étudiants en contrat', val: stats.enContrat, icon: <FaFileContract />, color: '#6B21A8' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 24, color: k.color, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(24,95,165,0.12)', borderRadius: 8, padding: 4 }}>
        {[
          { key: 'offres', label: `Postes (${offres.length})` },
          { key: 'candidatures', label: 'Candidatures' },
          { key: 'salaires', label: 'Salaires & Pointage' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            background: tab === t.key ? 'white' : 'transparent',
            fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#0B1F4A' : '#666',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Onglet Postes ── */}
      {tab === 'offres' && (
        <div>
          {offres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 12, color: 'var(--text-muted)' }}>
              <FaBriefcase style={{ fontSize: 48, marginBottom: 16 }} />
              <p>Aucun poste créé. Cliquez sur "Nouveau poste" pour commencer.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {offres.map(o => (
                <div key={o.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{o.titre}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, background: o.statut === 'ACTIVE' ? '#d4edda' : '#eee', color: o.statut === 'ACTIVE' ? '#155724' : '#666', fontSize: 11, fontWeight: 600 }}>
                        {o.statut === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {CATEGORIES.find(c => c.id === o.categorie)?.label} · {o.campus} · {o.heures}h/sem · {o.remuneration}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{o.nbPostes || 1} poste{(o.nbPostes || 1) > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{o.nbCandidatures || 0} candidature{(o.nbCandidatures || 0) > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{o.nbEnContrat || 0} en contrat</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button onClick={() => { setOffreSelectionnee(o); setTab('candidatures'); }}
                      style={{ padding: '7px 14px', background: 'rgba(24,95,165,0.12)', color: '#185FA5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaUsers /> Candidatures
                    </button>
                    <button onClick={() => supprimerOffre(o.id)} style={{ padding: '7px 10px', background: 'rgba(220,53,69,0.10)', color: '#cc0000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Candidatures ── */}
      {tab === 'candidatures' && (
        <div>
          {!offreSelectionnee ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 30 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>Sélectionnez un poste pour voir ses candidatures :</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {offres.map(o => (
                  <button key={o.id} onClick={() => setOffreSelectionnee(o)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 14 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.titre}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{o.nbCandidatures || 0} candidature{(o.nbCandidatures || 0) > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setOffreSelectionnee(null)} style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: 13 }}>← Retour</button>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{offreSelectionnee.titre} — Candidatures</span>
              </div>
              {candidatures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, color: 'var(--text-muted)' }}>Aucune candidature pour ce poste.</div>
              ) : (
                candidatures.map(c => (
                  <div key={c.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{c.etudiant?.prenom} {c.etudiant?.nom}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.etudiant?.matricule} · {c.etudiant?.filiere} · Moy: {c.etudiant?.moyenne}/20</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Postulé le {new Date(c.dateCandidature).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: c.statut === 'EN_ATTENTE' ? '#fff3cd' : c.statut === 'ACCEPTEE' ? '#d4edda' : '#f8d7da',
                        color: c.statut === 'EN_ATTENTE' ? '#856404' : c.statut === 'ACCEPTEE' ? '#155724' : '#721c24',
                      }}>
                        {c.statut === 'EN_ATTENTE' ? 'En attente' : c.statut === 'ACCEPTEE' ? 'Acceptée' : 'Rejetée'}
                      </span>
                    </div>
                    {c.motivation && (
                      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, borderLeft: '3px solid #185FA5' }}>
                        "{c.motivation}"
                      </div>
                    )}
                    {c.statut === 'EN_ATTENTE' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => traiterCandidature(c.id, 'ACCEPTEE')}
                          style={{ padding: '8px 18px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaCheckCircle /> Accepter & Créer contrat
                        </button>
                        <button onClick={() => traiterCandidature(c.id, 'REJETEE')}
                          style={{ padding: '8px 18px', background: 'rgba(220,53,69,0.10)', color: '#cc0000', border: '1px solid #ffcccc', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaTimesCircle /> Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Salaires ── */}
      {tab === 'salaires' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Mois :</label>
            <input type="month" value={mois} onChange={e => setMois(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
            <button onClick={exporterSalairesCSV} disabled={!rapportSalaires?.details?.length}
              style={{ padding: '8px 16px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: rapportSalaires?.details?.length ? 'pointer' : 'not-allowed', fontSize: 13, opacity: rapportSalaires?.details?.length ? 1 : 0.6 }}>
              Exporter CSV
            </button>
          </div>
          {!rapportSalaires ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement du rapport...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Étudiants payés', val: rapportSalaires.totalEtudiantsEmployes, icon: <FaUsers />, color: '#185FA5' },
                  { label: 'Total USD', val: `$${rapportSalaires.totalSalairesUSD?.toFixed(2) || '0.00'}`, icon: <FaMoneyBillWave />, color: '#1D9E75' },
                  { label: 'Total CDF', val: `${(rapportSalaires.totalSalairesCDF || 0).toLocaleString('fr-FR')} FC`, icon: <FaMoneyBillWave />, color: '#854F0B' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 22, color: k.color, marginBottom: 8 }}>{k.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              {(rapportSalaires.details || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, color: 'var(--text-muted)' }}>Aucun paiement pour ce mois.</div>
              ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['Étudiant', 'Poste', 'Heures', 'Taux horaire', 'Total brut', 'Statut paiement'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rapportSalaires.details.map((d, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '11px 16px', fontSize: 13 }}>{d.prenom} {d.nom}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{d.poste}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700 }}>{d.heures}h</td>
                          <td style={{ padding: '11px 16px', fontSize: 13 }}>{d.tauxHoraire} {d.devise}/h</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>{d.totalBrut} {d.devise}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: d.paye ? '#d4edda' : '#fff3cd', color: d.paye ? '#155724' : '#856404' }}>
                              {d.paye ? 'Payé' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modal créer offre ── */}
      {modal === 'creer' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 18 }}>Nouveau poste d'emploi étudiant</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={creerOffre} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Titre du poste *</label>
                  <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required
                    placeholder="ex: Moniteur en Informatique"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Catégorie *</label>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} required
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13 }}>
                    <option value="">Choisir...</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3}
                  placeholder="Missions et responsabilités..."
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Heures/semaine</label>
                  <input value={form.heures} onChange={e => setForm(f => ({ ...f, heures: e.target.value }))}
                    placeholder="ex: 15h/sem"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rémunération</label>
                  <input value={form.remuneration} onChange={e => setForm(f => ({ ...f, remuneration: e.target.value }))}
                    placeholder="ex: 60 USD/mois"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nb de postes</label>
                  <input type="number" min={1} value={form.nbPostes} onChange={e => setForm(f => ({ ...f, nbPostes: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Campus / Lieu</label>
                  <input value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))}
                    placeholder="ex: Campus principal"
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date de début</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <button type="submit" style={{ padding: 13, background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                Publier le poste
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
