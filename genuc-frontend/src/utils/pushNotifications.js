// src/utils/pushNotifications.js
// Notifications push (Firebase Cloud Messaging) — s'active uniquement si REACT_APP_FIREBASE_*
// est configuré. Sans configuration, toutes les fonctions ci-dessous sont des no-op silencieux
// (comportement identique au SMS/WhatsApp côté backend quand ils ne sont pas configurés).
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import api from '../api/axios';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

const estConfigure = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && vapidKey);

let appInstance = null;
const getFirebaseApp = () => {
  if (!estConfigure()) return null;
  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return appInstance;
};

/**
 * Demande la permission de notification au navigateur, récupère le jeton FCM et
 * l'enregistre auprès du backend. À appeler une fois l'utilisateur connecté.
 * Ne fait rien (retourne false) si Firebase n'est pas configuré ou si le navigateur
 * ne supporte pas les notifications push.
 */
export async function activerNotificationsPush() {
  if (!estConfigure()) return false;
  try {
    const supporte = await isSupported();
    if (!supporte) return false;

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return false;

    await api.post('/api/notifications/push/enregistrer', {
      token,
      plateforme: 'WEB',
    });

    localStorage.setItem('genuc_fcm_token', token);

    // Affiche les notifications reçues pendant que l'onglet est actif au premier plan
    onMessage(messaging, (payload) => {
      const titre = payload.notification?.title || 'GENUC';
      const corps = payload.notification?.body || '';
      if (Notification.permission === 'granted') {
        new Notification(titre, { body: corps, icon: '/assets/logo-genuc.png' });
      }
    });

    return true;
  } catch (err) {
    console.error('Erreur activation notifications push', err);
    return false;
  }
}

export async function desactiverNotificationsPush() {
  const token = localStorage.getItem('genuc_fcm_token');
  if (!token) return;
  try {
    await api.delete('/api/notifications/push/desenregistrer', { data: { token } });
    localStorage.removeItem('genuc_fcm_token');
  } catch (err) {
    console.error('Erreur désactivation notifications push', err);
  }
}

export const pushNotificationsDisponibles = estConfigure;
