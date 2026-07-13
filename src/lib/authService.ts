import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "@firebase/auth";
import { auth } from "./firebase";

export class AuthError extends Error {}

function friendlyMessage(code: string | undefined): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email already has an account — try logging in instead.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts — try again in a bit.";
    case "auth/network-request-failed":
      return "No internet connection.";
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return "This app's Firebase project isn't set up yet — see src/lib/firebaseConfig.ts.";
    default:
      return "Something went wrong — try again.";
  }
}

function asAuthError(err: unknown): AuthError {
  const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : undefined;
  return new AuthError(friendlyMessage(code));
}

export async function signUp(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  } catch (err) {
    throw asAuthError(err);
  }
}

export async function logIn(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  } catch (err) {
    throw asAuthError(err);
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export type { User };
