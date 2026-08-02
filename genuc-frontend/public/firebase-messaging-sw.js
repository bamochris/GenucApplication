/* eslint-disable no-undef */
// Service worker Firebase Cloud Messaging — reçoit les notifications push quand l'onglet
// GENUC n'est pas au premier plan. Doit rester à la racine de public/ (portée du SW).
//
// ⚠️ Un service worker ne peut pas lire process.env / les variables REACT_APP_* au build :
// Firebase documente que la config web (apiKey, projectId, etc.) n'est PAS secrète — elle
// doit donc être recopiée ici en dur, identique à .env (REACT_APP_FIREBASE_*), à chaque
// changement de projet Firebase. Tant que ces valeurs restent vides, ce fichier ne fait rien
// (aucune notification en arrière-plan) sans casser le reste de l'application.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const titre = payload.notification?.title || 'GENUC';
    const options = {
      body: payload.notification?.body || '',
      icon: '/assets/logo-genuc.png',
      data: payload.data,
    };
    self.registration.showNotification(titre, options);
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const lien = event.notification.data?.lienAction || '/';
    event.waitUntil(clients.openWindow(lien));
  });
}
