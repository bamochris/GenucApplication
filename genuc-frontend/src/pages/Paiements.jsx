import { useState } from 'react';
import api from '../api/axios';
import './Dashboard.css';

export default function Paiements() {
  const [onglet, setOnglet]         = useState('situation');
  const [inscriptionId, setInsId]   = useState('');
  const [situation, setSituation]   = useState(null);
  const [message, setMessage]       = useState('');
  const [erreur, setErreur]         = useState('');
  const [form, setForm] = useState({
    inscriptionId: '', montant: '',
    devise: 'USD', modePaiement: 'MOBILE_MONEY',
    typePaiement: 'FRAIS_ACADEMIQUES', referenceBancaire: '', banque: ''
  });

  const voirSituation = () => {
    if (!inscriptionId) return;
    setErreur(''); 
    setSituation(null);
    api.get(`/api/paiements/etudiant/situation/${inscriptionId}`)
      .then(r => setSituation(r.data))
      .catch(() => setErreur('Donnees ou Inscription introuvable'));
  };

  const soumettrePaiement = (e) => {
    e.preventDefault();
    setErreur(''); 
    setMessage('');
    api.post('/api/paiements/declarer', form)
      .then(r => {
        setMessage(`Paiement soumis avec succes ! ID de transaction : ${r.data.id || 'Valide'}`);
        setForm({
          inscriptionId: '', montant: '',
          devise: 'USD', modePaiement: 'MOBILE_MONEY',
          typePaiement: 'FRAIS_ACADEMIQUES', referenceBancaire: '', banque: ''
        });
      })
      .catch(err => setErreur(err.response?.data?.message || 'Erreur de declaration'));
  };

  const pourcentage = situation ? Math.min(100, situation.pourcentage) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Frais d'Etudes & Caisse</h1>
          <p className="page-sub">Suivez votre etat d'acquittement ou declarez un paiement bancaire.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn-outline ${onglet === 'situation' ? 'active' : ''}`}
                style={{ background: onglet === 'situation' ? '#0B1F4A' : '', color: onglet === 'situation' ? 'white' : '' }}
                onClick={() => setOnglet('situation')}>
          📊 Ma Situation Financiere
        </button>
        <button className={`btn-outline ${onglet === 'declarer' ? 'active' : ''}`}
                style={{ background: onglet === 'declarer' ? '#0B1F4A' : '', color: onglet === 'declarer' ? 'white' : '' }}
                onClick={() => setOnglet('declarer')}>
          💵 Déclarer un versement
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur">{erreur}</div>}

      {onglet === 'situation' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Vérification du solde étudiant</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input 
              type="number" 
              placeholder="Saisissez votre ID d'inscription..." 
              value={inscriptionId}
              onChange={e => setInsId(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} 
            />
            <button className="btn-primary" onClick={voirSituation}>Analyser le dossier</button>
          </div>

          {situation && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
                <span>Progression de la couverture des frais</span>
                <span style={{ color: '#1D9E75' }}>{pourcentage}%</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#1D9E75', height: '100%', width: `${pourcentage}%`, transition: 'width 0.4s' }}></div>
              </div>

              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Attendu</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{situation.totalDu || 0} USD</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Montant Payé</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75', marginTop: 4 }}>{situation.totalPaye || 0} USD</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reste à solder</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#cc0000', marginTop: 4 }}>{situation.soldeRestant || 0} USD</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === 'declarer' && (
        <div className="card">
          <h2 className="card-title">Enregistrement d'un bordereau ou reçu mobile</h2>
          <form onSubmit={soumettrePaiement} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>ID d'Inscription Académique</label>
              <input type="number" value={form.inscriptionId} onChange={e => setForm({ ...form, inscriptionId: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Montant Versé</label>
              <input type="number" step="0.01" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Type de Redevance</label>
              <select value={form.typePaiement} onChange={e => setForm({ ...form, typePaiement: e.target.value })}>
                <option value="FRAIS_INSCRIPTION">Frais d'Inscription</option>
                <option value="FRAIS_ACADEMIQUES">Frais Academiques (Minerval)</option>
                <option value="ENROLEMENT_EXAMEN">Frais d'Enrolement aux examens</option>
              </select>
            </div>
            <div className="form-group">
              <label>Canal de Paiement</label>
              <select value={form.modePaiement} onChange={e => setForm({ ...form, modePaiement: e.target.value })}>
                <option value="MOBILE_MONEY">Mobile Money (M-Pesa, Airtel, Orange)</option>
                <option value="VIREMENT_BANCAIRE">Versement Guichet / Banque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nom de la Banque ou Opérateur</label>
              <input value={form.banque} onChange={e => setForm({ ...form, banque: e.target.value })} placeholder="Rawbank, TMB, M-Pesa..." required />
            </div>
            <div className="form-group">
              <label>Numéro de Bordereau / Référence de Transaction</label>
              <input value={form.referenceBancaire} onChange={e => setForm({ ...form, referenceBancaire: e.target.value })} placeholder="Ex: TXN-984812" required />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 16 }}>
              Soumettre la preuve à la caisse
            </button>
          </form>
        </div>
      )}
    </div>
  );
}