import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAAB9dXWrymvyJSrE8Qg3Op4vXQMEtv2hw',
  authDomain: 'aashish-properties.firebaseapp.com',
  projectId: 'aashish-properties',
  storageBucket: 'aashish-properties.firebasestorage.app',
  messagingSenderId: '1074799820866',
  appId: '1:1074799820866:web:60035a614911eb876faddb',
  measurementId: 'G-WJS8TWNW00'
};

let app: any;
let tokenCache: string | null = null;

export async function ensureFcmToken(): Promise<string | null> {
  try {
    if (!(await isSupported())) return null;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
    if (!app) app = initializeApp(firebaseConfig);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const vapid = (window as any).__FCM_VAPID_PUBLIC_KEY__ || import.meta.env.VITE_FCM_VAPID_PUBLIC_KEY;
    const t = await getToken(messaging, { vapidKey: vapid, serviceWorkerRegistration: reg });
    tokenCache = t;
    return t;
  } catch (e) {
    return null;
  }
}

export function getCachedFcmToken() { return tokenCache || localStorage.getItem('posttrr_fcm_token'); }
