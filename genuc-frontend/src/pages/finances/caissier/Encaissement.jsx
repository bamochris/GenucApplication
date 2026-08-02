// src/pages/finances/caissier/Encaissement.jsx
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function Encaissement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [etudiant, setEtudiant] = useState(null);
  const [dettes, setDettes] = useState([]);
  const [selectedDettes, setSelectedDettes] = useState([]);
  const [montantPaye, setMontantPaye] = useState('');
  const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
  const [operateur, setOperateur] = useState('');
  const [numeroTransaction, setNumeroTransaction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recuGenerer, setRecuGenerer] = useState(null);

  const rechercheEtudiant = async () => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setError('Veuillez saisir au moins 3 caractères');
      return;
    }
    setLoading(true);
    setError(null);
    setEtudiant(null);
    setDettes([]);
    setSelectedDettes([]);
    setMontantPaye('');
    setRecuGenerer(null);

    try {
      const res = await api.get(`/api/inscriptions/recherche?q=${searchTerm}`);
      if (res.data && res.data.length > 0) {
        const etudiantData = res.data[0];
        setEtudiant(etudiantData);
        // Charger les dettes de l'étudiant
        const dettesRes = await api.get(`/api/etudiant/frais/a-payer?inscriptionId=${etudiantData.id}`);
        setDettes(dettesRes.data || []);
        if (dettesRes.data.length === 0) {
          setMessage('✅ Cet étudiant n\'a pas de frais à payer');
        }
      } else {
        setError('Aucun étudiant trouvé');
      }
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDette = (id) => {
    setSelectedDettes(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDettes.length === dettes.length) {
      setSelectedDettes([]);
    } else {
      setSelectedDettes(dettes.map(d => d.id));
    }
  };

  const getTotalSelectionne = () => {
    return dettes
      .filter(d => selectedDettes.includes(d.id))
      .reduce((sum, d) => sum + (d.reste || d.montant), 0);
  };

  const handlePayer = async () => {
    if (selectedDettes.length === 0) {
      setError('Veuillez sélectionner au moins un frais à payer');
      return;
    }
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    const total = getTotalSelectionne();
    if (parseFloat(montantPaye) > total) {
      setError(`Le montant ne peut pas dépasser le total dû (${total} USD)`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage('');

    try {
      const payload = {
        inscriptionId: etudiant.id,
        universiteId: user.universiteId,
        montant: parseFloat(montantPaye),
        modePaiement: modePaiement,
        typePaiement: 'FRAIS_ACADEMIQUES',
        numeroTransaction: numeroTransaction || null,
        operateur: operateur || null,
        agentId: user.id,
        affectationIds: selectedDettes
      };

      const res = await api.post('/api/paiements/etudiant', payload);
      setMessage(`✅ Paiement de ${montantPaye} USD enregistré avec succès`);
      
      // Générer le reçu
      const recuRes = await api.get(`/api/etudiant/frais/recu/${res.data.id}`, {
        responseType: 'blob'
      });
      setRecuGenerer({
        url: URL.createObjectURL(new Blob([recuRes.data], { type: 'application/pdf' })),
        reference: res.data.reference
      });

      // Réinitialiser
      setSelectedDettes([]);
      setMontantPaye('');
      setNumeroTransaction('');
      setOperateur('');
      // Recharger les dettes
      const dettesRes = await api.get(`/api/etudiant/frais/a-payer?inscriptionId=${etudiant.id}`);
      setDettes(dettesRes.data || []);
      if (dettesRes.data.length === 0) {
        setMessage('✅ Tous les frais sont soldés !');
      }
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      rechercheEtudiant();
    }
  };

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">💵 Encaissement</h2>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Recherche étudiant */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">🔍 Rechercher un étudiant</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Matricule, nom ou prénom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flex: 1, minWidth: 250, padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border-color)', fontSize: 14 }}
          />
          <button className="btn-primary" onClick={rechercheEtudiant} disabled={loading}>
            {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
          </button>
        </div>
      </div>

      {/* Informations étudiant */}
      {etudiant && (
        <div className="card" style={{ marginBottom: 20, background: 'rgba(24,95,165,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{etudiant.prenom} {etudiant.nom}</div>
              <div style={{ color: '#185FA5', fontWeight: 600 }}>Matricule: {etudiant.matricule}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{etudiant.promotion} • {etudiant.filiere}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total dû</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: dettes.length > 0 ? '#cc0000' : '#1D9E75' }}>
                {dettes.reduce((sum, d) => sum + (d.reste || d.montant), 0)} USD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des dettes */}
      {etudiant && dettes.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📋 Frais à payer</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedDettes.length === dettes.length && dettes.length > 0}
                onChange={handleSelectAll}
              />
              <span style={{ fontSize: 13 }}>Tout sélectionner</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                ({selectedDettes.length}/{dettes.length} sélectionnées)
              </span>
            </label>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Code</th>
                <th>Libellé</th>
                <th>Montant</th>
                <th>Reste</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {dettes.map(d => {
                const selectionnee = selectedDettes.includes(d.id);
                return (
                  <tr key={d.id} style={{ background: selectionnee ? '#f0f7ff' : 'transparent' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectionnee}
                        onChange={() => handleSelectDette(d.id)}
                      />
                    </td>
                    <td className="uni-code">{d.code}</td>
                    <td>{d.libelle}</td>
                    <td>{d.montant} USD</td>
                    <td style={{ fontWeight: 600, color: d.reste > 0 ? '#cc0000' : '#1D9E75' }}>
                      {d.reste} USD
                    </td>
                    <td>
                      <span className={`badge ${d.statut === 'PAYE' ? 'badge-success' : 'badge-warning'}`}>
                        {d.statut || 'EN_ATTENTE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontWeight: 600 }}>Total sélectionné : </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#185FA5' }}>{getTotalSelectionne()} USD</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de paiement */}
      {etudiant && dettes.length > 0 && selectedDettes.length > 0 && (
        <div className="card">
          <h3 className="card-title">💳 Enregistrer le paiement</h3>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Montant payé *</label>
              <input
                type="number"
                step="0.01"
                placeholder={`Max: ${getTotalSelectionne()}`}
                value={montantPaye}
                onChange={e => setMontantPaye(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Mode de paiement *</label>
              <select
                value={modePaiement}
                onChange={e => setModePaiement(e.target.value)}
                disabled={submitting}
              >
                <option value="MOBILE_MONEY">📱 Mobile Money</option>
                <option value="ESPECES">💵 Espèces</option>
                <option value="VIREMENT">🏦 Virement bancaire</option>
                <option value="CHEQUE">📄 Chèque</option>
                <option value="CARTE_BANCAIRE">💳 Carte bancaire</option>
              </select>
            </div>
            <div className="form-group">
              <label>Opérateur</label>
              <input
                type="text"
                placeholder="Ex: M-Pesa, Rawbank..."
                value={operateur}
                onChange={e => setOperateur(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Numéro de transaction</label>
              <input
                type="text"
                placeholder="Ex: TXN-123456"
                value={numeroTransaction}
                onChange={e => setNumeroTransaction(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                onClick={handlePayer}
                disabled={submitting || !montantPaye || parseFloat(montantPaye) <= 0}
                style={{ flex: 1 }}
              >
                {submitting ? '⏳ Traitement...' : '💰 Payer et générer le reçu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reçu généré */}
      {recuGenerer && (
        <div className="card" style={{ marginTop: 20, background: 'rgba(29,158,117,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1D9E75' }}>✅ Reçu généré</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Référence : {recuGenerer.reference}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={recuGenerer.url} 
                download={`recu_${recuGenerer.reference}.pdf`}
                className="btn-primary"
              >
                📥 Télécharger le reçu
              </a>
              <button 
                className="btn-outline" 
                onClick={() => setRecuGenerer(null)}
              >
                ✕ Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}