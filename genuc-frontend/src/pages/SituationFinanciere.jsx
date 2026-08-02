/**
 * Page Situation Financière — Affiche la situation financière d'un étudiant
 * ✅ ÉTAPE 5 : Dashboard financié
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaiementService from '../services/paiementService';
import { formatErrorMessage } from '../utils/errorHandler';
import './SituationFinanciere.css';

const SituationFinanciere = () => {
  const { inscriptionId } = useParams();
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charge la situation financière
  const loadSituation = async () => {
    if (!inscriptionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await PaiementService.getSituationFinanciere(
        inscriptionId
      );
      setSituation(response);
    } catch (err) {
      const message = formatErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSituation();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  if (loading) {
    return <div className="loading">Chargement de votre situation financière...</div>;
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!situation) {
    return <div className="empty-state">Aucune donnée disponible</div>;
  }

  const { montantTotal, montantPaye, montantRestant, pourcentagePaiement } =
    situation;
  const isFullyPaid = montantRestant === 0;

  return (
    <div className="situation-financiere">
      <div className="page-header">
        <h1>📈 Situation Financière</h1>
        <p>Inscription #{inscriptionId}</p>
      </div>

      <div className="cards-grid">
        {/* Montant Total */}
        <div className="card">
          <div className="card-header">
            <h3>Montant Total</h3>
          </div>
          <div className="card-body">
            <div className="amount">{montantTotal.toLocaleString('fr-DZ')} DZD</div>
          </div>
        </div>

        {/* Montant Payé */}
        <div className="card">
          <div className="card-header">
            <h3>Montant Payé</h3>
          </div>
          <div className="card-body">
            <div className="amount paid">{montantPaye.toLocaleString('fr-DZ')} DZD</div>
          </div>
        </div>

        {/* Montant Restant */}
        <div className="card">
          <div className="card-header">
            <h3>Montant Restant</h3>
          </div>
          <div className="card-body">
            <div className={`amount ${isFullyPaid ? 'paid' : 'pending'}`}>
              {montantRestant.toLocaleString('fr-DZ')} DZD
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="progress-section">
        <h3>Progression du paiement</h3>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${pourcentagePaiement}%` }}
          />
        </div>
        <div className="progress-label">
          <span>{pourcentagePaiement.toFixed(1)}% complet</span>
          {isFullyPaid && <span className="badge badge-success">Payé</span>}
        </div>
      </div>

      {/* Status */}
      <div className="status-section">
        <h3>Statut</h3>
        {isFullyPaid ? (
          <div className="status-success">
            <p>✅ Tous vos paiements sont à jour!</p>
          </div>
        ) : (
          <div className="status-pending">
            <p>⚠️ Vous avez un solde à payer: {montantRestant.toLocaleString('fr-DZ')} DZD</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SituationFinanciere;
