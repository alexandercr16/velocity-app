import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { LibraryEntry } from "../types";

export async function fetchCloudLibrary(uid: string): Promise<LibraryEntry[]> {
  try {
    const snap = await getDoc(doc(db, "libraries", uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data?.entries) ? (data.entries as LibraryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function pushCloudLibrary(uid: string, entries: LibraryEntry[]): Promise<void> {
  try {
    await setDoc(doc(db, "libraries", uid), { entries });
  } catch {
    // best-effort — the local AsyncStorage copy stays authoritative on this
    // device even if the cloud push fails (e.g. offline); it'll sync next time.
  }
}

// Combines a device's local library with its cloud copy after login, keeping
// exactly one entry per distinct text (matched by rawText) and preferring
// whichever side was opened/saved more recently.
export function mergeLibraries(local: LibraryEntry[], cloud: LibraryEntry[]): LibraryEntry[] {
  const byText = new Map<string, LibraryEntry>();
  for (const entry of cloud) byText.set(entry.rawText, entry);
  for (const entry of local) {
    const existing = byText.get(entry.rawText);
    if (!existing) {
      byText.set(entry.rawText, entry);
      continue;
    }
    const existingTime = existing.lastOpenedAt ?? existing.savedAt;
    const localTime = entry.lastOpenedAt ?? entry.savedAt;
    byText.set(entry.rawText, localTime > existingTime ? entry : existing);
  }
  return Array.from(byText.values());
}
