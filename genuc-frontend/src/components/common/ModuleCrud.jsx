// src/components/common/ModuleCrud.jsx
// CRUD générique des modules d'administration (Communication, Infrastructure,
// Patrimoine, Recherche). Table + recherche + modal création/édition, piloté
// par une configuration de champs. Les champs de type « ref » chargent leurs
// options depuis une autre ressource du même module (ex. salle → bâtiment).
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import './ModuleCrud.css';

export default function ModuleCrud({ ressource, universiteId, champs, colonnes }) {
  const [lignes, setLignes] = useState([]);
  const [refs, setRefs] = useState({});          // refRessource -> [{id, libelle}]
  const [chargement, setChargement] = useState(false);
  const [modal, setModal] = useState(null);      // null | objet en édition ({} = création)
  const [form, setForm] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    if (!universiteId) return;
    setChargement(true);
    try {
      const res = await api.get(`/api/modules/${ressource}`, { params: { universiteId } });
      setLignes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLignes([]);
    } finally {
      setChargement(false);
    }
  }, [ressource, universiteId]);

  useEffect(() => { charger(); }, [charger]);

  // Options des champs « ref » (ex. campus pour un bâtiment)
  useEffect(() => {
    if (!universiteId) return;
    champs.filter((c) => c.type === 'ref').forEach((c) => {
      api.get(`/api/modules/${c.refRessource}`, { params: { universiteId } })
        .then((res) => setRefs((r) => ({
          ...r,
          [c.refRessource]: (res.data || []).map((l) => ({ id: l.id, libelle: l[c.refLibelle] || `#${l.id}` })),
        })))
        .catch(() => {});
    });
  }, [champs, universiteId]);

  const ouvrirCreation = () => { setForm({}); setModal({}); setMessage(null); };
  const ouvrirEdition = (ligne) => {
    const initial = {};
    champs.forEach((c) => {
      let v = ligne[c.cle];
      if (v && c.type === 'date') v = String(v).slice(0, 10);
      if (v && c.type === 'datetime') v = String(v).slice(0, 16);
      initial[c.cle] = v ?? '';
    });
    setForm(initial);
    setModal(ligne);
    setMessage(null);
  };

  const set = (cle) => (e) => setForm((f) => ({ ...f, [cle]: e.target.value }));

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setMessage(null);
    try {
      const payload = { universiteId, ...form };
      if (modal?.id) {
        await api.put(`/api/modules/${ressource}/${modal.id}`, payload);
      } else {
        await api.post(`/api/modules/${ressource}`, payload);
      }
      setModal(null);
      charger();
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Échec de l\'enregistrement.' });
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (ligne) => {
    if (!window.confirm(`Supprimer « ${ligne[colonnes[0].cle] || '#' + ligne.id} » ?`)) return;
    try {
      await api.delete(`/api/modules/${ressource}/${ligne.id}`);
      charger();
    } catch (err) {
      window.alert(err.response?.data?.erreur || 'Échec de la suppression.');
    }
  };

  const libelleRef = (champ, valeur) => {
    const options = refs[champ.refRessource] || [];
    return options.find((o) => String(o.id) === String(valeur))?.libelle || (valeur ?? '—');
  };

  const afficher = (ligne, colonne) => {
    const champ = champs.find((c) => c.cle === colonne.cle);
    const v = ligne[colonne.cle];
    if (v === null || v === undefined || v === '') return '—';
    if (champ?.type === 'ref') return libelleRef(champ, v);
    if (champ?.type === 'date' || champ?.type === 'datetime') {
      return new Date(v).toLocaleDateString('fr-FR');
    }
    if (champ?.type === 'select') {
      return champ.options.find((o) => o.v === v)?.l || v;
    }
    return String(v);
  };

  const filtre = recherche.trim().toLowerCase();
  const visibles = filtre
    ? lignes.filter((l) => colonnes.some((c) => String(l[c.cle] ?? '').toLowerCase().includes(filtre)))
    : lignes;

  return (
    <div className="mc-bloc">
      <div className="mc-outils">
        <div className="mc-recherche">
          <FaSearch />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher…"
          />
        </div>
        <button type="button" className="mc-btn-ajouter" onClick={ouvrirCreation}>
          <FaPlus /> Ajouter
        </button>
      </div>

      {chargement ? (
        <div className="mc-vide">Chargement…</div>
      ) : visibles.length === 0 ? (
        <div className="mc-vide">Aucun élément{filtre ? ' pour cette recherche' : ''}. Cliquez sur « Ajouter ».</div>
      ) : (
        <div className="mc-table-wrap">
          <table className="mc-table">
            <thead>
              <tr>
                {colonnes.map((c) => <th key={c.cle}>{c.libelle}</th>)}
                <th className="mc-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((ligne) => (
                <tr key={ligne.id}>
                  {colonnes.map((c) => <td key={c.cle}>{afficher(ligne, c)}</td>)}
                  <td className="mc-col-actions">
                    <button type="button" className="mc-action" onClick={() => ouvrirEdition(ligne)} title="Modifier">
                      <FaEdit />
                    </button>
                    <button type="button" className="mc-action mc-action-danger" onClick={() => supprimer(ligne)} title="Supprimer">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <div className="mc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mc-modal" role="dialog" aria-modal="true">
            <h3>{modal.id ? 'Modifier' : 'Ajouter'}</h3>

            {message && (
              <div className={`mc-flash ${message.type === 'ok' ? 'mc-flash-ok' : 'mc-flash-err'}`}>
                {message.type === 'ok' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span>{message.texte}</span>
              </div>
            )}

            <form onSubmit={enregistrer} className="mc-form">
              {champs.map((c) => (
                <label key={c.cle} className={`mc-champ${c.type === 'textarea' ? ' mc-champ-large' : ''}`}>
                  <span>{c.libelle}{c.requis ? ' *' : ''}</span>
                  {c.type === 'textarea' ? (
                    <textarea rows={3} value={form[c.cle] ?? ''} onChange={set(c.cle)} required={c.requis} />
                  ) : c.type === 'select' ? (
                    <select value={form[c.cle] ?? ''} onChange={set(c.cle)} required={c.requis}>
                      <option value="">-- Sélectionner --</option>
                      {c.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : c.type === 'ref' ? (
                    <select value={form[c.cle] ?? ''} onChange={set(c.cle)} required={c.requis}>
                      <option value="">-- Sélectionner --</option>
                      {(refs[c.refRessource] || []).map((o) => (
                        <option key={o.id} value={o.id}>{o.libelle}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={c.type === 'nombre' || c.type === 'decimal' ? 'number'
                        : c.type === 'date' ? 'date'
                        : c.type === 'datetime' ? 'datetime-local'
                        : 'text'}
                      step={c.type === 'decimal' ? '0.01' : undefined}
                      value={form[c.cle] ?? ''}
                      onChange={set(c.cle)}
                      required={c.requis}
                    />
                  )}
                </label>
              ))}

              <div className="mc-modal-actions">
                <button type="button" className="mc-btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button type="submit" className="mc-btn-primary" disabled={envoi}>
                  {envoi ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
