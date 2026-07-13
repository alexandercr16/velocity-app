import { getApp, getApps, initializeApp } from "firebase/app";
// Imported from the scoped @firebase/auth package rather than the "firebase/auth"
// wrapper: the wrapper's package.json hardcodes generic (non-React-Native) types
// for its "./auth" export, so getReactNativePersistence isn't visible through it
// even though @firebase/auth ships a proper "react-native" conditional export.
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from "@firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "./firebaseConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  // initializeAuth throws if it's already been called once (e.g. Fast Refresh
  // re-running this module) — fall back to the existing instance.
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
