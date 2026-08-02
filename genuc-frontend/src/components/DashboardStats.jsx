import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

// Données de démonstration utilisées en cas d'erreur 403/404
const FALLBACK_DATA = Array.from({ length: 12 }, (_, i) => ({
  mois: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][i],
  inscriptions: [34, 48, 52, 41, 67, 73, 58, 44, 61, 79, 55, 38][i],
  paiements:    [2100, 3200, 3800, 2900, 4500, 5100, 4200, 3100, 4600, 5800, 4000, 2700][i],
}));

const getMonthName = (m) => {
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return months[m - 1];
};

export default function DashboardStats({ annee }) {
  const [inscriptionsData, setInscriptionsData] = useState([]);
  const [paiementsData, setPaiementsData] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Flag pour tracker si le composant est monté
    let isMounted = true;
    
    // AbortController pour annuler les requêtes si le composant est démonté
    const abortController = new AbortController();

    const loadStats = async () => {
      setLoading(true);
      setErreur(null);
      try {
        const [insRes, paiRes] = await Promise.all([
          api.get(`/api/stats/inscriptions-par-mois/${annee}`, { signal: abortController.signal }),
          api.get(`/api/stats/paiements-par-mois/${annee}`, { signal: abortController.signal })
        ]);

        // Vérifie que le composant est toujours monté
        if (isMounted && !abortController.signal.aborted) {
          const insc = Object.entries(insRes.data).map(([mois, count]) => ({
            mois: getMonthName(parseInt(mois)),
            inscriptions: count
          }));
          const pai = Object.entries(paiRes.data).map(([mois, total]) => ({
            mois: getMonthName(parseInt(mois)),
            paiements: total
          }));
          setInscriptionsData(insc);
          setPaiementsData(pai);
        }
      } catch (err) {
        // Ignore les erreurs d'annulation (AbortError ou CanceledError d'Axios)
        if (
          err.name === 'AbortError' ||
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }

        if (isMounted) {
          const status = err?.response?.status;
          if (status === 403) {
            setErreur("Accès refusé aux statistiques (403) — données de démonstration affichées.");
          } else if (status === 404) {
            setErreur("Endpoint statistiques introuvable (404) — données de démonstration affichées.");
          } else {
            setErreur("Impossible de charger les statistiques — données de démonstration affichées.");
          }
          setInscriptionsData(FALLBACK_DATA);
          setPaiementsData(FALLBACK_DATA);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    // Cleanup : exécuté à la démo du composant
    return () => {
      isMounted = false;
      abortController.abort(); // Annule les requêtes en cours
    };
  }, [annee]); // Re-déclenche quand l'année change

  if (loading) return <div className="loading">Chargement des statistiques...</div>;

  return (
    <div>
      {erreur && (
        <div className="alert-erreur" style={{ marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {erreur}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">📈 Inscriptions mensuelles</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inscriptionsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="inscriptions" fill="#185FA5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="card-title">💰 Paiements mensuels (USD)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paiementsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="paiements" stroke="#1D9E75" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}