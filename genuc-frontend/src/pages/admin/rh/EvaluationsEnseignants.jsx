import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const LABELS = { clarte: 'Clarté', ponctualite: 'Ponctualité', disponibilite: 'Disponibilité', maitrise: 'Maîtrise', methode: 'Méthode péda.' };

export default function EvaluationsEnseignants() {
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('note');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/api/evaluations/admin/synthese')
      .then(r => setProfesseurs(r.data || []))
      .catch(err => { console.error(err); setError('Erreur lors du chargement des évaluations.'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = professeurs
    .filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'note' ? b.noteGlobale - a.noteGlobale : b.nbEvaluations - a.nbEvaluations);

  const noteColor = (n) => n >= 4 ? '#1D9E75' : n >= 3 ? '#f5a623' : '#cc0000';

  const exporterCSV = () => {
    const entetes = ['Enseignant', 'Departement', 'Note globale', 'Nb evaluations', ...Object.values(LABELS)];
    const lignes = filtered.map(p => [
      `${p.prenom} ${p.nom}`,
      p.departement || '',
      p.nbEvaluations >= 5 ? (p.noteGlobale?.toFixed(2) ?? '') : 'Insuffisant',
      p.nbEvaluations,
      ...Object.keys(LABELS).map(k => p.nbEvaluations >= 5 ? (p.moyennes?.[k] || 0).toFixed(2) : '')
    ]);
    const csv = [entetes, ...lignes]
      .map(ligne => ligne.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `evaluations_enseignants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Évaluations des enseignants</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Résultats anonymes agrégés. Minimum 5 évaluations requis pour afficher les données.</p>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.10)', color: '#cc0000', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error} <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#cc0000' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un enseignant..."
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
          <option value="note">Trier par note</option>
          <option value="nb">Trier par nb d'évaluations</option>
        </select>
        <button onClick={exporterCSV} disabled={filtered.length === 0}
          style={{ padding: '9px 16px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer', fontSize: 13, opacity: filtered.length === 0 ? 0.6 : 1 }}>
          Exporter CSV
        </button>
      </div>

      <div style={{ display: selected ? 'grid' : 'block', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Enseignant</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Note globale</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Évaluations</th>
                {Object.values(LABELS).map(l => (
                  <th key={l} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{l}</th>
                ))}
                <th style={{ padding: '12px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  style={{ borderTop: '1px solid var(--border-color)', cursor: 'pointer', background: selected?.id === p.id ? '#f0f4ff' : 'white' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.departement}</div>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {p.nbEvaluations >= 5 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: noteColor(p.noteGlobale) }}>{p.noteGlobale?.toFixed(1)}</span>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 12, color: i <= Math.round(p.noteGlobale) ? '#f5a623' : '#ddd' }}>★</span>)}
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Insuffisant</span>}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{p.nbEvaluations}</td>
                  {Object.keys(LABELS).map(k => (
                    <td key={k} style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>
                      {p.nbEvaluations >= 5 ? (
                        <span style={{ color: noteColor(p.moyennes?.[k] || 0), fontWeight: 600 }}>
                          {(p.moyennes?.[k] || 0).toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                  ))}
                  <td style={{ padding: '0 12px', textAlign: 'center', fontSize: 16 }}>
                    {selected?.id === p.id ? '▲' : '▼'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Aucun résultat</div>
          )}
        </div>

        {/* Panel détail */}
        {selected && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{selected.prenom} {selected.nom}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.departement}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {selected.nbEvaluations >= 5 ? (
              <>
                <div style={{ fontSize: 40, fontWeight: 800, color: noteColor(selected.noteGlobale), textAlign: 'center', marginBottom: 4 }}>
                  {selected.noteGlobale?.toFixed(2)}<span style={{ fontSize: 18 }}>/5</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 20 }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 20, color: i <= Math.round(selected.noteGlobale) ? '#f5a623' : '#ddd' }}>★</span>)}
                </div>
                {Object.entries(LABELS).map(([k, l]) => {
                  const v = selected.moyennes?.[k] || 0;
                  return (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{l}</span>
                        <span style={{ fontWeight: 600, color: noteColor(v) }}>{v.toFixed(1)}/5</span>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 6 }}>
                        <div style={{ background: noteColor(v), height: '100%', borderRadius: 4, width: `${(v / 5) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(selected.commentaires || []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Commentaires anonymes</div>
                    {selected.commentaires.slice(0, 3).map((c, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{c}"
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                Données masquées ({selected.nbEvaluations} évaluations — minimum 5 requis pour protéger l'anonymat)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
