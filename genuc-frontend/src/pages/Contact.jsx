// src/pages/Contact.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaPhone, FaClock, FaPaperPlane } from 'react-icons/fa';
import FormField from '../components/FormField';
import './Dashboard.css';

const CONTACT_EMAIL = 'support@genuc.cd';

const CHAMPS_VIDES = { nom: '', email: '', sujet: '', message: '' };

function valider(champs) {
  const erreurs = {};
  if (!champs.nom.trim()) erreurs.nom = 'Le nom est requis.';
  if (!champs.email.trim()) erreurs.email = "L'email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champs.email)) erreurs.email = 'Format d\'email invalide.';
  if (!champs.sujet.trim()) erreurs.sujet = 'Le sujet est requis.';
  if (!champs.message.trim()) erreurs.message = 'Le message est requis.';
  else if (champs.message.trim().length < 10) erreurs.message = 'Le message doit contenir au moins 10 caractères.';
  return erreurs;
}

export default function Contact() {
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [touched, setTouched] = useState({});
  const [erreurs, setErreurs] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChamps((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErreurs(valider({ ...champs }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const erreursTrouvees = valider(champs);
    setErreurs(erreursTrouvees);
    setTouched({ nom: true, email: true, sujet: true, message: true });

    if (Object.keys(erreursTrouvees).length > 0) {
      toast.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const corps = `${champs.message}\n\n— Envoyé par ${champs.nom} (${champs.email})`;
    const lien = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(champs.sujet)}&body=${encodeURIComponent(corps)}`;
    window.location.href = lien;
    toast.success('Votre messagerie va s\'ouvrir pour envoyer le message.');
    setChamps(CHAMPS_VIDES);
    setTouched({});
    setErreurs({});
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📞 Contact & Support</h1>
        <p className="page-sub">Une question ? Une demande ? Contactez-nous</p>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h2 className="card-title">Envoyer un message</h2>
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Nom complet"
              name="nom"
              value={champs.nom}
              onChange={handleChange}
              onBlur={handleBlur}
              error={erreurs.nom}
              touched={touched.nom}
              placeholder="Votre nom"
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={champs.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={erreurs.email}
              touched={touched.email}
              placeholder="vous@exemple.com"
              required
            />
            <FormField
              label="Sujet"
              name="sujet"
              value={champs.sujet}
              onChange={handleChange}
              onBlur={handleBlur}
              error={erreurs.sujet}
              touched={touched.sujet}
              placeholder="Objet de votre demande"
              required
            />
            <FormField
              label="Message"
              name="message"
              type="textarea"
              value={champs.message}
              onChange={handleChange}
              onBlur={handleBlur}
              error={erreurs.message}
              touched={touched.message}
              placeholder="Décrivez votre demande..."
              required
            />
            <button type="submit" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FaPaperPlane /> Envoyer
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">Nos coordonnées</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaEnvelope color="#185FA5" />
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaPhone color="#1D9E75" />
              <span>Disponible via le formulaire ci-contre</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaClock color="#856404" />
              <span>Lundi - Vendredi, 8h00 - 17h00</span>
            </div>
          </div>
        </div>
      </div>

      <Link to="/" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 16 }}>
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
