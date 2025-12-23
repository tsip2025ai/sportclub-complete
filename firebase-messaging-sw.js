// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDJEd_cK18ht8zbidQ9WK0vNvK_rDB5qgo",
  authDomain: "sportclub-7b155.firebaseapp.com",
  projectId: "sportclub-7b155",
  storageBucket: "sportclub-7b155.firebasestorage.app",
  messagingSenderId: "621945852010",
  appId: "1:621945852010:web:f639a432f0d13e09b3ba13"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message:', payload);
  
  const notificationTitle = payload.notification.title || '🏆 SportClub';
  const notificationOptions = {
    body: payload.notification.body || 'Νέα ενημέρωση!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});