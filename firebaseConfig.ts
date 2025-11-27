
// IMPORTANT: These values are now loaded from Environment Variables (Vercel)
// This prevents security alerts from GitHub and protects your configuration.

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  if (!firebaseConfig.apiKey) return false;
  // Basic check to ensure it has a value (not undefined or empty)
  return firebaseConfig.apiKey.length > 0;
};
