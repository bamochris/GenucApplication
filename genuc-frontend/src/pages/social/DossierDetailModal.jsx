// src/components/Social/DossierDetailModal.jsx
import React from 'react';
import '../../pages/Dashboard.css';

const DossierDetailModal = ({ dossier, onClose, onValider, onRejeter, onEtudier, onRefresh }) => {
  if (!dossier) return null;

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'EN_ETUDE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'EN_ETUDE': '📋 En étude',
      'VALIDE': '✅ Validé',
      'REJETE': '❌ Rejeté'
    };
    return map[statut] || statut;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="card-title" style={{ margin: 0 }}>📋 Dossier social #{dossier.numeroDossier}</h3>
          <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={onClose} aria-label="Fermer" title="Fermer">✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span className={`badge ${getStatutBadge(dossier.statut)}`}>
            {getStatutLabel(dossier.statut)}
          </span>
          {dossier.demandeBourse && <span className="badge badge-success">💰 Demande bourse</span>}
          {dossier.handicap && <span className="badge badge-warning">♿ Handicap</span>}
        </div>

        <div className="detail-grid">
          <div><div className="detail-lbl">Étudiant</div><div>{dossier.etudiant?.prenom} {dossier.etudiant?.nom}</div></div>
          <div><div className="detail-lbl">Matricule</div><div>{dossier.inscription?.matricule}</div></div>
          <div><div className="detail-lbl">Situation familiale</div><div>{dossier.situationFamiliale || '-'}</div></div>
          <div><div className="detail-lbl">Nombre d'enfants</div><div>{dossier.nombreEnfants || 0}</div></div>
          <div><div className="detail-lbl">Personnes à charge</div><div>{dossier.nombrePersonnesCharge || 0}</div></div>
          <div><div className="detail-lbl">Profession parent</div><div>{dossier.professionParent || '-'}</div></div>
          <div><div className="detail-lbl">Revenu mensuel foyer</div><div>{dossier.revenuMensuelFoyer ? dossier.revenuMensuelFoyer + ' USD' : '-'}</div></div>
          <div><div className="detail-lbl">Source de revenu</div><div>{dossier.sourceRevenu || '-'}</div></div>
          <div><div className="detail-lbl">Type de logement</div><div>{dossier.typeLogement || '-'}</div></div>
          <div><div className="detail-lbl">Handicap</div><div>{dossier.handicap ? '✅ Oui' : '❌ Non'}</div></div>
          {dossier.handicap && <div><div className="detail-lbl">Type handicap</div><div>{dossier.typeHandicap || '-'}</div></div>}
          <div><div className="detail-lbl">Problèmes de santé</div><div>{dossier.problemesSante || '-'}</div></div>
          {dossier.demandeBourse && (
            <>
              <div><div className="detail-lbl">Type bourse demandée</div><div>{dossier.typeBourseDemandee || '-'}</div></div>
              <div><div className="detail-lbl">Montant demandé</div><div>{dossier.montantDemande ? dossier.montantDemande + ' USD' : '-'}</div></div>
            </>
          )}
          <div style={{ gridColumn: '1 / span 2' }}>
            <div className="detail-lbl">Commentaire admin</div>
            <div>{dossier.commentaireAdmin || '-'}</div>
          </div>
          <div style={{ gridColumn: '1 / span 2' }}>
            <div className="detail-lbl">Documents</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {dossier.urlCertificatScolarite && <a href={dossier.urlCertificatScolarite} target="_blank" rel="noopener noreferrer" className="badge badge-neutral">📄 Scolarité</a>}
              {dossier.urlBulletinNotes && <a href={dossier.urlBulletinNotes} target="_blank" rel="noopener noreferrer" className="badge badge-neutral">📄 Bulletin</a>}
              {dossier.urlAttestationRevenus && <a href={dossier.urlAttestationRevenus} target="_blank" rel="noopener noreferrer" className="badge badge-neutral">📄 Revenus</a>}
              {dossier.urlCertificatHandicap && <a href={dossier.urlCertificatHandicap} target="_blank" rel="noopener noreferrer" className="badge badge-neutral">📄 Handicap</a>}
              {dossier.urlLettreMotivation && <a href={dossier.urlLettreMotivation} target="_blank" rel="noopener noreferrer" className="badge badge-neutral">📄 Motivation</a>}
            </div>
          </div>
        </div>

        {/* Bourse attribuée si validé */}
        {dossier.statut === 'VALIDE' && dossier.bourse && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(29,158,117,0.12)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, color: '#1D9E75' }}>💰 Bourse attribuée</div>
            <div className="detail-grid" style={{ marginTop: 8 }}>
              <div><span style={{ color: '#6b7280' }}>Type :</span> {dossier.bourse.type}</div>
              <div><span style={{ color: '#6b7280' }}>Montant total :</span> {dossier.bourse.montantTotal} USD</div>
              <div><span style={{ color: '#6b7280' }}>Par mois :</span> {dossier.bourse.montantParMois} USD</div>
              <div><span style={{ color: '#6b7280' }}>Durée :</span> {dossier.bourse.dureeMois} mois</div>
              <div style={{ gridColumn: '1 / span 2' }}><span style={{ color: '#6b7280' }}>Conditions :</span> {dossier.bourse.conditions || '-'}</div>
            </div>
          </div>
        )}

        {/* Historique des statuts */}
        {dossier.historique && dossier.historique.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📜 Historique</div>
            <div style={{ fontSize: 12 }}>
              {dossier.historique.map((h, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span>{h.action}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions admin */}
        {dossier.statut !== 'VALIDE' && dossier.statut !== 'REJETE' && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
            {dossier.statut === 'EN_ATTENTE' && (
              <button className="btn-primary" style={{ background: '#185FA5' }} onClick={() => onEtudier(dossier.id)}>
                📝 Passer en étude
              </button>
            )}
            {dossier.statut === 'EN_ETUDE' && (
              <button className="btn-success" onClick={() => onValider(dossier.id)}>
                ✅ Valider
              </button>
            )}
            <button className="btn-danger" onClick={() => onRejeter(dossier.id)}>
              ❌ Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DossierDetailModal;