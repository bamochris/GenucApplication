// src/pages/superadmin/EnregistrementUniversite.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './EnregistrementUniversite.css';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // ← AJOUT
import useDraggableDialog from '../../hooks/useDraggableDialog';

// ─── Import des icônes ──────────────────────────────────────
import {
  FaUniversity, FaGavel,
  FaBook, FaIdCard, FaUserTie,
  FaCheckCircle, FaArrowLeft, FaArrowRight, FaSave, FaTimes,
  FaCog, FaFilePdf, FaImage, FaTrash,
  FaSitemap, FaGraduationCap, FaFolderOpen, FaFolder, FaPlus
} from 'react-icons/fa';

// ─── Constantes ──────────────────────────────────────────────
const TYPES_ETABLISSEMENT = ['Université publique', 'Université privée', 'Institut supérieur'];
const STATUTS = ['En activité', 'Suspendue', 'En évaluation'];
const PROVINCES = [
  'Kinshasa', 'Kongo Central', 'Kwango', 'Kwilu', 'Mai-Ndombe',
  'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru',
  'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uele',
  'Tshopo', 'Bas-Uele', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi',
  'Équateur', 'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'
];
const SYSTEMES = ['LMD', 'Ancien système', 'Mixte'];
const DEVISES = ['USD', 'CDF', 'USD/CDF'];

// ─── Niveaux d'études pour les promotions ────────────────────
const NIVEAUX_PROMOTION = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'];

// ─── Vacations (contexte RDC : cours de jour et/ou du soir) ──
// Chaque promotion (L1, L2, …) est organisée en vacation de jour,
// du soir, ou les deux (ex. L1 → Jour, L2 → Jour et Soir).
const VACATION_OPTIONS = [
  { key: 'JOUR', label: 'Jour', vacations: ['JOUR'] },
  { key: 'SOIR', label: 'Soir', vacations: ['SOIR'] },
  { key: 'JOUR_SOIR', label: 'Jour et Soir', vacations: ['JOUR', 'SOIR'] },
];

const vacationsVersCle = (vacations) => {
  const v = vacations || [];
  if (v.includes('JOUR') && v.includes('SOIR')) return 'JOUR_SOIR';
  if (v.includes('SOIR')) return 'SOIR';
  return 'JOUR';
};

const cleVersVacations = (cle) =>
  (VACATION_OPTIONS.find((o) => o.key === cle) || VACATION_OPTIONS[0]).vacations;

// Anciens brouillons (localStorage) : promotions = ['L1', 'L2'] → objets { niveau, vacations }
const normaliserPromotions = (promotions) => {
  const resultat = {};
  Object.entries(promotions || {}).forEach(([option, promos]) => {
    resultat[option] = (promos || []).map((p) =>
      typeof p === 'string'
        ? { niveau: p, vacations: ['JOUR'] }
        : { niveau: p.niveau, vacations: p.vacations?.length ? p.vacations : ['JOUR'] }
    );
  });
  return resultat;
};

// ─── Données géographiques ──────────────────────────────────
const PROVINCES_VILLES = {
  'Kinshasa': ['Kinshasa'],
  'Kongo Central': ['Matadi', 'Boma', 'Muanda', 'Mbanza-Ngungu', 'Tshela', 'Seke-Banza', 'Kimpese', 'Luozi'],
  'Kwango': ['Kenge', 'Popokabaka', 'Feshi', 'Kahemba', 'Kisandji'],
  'Kwilu': ['Bandundu', 'Kikwit', 'Bulungu', 'Masi-Manimba', 'Bagata', 'Idiofa', 'Gungu'],
  'Mai-Ndombe': ['Inongo', 'Nioki', 'Oshwe', 'Kiri', 'Bolobo', 'Kutu', 'Mushie'],
  'Kasaï': ['Tshikapa', 'Luebo', 'Demba', 'Mweka', 'Kazumba', 'Dekese', 'Ilebo'],
  'Kasaï-Central': ['Kananga', 'Tshilenge', 'Demba', 'Luluabourg', 'Mwene-Ditu', 'Dimbelenge'],
  'Kasaï-Oriental': ['Mbuji-Mayi', 'Miabi', 'Katanda', 'Lupatapata', 'Tshilenge', 'Lubao'],
  'Lomami': ['Kabinda', 'Mwene-Ditu', 'Lubao', 'Kamiji', 'Lodja', 'Kole'],
  'Sankuru': ['Lusambo', 'Lodja', 'Dibaya-Lubwe', 'Katako-Kombe', 'Kole', 'Pangi'],
  'Maniema': ['Kindu', 'Kasongo', 'Pangi', 'Kabambare', 'Kibombo', 'Punia', 'Lubutu'],
  'Sud-Kivu': ['Bukavu', 'Uvira', 'Baraka', 'Fizi', 'Mwenga', 'Walungu', 'Kabare', 'Kalehe', 'Idjwi'],
  'Nord-Kivu': ['Goma', 'Beni', 'Butembo', 'Lubero', 'Rutshuru', 'Nyiragongo', 'Masisi', 'Walikale'],
  'Ituri': ['Bunia', 'Aru', 'Mahagi', 'Djugu', 'Irumu', 'Mambasa'],
  'Haut-Uele': ['Isiro', 'Watsa', 'Rungu', 'Dungu', 'Faradje', 'Niangara'],
  'Tshopo': ['Kisangani', 'Yangambi', 'Bafwasende', 'Banalia', 'Basoko', 'Isangi', 'Opala'],
  'Bas-Uele': ['Buta', 'Aketi', 'Ango', 'Bondo', 'Poko', 'Gamba'],
  'Nord-Ubangi': ['Gbadolite', 'Zongo', 'Bosobolo', 'Businga', 'Mobayi-Mbongo'],
  'Mongala': ['Lisala', 'Bumba', 'Bongandanga', 'Yahuma', 'Bokungu'],
  'Sud-Ubangi': ['Gemena', 'Kungu', 'Budjala', 'Bominenge', 'Libenge'],
  'Équateur': ['Mbandaka', 'Bikoro', 'Bolomba', 'Basankusu', 'Lukolela', 'Makanza', 'Ingende'],
  'Tshuapa': ['Boende', 'Ikela', 'Djolu', 'Befale', 'Bolomba'],
  'Tanganyika': ['Kalemie', 'Moba', 'Nyunzu', 'Mpala', 'Kongolo', 'Kabalo', 'Manono'],
  'Haut-Lomami': ['Kamina', 'Bukama', 'Malemba-Nkulu', 'Lubudi', 'Mukanga'],
  'Lualaba': ['Kolwezi', 'Lubudi', 'Mutshatsha', 'Sandoa', 'Dilolo'],
  'Haut-Katanga': ['Lubumbashi', 'Likasi', 'Kipushi', 'Sakania', 'Mokambo', 'Kambove', 'Kakanda']
};

const PROVINCES_COMMUNES = {
  'Kinshasa': [
    'Gombe', 'Lingwala', 'Kinshasa', 'Kasa-Vubu', 'Bandalungwa',
    'Bumbu', 'Kalamu', 'Kintambo', 'Lemba', 'Limete', 'Matete',
    'Ngaliema', 'Selembao', 'Mont Ngafula', 'Ndjili', 'Kimbanseke',
    'Makala', 'Maluku', 'Nsele', 'Barumbu'
  ],
  'Kongo Central': ['Matadi', 'Boma', 'Muanda', 'Mbanza-Ngungu', 'Tshela', 'Seke-Banza', 'Kimpese', 'Luozi', 'Songololo', 'Kwilu-Ngongo'],
  'Kwango': ['Kenge', 'Popokabaka', 'Feshi', 'Kahemba', 'Kisandji'],
  'Kwilu': ['Bandundu', 'Kikwit', 'Bulungu', 'Masi-Manimba', 'Bagata', 'Idiofa', 'Gungu'],
  'Mai-Ndombe': ['Inongo', 'Nioki', 'Oshwe', 'Kiri', 'Bolobo', 'Kutu', 'Mushie'],
  'Kasaï': ['Tshikapa', 'Luebo', 'Demba', 'Mweka', 'Kazumba', 'Dekese', 'Ilebo'],
  'Kasaï-Central': ['Kananga', 'Tshilenge', 'Demba', 'Luluabourg', 'Mwene-Ditu', 'Dimbelenge'],
  'Kasaï-Oriental': ['Mbuji-Mayi', 'Miabi', 'Katanda', 'Lupatapata', 'Tshilenge', 'Lubao'],
  'Lomami': ['Kabinda', 'Mwene-Ditu', 'Lubao', 'Kamiji', 'Lodja', 'Kole'],
  'Sankuru': ['Lusambo', 'Lodja', 'Dibaya-Lubwe', 'Katako-Kombe', 'Kole', 'Pangi'],
  'Maniema': ['Kindu', 'Kasongo', 'Pangi', 'Kabambare', 'Kibombo', 'Punia', 'Lubutu'],
  'Sud-Kivu': ['Bukavu', 'Uvira', 'Baraka', 'Fizi', 'Mwenga', 'Walungu', 'Kabare', 'Kalehe', 'Idjwi'],
  'Nord-Kivu': ['Goma', 'Beni', 'Butembo', 'Lubero', 'Rutshuru', 'Nyiragongo', 'Masisi', 'Walikale'],
  'Ituri': ['Bunia', 'Aru', 'Mahagi', 'Djugu', 'Irumu', 'Mambasa'],
  'Haut-Uele': ['Isiro', 'Watsa', 'Rungu', 'Dungu', 'Faradje', 'Niangara'],
  'Tshopo': ['Kisangani', 'Yangambi', 'Bafwasende', 'Banalia', 'Basoko', 'Isangi', 'Opala'],
  'Bas-Uele': ['Buta', 'Aketi', 'Ango', 'Bondo', 'Poko', 'Gamba'],
  'Nord-Ubangi': ['Gbadolite', 'Zongo', 'Bosobolo', 'Businga', 'Mobayi-Mbongo'],
  'Mongala': ['Lisala', 'Bumba', 'Bongandanga', 'Yahuma', 'Bokungu'],
  'Sud-Ubangi': ['Gemena', 'Kungu', 'Budjala', 'Bominenge', 'Libenge'],
  'Équateur': ['Mbandaka', 'Bikoro', 'Bolomba', 'Basankusu', 'Lukolela', 'Makanza', 'Ingende'],
  'Tshuapa': ['Boende', 'Ikela', 'Djolu', 'Befale', 'Bolomba'],
  'Tanganyika': ['Kalemie', 'Moba', 'Nyunzu', 'Mpala', 'Kongolo', 'Kabalo', 'Manono'],
  'Haut-Lomami': ['Kamina', 'Bukama', 'Malemba-Nkulu', 'Lubudi', 'Mukanga'],
  'Lualaba': ['Kolwezi', 'Lubudi', 'Mutshatsha', 'Sandoa', 'Dilolo'],
  'Haut-Katanga': ['Lubumbashi', 'Likasi', 'Kipushi', 'Sakania', 'Mokambo', 'Kambove', 'Kakanda']
};

// ─── Étapes ──────────────────────────────────────────────────
const ETAPES = [
  { id: 'etape1', label: '1. Création du compte' },
  { id: 'etape2', label: '2. Informations légales' },
  { id: 'etape3', label: '3. Autorité principale' },
  { id: 'etape4', label: '4. Paramètres académiques' },
  { id: 'etape5', label: '5. Facultés & Départements' },
  { id: 'etape6', label: '6. Options & Promotions' },
  { id: 'etape7', label: '7. Paramétrage des cartes' },
  { id: 'etape8', label: '8. Paramétrage du personnel' },
  { id: 'etape9', label: '9. Activation des modules' },
  { id: 'etape10', label: '10. Validation finale' }
];

const EnregistrementUniversite = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth(); // ← AJOUT
  const [etapeCourante, setEtapeCourante] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [resetModal, setResetModal] = useState(false);
  const [annulerModal, setAnnulerModal] = useState(false);
  const resetDrag = useDraggableDialog();
  const annulerDrag = useDraggableDialog();

  // ─── État global ───────────────────────────────────────────
  const [universite, setUniversite] = useState({
    nom: '', sigle: '', type: '', province: '', ville: '', commune: '',
    zone: '', adresse: '', codePostal: '', telephone: '', telephoneFixe: '',
    email: '', siteWeb: '', anneeFondation: '', latitude: '', longitude: '',
    logo: null, devise: '',
    agrementNumero: '', arreteMinisteriel: '', dateAutorisation: '', statut: '',
    documents: { agrement: null, arrete: null, statuts: null },
    recteur: { nom: '', prenom: '', email: '', telephone: '' },
    systeme: '', anneeAcademique: '', semestres: 2, sessions: 2,
    notation: 'Sur 20', deliberation: true,
    facultes: [],
    departements: {},
    options: {},
    promotions: {},
    carteEtudiant: true, carteEnseignant: true, cartePersonnel: true,
    qrCode: true, matriculeAuto: true,
    categories: ['Enseignant', 'Assistant', 'Chef de travaux', 'Professeur', 'Administratif', 'Ouvrier'],
    modules: {
      admissions: true, inscriptions: true, controleAcademique: true,
      deliberation: true, bulletins: true, releves: true, diplomation: true,
      rh: true, caisse: true, comptabilite: true, bibliotheque: true,
      elearning: true, stages: true, assuranceQualite: true
    }
  });

  // ─── États locaux ────────────────────────────────────────────
  const [villeAutre, setVilleAutre] = useState(false);
  const [communeAutre, setCommuneAutre] = useState(false);
  const [nouvelleFaculte, setNouvelleFaculte] = useState('');
  const [nouveauDept, setNouveauDept] = useState({});
  const [nouvelleOption, setNouvelleOption] = useState({});
  const [nouvellePromo, setNouvellePromo] = useState({});
  const [nouvelleVacation, setNouvelleVacation] = useState({}); // clé = option → 'JOUR' | 'SOIR' | 'JOUR_SOIR'

  // ─── Sauvegarde automatique ──────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('enregistrementUniversite');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUniversite(prev => ({
          ...prev,
          ...parsed,
          promotions: normaliserPromotions(parsed.promotions),
          logo: prev.logo,
          documents: prev.documents
        }));
      } catch (e) {
        console.warn('Impossible de restaurer le brouillon d\'enregistrement:', e);
        toast.error('Impossible de restaurer le brouillon enregistré');
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = { ...universite };
    delete dataToSave.logo;
    delete dataToSave.documents;
    localStorage.setItem('enregistrementUniversite', JSON.stringify(dataToSave));
  }, [universite]);

  // ─── Gestionnaires ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setUniversite(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setUniversite(prev => ({ ...prev, [name]: checked }));
    } else {
      setUniversite(prev => {
        const updates = { [name]: value };
        if (name === 'province') {
          updates.ville = '';
          updates.commune = '';
          setVilleAutre(false);
          setCommuneAutre(false);
        }
        return { ...prev, ...updates };
      });
    }
  };

  const handleVilleChange = (e) => {
    const value = e.target.value;
    if (value === '__AUTRE__') {
      setVilleAutre(true);
      setUniversite(prev => ({ ...prev, ville: '' }));
    } else {
      setVilleAutre(false);
      setUniversite(prev => ({ ...prev, ville: value }));
    }
  };

  const handleCommuneChange = (e) => {
    const value = e.target.value;
    if (value === '__AUTRE__') {
      setCommuneAutre(true);
      setUniversite(prev => ({ ...prev, commune: '' }));
    } else {
      setCommuneAutre(false);
      setUniversite(prev => ({ ...prev, commune: value }));
    }
  };

  const handleAutoriteChange = (role, e) => {
    const { name, value } = e.target;
    setUniversite(prev => ({
      ...prev,
      [role]: { ...prev[role], [name]: value }
    }));
  };

  const handleModuleToggle = (module) => {
    setUniversite(prev => ({
      ...prev,
      modules: { ...prev.modules, [module]: !prev.modules[module] }
    }));
  };

  const handleFileChange = (field, file) => {
    if (field === 'logo') {
      setUniversite(prev => ({ ...prev, logo: file }));
    } else if (field.startsWith('documents.')) {
      const docKey = field.split('.')[1];
      setUniversite(prev => ({
        ...prev,
        documents: { ...prev.documents, [docKey]: file }
      }));
    }
  };

  const handleRemoveFile = (field) => {
    if (field === 'logo') {
      setUniversite(prev => ({ ...prev, logo: null }));
    } else if (field.startsWith('documents.')) {
      const docKey = field.split('.')[1];
      setUniversite(prev => ({
        ...prev,
        documents: { ...prev.documents, [docKey]: null }
      }));
    }
  };

  // ─── Gestion de la structure ──────────────────────────────
  const ajouterFaculte = () => {
    if (nouvelleFaculte.trim() && !universite.facultes.includes(nouvelleFaculte.trim())) {
      setUniversite(prev => ({
        ...prev,
        facultes: [...prev.facultes, nouvelleFaculte.trim()],
        departements: { ...prev.departements, [nouvelleFaculte.trim()]: [] }
      }));
      setNouvelleFaculte('');
    }
  };

  const supprimerFaculte = (faculte) => {
    const newFacultes = universite.facultes.filter(f => f !== faculte);
    const newDepartements = { ...universite.departements };
    delete newDepartements[faculte];
    setUniversite(prev => ({
      ...prev,
      facultes: newFacultes,
      departements: newDepartements
    }));
  };

  const ajouterDepartement = (faculte) => {
    const inputValue = nouveauDept[faculte] || '';
    if (inputValue.trim()) {
      setUniversite(prev => ({
        ...prev,
        departements: {
          ...prev.departements,
          [faculte]: [...(prev.departements[faculte] || []), inputValue.trim()]
        }
      }));
      setNouveauDept(prev => ({ ...prev, [faculte]: '' }));
    }
  };

  const supprimerDepartement = (faculte, dept) => {
    setUniversite(prev => ({
      ...prev,
      departements: {
        ...prev.departements,
        [faculte]: prev.departements[faculte].filter(d => d !== dept)
      }
    }));
  };

  const ajouterOption = (departement) => {
    const inputValue = nouvelleOption[departement] || '';
    if (inputValue.trim()) {
      setUniversite(prev => ({
        ...prev,
        options: {
          ...prev.options,
          [departement]: [...(prev.options[departement] || []), inputValue.trim()]
        }
      }));
      setNouvelleOption(prev => ({ ...prev, [departement]: '' }));
    }
  };

  const supprimerOption = (departement, option) => {
    setUniversite(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [departement]: prev.options[departement].filter(o => o !== option)
      }
    }));
  };

  // ─── Gestion des promotions (niveau + vacation) ────────────
  const ajouterPromotion = (option, niveau) => {
    const niv = niveau.trim();
    const existantes = universite.promotions[option] || [];
    if (niv && !existantes.some(p => p.niveau === niv)) {
      const vacations = cleVersVacations(nouvelleVacation[option]);
      setUniversite(prev => ({
        ...prev,
        promotions: {
          ...prev.promotions,
          [option]: [...(prev.promotions[option] || []), { niveau: niv, vacations }]
        }
      }));
      setNouvellePromo(prev => ({ ...prev, [option]: '' }));
    }
  };

  const supprimerPromotion = (option, niveau) => {
    setUniversite(prev => ({
      ...prev,
      promotions: {
        ...prev.promotions,
        [option]: prev.promotions[option].filter(p => p.niveau !== niveau)
      }
    }));
  };

  const changerVacationPromotion = (option, niveau, cle) => {
    setUniversite(prev => ({
      ...prev,
      promotions: {
        ...prev.promotions,
        [option]: prev.promotions[option].map(p =>
          p.niveau === niveau ? { ...p, vacations: cleVersVacations(cle) } : p
        )
      }
    }));
  };

  // ─── Réinitialisation ──────────────────────────────────────
  const handleReset = () => setResetModal(true);

  const confirmerReset = () => {
    setResetModal(false);
    localStorage.removeItem('enregistrementUniversite');
    setUniversite(prev => ({
      ...prev,
      facultes: [],
      departements: {},
      options: {},
      promotions: {}
    }));
    setNouvelleFaculte('');
    setNouveauDept({});
    setNouvelleOption({});
    setNouvellePromo({});
    setNouvelleVacation({});
    setMessage('Données réinitialisées avec succès.');
  };

  const confirmerAnnuler = () => {
    setAnnulerModal(false);
    localStorage.removeItem('enregistrementUniversite');
    navigate('/superadmin/dashboard');
  };

  // ─── Navigation ────────────────────────────────────────────
  const nextStep = () => {
    if (etapeCourante < ETAPES.length - 1) {
      setEtapeCourante(etapeCourante + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (etapeCourante > 0) {
      setEtapeCourante(etapeCourante - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── Soumission finale ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setMessage('');

    // ✅ Vérification du rôle SUPER_ADMIN
    if (!hasRole('SUPER_ADMIN')) {
      setErreur('❌ Accès refusé. Vous devez être SUPER_ADMIN pour enregistrer une université.');
      return;
    }

    const totalDepts = Object.values(universite.departements).flat().length;
    const totalOptions = Object.values(universite.options).flat().length;
    const totalPromos = Object.values(universite.promotions).flat().length;

    if (universite.facultes.length === 0) {
      setErreur('Veuillez créer au moins une faculté (Étape 5).');
      setEtapeCourante(4);
      return;
    }
    if (totalDepts === 0) {
      setErreur('Veuillez créer au moins un département (Étape 5).');
      setEtapeCourante(4);
      return;
    }
    if (totalOptions === 0) {
      setErreur('Veuillez créer au moins une option (Étape 6).');
      setEtapeCourante(5);
      return;
    }
    if (totalPromos === 0) {
      setErreur('Veuillez créer au moins une promotion (Étape 6).');
      setEtapeCourante(5);
      return;
    }
    if (!universite.recteur.email) {
      setErreur('Veuillez renseigner l\'email du Recteur (Étape 3).');
      setEtapeCourante(2);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('universite', new Blob([JSON.stringify(universite)], { type: 'application/json' }));
      if (universite.logo) formData.append('logo', universite.logo);
      if (universite.documents?.agrement) formData.append('agrement', universite.documents.agrement);
      if (universite.documents?.arrete) formData.append('arrete', universite.documents.arrete);
      if (universite.documents?.statuts) formData.append('statuts', universite.documents.statuts);

      await api.post('/api/super-admin/universites/etapes', formData, {
        timeout: 60000,
        // Pas de Content-Type manuel (Axios le gère avec FormData)
      });

      setMessage('✅ Université enregistrée avec succès !');
      localStorage.removeItem('enregistrementUniversite');
      setTimeout(() => navigate('/superadmin/dashboard'), 1500);
    } catch (err) {
      console.error('❌ Erreur lors de l\'enregistrement:', err);
      // L'intercepteur d'Axios rejette une ApiError, qui porte `status` à la
      // racine ; `response` n'est reconstitué que lorsque le serveur a
      // vraiment répondu. On lit donc les deux, dans cet ordre.
      const statut = err.status ?? err.response?.status;
      if (statut === 403) {
        setErreur('❌ Accès refusé (403). Vérifiez que vous êtes connecté en tant que SUPER_ADMIN.');
      } else if (statut === 401) {
        setErreur('❌ Authentification requise. Veuillez vous reconnecter.');
      } else if (statut === 413) {
        setErreur('❌ Les pièces jointes sont trop volumineuses (10 Mo maximum au total, logo et PDF compris). Compressez-les puis réessayez.');
      } else if (!statut) {
        // Ni statut ni réponse : la requête n'a jamais abouti. Le plus
        // souvent un envoi coupé en cours de route — d'où le rappel sur la
        // taille des pièces, principale cause observée.
        setErreur('❌ L\'envoi n\'a pas abouti. Vérifiez votre connexion, et que les pièces jointes ne dépassent pas 10 Mo au total.');
      } else {
        const msg = err.response?.data?.message || err.response?.data?.erreur || err.message;
        setErreur('❌ Erreur : ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Rendu des étapes ──────────────────────────────────────
  const renderEtape = () => {
    switch (etapeCourante) {
      case 0: return renderEtape1();
      case 1: return renderEtape2();
      case 2: return renderEtape3();
      case 3: return renderEtape4();
      case 4: return renderEtape5();
      case 5: return renderEtape6();
      case 6: return renderEtape7();
      case 7: return renderEtape8();
      case 8: return renderEtape9();
      case 9: return renderEtape10();
      default: return null;
    }
  };

  // ─── Étape 1 ──────────────────────────────────────────────
  const renderEtape1 = () => {
    const villes = PROVINCES_VILLES[universite.province] || [];
    const communes = PROVINCES_COMMUNES[universite.province] || [];

    return (
      <div className="section">
        <h3><FaUniversity /> Étape 1 : Création du compte Université</h3>
        <div className="champs">
          <Input label="Nom officiel *" name="nom" value={universite.nom} onChange={handleChange} required />
          <Input label="Sigle *" name="sigle" value={universite.sigle} onChange={handleChange} required />
          <Select label="Type *" name="type" value={universite.type} options={TYPES_ETABLISSEMENT} onChange={handleChange} required />
          <Input label="Année de fondation" name="anneeFondation" type="number" value={universite.anneeFondation} onChange={handleChange} placeholder="ex: 1985" />
          <Select label="Province *" name="province" value={universite.province} options={PROVINCES} onChange={handleChange} required />

          <div className="champ">
            <label>Ville *</label>
            {villes.length > 0 ? (
              <>
                <select value={villeAutre ? '__AUTRE__' : universite.ville} onChange={handleVilleChange} required>
                  <option value="">-- Sélectionner --</option>
                  {villes.map((ville) => (
                    <option key={ville} value={ville}>{ville}</option>
                  ))}
                  <option value="__AUTRE__">Autre (saisir manuellement)</option>
                </select>
                {villeAutre && (
                  <input
                    type="text"
                    value={universite.ville}
                    onChange={(e) => setUniversite(prev => ({ ...prev, ville: e.target.value }))}
                    placeholder="Saisissez le nom de la ville"
                    required
                    style={{ marginTop: '6px' }}
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                name="ville"
                value={universite.ville}
                onChange={handleChange}
                required
              />
            )}
          </div>

          <div className="champ">
            <label>Commune {communes.length > 0 ? '*' : ''}</label>
            {communes.length > 0 ? (
              <>
                <select value={communeAutre ? '__AUTRE__' : universite.commune} onChange={handleCommuneChange} required={communes.length > 0}>
                  <option value="">-- Sélectionner --</option>
                  {communes.map((commune) => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                  <option value="__AUTRE__">Autre (saisir manuellement)</option>
                </select>
                {communeAutre && (
                  <input
                    type="text"
                    value={universite.commune}
                    onChange={(e) => setUniversite(prev => ({ ...prev, commune: e.target.value }))}
                    placeholder="Saisissez le nom de la commune"
                    required
                    style={{ marginTop: '6px' }}
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                name="commune"
                value={universite.commune}
                onChange={handleChange}
                placeholder="Commune (facultatif)"
              />
            )}
          </div>

          <Input label="Zone / Quartier" name="zone" value={universite.zone} onChange={handleChange} />
          <Input label="Adresse physique *" name="adresse" value={universite.adresse} onChange={handleChange} required />
          <Input label="Code postal" name="codePostal" value={universite.codePostal} onChange={handleChange} />
          <Input label="Téléphone mobile *" name="telephone" value={universite.telephone} onChange={handleChange} required />
          <Input label="Téléphone fixe" name="telephoneFixe" value={universite.telephoneFixe} onChange={handleChange} />
          <Input label="Email officiel *" name="email" type="email" value={universite.email} onChange={handleChange} required />
          <Input label="Site web" name="siteWeb" value={universite.siteWeb} onChange={handleChange} />
          <Input label="Latitude" name="latitude" value={universite.latitude} onChange={handleChange} placeholder="ex: -4.3219" />
          <Input label="Longitude" name="longitude" value={universite.longitude} onChange={handleChange} placeholder="ex: 15.3129" />
          
          <div className="champ" style={{ gridColumn: '1 / span 2' }}>
            <FileUpload
              label="Logo *"
              file={universite.logo}
              onChange={(file) => handleFileChange('logo', file)}
              onRemove={() => handleRemoveFile('logo')}
              accept="image/*"
              preview={true}
              required
            />
          </div>

          <Select label="Devise *" name="devise" value={universite.devise} options={DEVISES} onChange={handleChange} required />
        </div>
      </div>
    );
  };

  // ─── Étape 2 ──────────────────────────────────────────────
  const renderEtape2 = () => (
    <div className="section">
      <h3><FaGavel /> Étape 2 : Informations légales</h3>
      <div className="champs">
        <Input label="Numéro d'agrément ESU" name="agrementNumero" value={universite.agrementNumero} onChange={handleChange} />
        <Input label="Référence arrêté ministériel" name="arreteMinisteriel" value={universite.arreteMinisteriel} onChange={handleChange} />
        <Input label="Date d'autorisation" name="dateAutorisation" type="date" value={universite.dateAutorisation} onChange={handleChange} />
        <Select label="Statut *" name="statut" value={universite.statut} options={STATUTS} onChange={handleChange} required />
        <div style={{ gridColumn: '1 / span 2' }}>
          <label>Documents PDF</label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            <FileUpload
              label="Agrément"
              file={universite.documents.agrement}
              onChange={(file) => handleFileChange('documents.agrement', file)}
              onRemove={() => handleRemoveFile('documents.agrement')}
              accept=".pdf"
              preview={false}
            />
            <FileUpload
              label="Arrêté ministériel"
              file={universite.documents.arrete}
              onChange={(file) => handleFileChange('documents.arrete', file)}
              onRemove={() => handleRemoveFile('documents.arrete')}
              accept=".pdf"
              preview={false}
            />
            <FileUpload
              label="Statuts"
              file={universite.documents.statuts}
              onChange={(file) => handleFileChange('documents.statuts', file)}
              onRemove={() => handleRemoveFile('documents.statuts')}
              accept=".pdf"
              preview={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Étape 3 ──────────────────────────────────────────────
  const renderEtape3 = () => (
    <div className="section">
      <h3><FaUserTie /> Étape 3 : Autorité principale</h3>
      <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
        Seul le <strong>Recteur</strong> est requis à la création. Les autres postes pourront être ajoutés ultérieurement.
      </p>
      <div className="autorite-block">
        <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: 8 }}>Recteur *</h4>
        <div className="autorite-grid">
          <Input label="Nom" name="nom" value={universite.recteur.nom} onChange={(e) => handleAutoriteChange('recteur', e)} />
          <Input label="Prénom" name="prenom" value={universite.recteur.prenom} onChange={(e) => handleAutoriteChange('recteur', e)} />
          <Input label="Email" name="email" type="email" value={universite.recteur.email} onChange={(e) => handleAutoriteChange('recteur', e)} required />
          <Input label="Téléphone" name="telephone" value={universite.recteur.telephone} onChange={(e) => handleAutoriteChange('recteur', e)} />
        </div>
      </div>
    </div>
  );

  // ─── Étape 4 ──────────────────────────────────────────────
  const renderEtape4 = () => (
    <div className="section">
      <h3><FaBook /> Étape 4 : Paramètres académiques</h3>
      <div className="champs">
        <Select label="Système *" name="systeme" value={universite.systeme} options={SYSTEMES} onChange={handleChange} required />
        <Input label="Année académique *" name="anneeAcademique" value={universite.anneeAcademique} onChange={handleChange} placeholder="2025-2026" required />
        <Input label="Nombre de semestres" name="semestres" type="number" value={universite.semestres} onChange={handleChange} min={1} max={4} />
        <Input label="Nombre de sessions" name="sessions" type="number" value={universite.sessions} onChange={handleChange} min={1} max={4} />
        <Select label="Système de notation" name="notation" value={universite.notation} options={['Sur 20', 'Sur 100']} onChange={handleChange} />
        <Checkbox label="Activer la délibération" name="deliberation" checked={universite.deliberation} onChange={handleChange} />
      </div>
    </div>
  );

  // ─── Étape 5 : Facultés & Départements ────────────────────
  const renderEtape5 = () => (
    <div className="section">
      <h3><FaSitemap /> Étape 5 : Facultés & Départements</h3>
      
      <div className="tree-control" style={{ marginBottom: 20 }}>
        <div className="tag-input" style={{ maxWidth: 500 }}>
          <input
            value={nouvelleFaculte}
            onChange={(e) => setNouvelleFaculte(e.target.value)}
            placeholder="Ex: Faculté des Sciences, Section Commerciale..."
          />
          <button type="button" onClick={ajouterFaculte}>
            <FaPlus /> Ajouter une faculté
          </button>
        </div>
      </div>

      <div className="tree-container">
        {universite.facultes.map((faculte, idx) => (
          <div key={idx} className="tree-node level-1">
            <div className="tree-folder" style={{ backgroundColor: 'rgba(192,122,43,0.15)' }}>
              <FaFolderOpen className="folder-icon" style={{ color: '#f59e0b' }} />
              <span className="tree-label">{faculte}</span>
              <button
                type="button"
                className="tree-delete"
                onClick={() => supprimerFaculte(faculte)}
                title="Supprimer cette faculté"
              >
                ×
              </button>
            </div>

            <div className="tree-children">
              <div className="tree-control">
                <div className="tag-input" style={{ maxWidth: 400 }}>
                  <input
                    value={nouveauDept[faculte] || ''}
                    onChange={(e) => setNouveauDept(prev => ({ ...prev, [faculte]: e.target.value }))}
                    placeholder="Ex: Informatique, Comptabilité..."
                  />
                  <button type="button" onClick={() => ajouterDepartement(faculte)}>
                    Ajouter département
                  </button>
                </div>
              </div>

              {(universite.departements[faculte] || []).map((dept, i) => (
                <div key={i} className="tree-leaf level-2">
                  <FaFolder className="folder-icon" style={{ color: '#3b82f6' }} />
                  <span className="tree-label">{dept}</span>
                  <button
                    type="button"
                    className="tree-delete"
                    onClick={() => supprimerDepartement(faculte, dept)}
                    title="Supprimer ce département"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Étape 6 : Options & Promotions (avec sélecteur rapide) ─
  const renderEtape6 = () => {
    const allDepts = Object.values(universite.departements).flat();

    if (allDepts.length === 0) {
      return (
        <div className="section">
          <h3><FaGraduationCap /> Étape 6 : Options & Promotions</h3>
          <p style={{ color: 'var(--text-muted)' }}>Veuillez d'abord créer des départements à l'étape 5.</p>
        </div>
      );
    }

    return (
      <div className="section">
        <h3><FaGraduationCap /> Étape 6 : Options & Promotions</h3>
        <div className="tree-container">
          {allDepts.map((dept, idx) => (
            <div key={idx} className="tree-node level-2">
              <div className="tree-folder" style={{ backgroundColor: 'rgba(24,95,165,0.12)' }}>
                <FaFolderOpen className="folder-icon" style={{ color: '#3b82f6' }} />
                <span className="tree-label" style={{ fontWeight: 600 }}>{dept}</span>
              </div>

              <div className="tree-children">
                <div className="tree-control">
                  <div className="tag-input" style={{ maxWidth: 400 }}>
                    <input
                      value={nouvelleOption[dept] || ''}
                      onChange={(e) => setNouvelleOption(prev => ({ ...prev, [dept]: e.target.value }))}
                      placeholder="Ex: Génie Logiciel, Réseaux..."
                    />
                    <button type="button" onClick={() => ajouterOption(dept)}>
                      Ajouter option
                    </button>
                  </div>
                </div>

                {(universite.options[dept] || []).map((opt, j) => (
                  <div key={j} className="tree-leaf level-3">
                    <FaFolder className="folder-icon" style={{ color: '#8b5cf6' }} />
                    <span className="tree-label">{opt}</span>
                    <button
                      type="button"
                      className="tree-delete"
                      onClick={() => supprimerOption(dept, opt)}
                      title="Supprimer cette option"
                    >
                      ×
                    </button>

                    {/* Ce bloc est un FRÈRE du nom dans la même ligne flex
                        (.tree-leaf). Sans `tree-leaf-controls`, qui le force à
                        occuper une ligne entière, il se plaçait À CÔTÉ du nom
                        et le comprimait jusqu'à le rendre illisible. */}
                    <div className="tree-leaf-controls" style={{ marginLeft: 30, marginTop: 6 }}>
                      {/* Sélecteur de promotion + vacation + bouton Ajouter */}
                      <div className="promotion-add">
                        <select
                          value={nouvellePromo[opt] || ''}
                          onChange={(e) => setNouvellePromo(prev => ({ ...prev, [opt]: e.target.value }))}
                          className="promo-select"
                        >
                          <option value="">-- Niveau --</option>
                          {NIVEAUX_PROMOTION.map((niveau) => (
                            <option key={niveau} value={niveau}>{niveau}</option>
                          ))}
                          <option value="__AUTRE__">Autre (saisir)</option>
                        </select>
                        {nouvellePromo[opt] === '__AUTRE__' && (
                          <input
                            type="text"
                            placeholder="Saisissez le niveau"
                            className="promo-input"
                            value={nouvellePromo[opt] === '__AUTRE__' ? '' : nouvellePromo[opt]}
                            onChange={(e) => setNouvellePromo(prev => ({ ...prev, [opt]: e.target.value }))}
                          />
                        )}
                        <select
                          value={nouvelleVacation[opt] || 'JOUR'}
                          onChange={(e) => setNouvelleVacation(prev => ({ ...prev, [opt]: e.target.value }))}
                          className="promo-select"
                          title="Vacation de la promotion (Jour, Soir, ou les deux)"
                        >
                          {VACATION_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>Vacation : {o.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-ajouter-promo"
                          onClick={() => {
                            const niveau = nouvellePromo[opt] === '__AUTRE__' ? '' : nouvellePromo[opt];
                            if (niveau.trim()) {
                              ajouterPromotion(opt, niveau);
                            }
                          }}
                        >
                          <FaPlus /> Ajouter promo
                        </button>
                      </div>

                      {/* Promotions existantes : niveau + vacation modifiable */}
                      <div className="tags" style={{ marginTop: 8 }}>
                        {(universite.promotions[opt] || []).map((p) => (
                          <span key={p.niveau} className="tag promo-tag">
                            <strong>{p.niveau}</strong>
                            <select
                              className="promo-vacation-select"
                              value={vacationsVersCle(p.vacations)}
                              onChange={(e) => changerVacationPromotion(opt, p.niveau, e.target.value)}
                              title={`Vacation de ${p.niveau}`}
                            >
                              {VACATION_OPTIONS.map((o) => (
                                <option key={o.key} value={o.key}>{o.label}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => supprimerPromotion(opt, p.niveau)}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Étape 7 ──────────────────────────────────────────────
  const renderEtape7 = () => (
    <div className="section">
      <h3><FaIdCard /> Étape 7 : Paramétrage des cartes</h3>
      <div className="champs" style={{ gridTemplateColumns: '1fr' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Checkbox label="Carte étudiant" name="carteEtudiant" checked={universite.carteEtudiant} onChange={handleChange} />
          <Checkbox label="Carte enseignant" name="carteEnseignant" checked={universite.carteEnseignant} onChange={handleChange} />
          <Checkbox label="Carte personnel" name="cartePersonnel" checked={universite.cartePersonnel} onChange={handleChange} />
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
          <Checkbox label="QR Code" name="qrCode" checked={universite.qrCode} onChange={handleChange} />
          <Checkbox label="Numéro matricule auto" name="matriculeAuto" checked={universite.matriculeAuto} onChange={handleChange} />
        </div>
      </div>
    </div>
  );

  // ─── Étape 8 ──────────────────────────────────────────────
  const renderEtape8 = () => (
    <div className="section">
      <h3><FaUserTie /> Étape 8 : Paramétrage du personnel</h3>
      <p style={{ marginBottom: 12 }}>Catégories de personnel par défaut :</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {universite.categories.map((cat, idx) => (
          <span key={idx} className="tag" style={{ fontSize: 14 }}>{cat}</span>
        ))}
      </div>
    </div>
  );

  // ─── Étape 9 ──────────────────────────────────────────────
  const renderEtape9 = () => (
    <div className="section">
      <h3><FaCog /> Étape 9 : Activation des modules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {Object.entries(universite.modules).map(([key, val]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <input type="checkbox" checked={val} onChange={() => handleModuleToggle(key)} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {key === 'admissions' && 'Admissions'}
              {key === 'inscriptions' && 'Inscriptions'}
              {key === 'controleAcademique' && 'Contrôle Académique'}
              {key === 'deliberation' && 'Délibération'}
              {key === 'bulletins' && 'Bulletins'}
              {key === 'releves' && 'Relevés'}
              {key === 'diplomation' && 'Diplomation'}
              {key === 'rh' && 'RH'}
              {key === 'caisse' && 'Caisse'}
              {key === 'comptabilite' && 'Comptabilité'}
              {key === 'bibliotheque' && 'Bibliothèque'}
              {key === 'elearning' && 'E-learning'}
              {key === 'stages' && 'Stages'}
              {key === 'assuranceQualite' && 'Assurance Qualité'}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  // ─── Étape 10 : Validation finale ──────────────────────────
  const renderEtape10 = () => {
    const totalDepts = Object.values(universite.departements).flat().length;
    const totalOptions = Object.values(universite.options).flat().length;
    const totalPromos = Object.values(universite.promotions).flat().length;
    const validation = {
      facultes: universite.facultes.length > 0,
      departements: totalDepts > 0,
      options: totalOptions > 0,
      promotions: totalPromos > 0,
      recteur: !!universite.recteur.email,
    };
    return (
      <div className="section">
        <h3><FaCheckCircle /> Étape 10 : Validation finale</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className={`validation-item ${validation.facultes ? 'ok' : 'ko'}`}>
            {validation.facultes ? '✅' : '❌'} Au moins 1 faculté
          </div>
          <div className={`validation-item ${validation.departements ? 'ok' : 'ko'}`}>
            {validation.departements ? '✅' : '❌'} Au moins 1 département
          </div>
          <div className={`validation-item ${validation.options ? 'ok' : 'ko'}`}>
            {validation.options ? '✅' : '❌'} Au moins 1 option
          </div>
          <div className={`validation-item ${validation.promotions ? 'ok' : 'ko'}`}>
            {validation.promotions ? '✅' : '❌'} Au moins 1 promotion
          </div>
          <div className={`validation-item ${validation.recteur ? 'ok' : 'ko'}`}>
            {validation.recteur ? '✅' : '❌'} Compte Recteur
          </div>
        </div>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
          {Object.values(validation).every(v => v) ? '✅ Tous les prérequis sont remplis. Vous pouvez finaliser.' : '⚠️ Veuillez compléter les éléments manquants.'}
        </p>
      </div>
    );
  };

  // ─── Rendu principal ──────────────────────────────────────────
  return (
    <div className="form-container">
      <div className="form-header">
        <div>
          <h2>🏛️ Enregistrer une université</h2>
          <p className="sous-titre">Étape {etapeCourante + 1} / {ETAPES.length} : {ETAPES[etapeCourante].label}</p>
        </div>
        <button type="button" className="btn-retour" onClick={() => navigate('/superadmin/dashboard')}>
          <FaArrowLeft /> Retour
        </button>
      </div>

      <div className="progress-bar-etapes">
        {ETAPES.map((_, idx) => (
          <div
            key={idx}
            className={`progress-step ${idx <= etapeCourante ? 'active' : ''}`}
            style={{ width: `${100 / ETAPES.length}%` }}
          >
            <span className="step-number">{idx + 1}</span>
          </div>
        ))}
      </div>

      {erreur && <div className="alert-erreur">{erreur}</div>}
      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="contenu-onglet">
          {renderEtape()}
        </div>

        <div className="actions">
          <div className="actions-left">
            <button
              type="button"
              className="btn-secondary"
              onClick={prevStep}
              disabled={etapeCourante === 0}
            >
              <FaArrowLeft /> Précédent
            </button>
            {etapeCourante < ETAPES.length - 1 && (
              <button
                type="button"
                className="btn-primary"
                onClick={nextStep}
              >
                Suivant <FaArrowRight />
              </button>
            )}
            <button
              type="button"
              className="btn-annuler"
              onClick={() => setAnnulerModal(true)}
            >
              <FaTimes /> Annuler
            </button>
            <button
              type="button"
              className="btn-reset"
              onClick={handleReset}
            >
              <FaTrash /> Réinitialiser
            </button>
          </div>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || etapeCourante !== ETAPES.length - 1}
          >
            {loading ? 'Enregistrement...' : <><FaSave /> Enregistrer l'université</>}
          </button>
        </div>
      </form>

      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div
            className="dialog-resizable"
            style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, minWidth: 300, minHeight: 160, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', ...resetDrag.panelStyle }}
          >
            <h3 className="dialog-draggable-handle" {...resetDrag.dragHandleProps} style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Réinitialiser les données</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setResetModal(false)}>Annuler</button>
              <button className="btn-danger" onClick={confirmerReset}>Réinitialiser</button>
            </div>
          </div>
        </div>
      )}

      {annulerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div
            className="dialog-resizable"
            style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, minWidth: 300, minHeight: 160, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', ...annulerDrag.panelStyle }}
          >
            <h3 className="dialog-draggable-handle" {...annulerDrag.dragHandleProps} style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Annuler l'enregistrement</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Voulez-vous vraiment annuler ? Toutes les données saisies seront perdues.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setAnnulerModal(false)}>Continuer</button>
              <button className="btn-danger" onClick={confirmerAnnuler}>Annuler l'enregistrement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Composant FileUpload ────────────────────────────────────
const FileUpload = ({ label, file, onChange, onRemove, accept, preview = false, required = false }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (file && preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file, preview]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onChange(selectedFile);
    }
  };

  return (
    <div className="file-upload-container">
      <label className="file-label">{label} {required && '*'}</label>
      <div className="file-upload-area">
        {!file ? (
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="file-input"
          />
        ) : (
          <div className="file-preview">
            {preview && previewUrl ? (
              <img src={previewUrl} alt="Aperçu" className="file-preview-img" />
            ) : (
              <div className="file-icon">
                {file.type?.startsWith('image/') ? <FaImage /> : <FaFilePdf />}
              </div>
            )}
            <span className="file-name">{file.name}</span>
            <button type="button" className="file-remove" onClick={onRemove}>
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Composants réutilisables ──────────────────────────────────
const Input = ({ label, ...props }) => (
  <div className="champ">
    <label>{label}</label>
    <input {...props} />
  </div>
);

const Select = ({ label, name, value, options, onChange, required }) => (
  <div className="champ">
    <label>{label}</label>
    <select name={name} value={value} onChange={onChange} required={required}>
      <option value="">-- Sélectionner --</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Checkbox = ({ label, ...props }) => (
  <div className="champ checkbox">
    <label>
      <input type="checkbox" {...props} />
      {label}
    </label>
  </div>
);

export default EnregistrementUniversite;