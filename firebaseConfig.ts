
// IMPORTANT: Replace the values below with your own Firebase project configuration
// You can find these in the Firebase Console -> Project Settings -> General -> Your apps
// 1. Go to https://console.firebase.google.com/
// 2. Click your project
// 3. Click the gear icon -> Project settings
// 4. Scroll down to "Your apps" and select "Config"
// 5. Copy the values and paste them below

export const firebaseConfig = {
  apiKey: "AIzaSyBMkLtf_VKMv3fTGgnrNUhR4IYW_h8I_i4", 
  authDomain: "pharmacyshiftpro.firebaseapp.com",      
  projectId: "pharmacyshiftpro",                      
  storageBucket: "pharmacyshiftpro.firebasestorage.app",       
  messagingSenderId: "429194484392",      
  appId: "1:429194484392:web:8d1606be8d408c477dc09d",
  measurementId: "G-5T2Z0VCHW2"
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  if (!firebaseConfig.apiKey) return false;
  // Basic check to ensure it's not a placeholder text if user forgot to change it
  // (In your case, you have filled it, so this function returns true)
  return !firebaseConfig.apiKey.includes("YOUR_API_KEY");
};
