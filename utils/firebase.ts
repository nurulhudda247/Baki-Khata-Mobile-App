import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Check if config is valid
const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase only if config is present
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// Initialize Auth with Persistence
export const auth = isFirebaseConfigured ? initializeAuth(app!, {
  persistence: getReactNativePersistence(AsyncStorage)
}) : null as any;

// Initialize Firestore
export const db = isFirebaseConfigured ? getFirestore(app!) : null as any;

export default app;
