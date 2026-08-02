// src/pages/professeur/TableauPresences.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import presenceService from '../../services/presenceService';
import '../Dashboard.css';

export default function TableauPresences() {
    const { coursId } = useParams();
    const [data, setData] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadTableau = async () => {
            if (!coursId) return;
            setLoading(true);
            try {
                const response = await presenceService.getTableau(coursId, date);
                setData(response.data);
                setError('');
            } catch (err) {
                setError('Erreur lors du chargement des présences');
            } finally {
                setLoading(false);
            }
        };
        loadTableau();
    }, [coursId, date]);

    const handleJustifier = async (presenceId) => {
        try {
            await presenceService.justifier(presenceId);
            setMessage('Absence justifiée');
            // recharger le tableau (force un nouvel appel)
            const response = await presenceService.getTableau(coursId, date);
            setData(response.data);
        } catch (err) {
            setError('Erreur lors de la justification');
        }
    };

    if (loading) return <div className="loading">Chargement...</div>;

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">📋 Tableau des présences</h1>
                <p className="page-sub">Cours ID: {coursId}</p>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label>Date :</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <button className="btn-primary" onClick={() => {
                        setDate(date); // force le rechargement (déjà fait via useEffect)
                    }}>Actualiser</button>
                </div>
            </div>
            {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
            {error && <div className="alert-erreur">{error}</div>}
            {data && (
                <>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
                        <div className="stat-card">
                            <div className="stat-value">{data.effectifTotal}</div>
                            <div className="stat-label">Inscrits</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{data.nbPresent}</div>
                            <div className="stat-label">Présents</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{data.effectifTotal - data.nbPresent}</div>
                            <div className="stat-label">Absents</div>
                        </div>
                    </div>
                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr><th>#</th><th>Étudiant</th><th>Statut</th><th>Heure d'arrivée</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {data.presences.map((p, idx) => (
                                    <tr key={p.etudiantId}>
                                        <td>{idx+1}</td>
                                        <td>{p.prenom} {p.nom}</td>
                                        <td>
                                            {p.present ? (
                                                <span className="badge badge-success">✓ Présent</span>
                                            ) : p.justifie ? (
                                                <span className="badge badge-warning">Justifié</span>
                                            ) : (
                                                <span className="badge badge-danger">Absent</span>
                                            )}
                                        </td>
                                        <td>{p.heureArrivee || '—'}</td>
                                        <td>
                                            {!p.present && !p.justifie && p.presenceId && (
                                                <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => handleJustifier(p.presenceId)}>
                                                    Justifier
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}