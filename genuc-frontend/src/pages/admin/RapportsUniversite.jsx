// src/pages/admin/RapportsUniversite.jsx
// Module Rapports : indicateurs par université (académique, RH, financier,
// bibliothèque, statistiques) sous forme de tuiles, avec répartition des
// comptes par rôle en tableau. Imprimable (Ctrl+P / bouton Imprimer).
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaChartBar, FaGraduationCap, FaUsers, FaMoneyBillWave,
  FaBook, FaChartPie, FaPrint, FaSyncAlt,
} from 'react-icons/fa';
import './RapportsUniversite.css';

const LIBELLES = {
  etudiantsActifs: 'Étudiants actifs',
  inscriptionsTotal: 'Inscriptions (total)',
  inscriptionsEnAttente: 'Inscriptions en attente',
  facultes: 'Facultés',
  departements: 'Départements',
  filieres: 'Filières',
  enseignants: 'Enseignants',
  personnelAdministratif: 'Personnel administratif',
  contratsActifs: 'Contrats actifs',
  congesEnAttente: 'Congés en attente',
  paiesEnAttente: 'Paies en attente',
  paiementsTotal: 'Paiements enregistrés',
  montantPaiements: 'Montant des paiements',
  transactionsMobiles: 'Transactions mobile money',
  montantTransactionsUsd: 'Montant transactions (USD)',
  livres: 'Livres au catalogue',
  empruntsEnCours: 'Emprunts en cours',
  utilisateursTotal: 'Comptes (total)',
  utilisateursActifs: 'Comptes actifs',
};

const SECTIONS = [
  { cle: 'academique', titre: 'Académique', icone: FaGraduationCap, accent: 'bleu' },
  { cle: 'rh', titre: 'Ressources humaines', icone: FaUsers, accent: 'ambre' },
  { cle: 'financier', titre: 'Finances', icone: FaMoneyBillWave, accent: 'vert' },
  { cle: 'bibliotheque', titre: 'Bibliothèque', icone: FaBook, accent: 'violet' },
];

const formater = (cle, valeur) => {
  if (typeof valeur !== 'number') return valeur;
  if (cle.startsWith('montant')) {
    return valeur.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }
  return valeur.toLocaleString('fr-FR');
};

export default function RapportsUniversite() {
  const { user } = useAuth();
  const [universiteId, setUniversiteId] = useState(user?.universiteId || '');
  const [universites, setUniversites] = useState([]);
  const [rapport, setRapport] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const estSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (estSuperAdmin) {
      api.get('/api/universites')
        .then((res) => setUniversites(Array.isArray(res.data) ? res.data : []))
        .catch(() => setUniversites([]));
    }
  }, [estSuperAdmin]);

  const charger = useCallback(async (id) => {
    if (!id) return;
    setChargement(true);
    setErreur('');
    try {
      const res = await api.get(`/api/admin/universites/${id}/rapports`);
      setRapport(res.data);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Impossible de charger les rapports.');
      setRapport(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(universiteId); }, [universiteId, charger]);

  return (
    <div className="rap-page">
      <header className="rap-header">
        <div className="rap-header-icon"><FaChartBar /></div>
        <div className="rap-header-textes">
          <h1>Rapports</h1>
          <p>Indicateurs académiques, RH, financiers et bibliothèque de l'université.</p>
        </div>
        <div className="rap-header-actions">
          <button type="button" className="rap-btn" onClick={() => charger(universiteId)} disabled={chargement}>
            <FaSyncAlt /> Actualiser
          </button>
          <button type="button" className="rap-btn rap-btn-primary" onClick={() => window.print()}>
            <FaPrint /> Imprimer
          </button>
        </div>
      </header>

      {estSuperAdmin && (
        <div className="rap-carte rap-selecteur">
          <label>
            <span>Université</span>
            <select value={universiteId} onChange={(e) => setUniversiteId(e.target.value)}>
              <option value="">-- Sélectionner une université --</option>
              {universites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {erreur && <div className="rap-erreur">{erreur}</div>}
      {chargement && <div className="rap-carte rap-vide">Calcul des indicateurs…</div>}

      {!chargement && rapport && (
        <>
          {SECTIONS.map(({ cle, titre, icone: Icone, accent }) => (
            <section key={cle} className="rap-carte">
              <h2 className={`rap-section-titre rap-accent-${accent}`}>
                <span className="rap-section-icone"><Icone /></span>
                {titre}
              </h2>
              <div className="rap-tuiles">
                {Object.entries(rapport[cle] || {}).map(([k, v]) => (
                  <div key={k} className="rap-tuile">
                    <div className="rap-tuile-valeur">{formater(k, v)}</div>
                    <div className="rap-tuile-libelle">{LIBELLES[k] || k}</div>
                  </div>
                ))}
              </div>
              {cle === 'rh' && (
                <p className="rap-note">
                  Contrats, congés et paies : périmètre plateforme (non rattachés à une université).
                </p>
              )}
            </section>
          ))}

          {/* Statistiques : tuiles + répartition par rôle en tableau */}
          <section className="rap-carte">
            <h2 className="rap-section-titre rap-accent-bleu">
              <span className="rap-section-icone"><FaChartPie /></span>
              Statistiques des comptes
            </h2>
            <div className="rap-tuiles">
              <div className="rap-tuile">
                <div className="rap-tuile-valeur">{formater('utilisateursTotal', rapport.statistiques?.utilisateursTotal ?? 0)}</div>
                <div className="rap-tuile-libelle">{LIBELLES.utilisateursTotal}</div>
              </div>
              <div className="rap-tuile">
                <div className="rap-tuile-valeur">{formater('utilisateursActifs', rapport.statistiques?.utilisateursActifs ?? 0)}</div>
                <div className="rap-tuile-libelle">{LIBELLES.utilisateursActifs}</div>
              </div>
            </div>
            {(rapport.statistiques?.parRole || []).length > 0 && (
              <div className="rap-table-wrap">
                <table className="rap-table">
                  <thead>
                    <tr><th>Rôle</th><th>Nombre de comptes</th></tr>
                  </thead>
                  <tbody>
                    {rapport.statistiques.parRole.map((ligne) => (
                      <tr key={ligne.role}>
                        <td>{ligne.role}</td>
                        <td>{Number(ligne.nombre).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!chargement && !rapport && !erreur && (
        <div className="rap-carte rap-vide">Sélectionnez une université pour générer ses rapports.</div>
      )}
    </div>
  );
}
