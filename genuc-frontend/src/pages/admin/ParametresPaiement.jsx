// src/pages/admin/ParametresPaiement.jsx
// Comptes d'encaissement de l'université : numéros marchands mobile money
// (M-Pesa, Orange Money, Airtel Money), compte bancaire (carte/virement)
// et espèces. Configurés par l'admin — affichés aux étudiants au moment
// de payer leurs frais.
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaMobileAlt, FaUniversity, FaMoneyBillWave, FaSave,
  FaCheckCircle, FaExclamationTriangle, FaCreditCard,
} from 'react-icons/fa';
import './ParametresPaiement.css';

const CHAMPS_INITIAUX = {
  primaryCurrency: 'USD',
  allowPartialPayments: true,
  mpesaNumero: '',
  orangeMoneyNumero: '',
  airtelMoneyNumero: '',
  banqueNom: '',
  banqueCompte: '',
  banqueSwift: '',
  banqueTitulaire: '',
  accepteEspeces: true,
};

export default function ParametresPaiement() {
  const { user } = useAuth();
  const [universiteId, setUniversiteId] = useState(user?.universiteId || '');
  const [universites, setUniversites] = useState([]); // superadmin : choix de l'université
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok'|'err', texte }

  const estSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Superadmin sans université rattachée : liste pour choisir
  useEffect(() => {
    if (estSuperAdmin) {
      api.get('/api/universites')
        .then((res) => setUniversites(Array.isArray(res.data) ? res.data : res.data?.data || []))
        .catch(() => setUniversites([]));
    }
  }, [estSuperAdmin]);

  const charger = useCallback(async (id) => {
    if (!id) return;
    setChargement(true);
    setMessage(null);
    try {
      const res = await api.get(`/api/admin/universites/${id}/parametres-paiement`);
      const d = res.data || {};
      setForm({
        primaryCurrency: d.primaryCurrency || 'USD',
        allowPartialPayments: d.allowPartialPayments ?? true,
        mpesaNumero: d.mpesaNumero || '',
        orangeMoneyNumero: d.orangeMoneyNumero || '',
        airtelMoneyNumero: d.airtelMoneyNumero || '',
        banqueNom: d.banqueNom || '',
        banqueCompte: d.banqueCompte || '',
        banqueSwift: d.banqueSwift || '',
        banqueTitulaire: d.banqueTitulaire || '',
        accepteEspeces: d.accepteEspeces ?? true,
      });
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Impossible de charger les paramètres.' });
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(universiteId); }, [universiteId, charger]);

  const set = (k) => (e) => {
    const valeur = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: valeur }));
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    if (!universiteId) return;
    setEnvoi(true);
    setMessage(null);
    try {
      await api.put(`/api/admin/universites/${universiteId}/parametres-paiement`, form);
      setMessage({ type: 'ok', texte: 'Paramètres de paiement enregistrés. Les étudiants verront ces moyens de paiement.' });
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Échec de l\'enregistrement.' });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="pp-page">
      <header className="pp-header">
        <div className="pp-header-icon"><FaMoneyBillWave /></div>
        <div>
          <h1>Paramètres de paiement</h1>
          <p>Comptes qui reçoivent l'argent de votre université — mobile money, banque et espèces.</p>
        </div>
      </header>

      {estSuperAdmin && (
        <div className="pp-card">
          <label className="pp-field">
            <span>Université</span>
            <select value={universiteId} onChange={(e) => setUniversiteId(e.target.value)}>
              <option value="">-- Sélectionner une université --</option>
              {universites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom} ({u.code})</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {message && (
        <div className={`pp-flash ${message.type === 'ok' ? 'pp-flash-ok' : 'pp-flash-err'}`}>
          {message.type === 'ok' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{message.texte}</span>
        </div>
      )}

      {chargement ? (
        <div className="pp-card pp-loading">Chargement…</div>
      ) : universiteId ? (
        <form onSubmit={enregistrer} className="pp-form">
          {/* ─── Mobile money ─── */}
          <section className="pp-card">
            <h2><FaMobileAlt /> Mobile money (numéros marchands)</h2>
            <p className="pp-hint">
              Numéros qui reçoivent les paiements des étudiants. Laissez vide un opérateur non utilisé.
            </p>
            <div className="pp-grid">
              <label className="pp-field">
                <span>Vodacom M-Pesa</span>
                <input value={form.mpesaNumero} onChange={set('mpesaNumero')} placeholder="+243 81…" />
              </label>
              <label className="pp-field">
                <span>Orange Money</span>
                <input value={form.orangeMoneyNumero} onChange={set('orangeMoneyNumero')} placeholder="+243 89…" />
              </label>
              <label className="pp-field">
                <span>Airtel Money</span>
                <input value={form.airtelMoneyNumero} onChange={set('airtelMoneyNumero')} placeholder="+243 99…" />
              </label>
            </div>
          </section>

          {/* ─── Banque ─── */}
          <section className="pp-card">
            <h2><FaCreditCard /> Compte bancaire (carte & virement)</h2>
            <div className="pp-grid">
              <label className="pp-field">
                <span>Banque</span>
                <input value={form.banqueNom} onChange={set('banqueNom')} placeholder="Rawbank, Equity BCDC…" />
              </label>
              <label className="pp-field">
                <span>N° de compte / IBAN</span>
                <input value={form.banqueCompte} onChange={set('banqueCompte')} placeholder="00011-25000-…" />
              </label>
              <label className="pp-field">
                <span>Code SWIFT</span>
                <input value={form.banqueSwift} onChange={set('banqueSwift')} placeholder="RAWBCDKI" />
              </label>
              <label className="pp-field">
                <span>Intitulé du compte</span>
                <input value={form.banqueTitulaire} onChange={set('banqueTitulaire')} placeholder="Université de …" />
              </label>
            </div>
          </section>

          {/* ─── Options ─── */}
          <section className="pp-card">
            <h2><FaUniversity /> Options d'encaissement</h2>
            <div className="pp-grid">
              <label className="pp-field">
                <span>Devise principale</span>
                <select value={form.primaryCurrency} onChange={set('primaryCurrency')}>
                  <option value="USD">USD</option>
                  <option value="CDF">CDF (FC)</option>
                </select>
              </label>
              <label className="pp-check">
                <input type="checkbox" checked={form.accepteEspeces} onChange={set('accepteEspeces')} />
                <span>Accepter les paiements en espèces à la caisse</span>
              </label>
              <label className="pp-check">
                <input type="checkbox" checked={form.allowPartialPayments} onChange={set('allowPartialPayments')} />
                <span>Autoriser les paiements par tranches</span>
              </label>
            </div>
          </section>

          <div className="pp-actions">
            <button type="submit" className="btn-primary" disabled={envoi}>
              <FaSave /> {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <div className="pp-card pp-loading">Sélectionnez une université pour configurer ses paiements.</div>
      )}
    </div>
  );
}
