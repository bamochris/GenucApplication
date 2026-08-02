// src/components/etudiant/ReleveCard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './ReleveCard.css';

const ReleveCard = ({ inscriptionId, anneeCourante }) => {
    const [disponibilite, setDisponibilite] = useState(null);
    const [chargement, setChargement] = useState(false);
    const [paiementEnCours, setPaiementEnCours] = useState(false);
    const [modePaiement, setModePaiement] = useState('MOBILE_MONEY');
    const [numeroTransaction, setNumeroTransaction] = useState('');
    const [operateur, setOperateur] = useState('M-PESA');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        chargerDisponibilite();
        
        // Vérifier les notifications stockées
        const notif = localStorage.getItem('releve_notification');
        if (notif) {
            setNotification(JSON.parse(notif));
            setTimeout(() => {
                localStorage.removeItem('releve_notification');
                setNotification(null);
            }, 5000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
    }, [inscriptionId, anneeCourante]);

    const chargerDisponibilite = async () => {
        try {
            const response = await api.get(
                `/api/etudiant/portal/${inscriptionId}/releve/disponibilite?annee=${anneeCourante}`
            );
            setDisponibilite(response.data);
        } catch (err) {
            console.error("Erreur chargement disponibilité:", err);
        }
    };

    const handlePayer = async () => {
        if (!numeroTransaction) {
            setNotification({ type: 'error', message: '⚠️ Veuillez entrer le numéro de transaction.' });
            return;
        }

        setPaiementEnCours(true);
        try {
            await api.post('/api/paiements/etudiant', {
                inscriptionId: inscriptionId,
                montant: disponibilite?.prix || 5,
                devise: "USD",
                type: "FRAIS_RELEVE",
                modePaiement: modePaiement,
                operateur: operateur,
                numeroTransaction: numeroTransaction,
                notesCaisse: "Paiement relevé de notes"
            });

            // Mettre à jour la disponibilité
            await chargerDisponibilite();
            
            // Afficher notification de succès
            setNotification({
                type: 'success',
                message: '✅ Paiement effectué ! Le relevé vous a été envoyé par email et est disponible au téléchargement.'
            });
            
            setPaiementEnCours(false);
            setNumeroTransaction('');
            
            // Stocker la notification pour la prochaine visite
            localStorage.setItem('releve_notification', JSON.stringify({
                type: 'success',
                message: '✅ Votre relevé de notes est disponible !'
            }));
            
        } catch (err) {
            setNotification({ type: 'error', message: '❌ Erreur lors du paiement : ' + (err.response?.data?.erreur || err.message) });
            setPaiementEnCours(false);
        }
    };

    const handleTelecharger = async () => {
        setChargement(true);
        try {
            const response = await api.get(
                `/api/etudiant/portal/${inscriptionId}/releve/telecharger?annee=${anneeCourante}`,
                { responseType: 'blob' }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `releve_notes_${anneeCourante}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (err) {
            if (err.response?.status === 400) {
                const errorText = await err.response.data.text();
                setNotification({ type: 'error', message: '❌ ' + errorText });
            } else {
                setNotification({ type: 'error', message: '❌ Erreur lors du téléchargement du relevé.' });
            }
        } finally {
            setChargement(false);
        }
    };

    const handleRenvoyerEmail = async () => {
        setChargement(true);
        try {
            await api.post(`/api/etudiant/portal/${inscriptionId}/releve/renvoyer-email?annee=${anneeCourante}`);
            setNotification({ type: 'success', message: '✅ Relevé renvoyé par email avec succès !' });
        } catch (err) {
            setNotification({ type: 'error', message: "❌ Erreur lors de l'envoi : " + (err.response?.data?.erreur || err.message) });
        } finally {
            setChargement(false);
        }
    };

    if (!disponibilite) {
        return (
            <div className="releve-card-skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-text"></div>
            </div>
        );
    }

    return (
        <div className="releve-card">
            {/* Notification */}
            {notification && (
                <div className={`notification-banner ${notification.type}`}>
                    {notification.message}
                    <button className="close" onClick={() => setNotification(null)}>×</button>
                </div>
            )}

            {/* Icône en grand format */}
            <div className={`releve-icon ${disponibilite.disponible ? 'disponible' : 'indisponible'}`}>
                {disponibilite.disponible ? '📄' : '🔒'}
            </div>

            {/* Titre */}
            <h2 className="releve-title">Relevé de notes officiel</h2>
            
            {/* Badge de disponibilité */}
            <div className="releve-status">
                {disponibilite.disponible ? (
                    <span className="badge-success">
                        ✅ Disponible
                    </span>
                ) : disponibilite.paye ? (
                    <span className="badge-warning">
                        ⏳ En traitement
                    </span>
                ) : (
                    <span className="badge-secondary">
                        🔒 Non disponible
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="releve-description">
                Téléchargez votre relevé de notes officiel au format PDF.<br/>
                Document authentique avec QR code de vérification.
            </p>

            {/* Prix si non payé */}
            {!disponibilite.paye && disponibilite.notesDisponibles && (
                <div className="releve-price">
                    <span className="price-label">Prix :</span>
                    <span className="price-value">{disponibilite.prix} {disponibilite.devise}</span>
                </div>
            )}

            {/* Message si pas de notes */}
            {!disponibilite.notesDisponibles && (
                <div className="releve-warning">
                    ⚠️ Aucune note disponible pour l'année {anneeCourante}.
                    Les relevés seront disponibles après la publication des notes par les professeurs.
                </div>
            )}

            {/* Section paiement (si non payé et notes disponibles) */}
            {!disponibilite.paye && disponibilite.notesDisponibles && (
                <div className="releve-paiement">
                    <div className="paiement-methods">
                        <select 
                            className="form-select" 
                            value={modePaiement} 
                            onChange={e => setModePaiement(e.target.value)}
                        >
                            <option value="MOBILE_MONEY">📱 Mobile Money</option>
                            <option value="CARTE_BANCAIRE">💳 Carte bancaire</option>
                            <option value="ESPECES">🏦 Espèces (à la caisse)</option>
                        </select>

                        {modePaiement === 'MOBILE_MONEY' && (
                            <select 
                                className="form-select mt-2" 
                                value={operateur} 
                                onChange={e => setOperateur(e.target.value)}
                            >
                                <option value="M-PESA">M-PESA</option>
                                <option value="ORANGE_MONEY">Orange Money</option>
                                <option value="AIRTELL_MONEY">Airtel Money</option>
                                <option value="AFRIMONEY">AfriMoney</option>
                            </select>
                        )}

                        <input 
                            type="text" 
                            className="form-control mt-2" 
                            placeholder="Numéro de transaction *"
                            value={numeroTransaction}
                            onChange={e => setNumeroTransaction(e.target.value)}
                        />

                        <button 
                            className="btn-payer w-100 mt-3" 
                            onClick={handlePayer}
                            disabled={paiementEnCours || !numeroTransaction}
                        >
                            {paiementEnCours ? 'Traitement...' : `💰 Payer ${disponibilite.prix} ${disponibilite.devise}`}
                        </button>
                    </div>
                </div>
            )}

            {/* Section téléchargement (si payé) */}
            {disponibilite.disponible && (
                <div className="releve-telechargement">
                    <button 
                        className="btn-telecharger" 
                        onClick={handleTelecharger}
                        disabled={chargement}
                    >
                        {chargement ? 'Génération...' : '📥 Télécharger le relevé (PDF)'}
                    </button>
                    
                    <button 
                        className="btn-email" 
                        onClick={handleRenvoyerEmail}
                        disabled={chargement}
                    >
                        📧 Renvoyer par email
                    </button>
                    
                    <div className="releve-info">
                        <small>
                            📌 Paiement effectué le {disponibilite.datePaiement}<br/>
                            Un email vous a été envoyé avec le PDF en pièce jointe.
                        </small>
                    </div>
                </div>
            )}

            {/* Footer informatif */}
            <div className="releve-footer">
                <small>
                    <i className="bi bi-shield-check"></i> Document officiel vérifiable par QR code
                </small>
            </div>
        </div>
    );
};

export default ReleveCard;