/**
 * Page Paiements — Liste et gestion des paiements
 * ✅ ÉTAPE 5 : Interface paiements avec pagination
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaiementService from '../services/paiementService';
import usePagination from '../hooks/usePagination';
import useAuth from '../hooks/useAuth';
import Pagination from '../components/Pagination';
import { formatErrorMessage } from '../utils/errorHandler';
import './PaiementsPage.css';

const PaiementsPage = () => {
  const { inscriptionId } = useParams();
  const { user } = useAuth();
  const pagination = usePagination();
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  // Charge les paiements
  const loadPayments = async () => {
    if (!inscriptionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await PaiementService.getPaymentsByInscription(
        inscriptionId,
        pagination.page,
        pagination.size
      );
      setPaiements(response.content || []);
      pagination.setPaginationState(response);
    } catch (err) {
      const message = formatErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, pagination.page, pagination.size]);

  const handleValidate = async (paiementId) => {
    try {
      await PaiementService.validatePayment(paiementId);
      toast.success('Paiement validé avec succès');
      loadPayments();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleReject = (paiementId) => setRejetModal({ open: true, id: paiementId, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { toast.error('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    try {
      await PaiementService.rejectPayment(id, rejetModal.motif);
      toast.success('Paiement rejeté');
      loadPayments();
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  const handleDownloadReceipt = async (paiementId) => {
    try {
      const blob = await PaiementService.getReceipt(paiementId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paiementId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(formatErrorMessage(err));
    }
  };

  if (loading && paiements.length === 0) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="paiements-page">
      <div className="page-header">
        <h1>💳 Paiements</h1>
        {user?.role === 'ETUDIANT' && (
          <p>Inscription #{inscriptionId}</p>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {paiements.length === 0 ? (
        <div className="empty-state">
          <p>Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="paiements-table">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Montant</th>
                <th>Date</th>
                <th>État</th>
                {user?.role !== 'ETUDIANT' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paiements.map((p) => (
                <tr key={p.id}>
                  <td>{p.reference}</td>
                  <td>{p.montant} DZD</td>
                  <td>{new Date(p.dateCreation).toLocaleDateString('fr-DZ')}</td>
                  <td>
                    <span className={`badge badge-${p.statut?.toLowerCase()}`}>
                      {p.statut}
                    </span>
                  </td>
                  {user?.role !== 'ETUDIANT' && (
                    <td className="actions">
                      {p.statut === 'EN_ATTENTE' && (
                        <>
                          <button
                            onClick={() => handleValidate(p.id)}
                            className="btn btn-success"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="btn btn-danger"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDownloadReceipt(p.id)}
                        className="btn btn-primary"
                      >
                        Reçu
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.goToPage}
        pageSize={pagination.size}
        onPageSizeChange={pagination.setPageSize}
        totalElements={pagination.totalElements}
        isLoading={loading}
      />

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsPage;
