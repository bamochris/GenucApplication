import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TachPayCheckout from '../components/TachPayCheckout';
import TachPayLoadingDialog from '../components/TachPayLoadingDialog';
import { useAuth } from '../context/AuthContext';
import './TachPayPage.css';
import { API_BASE_URL } from '../config/apiBaseUrl';

const API_BASE = API_BASE_URL;

export default function TachPayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [checkoutContext, setCheckoutContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextError, setContextError] = useState('');

  const studentShortcut = isAuthenticated && user?.role === 'ETUDIANT' && user?.inscriptionId;
  const dossierNumero = (searchParams.get('dossier') || '').trim();
  const pageBackgroundStyle = {
    '--tachpay-bg-image': `url(${process.env.PUBLIC_URL}/assets/background/bg-universites-dark-desktop.svg)`,
  };

  useEffect(() => {
    if (!studentShortcut && !dossierNumero) return;

    let active = true;
    const controller = new AbortController();

    const chargerContexte = async () => {
      setLoadingContext(true);
      setContextError('');

       try {
         const url = dossierNumero
           ? `${API_BASE}/api/tachpay/public/dossier/${encodeURIComponent(dossierNumero)}/checkout-context`
           : `${API_BASE}/api/tachpay/etudiant/checkout-context`;
         const res = await fetch(url, {
           credentials: 'include',
           signal: controller.signal,
         });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.erreur || 'Impossible de précharger vos informations de paiement.');
        }
        if (active) {
          setCheckoutContext(data);
        }
      } catch (err) {
        if (
          err.name === 'AbortError' ||
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED'
        ) return;
        if (active) {
          setContextError(err.message || 'Impossible de précharger vos informations de paiement.');
        }
      } finally {
        if (active) {
          setLoadingContext(false);
        }
      }
    };

    chargerContexte();

    return () => {
      active = false;
      controller.abort();
    };
  }, [studentShortcut, dossierNumero]);

  return (
    <div className="tachpay-page-container" style={pageBackgroundStyle}>
      <div className="tachpay-page-header">
        <button className="tachpay-back-btn" onClick={() => navigate('/')}>
          ← Retour à l'accueil
        </button>
        <img
          src="/assets/TachPay-logo.png"
          alt="TachPay"
          className="tachpay-page-logo"
          onError={(e) => {
            e.target.style.display = 'none';
            // On ajoute un texte de fallback
            const parent = e.target.parentElement;
            const fallback = document.createElement('span');
            fallback.style.fontWeight = '700';
            fallback.style.color = '#e2e8f0';
            fallback.style.fontSize = '18px';
            fallback.textContent = 'TachPay';
            parent.appendChild(fallback);
          }}
        />
      </div>
      <div className="tachpay-page-content">
        {contextError && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#fff7ed',
            color: '#9a3412',
            border: '1px solid #fdba74',
          }}>
            {contextError}
          </div>
        )}
        {loadingContext ? (
          <TachPayLoadingDialog message="Chargement de vos informations de paiement..." />
        ) : (
        <TachPayCheckout
          mode="page"
          prefill={checkoutContext?.data || {}}
          initialFrais={checkoutContext?.frais || []}
          disableSearch={studentShortcut || Boolean(dossierNumero)}
          onClose={() => navigate('/')}
        />
        )}
      </div>
    </div>
  );
}