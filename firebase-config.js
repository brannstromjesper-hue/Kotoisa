export const firebaseConfig = {
  apiKey: "AIzaSyDL9Lg4JL3QsFXtwPYYVsxlDOgsHUmih1Q",
  authDomain: "kotityo-appi1.firebaseapp.com",
  projectId: "kotityo-appi1",
  storageBucket: "kotityo-appi1.firebasestorage.app",
  messagingSenderId: "555822355836",
  appId: "1:555822355836:web:928cd364cff4ac16c180f9",
  measurementId: "G-2GHF3F68EH"
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => value && !value.startsWith("PASTE_YOUR_"));
}
