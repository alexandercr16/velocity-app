import AsyncStorage from "@react-native-async-storage/async-storage";
import { LastSession, Settings } from "../types";

const SETTINGS_KEY = "velocity:settings";
const SESSION_KEY = "velocity:lastSession";

export async function loadSettings(): Promise<Settings | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // best-effort persistence; ignore write failures
  }
}

export async function loadLastSession(): Promise<LastSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LastSession) : null;
  } catch {
    return null;
  }
}

export async function saveLastSession(session: LastSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // best-effort persistence; ignore write failures
  }
}

export async function clearLastSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
