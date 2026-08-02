// src/pages/SuiviDossier.jsx
import { useState } from 'react';
import api from '../api/axios';
import './Dashboard.css';

export default function SuiviDossier() {
  const [numeroDossier, setNumeroDossier] = useState('');
  const [dossier, setDossier] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rechercher = async () => {
    if (!numeroDossier.trim()) {
      setError('Veuillez saisir un numéro de dossier');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/dossiers/statut/${numeroDossier.trim()}`);
      setDossier(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Dossier introuvable');
      setDossier(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return 'badge-warning';
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return '⏳ En attente de validation';
      case 'VALIDE': return '✅ Dossier validé';
      case 'REJETE': return '❌ Dossier rejeté';
      default: return statut;
    }
  };

  return (
    <div className="page" style={{ maxWidth: 700, margin: '40px auto' }}>
      <div className="card">
        <h1 className="page-title">🔍 Suivi de dossier</h1>
        <p className="page-sub">Entrez le numéro de dossier reçu par email</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <input
            type="text"
            placeholder="Ex: HADOS-2026-000123"
            value={numeroDossier}
            onChange={e => setNumeroDossier(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
          />
          <button className="btn-primary" onClick={rechercher} disabled={loading}>
            {loading ? 'Recherche...' : '🔍 Vérifier'}
          </button>
        </div>

        {error && <div className="alert-erreur" style={{ marginTop: 20 }}>{error}</div>}

        {dossier && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="detail-lbl">Numéro dossier</div>
                <div style={{ fontWeight: 600, color: '#185FA5' }}>{dossier.numeroDossier}</div>
              </div>
              <div>
                <div className="detail-lbl">Statut</div>
                <span className={`badge ${getStatutBadge(dossier.statut)}`}>
                  {getStatutLabel(dossier.statut)}
                </span>
              </div>
              <div>
                <div className="detail-lbl">Nom complet</div>
                <div>{dossier.prenom} {dossier.nom}</div>
              </div>
              <div>
                <div className="detail-lbl">Email</div>
                <div>{dossier.email}</div>
              </div>
              <div>
                <div className="detail-lbl">Université</div>
                <div>{dossier.universite}</div>
              </div>
              <div>
                <div className="detail-lbl">Niveau visé</div>
                <div>{dossier.niveauVise}</div>
              </div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <div className="detail-lbl">Date soumission</div>
                <div>{new Date(dossier.creeLe).toLocaleDateString('fr-FR')}</div>
              </div>
              {dossier.motifRejet && (
                <div style={{ gridColumn: '1 / span 2' }}>
                  <div className="detail-lbl" style={{ color: '#cc0000' }}>Motif du rejet</div>
                  <div style={{ color: '#cc0000' }}>{dossier.motifRejet}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}