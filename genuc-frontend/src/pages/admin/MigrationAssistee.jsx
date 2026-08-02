// src/pages/admin/MigrationAssistee.jsx
// Migration Assistée Intelligente — intègre une université qui possède déjà
// des étudiants (historique, promotions, facultés, matricules, situation
// financière) via un assistant en 8 étapes : dépôt du fichier, analyse
// automatique, mapping intelligent mémorisé, vérification à trois niveaux,
// correction en ligne, simulation, import par lots avec pause/reprise, et
// centre des erreurs. Tout l'état vit côté serveur : fermer le navigateur ne
// perd rien, chaque migration se reprend exactement où elle s'était arrêtée.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  FaFolderOpen, FaSearch, FaProjectDiagram, FaClipboardCheck, FaPenFancy,
  FaFlask, FaRocket, FaBriefcaseMedical, FaCheck, FaFileExcel, FaFileCsv,
  FaLightbulb, FaDownload, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';
import '../Dashboard.css';

const ETAPES = [
  { num: 1, label: 'Création',     desc: 'Fichier déposé',        Icon: FaFolderOpen },
  { num: 2, label: 'Analyse',      desc: 'Lecture automatique',   Icon: FaSearch },
  { num: 3, label: 'Mapping',      desc: 'Colonnes associées',    Icon: FaProjectDiagram },
  { num: 4, label: 'Vérification', desc: '3 niveaux de contrôle', Icon: FaClipboardCheck },
  { num: 5, label: 'Correction',   desc: 'Directement en ligne',  Icon: FaPenFancy },
  { num: 6, label: 'Simulation',   desc: 'Répétition générale',   Icon: FaFlask },
  { num: 7, label: 'Import',       desc: 'Par lots de 500',       Icon: FaRocket },
  { num: 8, label: 'Erreurs',      desc: 'Réimport ciblé',        Icon: FaBriefcaseMedical },
];

const LIBELLES_CHAMPS = {
  matricule: 'Matricule', nom: 'Nom', postnom: 'Post-nom', prenom: 'Prénom',
  sexe: 'Sexe', dateNaissance: 'Date de naissance', lieuNaissance: 'Lieu de naissance',
  email: 'Email', telephone: 'Téléphone', adresse: 'Adresse',
  faculte: 'Faculté', departement: 'Département', filiere: 'Filière',
  promotion: 'Promotion', niveau: 'Niveau',
  montantPaye: 'Montant payé', devise: 'Devise', datePaiement: 'Date de paiement',
  ignorer: '— Ignorer cette colonne —',
};

const STATUTS_MIGRATION = {
  EN_ATTENTE:   { label: 'En attente',   badge: 'badge-neutral' },
  ANALYSE:      { label: 'Analysée',     badge: 'badge-info' },
  MAPPING:      { label: 'Mapping fait', badge: 'badge-info' },
  VERIFICATION: { label: 'Vérification', badge: 'badge-warning' },
  SIMULATION:   { label: 'Simulée',      badge: 'badge-info' },
  EN_COURS:     { label: 'En cours',     badge: 'badge-warning' },
  PAUSE:        { label: 'En pause',     badge: 'badge-warning' },
  ERREURS:      { label: 'Erreurs à corriger', badge: 'badge-danger' },
  TERMINE:      { label: 'Terminée',     badge: 'badge-success' },
  ANNULE:       { label: 'Annulée',      badge: 'badge-neutral' },
};

const NIVEAU_COULEURS = { VERT: '#1D9E75', ORANGE: '#C07A2B', ROUGE: '#cc0000' };


// ─── Widget « Format de fichier attendu » ─────────────────────────
// Montre à l'admin la mise en forme idéale du fichier à importer :
// colonnes reconnues automatiquement, exemple concret, règles clés.
const COLONNES_GUIDE = [
  { entete: 'Matricule',          exemple: 'HEC-2024-001',            note: 'Identifiant unique (fortement conseillé)' },
  { entete: 'Nom',                exemple: 'KABONGO',                 note: 'Obligatoire (ou Prénom)' },
  { entete: 'Postnom',            exemple: 'MWAMBA',                  note: 'Facultatif' },
  { entete: 'Prenom',             exemple: 'Jean',                    note: 'Obligatoire (ou Nom)' },
  { entete: 'Sexe',               exemple: 'M',                       note: 'M / F' },
  { entete: 'Date de naissance',  exemple: '12/05/2001',              note: 'jj/mm/aaaa' },
  { entete: 'Email',              exemple: 'jean@exemple.cd',         note: 'Facultatif' },
  { entete: 'Telephone',          exemple: '+243810000001',           note: 'Facultatif' },
  { entete: 'Faculte',            exemple: 'Sciences Commerciales',   note: 'Créée automatiquement si absente' },
  { entete: 'Filiere',            exemple: 'Comptabilite',            note: 'Créée automatiquement si absente' },
  { entete: 'Promotion',          exemple: 'L2',                      note: 'Ou « Classe » : L1, G2, M1…' },
  { entete: 'Montant paye',       exemple: '450',                     note: 'Situation financière (historique)' },
  { entete: 'Devise',             exemple: 'USD',                     note: 'USD ou CDF' },
  { entete: 'Date paiement',      exemple: '15/01/2026',              note: 'jj/mm/aaaa' },
];

function GuideFormat({ onTelechargerModele, replie = false }) {
  const [ouvert, setOuvert] = useState(!replie);
  return (
    <div className="card" style={{ marginBottom: 16, border: '1.5px solid rgba(24,95,165,0.35)' }}>
      <button
        type="button"
        onClick={() => setOuvert(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--text-primary)', textAlign: 'left',
        }}
      >
        <span style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #C07A2B, #854F0B)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}><FaLightbulb /></span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 14, display: 'block' }}>
            Quel format de fichier préparer ?
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Guide de mise en forme pour une migration sans erreur — Excel (.xlsx/.xls) ou CSV
          </span>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{ouvert ? <FaChevronUp /> : <FaChevronDown />}</span>
      </button>

      {ouvert && (
        <div style={{ marginTop: 16 }}>
          {/* Règles d'or */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { Icone: FaFileExcel, titre: '1 feuille, 1 ligne d\'en-têtes', texte: 'La première ligne contient les noms de colonnes ; chaque ligne suivante = un étudiant.' },
              { Icone: FaSearch, titre: 'Noms de colonnes libres', texte: 'GENUC reconnaît vos intitulés (« Classe » = promotion, « Tel » = téléphone…) et vous laisse corriger le mapping.' },
              { Icone: FaClipboardCheck, titre: 'Dates jj/mm/aaaa', texte: 'Formats acceptés : 12/05/2001, 12-05-2001, 2001-05-12. Montants avec ou sans symbole.' },
              { Icone: FaFileCsv, titre: 'CSV : ; ou ,', texte: 'Le séparateur est détecté automatiquement, encodage UTF-8 ou Windows recommandé.' },
            ].map(r => (
              <div key={r.titre} style={{
                display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10,
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              }}>
                <span style={{ color: '#185FA5', fontSize: 16, marginTop: 2 }}><r.Icone /></span>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 12.5 }}>{r.titre}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.texte}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Exemple de mise en forme */}
          <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--text-primary)' }}>
            📄 Exemple de mise en forme (colonnes reconnues automatiquement) :
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11.5, minWidth: 900 }}>
              <thead>
                <tr>
                  {COLONNES_GUIDE.map(c => (
                    <th key={c.entete} style={{
                      padding: '7px 10px', textAlign: 'left', whiteSpace: 'nowrap',
                      background: 'linear-gradient(135deg, #185FA5, #0B1F4A)', color: '#fff',
                      fontWeight: 700, borderRight: '1px solid rgba(255,255,255,0.15)',
                    }}>{c.entete}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {COLONNES_GUIDE.map(c => (
                    <td key={c.entete} style={{
                      padding: '6px 10px', whiteSpace: 'nowrap', color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                    }}>{c.exemple}</td>
                  ))}
                </tr>
                <tr>
                  {COLONNES_GUIDE.map(c => (
                    <td key={c.entete} style={{
                      padding: '5px 10px', whiteSpace: 'nowrap', fontSize: 10.5,
                      color: 'var(--text-muted)', fontStyle: 'italic',
                      borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                    }}>{c.note}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onTelechargerModele}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: '#fff',
                fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(29,158,117,0.4)',
              }}
            >
              <FaDownload /> Télécharger le modèle Excel prêt à remplir
            </button>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              💡 Seuls Nom/Prénom sont indispensables : les colonnes manquantes sont simplement ignorées,
              et tout se corrige dans l'assistant avant l'import.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MigrationAssistee() {
  const { user } = useAuth();
  const estSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [vue, setVue] = useState('liste');            // 'liste' | 'wizard'
  const [historique, setHistorique] = useState([]);
  const [migration, setMigration] = useState(null);   // détail complet
  const [etapeVue, setEtapeVue] = useState(1);        // étape affichée
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  // Étape 1
  const [universites, setUniversites] = useState([]);
  const [nomUniversiteAdmin, setNomUniversiteAdmin] = useState('');
  const [form, setForm] = useState({ nom: '', universiteId: user?.universiteId || '', anneeAcademique: '' });
  const [fichier, setFichier] = useState(null);

  // Étapes 3-5
  const [mapping, setMapping] = useState({});
  const [options, setOptions] = useState({ creerStructures: true, strategieDoublon: 'METTRE_A_JOUR' });
  const [lignes, setLignes] = useState([]);
  const [filtreLignes, setFiltreLignes] = useState('ERREUR');
  const [pageLignes, setPageLignes] = useState(0);
  const [totalPagesLignes, setTotalPagesLignes] = useState(0);
  const [ligneEnEdition, setLigneEnEdition] = useState(null); // { id, donnees, action }

  // Étape 6-7
  const [simulation, setSimulation] = useState(null);
  const pollRef = useRef(null);

  // ─── Chargements ──────────────────────────────────────────────
  const chargerHistorique = useCallback(async () => {
    try {
      const res = await api.get('/api/migrations');
      setHistorique(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Impossible de charger l'historique des migrations.");
    }
  }, []);

  useEffect(() => {
    chargerHistorique();
    if (estSuperAdmin) {
      api.get('/api/universites/public').then(r => setUniversites(r.data || [])).catch(() => {});
    } else if (user?.universiteId) {
      api.get(`/api/universites/public/${user.universiteId}`)
        .then(r => setNomUniversiteAdmin(r.data?.nom || ''))
        .catch(() => {});
    }
    return () => clearInterval(pollRef.current);
  }, [chargerHistorique, estSuperAdmin, user?.universiteId]);

  const ouvrirMigration = async (id) => {
    setErreur(''); setMessage('');
    try {
      const res = await api.get(`/api/migrations/${id}`);
      const m = res.data;
      setMigration(m);
      setMapping(m.mapping || {});
      setOptions({ creerStructures: true, strategieDoublon: 'METTRE_A_JOUR', ...(m.options || {}) });
      setSimulation(m.stats?.simulation || null);
      setEtapeVue(m.etape || 2);
      setVue('wizard');
      if (m.statut === 'EN_COURS') demarrerPolling(id);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Migration introuvable.');
    }
  };

  const rafraichirMigration = useCallback(async (id) => {
    try {
      const res = await api.get(`/api/migrations/${id}`);
      setMigration(res.data);
      return res.data;
    } catch { return null; }
  }, []);

  const chargerLignes = useCallback(async (id, statut, page = 0) => {
    try {
      const params = new URLSearchParams({ page, taille: 50 });
      if (statut) params.set('statut', statut);
      const res = await api.get(`/api/migrations/${id}/lignes?${params}`);
      setLignes(res.data.contenu || []);
      setTotalPagesLignes(res.data.totalPages || 0);
      setPageLignes(res.data.page || 0);
    } catch { setLignes([]); }
  }, []);

  useEffect(() => {
    if (migration && (etapeVue === 4 || etapeVue === 5 || etapeVue === 8)) {
      chargerLignes(migration.id, etapeVue === 4 ? filtreLignes : 'ERREUR' === filtreLignes ? filtreLignes : filtreLignes, pageLignes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rechargement volontaire sur changement de filtre/page/étape
  }, [etapeVue, filtreLignes, pageLignes, migration?.id]);

  // ─── Étape 1 : création ───────────────────────────────────────
  const creerMigration = async (e) => {
    e.preventDefault();
    setErreur(''); setMessage('');
    if (!fichier) { setErreur('Déposez un fichier Excel ou CSV.'); return; }
    const uniId = estSuperAdmin ? form.universiteId : user?.universiteId;
    if (!uniId) { setErreur("Sélectionnez l'université à migrer."); return; }
    setChargement(true);
    try {
      const fd = new FormData();
      fd.append('nom', form.nom || `Migration ${new Date().toLocaleDateString('fr-FR')}`);
      fd.append('universiteId', uniId);
      if (form.anneeAcademique) fd.append('anneeAcademique', form.anneeAcademique);
      fd.append('fichier', fichier);
      const res = await api.post('/api/migrations', fd, { timeout: 120000 });
      setMigration(res.data);
      setMapping(res.data.mapping || {});
      setEtapeVue(2);
      setMessage('✅ Fichier analysé — aucune donnée n\'a encore été enregistrée.');
      chargerHistorique();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec de la lecture du fichier.');
    } finally {
      setChargement(false);
    }
  };

  // ─── Étape 3 : mapping ────────────────────────────────────────
  const validerMapping = async () => {
    setErreur(''); setChargement(true);
    try {
      await api.put(`/api/migrations/${migration.id}/options`, options);
      const res = await api.put(`/api/migrations/${migration.id}/mapping`, mapping);
      setMigration(res.data);
      setEtapeVue(4);
      setFiltreLignes('ERREUR');
      setPageLignes(0);
      setMessage('✅ Mapping enregistré et mémorisé pour cette université — vérification effectuée.');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec du mapping.');
    } finally {
      setChargement(false);
    }
  };

  // ─── Étape 5 : correction en ligne ────────────────────────────
  const enregistrerCorrection = async () => {
    if (!ligneEnEdition) return;
    setErreur('');
    try {
      await api.put(`/api/migrations/${migration.id}/lignes/${ligneEnEdition.id}`, {
        donnees: ligneEnEdition.donnees,
        action: ligneEnEdition.action || null,
      });
      setLigneEnEdition(null);
      setMessage('✅ Ligne corrigée et revalidée.');
      await rafraichirMigration(migration.id);
      chargerLignes(migration.id, filtreLignes, pageLignes);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec de la correction.');
    }
  };

  const ignorerLigne = async (ligneId) => {
    try {
      await api.delete(`/api/migrations/${migration.id}/lignes/${ligneId}`);
      await rafraichirMigration(migration.id);
      chargerLignes(migration.id, filtreLignes, pageLignes);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Impossible d'ignorer cette ligne.");
    }
  };

  // ─── Étape 6 : simulation ─────────────────────────────────────
  const lancerSimulation = async () => {
    setErreur(''); setChargement(true);
    try {
      const res = await api.post(`/api/migrations/${migration.id}/simuler`);
      setSimulation(res.data);
      setEtapeVue(6);
      setMessage('✅ Simulation terminée — aucune donnée enregistrée.');
      rafraichirMigration(migration.id);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec de la simulation.');
    } finally {
      setChargement(false);
    }
  };

  // ─── Étape 7 : import + polling ───────────────────────────────
  const demarrerPolling = useCallback((id) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const m = await rafraichirMigration(id);
      if (m && m.statut !== 'EN_COURS') {
        clearInterval(pollRef.current);
        if (m.statut === 'TERMINE') setMessage(`🎉 Import terminé : ${m.lignesImportees} réussites.`);
        if (m.statut === 'ERREURS') {
          setMessage(`Import terminé : ${m.lignesImportees} réussites, ${m.lignesErreur} lignes à corriger.`);
          setEtapeVue(8);
          setFiltreLignes('ERREUR');
        }
      }
    }, 2000);
  }, [rafraichirMigration]);

  const lancerImport = async () => {
    setErreur('');
    try {
      await api.post(`/api/migrations/${migration.id}/importer`);
      setEtapeVue(7);
      setMessage('🚀 Import démarré — lots de 500 lignes, chaque lot dans sa propre transaction.');
      demarrerPolling(migration.id);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Impossible de démarrer l'import.");
    }
  };

  const pauserImport = async () => {
    try { await api.post(`/api/migrations/${migration.id}/pause`); setMessage('⏸️ Pause demandée — effective à la fin du lot en cours.'); }
    catch (err) { setErreur(err.response?.data?.erreur || 'Échec de la pause.'); }
  };

  const reprendreImport = async () => {
    setErreur('');
    try {
      await api.post(`/api/migrations/${migration.id}/reprendre`);
      setEtapeVue(7);
      setMessage('▶️ Reprise — seules les lignes jamais importées sont traitées.');
      demarrerPolling(migration.id);
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec de la reprise.');
    }
  };

  const annulerMigration = async (id) => {
    if (!window.confirm('Annuler cette migration ? Les étudiants et paiements déjà créés par cette migration seront retirés (retour à l\'état précédent).')) return;
    setErreur('');
    try {
      const res = await api.post(`/api/migrations/${id}/annuler`);
      setMessage(res.data.message || 'Migration annulée.');
      chargerHistorique();
      if (migration?.id === id) rafraichirMigration(id);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Échec de l'annulation.");
    }
  };

  const telechargerModele = async () => {
    try {
      const res = await api.get('/api/migrations/modele', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const a = document.createElement('a');
      a.href = url; a.download = 'modele_migration_genuc.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { setErreur('Téléchargement du modèle impossible.'); }
  };

  // ─── Rendu : composants internes ──────────────────────────────
  // Stepper premium : tuiles circulaires en dégradé, coche verte sur les
  // étapes franchies, connecteurs colorés, sous-titre par étape.
  const Stepper = () => (
    <div className="card" style={{ padding: '18px 18px 14px', marginBottom: 18, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 760 }}>
        {ETAPES.map((e, i) => {
          const etapeMax = migration ? migration.etape : 1;
          const atteinte = etapeMax >= e.num;
          const franchie = etapeMax > e.num;
          const active = etapeVue === e.num;
          const IconeEtape = e.Icon;
          return (
            <div key={e.num} style={{ display: 'flex', alignItems: 'flex-start', flex: i < ETAPES.length - 1 ? 1 : 'none' }}>
              <button
                type="button"
                onClick={() => atteinte && setEtapeVue(e.num)}
                disabled={!atteinte}
                title={atteinte ? `Étape ${e.num} — ${e.label}` : 'Étape non encore atteinte'}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  background: 'none', border: 'none', padding: 0, width: 96, flexShrink: 0,
                  cursor: atteinte ? 'pointer' : 'default',
                }}
              >
                <div style={{
                  position: 'relative', width: 46, height: 46, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  background: active
                    ? 'linear-gradient(135deg, #185FA5, #0B1F4A)'
                    : franchie
                      ? 'linear-gradient(135deg, #1D9E75, #0F6E56)'
                      : atteinte ? 'var(--bg-card)' : 'var(--bg-secondary)',
                  color: active || franchie ? '#fff' : atteinte ? '#185FA5' : 'var(--text-muted)',
                  border: active || franchie ? 'none' : `2px solid ${atteinte ? '#185FA5' : 'var(--border-color)'}`,
                  boxShadow: active ? '0 6px 18px rgba(24,95,165,0.45), 0 0 0 4px rgba(24,95,165,0.15)'
                    : franchie ? '0 3px 10px rgba(29,158,117,0.35)' : 'none',
                  transition: 'all 0.25s ease',
                }}>
                  <IconeEtape />
                  {franchie && !active && (
                    <span style={{
                      position: 'absolute', bottom: -3, right: -3, width: 18, height: 18,
                      borderRadius: '50%', background: '#1D9E75', border: '2px solid var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 9,
                    }}><FaCheck /></span>
                  )}
                </div>
                <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
                  <div style={{
                    fontSize: 12, fontWeight: active ? 800 : 600,
                    color: active ? '#185FA5' : atteinte ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
                    {e.num}. {e.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.desc}</div>
                </div>
              </button>
              {i < ETAPES.length - 1 && (
                <div style={{
                  flex: 1, height: 3, borderRadius: 2, marginTop: 22, minWidth: 12,
                  background: etapeMax > e.num
                    ? 'linear-gradient(90deg, #1D9E75, #185FA5)'
                    : 'var(--border-color)',
                  transition: 'background 0.4s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const CarteStat = ({ valeur, label, couleur }) => (
    <div className="stat-card" style={couleur ? { borderLeftColor: couleur } : {}}>
      <div className="stat-content">
        <div className="stat-value" style={couleur ? { color: couleur } : {}}>{valeur}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const BadgeNiveau = ({ niveau }) => (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: `${NIVEAU_COULEURS[niveau] || '#888'}18`, color: NIVEAU_COULEURS[niveau] || '#888',
    }}>
      {niveau === 'VERT' ? '🟢 Info' : niveau === 'ORANGE' ? '🟠 Attention' : '🔴 Bloquant'}
    </span>
  );

  const TableLignes = ({ correction }) => (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filtrer :</span>
        {['ERREUR', 'AVERTISSEMENT', 'VALIDE', 'IMPORTEE', 'IGNOREE', ''].map(s => (
          <button key={s || 'TOUT'} className="btn-outline"
            style={{ fontSize: 11, padding: '4px 10px',
              background: filtreLignes === s ? '#185FA5' : '', color: filtreLignes === s ? '#fff' : '' }}
            onClick={() => { setFiltreLignes(s); setPageLignes(0); }}>
            {s === '' ? 'Toutes' : s === 'ERREUR' ? '🔴 Erreurs' : s === 'AVERTISSEMENT' ? '🟠 Avertissements'
              : s === 'VALIDE' ? '🟢 Valides' : s === 'IMPORTEE' ? '✅ Importées' : '⏭️ Ignorées'}
          </button>
        ))}
      </div>
      {lignes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune ligne pour ce filtre.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Aperçu</th><th>Problèmes</th>{correction && <th>Action</th>}</tr>
            </thead>
            <tbody>
              {lignes.map(l => {
                const donnees = safeJson(l.donneesJson, {});
                const problemes = safeJson(l.erreursJson, []);
                const apercu = Object.entries(donnees).slice(0, 4)
                  .map(([k, v]) => `${k}: ${v || '—'}`).join(' · ');
                return (
                  <tr key={l.id}>
                    <td className="uni-code">{l.numeroLigne}</td>
                    <td style={{ fontSize: 12, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={apercu}>{apercu}</td>
                    <td>
                      {problemes.length === 0 ? <span className="badge badge-success">OK</span> :
                        problemes.map((p, i) => (
                          <div key={i} style={{ marginBottom: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <BadgeNiveau niveau={p.niveau} />
                            <span style={{ fontSize: 12 }}>{p.message}</span>
                          </div>
                        ))}
                    </td>
                    {correction && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {(l.statut === 'ERREUR' || l.statut === 'AVERTISSEMENT') && (
                          <>
                            <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', marginRight: 6 }}
                              onClick={() => setLigneEnEdition({ id: l.id, donnees: { ...donnees }, action: l.action || '' })}>
                              ✏️ Corriger
                            </button>
                            <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', color: '#B91C1C' }}
                              onClick={() => ignorerLigne(l.id)}>
                              ⏭️ Ignorer
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {totalPagesLignes > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
          <button className="btn-outline" disabled={pageLignes === 0}
            onClick={() => setPageLignes(p => p - 1)} style={{ fontSize: 12 }}>← Précédent</button>
          <span style={{ fontSize: 12, alignSelf: 'center', color: 'var(--text-muted)' }}>
            Page {pageLignes + 1} / {totalPagesLignes}
          </span>
          <button className="btn-outline" disabled={pageLignes >= totalPagesLignes - 1}
            onClick={() => setPageLignes(p => p + 1)} style={{ fontSize: 12 }}>Suivant →</button>
        </div>
      )}
    </div>
  );

  // ─── VUE LISTE (historique) ───────────────────────────────────
  if (vue === 'liste') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔄 Migration Assistée Intelligente</h1>
            <p className="page-sub">
              Intégrez une université qui a déjà des étudiants : historique, promotions,
              facultés, matricules et situation financière — sans rien perdre.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={telechargerModele}>📄 Modèle Excel</button>
            <button className="btn-primary" onClick={() => {
              setMigration(null); setEtapeVue(1); setVue('wizard');
              setForm({ nom: '', universiteId: user?.universiteId || '', anneeAcademique: '' });
              setFichier(null); setMessage(''); setErreur('');
            }}>
              ➕ Nouvelle migration
            </button>
          </div>
        </div>

        {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
        {erreur && <div className="alert-erreur" onClick={() => setErreur('')}>{erreur}</div>}

        <GuideFormat onTelechargerModele={telechargerModele} replie />

        <div className="card">
          <h2 className="card-title">📋 Historique des migrations</h2>
          {historique.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune migration pour l'instant. Cliquez sur « Nouvelle migration » pour commencer.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {historique.map(m => {
                const st = STATUTS_MIGRATION[m.statut] || {};
                return (
                  <div key={m.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{m.nom}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {m.universiteNom} · {new Date(m.creeLe).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <span className={`badge ${st.badge || 'badge-neutral'}`}>{st.label || m.statut}</span>
                    </div>
                    <div style={{ margin: '12px 0 6px', background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${m.progression}%`, height: '100%', background: m.statut === 'TERMINE' ? '#1D9E75' : '#185FA5', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      {m.progression}% · {m.lignesImportees}/{m.totalLignes} importées
                      {m.lignesErreur > 0 && <span style={{ color: '#cc0000' }}> · {m.lignesErreur} erreurs</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                        onClick={() => ouvrirMigration(m.id)}>
                        {['TERMINE', 'ANNULE'].includes(m.statut) ? '👁️ Consulter' : '▶️ Reprendre'}
                      </button>
                      {!['ANNULE'].includes(m.statut) && (
                        <button className="btn-outline" style={{ fontSize: 12, padding: '6px 14px', color: '#B91C1C' }}
                          onClick={() => annulerMigration(m.id)}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── VUE WIZARD ───────────────────────────────────────────────
  const analyse = migration?.stats?.analyse || {};
  const st = migration ? (STATUTS_MIGRATION[migration.statut] || {}) : {};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            🔄 {migration ? migration.nom : 'Nouvelle migration'}
            {migration && <span className={`badge ${st.badge}`} style={{ marginLeft: 10, verticalAlign: 'middle' }}>{st.label}</span>}
          </h1>
          <p className="page-sub">
            {migration ? `${migration.universiteNom} · ${migration.totalLignes} lignes · fichier « ${migration.nomFichierOriginal} »`
              : 'Déposez le fichier des étudiants existants — rien ne sera importé sans votre validation.'}
          </p>
        </div>
        <button className="btn-outline" onClick={() => { clearInterval(pollRef.current); setVue('liste'); chargerHistorique(); }}>
          ← Historique
        </button>
      </div>

      <Stepper />
      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur" onClick={() => setErreur('')}>{erreur}</div>}

      {/* ═══ ÉTAPE 1 : CRÉATION ═══ */}
      {etapeVue === 1 && (
        <>
        <GuideFormat onTelechargerModele={telechargerModele} />
        <div className="card">
          <h2 className="card-title">📁 Étape 1 — Créer la migration</h2>
          <form onSubmit={creerMigration} className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>Nom de la migration *</label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex : Migration HEC-KIN 2026" required />
            </div>
            {estSuperAdmin ? (
              <div className="form-group">
                <label>Université *</label>
                <select value={form.universiteId} onChange={e => setForm({ ...form, universiteId: e.target.value })} required>
                  <option value="">-- Sélectionner --</option>
                  {universites.map(u => <option key={u.id} value={u.id}>{u.code} — {u.nom}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Université 🔒</label>
                <input value={nomUniversiteAdmin || 'Votre université'} disabled />
                <small style={{ color: 'var(--text-muted)' }}>
                  Verrouillé : un administrateur ne peut migrer que les données de sa propre université.
                </small>
              </div>
            )}
            <div className="form-group">
              <label>Année académique</label>
              <input value={form.anneeAcademique} onChange={e => setForm({ ...form, anneeAcademique: e.target.value })}
                placeholder="Ex : 2025-2026" />
            </div>
            <div className="form-group">
              <label>Fichier (Excel .xlsx/.xls ou CSV) *</label>
              <input type="file" accept=".csv,.xlsx,.xls"
                onChange={e => setFichier(e.target.files[0] || null)} required />
              {fichier && <small style={{ color: 'var(--text-muted)' }}>📎 {fichier.name} ({Math.round(fichier.size / 1024)} Ko)</small>}
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setVue('liste')}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={chargement}>
                {chargement ? '⏳ Lecture et analyse du fichier…' : '🔎 Déposer et analyser'}
              </button>
            </div>
          </form>
        </div>
        </>
      )}

      {/* ═══ ÉTAPE 2 : ANALYSE ═══ */}
      {etapeVue === 2 && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">🔎 Étape 2 — Analyse automatique</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Le fichier a été lu et analysé. <strong>Aucune donnée n'est encore enregistrée.</strong>
            </p>
          </div>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <CarteStat valeur={analyse.etudiants ?? migration.totalLignes} label="✔ Étudiants détectés" />
            <CarteStat valeur={analyse.departements ?? '—'} label="✔ Facultés / Départements" />
            <CarteStat valeur={analyse.promotions ?? '—'} label="✔ Promotions" />
            <CarteStat valeur={analyse.paiements ?? '—'} label="✔ Paiements détectés" />
          </div>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <CarteStat valeur={analyse.lignesIncompletes ?? 0} label="⚠ Lignes incomplètes" couleur="#C07A2B" />
            <CarteStat valeur={analyse.doublonsInternes ?? 0} label="⚠ Doublons de matricule" couleur="#C07A2B" />
            <CarteStat valeur={analyse.structuresInconnues ?? 0} label="⚠ Structures inconnues" couleur="#C07A2B" />
            <CarteStat valeur={analyse.cellulesVides ?? 0} label="Cellules vides" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => setEtapeVue(3)}>Continuer vers le mapping →</button>
          </div>
        </>
      )}

      {/* ═══ ÉTAPE 3 : MAPPING ═══ */}
      {etapeVue === 3 && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">🔗 Étape 3 — Mapping intelligent</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              GENUC a associé automatiquement vos colonnes aux champs de la plateforme
              (et réutilise le mapping mémorisé de cette université). Corrigez si besoin,
              puis validez : le mapping sera mémorisé pour vos prochaines migrations.
            </p>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Colonne de votre fichier</th><th></th><th>Champ GENUC</th></tr></thead>
                <tbody>
                  {(migration.colonnes || []).map(col => (
                    <tr key={col}>
                      <td style={{ fontWeight: 600 }}>{col}</td>
                      <td style={{ color: 'var(--text-muted)' }}>→</td>
                      <td>
                        <select
                          value={mapping[col] || 'ignorer'}
                          onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                          style={{
                            padding: '6px 10px', borderRadius: 8, fontSize: 13,
                            border: `1.5px solid ${mapping[col] && mapping[col] !== 'ignorer' ? '#1D9E75' : 'var(--border-color)'}`,
                            background: 'var(--bg-card)', color: 'var(--text-primary)',
                          }}
                        >
                          {(migration.champsCibles || Object.keys(LIBELLES_CHAMPS)).map(c => (
                            <option key={c} value={c}>{LIBELLES_CHAMPS[c] || c}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ fontSize: 14 }}>⚙️ Options d'import</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <input type="checkbox" checked={!!options.creerStructures}
                onChange={e => setOptions(o => ({ ...o, creerStructures: e.target.checked }))} />
              <span style={{ fontSize: 13 }}>
                Créer automatiquement les facultés, départements, filières et promotions qui n'existent pas encore
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Si un matricule existe déjà dans GENUC :</span>
              <select value={options.strategieDoublon}
                onChange={e => setOptions(o => ({ ...o, strategieDoublon: e.target.value }))}
                style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13, border: '1.5px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <option value="METTRE_A_JOUR">Fusionner (compléter l'existant)</option>
                <option value="IGNORER">Ignorer la ligne</option>
                <option value="CREER">Créer un nouvel étudiant</option>
              </select>
              <small style={{ color: 'var(--text-muted)' }}>— modifiable ligne par ligne à l'étape correction</small>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-outline" onClick={() => setEtapeVue(2)}>← Retour</button>
            <button className="btn-primary" onClick={validerMapping} disabled={chargement}>
              {chargement ? '⏳ Vérification…' : 'Valider le mapping et vérifier →'}
            </button>
          </div>
        </>
      )}

      {/* ═══ ÉTAPES 4-5 : VÉRIFICATION + CORRECTION ═══ */}
      {(etapeVue === 4 || etapeVue === 5) && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">{etapeVue === 4 ? '✅ Étape 4 — Vérification intelligente' : '✏️ Étape 5 — Correction en ligne'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              🟢 information · 🟠 attention (importable, corrigeable plus tard) · 🔴 bloquant (la ligne ne sera pas importée).
              Corrigez directement ici : chaque correction est revalidée immédiatement.
            </p>
          </div>
          <div className="stats-grid" style={{ marginBottom: 4 }}>
            <CarteStat valeur={migration.totalLignes - migration.lignesErreur} label="Lignes importables" couleur="#1D9E75" />
            <CarteStat valeur={migration.lignesErreur} label="🔴 Lignes bloquantes" couleur="#cc0000" />
            <CarteStat valeur={migration.lignesImportees} label="Déjà importées" />
            <CarteStat valeur={migration.lignesIgnorees} label="Ignorées" />
          </div>
          <TableLignes correction />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="btn-outline" onClick={() => setEtapeVue(3)}>← Revoir le mapping</button>
            <button className="btn-primary" onClick={lancerSimulation} disabled={chargement}>
              {chargement ? '⏳…' : '🧪 Lancer la simulation →'}
            </button>
          </div>
        </>
      )}

      {/* ═══ ÉTAPE 6 : SIMULATION ═══ */}
      {etapeVue === 6 && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">🧪 Étape 6 — Simulation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Répétition générale de l'import — <strong>aucune donnée n'est enregistrée.</strong>
            </p>
          </div>
          {!simulation ? (
            <button className="btn-primary" onClick={lancerSimulation} disabled={chargement}>
              {chargement ? '⏳ Simulation…' : '🧪 Lancer la simulation'}
            </button>
          ) : (
            <>
              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <CarteStat valeur={simulation.importables} label="Étudiants importables" couleur="#1D9E75" />
                <CarteStat valeur={simulation.aCorriger} label="À corriger (exclus)" couleur={simulation.aCorriger > 0 ? '#cc0000' : undefined} />
                <CarteStat valeur={simulation.paiements} label="Paiements historiques" />
                <CarteStat valeur={`~${Math.ceil((simulation.tempsEstimeSecondes || 5) / 60)} min`} label="Temps estimé" />
              </div>
              {(simulation.structuresACreer || []).length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 className="card-title" style={{ fontSize: 14 }}>🏗️ Structures qui seront créées automatiquement</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {simulation.structuresACreer.map(s => (
                      <span key={s} className="badge badge-info">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-outline" onClick={() => setEtapeVue(5)}>← Corriger encore</button>
                <button className="btn-primary" onClick={lancerImport}>🚀 Lancer l'import réel →</button>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ ÉTAPE 7 : IMPORT PROGRESSIF ═══ */}
      {etapeVue === 7 && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">🚀 Étape 7 — Import progressif</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Import par lots de 500 lignes, chaque lot dans sa propre transaction :
              un lot en erreur n'empêche jamais les autres d'aboutir.
            </p>
            <div style={{ margin: '18px 0 8px', background: 'var(--bg-secondary)', height: 16, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${migration.progression}%`, height: '100%',
                background: migration.statut === 'TERMINE' ? '#1D9E75' : 'linear-gradient(90deg,#185FA5,#1D9E75)',
                transition: 'width 0.8s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>{migration.progression}%</span>
              <span>✅ {migration.lignesImportees} importées · ⏭️ {migration.lignesIgnorees} ignorées · 🔴 {migration.lignesErreur} erreurs</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {migration.statut === 'EN_COURS' && (
              <button className="btn-outline" onClick={pauserImport}>⏸️ Pause</button>
            )}
            {migration.statut === 'PAUSE' && (
              <button className="btn-primary" onClick={reprendreImport}>▶️ Reprendre</button>
            )}
            {migration.statut === 'ERREURS' && (
              <button className="btn-primary" onClick={() => { setEtapeVue(8); setFiltreLignes('ERREUR'); }}>
                🩺 Ouvrir le centre des erreurs ({migration.lignesErreur})
              </button>
            )}
            {migration.statut === 'TERMINE' && (
              <div className="alert-success" style={{ flex: 1 }}>
                🎉 Import terminé : {migration.lignesImportees} réussites, {migration.lignesErreur} erreurs.
              </div>
            )}
            {['EN_COURS', 'PAUSE'].includes(migration.statut) && (
              <button className="btn-outline" style={{ color: '#B91C1C' }} onClick={() => annulerMigration(migration.id)}>
                Annuler la migration
              </button>
            )}
          </div>
        </>
      )}

      {/* ═══ ÉTAPE 8 : CENTRE DES ERREURS ═══ */}
      {etapeVue === 8 && migration && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">🩺 Étape 8 — Centre des erreurs</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {migration.lignesErreur > 0
                ? `${migration.lignesErreur} ligne(s) rejetée(s) conservée(s) ici. Corrigez-les puis cliquez sur
                   « Continuer la migration » : seules les lignes corrigées seront importées — jamais tout le processus.`
                : 'Aucune ligne en erreur — la migration est complète. 🎉'}
            </p>
          </div>
          <TableLignes correction />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="btn-outline" onClick={() => setEtapeVue(7)}>← Progression</button>
            <button className="btn-primary" onClick={reprendreImport}
              disabled={migration.statut === 'EN_COURS'}>
              ▶️ Continuer la migration (importer les lignes corrigées)
            </button>
          </div>
        </>
      )}

      {/* ═══ MODALE DE CORRECTION D'UNE LIGNE ═══ */}
      {ligneEnEdition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,16,38,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onMouseDown={e => { if (e.target === e.currentTarget) setLigneEnEdition(null); }}>
          <div className="card dialog-resizable" role="dialog" aria-modal="true"
            style={{ width: 'min(560px, 100%)', maxHeight: '86vh', overflowY: 'auto', margin: 0 }}>
            <h3 className="card-title">✏️ Corriger la ligne</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {Object.entries(ligneEnEdition.donnees).map(([col, val]) => (
                <div className="form-group" key={col}>
                  <label style={{ fontSize: 12 }}>
                    {col}
                    {mapping[col] && mapping[col] !== 'ignorer' && (
                      <span style={{ color: '#185FA5' }}> → {LIBELLES_CHAMPS[mapping[col]] || mapping[col]}</span>
                    )}
                  </label>
                  <input value={val}
                    onChange={e => setLigneEnEdition(le => ({ ...le, donnees: { ...le.donnees, [col]: e.target.value } }))} />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label style={{ fontSize: 12 }}>En cas de doublon de matricule</label>
                <select value={ligneEnEdition.action || ''}
                  onChange={e => setLigneEnEdition(le => ({ ...le, action: e.target.value }))}>
                  <option value="">Suivre la stratégie globale</option>
                  <option value="METTRE_A_JOUR">Fusionner avec l'existant</option>
                  <option value="IGNORER">Ignorer cette ligne</option>
                  <option value="CREER">Créer un nouvel étudiant</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn-outline" onClick={() => setLigneEnEdition(null)}>Annuler</button>
              <button className="btn-primary" onClick={enregistrerCorrection}>💾 Enregistrer et revalider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function safeJson(texte, defaut) {
  if (!texte) return defaut;
  try { return JSON.parse(texte); } catch { return defaut; }
}
