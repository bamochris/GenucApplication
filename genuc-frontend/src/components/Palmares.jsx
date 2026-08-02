import { useEffect, useState } from 'react';
import api from '../api/axios';
import './Palmares.css';

export default function Palmares() {
    const [laureats, setLaureats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Flag pour tracker si le composant est monté
        let isMounted = true;
        
        // AbortController pour annuler la requête si le composant est démonté
        const abortController = new AbortController();

        api.get('/api/palmares/public', { signal: abortController.signal })
            .then(res => {
                // Vérifie que le composant est toujours monté
                if (isMounted && !abortController.signal.aborted) {
                    setLaureats(res.data);
                }
            })
            .catch(err => {
                // Ignore les erreurs d'annulation (AbortError ou CanceledError d'Axios)
                if (
                  err.name !== 'AbortError' &&
                  err.name !== 'CanceledError' &&
                  err.code !== 'ERR_CANCELED' &&
                  isMounted
                ) {
                    console.error('Erreur chargement palmares :', err);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        // Cleanup : exécuté à la démo du composant
        return () => {
            isMounted = false;
            abortController.abort(); // Annule la requête en cours
        };
    }, []); // Dépendances vides = exécuté UNE FOIS au montage

    if (loading) return <div className="loading">Chargement des meilleurs étudiants...</div>;
    if (laureats.length === 0) return null;

    return (
        <div className="palmares-section">
            <div className="container">
                <h2 className="section-title">🏆 Excellence académique – Palmarès GENUC</h2>
                <p className="section-subtitle">Découvrez les étudiants les plus méritants de l'année, prêts à intégrer le marché du travail.</p>
                <div className="palmares-grid">
                    {laureats.map(etudiant => (
                        <div key={etudiant.id} className="palmares-card">
                            <div className="card-photo">
                                <img src={etudiant.photoUrl || '/assets/default-avatar.png'} alt={etudiant.nomComplet} />
                                {etudiant.rang === 1 && <div className="medaille-or">🥇</div>}
                                {etudiant.rang === 2 && <div className="medaille-argent">🥈</div>}
                                {etudiant.rang === 3 && <div className="medaille-bronze">🥉</div>}
                            </div>
                            <div className="card-content">
                                <h3>{etudiant.nomComplet}</h3>
                                <p className="filiere">{etudiant.filiereNom} – {etudiant.universiteNom}</p>
                                <p className="mention">Mention {etudiant.mention.toLowerCase().replace('_', ' ')}</p>
                                <p className="biographie">{etudiant.biographie}</p>
                                <div className="contact">
                                    <a href={`mailto:${etudiant.email}`}>📧 Contacter</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}