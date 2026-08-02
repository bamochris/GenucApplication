import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ReleveCard({ inscriptionId, anneeCourante }) {
  const [disponible, setDisponible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Vérifier la disponibilité du relevé
    api.get(`/api/etudiant/portal/${inscriptionId}/releve/disponibilite?annee=${anneeCourante}`)
      .then(res => setDisponible(res.data.disponible))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [inscriptionId, anneeCourante]);

  const telecharger = async () => {
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/releve/telecharger?annee=${anneeCourante}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `releve_notes_${anneeCourante}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage("Erreur lors du téléchargement");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="card" style={{ padding: 20, textAlign: 'center' }}>
      <h3>📄 Relevé de notes officiel</h3>
      {disponible ? (
        <>
          <p>Votre relevé est prêt à être téléchargé.</p>
          <button className="btn-primary" onClick={telecharger}>Télécharger le PDF</button>
        </>
      ) : (
        <p>Le relevé n'est pas encore disponible. Veuillez payer les frais requis.</p>
      )}
      {message && <div className="alert-erreur">{message}</div>}
    </div>
  );
}