
// IMPORTANT: These values are loaded from Environment Variables
// This supports both standard process.env (CRA/Node) and import.meta.env (Vite)

// Helper to safely get env vars in any environment without crashing
const getEnvVar = (key: string): string => {
  // 1. Try Vite (import.meta.env)
  try {
    // @ts-ignore - import.meta might not be typed in all configs
    if (import.meta && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || import.meta.env[`VITE_${key}`] || import.meta.env[`REACT_APP_${key}`];
      if (val) return val;
    }
  } catch (e) {}

  // 2. Try Node/CRA (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`];
      if (val) return val;
    }
  } catch (e) {}

  return '';
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
  if (!firebaseConfig.apiKey) return false;
  // Basic check to ensure it has a value (not undefined or empty)
  return firebaseConfig.apiKey.length > 0;
};
