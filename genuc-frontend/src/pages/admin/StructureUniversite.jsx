// src/pages/admin/StructureUniversite.jsx
// Panneau premium de navigation de la structure interne d'une université :
// Faculté → Département → Filière → Promotion. Affiché dans le module
// « Administration → Université » du portail admin.
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiGrid, FiBookOpen, FiUsers, FiSearch, FiRefreshCw, FiInbox,
} from 'react-icons/fi';
import './StructureUniversite.css';

const SEGMENTS = [
  { key: 'facultes',      label: 'Facultés',      singulier: 'faculté',     Icon: FiHome,     color: '#7c3aed' },
  { key: 'departements',  label: 'Départements',  singulier: 'département',  Icon: FiGrid,     color: '#d97706' },
  { key: 'filieres',      label: 'Filières',      singulier: 'filière',      Icon: FiBookOpen, color: '#185FA5' },
  { key: 'promotions',    label: 'Promotions',    singulier: 'promotion',    Icon: FiUsers,    color: '#16a34a' },
];

const nomComplet = (...parts) => parts.filter(Boolean).join(' ').trim() || '—';

const listeDepuisReponse = (payload) => Array.isArray(payload) ? payload : [];

const badgeStatut = (actif) => actif === false
  ? <span className="struct-badge struct-badge-off">Inactif</span>
  : <span className="struct-badge struct-badge-on">Actif</span>;

const celluleNom = (nom, code, color) => (
  <div className="struct-name">
    <span className="struct-name-badge" style={{ background: `${color}22`, color }}>
      {(code || nom || '?').slice(0, 2).toUpperCase()}
    </span>
    <div style={{ minWidth: 0 }}>
      <div className="struct-name-title">{nom || '—'}</div>
      {code && <div className="struct-name-code">{code}</div>}
    </div>
  </div>
);

const chipsVacations = (vacations) => {
  const liste = vacations ? String(vacations).split(',').map(v => v.trim()).filter(Boolean) : [];
  if (liste.length === 0) return <span className="struct-muted">—</span>;
  return liste.map(v => <span key={v} className="struct-chip" style={{ marginRight: 4 }}>{v}</span>);
};

function TableFacultes({ rows, color }) {
  return (
    <table className="struct-table">
      <thead><tr><th>Faculté</th><th>Doyen</th><th>Départements</th><th>Étudiants</th><th>Contact</th></tr></thead>
      <tbody>
        {rows.map(f => (
          <tr key={f.id}>
            <td>{celluleNom(f.nom, f.code, color)}</td>
            <td>{nomComplet(f.doyenNom, f.doyenPostnom, f.doyenPrenom)}</td>
            <td><span className="struct-chip">{f.nombreDepartements ?? 0}</span></td>
            <td><span className="struct-chip">{f.nombreEtudiants ?? 0}</span></td>
            <td className="struct-muted">{f.email || f.telephone || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableDepartements({ rows, color }) {
  return (
    <table className="struct-table">
      <thead><tr><th>Département</th><th>Type</th><th>Responsable</th><th>Statut</th></tr></thead>
      <tbody>
        {rows.map(d => (
          <tr key={d.id}>
            <td>{celluleNom(d.nom, d.code, color)}</td>
            <td><span className="struct-chip">{d.type || '—'}</span></td>
            <td>{nomComplet(d.chefNom, d.chefPostnom, d.chefPrenom)}</td>
            <td>{badgeStatut(d.actif)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableFilieres({ rows, color }) {
  return (
    <table className="struct-table">
      <thead><tr><th>Filière</th><th>Niveau</th><th>Durée</th><th>Crédits</th><th>Statut</th></tr></thead>
      <tbody>
        {rows.map(f => (
          <tr key={f.id}>
            <td>{celluleNom(f.nom, f.code, color)}</td>
            <td><span className="struct-chip">{f.niveau || '—'}</span></td>
            <td>{f.dureeAnnees ? `${f.dureeAnnees} an${f.dureeAnnees > 1 ? 's' : ''}` : '—'}</td>
            <td>{f.creditsTotal ?? '—'}</td>
            <td>{badgeStatut(f.actif)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablePromotions({ rows, color }) {
  return (
    <table className="struct-table">
      <thead><tr><th>Promotion</th><th>Niveau</th><th>Vacations</th><th>Statut</th></tr></thead>
      <tbody>
        {rows.map(p => (
          <tr key={p.id}>
            <td>{celluleNom(p.libelle || p.nom, p.code, color)}</td>
            <td><span className="struct-chip">{p.niveau || p.libelle || '—'}</span></td>
            <td>{chipsVacations(p.vacations)}</td>
            <td>{badgeStatut(p.actif)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StructureUniversite() {
  const { user } = useAuth();
  const uid = user?.universiteId;

  const [data, setData] = useState({ facultes: [], departements: [], filieres: [], promotions: [] });
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('facultes');
  const [recherche, setRecherche] = useState('');
  const [recharge, setRecharge] = useState(0); // incrémenté par « Actualiser »

  useEffect(() => {
    if (!uid) {
      setData({ facultes: [], departements: [], filieres: [], promotions: [] });
      setLoading(false);
      return;
    }
    let annule = false;
    setLoading(true);
    Promise.all([
      api.get(`/api/universites/public/${uid}/facultes`).catch(() => ({ data: [] })),
      api.get(`/api/universites/public/${uid}/departements`).catch(() => ({ data: [] })),
      api.get(`/api/filieres/universite/${uid}`).catch(() => ({ data: [] })),
      api.get(`/api/promotions/universite/${uid}`).catch(() => ({ data: [] })),
    ]).then(([f, d, fi, p]) => {
      if (annule) return;
      setData({
        facultes: listeDepuisReponse(f.data),
        departements: listeDepuisReponse(d.data),
        filieres: listeDepuisReponse(fi.data),
        promotions: listeDepuisReponse(p.data),
      });
    }).finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [uid, recharge]);

  const counts = {
    facultes: data.facultes.length,
    departements: data.departements.length,
    filieres: data.filieres.length,
    promotions: data.promotions.length,
  };

  const seg = SEGMENTS.find(s => s.key === segment) || SEGMENTS[0];
  const rows = data[segment] || [];
  const q = recherche.trim().toLowerCase();
  const rowsFiltres = q
    ? rows.filter(r => `${r.nom || r.libelle || ''} ${r.code || ''}`.toLowerCase().includes(q))
    : rows;

  return (
    <div className="struct card">
      <div className="struct-head">
        <div>
          <h2 className="card-title">🏛️ Structure de l'université</h2>
          <p className="page-sub" style={{ margin: '4px 0 0' }}>
            Naviguez la structure interne : facultés, départements, filières et promotions.
          </p>
        </div>
        <button className="btn-outline struct-refresh" onClick={() => setRecharge(n => n + 1)}>
          <FiRefreshCw /> Actualiser
        </button>
      </div>

      {/* Segments navigables */}
      <div className="struct-segments">
        {SEGMENTS.map(s => (
          <button
            key={s.key}
            type="button"
            className={`struct-seg${segment === s.key ? ' active' : ''}`}
            onClick={() => { setSegment(s.key); setRecherche(''); }}
            style={{ '--seg-color': s.color }}
          >
            <span className="struct-seg-ic" style={{ background: `${s.color}22`, color: s.color }}>
              <s.Icon />
            </span>
            <span className="struct-seg-label">{s.label}</span>
            <span className="struct-seg-count">{counts[s.key]}</span>
          </button>
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="struct-toolbar">
        <div className="struct-search">
          <FiSearch />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder={`Rechercher dans ${seg.label.toLowerCase()}...`}
          />
        </div>
        <span className="struct-count-label">{rowsFiltres.length} / {rows.length}</span>
      </div>

      {/* Tableau du segment actif */}
      {!uid ? (
        <div className="struct-empty">
          <FiInbox className="struct-empty-ic" />
          Votre compte n'est rattaché à aucune université.
        </div>
      ) : loading ? (
        <div className="struct-empty">Chargement de la structure...</div>
      ) : rowsFiltres.length === 0 ? (
        <div className="struct-empty">
          <FiInbox className="struct-empty-ic" />
          {rows.length === 0
            ? `Aucune ${seg.singulier} enregistrée pour le moment.`
            : 'Aucun résultat pour cette recherche.'}
        </div>
      ) : (
        <div className="struct-table-wrap">
          {segment === 'facultes' && <TableFacultes rows={rowsFiltres} color={seg.color} />}
          {segment === 'departements' && <TableDepartements rows={rowsFiltres} color={seg.color} />}
          {segment === 'filieres' && <TableFilieres rows={rowsFiltres} color={seg.color} />}
          {segment === 'promotions' && <TablePromotions rows={rowsFiltres} color={seg.color} />}
        </div>
      )}
    </div>
  );
}
