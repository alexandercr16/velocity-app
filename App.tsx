import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { Newsreader_400Regular, Newsreader_500Medium, Newsreader_500Medium_Italic } from "@expo-google-fonts/newsreader";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";

import HomeScreen from "./src/screens/HomeScreen";
import AuthScreen, { AuthMode } from "./src/screens/AuthScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import ImportScreen from "./src/screens/ImportScreen";
import ModeScreen from "./src/screens/ModeScreen";
import ReaderScreen from "./src/screens/ReaderScreen";
import { colors } from "./src/theme";
import { buildDocument } from "./src/lib/textIngestion";
import { MODE_META, useReaderEngine } from "./src/lib/readerEngine";
import { loadLibrary, loadSettings, saveLibrary, saveSettings } from "./src/lib/storage";
import { Document, LibraryEntry, Mode } from "./src/types";

type Screen = "home" | "auth" | "import" | "library" | "mode" | "reader";
const SCREEN_ORDER: Record<Screen, number> = { home: 0, auth: 1, import: 2, library: 2, mode: 3, reader: 4 };

export default function App() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const [screen, setScreen] = useState<Screen>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [document, setDocument] = useState<Document | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [pendingEnterIndex, setPendingEnterIndex] = useState<number | null>(null);
  // Where "Back" from Library should return to — it can be opened from either
  // the Import screen or the Mode screen now.
  const [libraryReturnScreen, setLibraryReturnScreen] = useState<"import" | "mode">("import");
  // Where "Back" from Reader should return to — the normal Mode-select flow,
  // or straight back to Library when a saved text was opened directly.
  const [readerReturnScreen, setReaderReturnScreen] = useState<"mode" | "library">("mode");
  // Bumped to force-remount ImportScreen with a blank slate (the "+" button),
  // since its paste/file/URL state otherwise persists across screen switches.
  const [importResetToken, setImportResetToken] = useState(0);
  const settingsLoadedRef = useRef(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  // Guards against the initial async loadLibrary() resolving *after* the user
  // has already saved something (e.g. they paste + save within the first
  // second of launch) — without this, applying the disk snapshot on load
  // would silently clobber the fresh save back to the pre-launch list.
  const librarySavedDuringLoadRef = useRef(false);

  const engine = useReaderEngine({
    document,
    initialMode: "beginner",
    initialWpm: 300,
    initialTtsRate: 1,
    // Persists progress into the matching library entry (by rawText) so each
    // saved text remembers its own position — texts that were never saved
    // have nothing to persist into, which is fine, they're one-off reads.
    onProgress: (idx) => {
      if (!document) return;
      librarySavedDuringLoadRef.current = true;
      setLibrary((current) => {
        const i = current.findIndex((e) => e.rawText === document.rawText);
        if (i === -1) return current;
        const next = [...current];
        next[i] = { ...next[i], lastIndex: idx, lastMode: engine.mode, lastWpm: engine.wpm, lastTtsRate: engine.ttsRate };
        saveLibrary(next);
        return next;
      });
    },
  });

  // Load persisted settings + the saved library once on launch.
  useEffect(() => {
    (async () => {
      const [settings, savedLibrary] = await Promise.all([loadSettings(), loadLibrary()]);
      if (settings) {
        engine.setMode(settings.mode);
        engine.setWpm(settings.wpm);
        engine.setTtsRate(settings.ttsRate);
      }
      setLibrary((current) => {
        if (!librarySavedDuringLoadRef.current) return savedLibrary;
        // A save already landed while this load was in flight — merge rather
        // than overwrite, so neither the fresh save nor older disk entries are lost.
        const currentIds = new Set(current.map((e) => e.id));
        return [...savedLibrary.filter((e) => !currentIds.has(e.id)), ...current];
      });
      settingsLoadedRef.current = true;
      setSettingsLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist mode/speed settings whenever they change, after the initial load.
  useEffect(() => {
    if (!settingsLoaded) return;
    saveSettings({ mode: engine.mode, wpm: engine.wpm, ttsRate: engine.ttsRate });
  }, [settingsLoaded, engine.mode, engine.wpm, engine.ttsRate]);

  // Resolves an "open at saved position" request once `document` has actually
  // propagated into the engine (avoids entering the chamber before word
  // bounds are known).
  useEffect(() => {
    if (pendingEnterIndex !== null && document && document.words.length) {
      engine.enter(Math.min(pendingEnterIndex, document.words.length - 1));
      setPendingEnterIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnterIndex, document]);

  function handleSelectMode(m: Mode) {
    engine.setMode(m);
    const meta = MODE_META[m];
    if (!meta.isTTS) engine.setWpm(meta.default);
  }

  function handleStart() {
    engine.enter(0);
    setReaderReturnScreen("mode");
    setScreen("reader");
  }

  function handleSaveToLibrary(doc: Document) {
    librarySavedDuringLoadRef.current = true;
    setLibrary((current) => {
      if (current.some((e) => e.rawText === doc.rawText)) return current;
      const entry: LibraryEntry = {
        id: String(Date.now()),
        title: doc.title.slice(0, 60),
        rawText: doc.rawText,
        wordCount: doc.words.length,
        savedAt: Date.now(),
        lastOpenedAt: Date.now(),
        lastIndex: 0,
        lastMode: engine.mode,
        lastWpm: engine.wpm,
        lastTtsRate: engine.ttsRate,
      };
      const next = [...current, entry];
      saveLibrary(next);
      return next;
    });
  }

  function handleDeleteLibraryEntry(id: string) {
    librarySavedDuringLoadRef.current = true;
    setLibrary((current) => {
      const next = current.filter((e) => e.id !== id);
      saveLibrary(next);
      return next;
    });
  }

  function handleOpenLibraryEntry(entry: LibraryEntry) {
    setDocument(buildDocument(entry.rawText, entry.title, entry.title));
    engine.setMode(entry.lastMode ?? "beginner");
    engine.setWpm(entry.lastWpm ?? MODE_META.medium.default);
    engine.setTtsRate(entry.lastTtsRate ?? 1);
    librarySavedDuringLoadRef.current = true;
    setLibrary((current) => {
      const next = current.map((e) => (e.id === entry.id ? { ...e, lastOpenedAt: Date.now() } : e));
      saveLibrary(next);
      return next;
    });
    setPendingEnterIndex(entry.lastIndex ?? 0);
    setReaderReturnScreen("library");
    setScreen("reader");
  }

  function handleNewImport() {
    setDocument(null);
    setImportResetToken((t) => t + 1);
    setScreen("import");
  }

  const isSaved = !!document && library.some((e) => e.rawText === document.rawText);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <Screens
          screen={screen}
          document={document}
          engine={engine}
          authMode={authMode}
          library={library}
          isSaved={isSaved}
          importResetToken={importResetToken}
          onDocumentChange={setDocument}
          onContinue={() => document && setScreen("mode")}
          onSelectMode={handleSelectMode}
          onBackToImport={() => setScreen("import")}
          onStart={handleStart}
          onExitReader={() => {
            engine.exit();
            setScreen(readerReturnScreen);
          }}
          onLogin={() => {
            setAuthMode("login");
            setScreen("auth");
          }}
          onSignup={() => {
            setAuthMode("signup");
            setScreen("auth");
          }}
          onGuest={() => setScreen("import")}
          onAuthBack={() => setScreen("home")}
          onToggleAuthMode={() => setAuthMode((m) => (m === "signup" ? "login" : "signup"))}
          onAuthSubmit={() => setScreen("import")}
          onOpenLibraryFromImport={() => {
            setLibraryReturnScreen("import");
            setScreen("library");
          }}
          onOpenLibraryFromMode={() => {
            setLibraryReturnScreen("mode");
            setScreen("library");
          }}
          onBackFromLibrary={() => setScreen(libraryReturnScreen)}
          onOpenLibraryEntry={handleOpenLibraryEntry}
          onDeleteLibraryEntry={handleDeleteLibraryEntry}
          onSaveToLibrary={handleSaveToLibrary}
          onNewImport={handleNewImport}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

interface ScreensProps {
  screen: Screen;
  document: Document | null;
  engine: ReturnType<typeof useReaderEngine>;
  authMode: AuthMode;
  library: LibraryEntry[];
  isSaved: boolean;
  importResetToken: number;
  onDocumentChange: (doc: Document | null) => void;
  onContinue: () => void;
  onSelectMode: (m: Mode) => void;
  onBackToImport: () => void;
  onStart: () => void;
  onExitReader: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onGuest: () => void;
  onAuthBack: () => void;
  onToggleAuthMode: () => void;
  onAuthSubmit: () => void;
  onOpenLibraryFromImport: () => void;
  onOpenLibraryFromMode: () => void;
  onBackFromLibrary: () => void;
  onOpenLibraryEntry: (entry: LibraryEntry) => void;
  onDeleteLibraryEntry: (id: string) => void;
  onSaveToLibrary: (doc: Document) => void;
  onNewImport: () => void;
}

function Screens({
  screen,
  document,
  engine,
  authMode,
  library,
  isSaved,
  importResetToken,
  onDocumentChange,
  onContinue,
  onSelectMode,
  onBackToImport,
  onStart,
  onExitReader,
  onLogin,
  onSignup,
  onGuest,
  onAuthBack,
  onToggleAuthMode,
  onAuthSubmit,
  onOpenLibraryFromImport,
  onOpenLibraryFromMode,
  onBackFromLibrary,
  onOpenLibraryEntry,
  onDeleteLibraryEntry,
  onSaveToLibrary,
  onNewImport,
}: ScreensProps) {
  const width = Dimensions.get("window").width;
  const anims = useRef({
    home: { x: new Animated.Value(0), o: new Animated.Value(1) },
    auth: { x: new Animated.Value(width), o: new Animated.Value(0) },
    import: { x: new Animated.Value(width), o: new Animated.Value(0) },
    library: { x: new Animated.Value(width), o: new Animated.Value(0) },
    mode: { x: new Animated.Value(width), o: new Animated.Value(0) },
    reader: { x: new Animated.Value(width), o: new Animated.Value(0) },
  }).current;

  useEffect(() => {
    const cur = SCREEN_ORDER[screen];
    const runs = (Object.keys(anims) as Screen[]).map((key) => {
      const order = SCREEN_ORDER[key];
      const active = key === screen;
      const targetX = active ? 0 : order < cur ? -width * 0.12 : width;
      return Animated.parallel([
        Animated.timing(anims[key].x, {
          toValue: targetX,
          duration: 400,
          easing: Easing.bezier(0.4, 0, 0.15, 1),
          useNativeDriver: true,
        }),
        Animated.timing(anims[key].o, {
          toValue: active ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.parallel(runs).start();
  }, [screen, anims, width]);

  return (
    <View style={styles.stack}>
      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.home.x }], opacity: anims.home.o }]}
        pointerEvents={screen === "home" ? "auto" : "none"}
      >
        <HomeScreen onLogin={onLogin} onSignup={onSignup} onGuest={onGuest} />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.auth.x }], opacity: anims.auth.o }]}
        pointerEvents={screen === "auth" ? "auto" : "none"}
      >
        <AuthScreen mode={authMode} onToggleMode={onToggleAuthMode} onBack={onAuthBack} onSubmit={onAuthSubmit} />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.import.x }], opacity: anims.import.o }]}
        pointerEvents={screen === "import" ? "auto" : "none"}
      >
        <ImportScreen
          key={importResetToken}
          onDocumentChange={onDocumentChange}
          onContinue={onContinue}
          onOpenLibrary={onOpenLibraryFromImport}
          isSaved={isSaved}
          onSaveToLibrary={onSaveToLibrary}
          onNewImport={onNewImport}
        />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.library.x }], opacity: anims.library.o }]}
        pointerEvents={screen === "library" ? "auto" : "none"}
      >
        <LibraryScreen
          entries={library}
          onOpen={onOpenLibraryEntry}
          onDelete={onDeleteLibraryEntry}
          onBack={onBackFromLibrary}
        />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.mode.x }], opacity: anims.mode.o }]}
        pointerEvents={screen === "mode" ? "auto" : "none"}
      >
        <ModeScreen
          document={document}
          mode={engine.mode}
          wpm={engine.wpm}
          ttsRate={engine.ttsRate}
          onSelectMode={onSelectMode}
          onChangeWpm={engine.setWpm}
          onChangeTtsRate={engine.setTtsRate}
          onBack={onBackToImport}
          onStart={onStart}
          onNewImport={onNewImport}
          onOpenLibrary={onOpenLibraryFromMode}
        />
      </Animated.View>

      <Animated.View
        style={[styles.layer, { transform: [{ translateX: anims.reader.x }], opacity: anims.reader.o }]}
        pointerEvents={screen === "reader" ? "auto" : "none"}
      >
        <ReaderScreen engine={engine} paragraphs={document?.paragraphs ?? []} onBack={onExitReader} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screen },
  stack: { flex: 1 },
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
