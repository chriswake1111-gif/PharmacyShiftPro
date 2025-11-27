
// IMPORTANT: These values are loaded from Environment Variables
// This supports both standard process.env (CRA/Node) and import.meta.env (Vite)

// Helper to safely get env vars in any environment without crashing
const getEnvVar = (key: string): string => {
  let val = '';
  
  // 1. Try Vite (import.meta.env) - This is the standard for Vite apps
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // Prioritize VITE_ prefix as it's the default for Vite
      // @ts-ignore
      val = import.meta.env[`VITE_${key}`] || import.meta.env[key] || import.meta.env[`REACT_APP_${key}`];
    }
  } catch (e) {}

  if (val) return val;

  // 2. Try Node/CRA (process.env) - This might work if Vercel polyfills process
  try {
    if (typeof process !== 'undefined' && process.env) {
      val = process.env[`VITE_${key}`] || process.env[`REACT_APP_${key}`] || process.env[key];
    }
  } catch (e) {}

  return val || '';
};

export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID')
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  const hasKey = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
  if (!hasKey) {
    console.warn("Firebase Configuration Missing: API Key is empty.");
    console.log("Debug Info - Env Vars Check:");
    console.log("VITE_FIREBASE_API_KEY present?", !!getEnvVar('FIREBASE_API_KEY'));
  }
  return hasKey;
};
