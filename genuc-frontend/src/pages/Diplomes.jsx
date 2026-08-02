import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Diplomes() {
  const { user } = useAuth();
  const [onglet, setOnglet]         = useState('verifier');
  const [diplomeId, setDiplomeId]   = useState('');
  const [diplome, setDiplome]       = useState(null);
  const [message, setMessage]       = useState('');
  const [erreur, setErreur]         = useState('');
  const [chargement, setChargement] = useState(false);

  const [form, setForm] = useState({
    inscriptionId: '',
    intitule: 'Diplôme de Licence en Sciences Informatiques',
    mention: 'Satisfaction',
    anneeAcademique: '2024-2025'
  });

  // Permettre la génération de diplômes uniquement aux rôles administratifs
  const peutGenerer = ['SUPER_ADMIN', 'ADMIN_UNIVERSITE'].includes(user?.role);

  // Vérification de l'authenticité d'un diplôme via son identifiant unique
  const verifierDiplome = () => {
    if (!diplomeId) return;
    setErreur('');
    setDiplome(null);
    setChargement(true);

    api.get(`/api/diplomes/public/verifier/${diplomeId}`)
      .then(r => setDiplome(r.data))
      .catch(() => setErreur('Diplôme introuvable ou code de certification non valide.'))
      .finally(() => setChargement(false));
  };

  // Génération officielle d'un nouveau diplôme
  const genererDiplome = (e) => {
    e.preventDefault();
    setErreur('');
    setMessage('');

    const donneesFormatees = {
      ...form,
      inscriptionId: parseInt(form.inscriptionId, 10)
    };

    api.post('/api/diplomes', donneesFormatees)
      .then(r => {
        setMessage(`Diplôme universitaire généré et sécurisé avec succès ! Code d'authenticité : ${r.data.codeVerification || r.data.id}`);
        setForm({
          inscriptionId: '',
          intitule: 'Diplôme de Licence en Sciences Informatiques',
          mention: 'Satisfaction',
          anneeAcademique: '2024-2025'
        });
      })
      .catch(err => setErreur(err.response?.data?.message || 'Échec de la génération du diplôme. Vérifiez l\'ID d\'inscription.'));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certification & Diplômes Numériques</h1>
          <p className="page-sub">Vérifiez l'authenticité des titres académiques ou générez les parchemins officiels.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn-outline ${onglet === 'verifier' ? 'active' : ''}`}
                style={{ background: onglet === 'verifier' ? '#0B1F4A' : '', color: onglet === 'verifier' ? 'white' : '' }}
                onClick={() => setOnglet('verifier')}>
          🔍 Vérifier un Diplôme
        </button>
        {peutGenerer && (
          <button className={`btn-outline ${onglet === 'generer' ? 'active' : ''}`}
                  style={{ background: onglet === 'generer' ? '#0B1F4A' : '', color: onglet === 'generer' ? 'white' : '' }}
                  onClick={() => setOnglet('generer')}>
            🎓 Générer un Diplôme (Admin)
          </button>
        )}
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur">{erreur}</div>}

      {onglet === 'verifier' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>Contrôle de validité du titre national</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input 
              type="text" 
              placeholder="Saisissez le code de vérification ou l'ID du diplôme..." 
              value={diplomeId}
              onChange={e => setDiplomeId(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 13 }} 
            />
            <button className="btn-primary" onClick={verifierDiplome}>Authentifier</button>
          </div>

          {chargement && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Analyse des signatures cryptographiques...</p>}

          {diplome && (
            <div style={{ marginTop: 24, border: '2px dashed #1D9E75', borderRadius: 12, padding: 24, background: '#F4FAF8', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 15, right: 15, color: '#1D9E75', fontWeight: 800, border: '3px solid #1D9E75', padding: '4px 12px', borderRadius: 6, transform: 'rotate(5deg)', fontSize: 14 }}>
                ✓ CERTIFIÉ GENUC
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>République Démocratique du Congo</h3>
                <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Enseignement Supérieur et Universitaire</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#222' }}>
                <div><strong>Intitulé du Titre :</strong> <span style={{ color: '#185FA5', fontWeight: 600 }}>{diplome.intitule}</span></div>
                <div><strong>Lauréat(e) :</strong> <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{diplome.inscription?.prenom} {diplome.inscription?.nom}</span></div>
                <div><strong>Institution émettrice :</strong> {diplome.inscription?.universite?.nom || 'Université Partenaire'}</div>
                <div><strong>Faculté / Filière :</strong> {diplome.inscription?.departement?.nom}</div>
                <div><strong>Année Académique :</strong> {diplome.anneeAcademique}</div>
                <div><strong>Mention décernée :</strong> <span style={{ fontWeight: 600 }}>{diplome.mention}</span></div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                  <strong>Code de traçabilité blockchain / unique :</strong> {diplome.codeVerification || diplome.id}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === 'generer' && peutGenerer && (
        <div className="card">
          <h2 className="card-title">Homologation et émission de diplôme</h2>
          <form onSubmit={genererDiplome} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>ID d'Inscription de l'Étudiant (Dossier Validé)</label>
              <input type="number" value={form.inscriptionId} onChange={e => setForm({ ...form, inscriptionId: e.target.value })} required placeholder="Ex: 481" />
            </div>
            <div className="form-group">
              <label>Année Académique de Réussite</label>
              <input value={form.anneeAcademique} onChange={e => setForm({ ...form, anneeAcademique: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Grade / Intitulé du diplôme officiel</label>
              <input value={form.intitule} onChange={e => setForm({ ...form, intitule: e.target.value })} required placeholder="Ex: Diplôme de Licence en Sciences Informatiques" />
            </div>
            <div className="form-group">
              <label>Mention finale du Jury</label>
              <select value={form.mention} onChange={e => setForm({ ...form, mention: e.target.value })}>
                <option value="Satisfaction">Satisfaction</option>
                <option value="Distinction">Distinction</option>
                <option value="Grande Distinction">Grande Distinction</option>
                <option value="Plus Grande Distinction">Plus Grande Distinction</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / span 2', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
              ⚠️ **Avertissement :** La validation de ce formulaire génère un identifiant numérique unique d'authenticité étatique. Cette action est irréversible et consigne le statut de l'étudiant dans le registre central des diplômés.
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 10 }}>
              Signer et publier le diplôme national
            </button>
          </form>
        </div>
      )}
    </div>
  );
}