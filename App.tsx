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

import ImportScreen from "./src/screens/ImportScreen";
import ModeScreen from "./src/screens/ModeScreen";
import ReaderScreen from "./src/screens/ReaderScreen";
import { colors } from "./src/theme";
import { MODE_META, useReaderEngine } from "./src/lib/readerEngine";
import { clearLastSession, loadLastSession, loadSettings, saveLastSession, saveSettings } from "./src/lib/storage";
import { Document, LastSession, Mode } from "./src/types";

type Screen = "import" | "mode" | "reader";
const SCREEN_ORDER: Record<Screen, number> = { import: 0, mode: 1, reader: 2 };

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

  const [screen, setScreen] = useState<Screen>("import");
  const [document, setDocument] = useState<Document | null>(null);
  const [resumeSession, setResumeSession] = useState<LastSession | null>(null);
  const [pendingEnterIndex, setPendingEnterIndex] = useState<number | null>(null);
  const settingsLoadedRef = useRef(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const engine = useReaderEngine({
    document,
    initialMode: "beginner",
    initialWpm: 300,
    initialTtsRate: 1,
    onProgress: (idx) => {
      if (!document) return;
      if (idx >= document.words.length - 1) {
        clearLastSession();
        return;
      }
      saveLastSession({
        document,
        mode: engine.mode,
        wpm: engine.wpm,
        ttsRate: engine.ttsRate,
        currentIndex: idx,
        savedAt: Date.now(),
      });
    },
  });

  // Load persisted settings + any in-progress session once on launch.
  useEffect(() => {
    (async () => {
      const [settings, session] = await Promise.all([loadSettings(), loadLastSession()]);
      if (settings) {
        engine.setMode(settings.mode);
        engine.setWpm(settings.wpm);
        engine.setTtsRate(settings.ttsRate);
      }
      if (session) setResumeSession(session);
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

  // Resolves a resume request once `document` has actually propagated into
  // the engine (avoids entering the chamber before word bounds are known).
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
    setScreen("reader");
  }

  function handleResume() {
    if (!resumeSession) return;
    setDocument(resumeSession.document);
    engine.setMode(resumeSession.mode);
    engine.setWpm(resumeSession.wpm);
    engine.setTtsRate(resumeSession.ttsRate);
    setPendingEnterIndex(resumeSession.currentIndex);
    setScreen("reader");
    setResumeSession(null);
  }

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <Screens
          screen={screen}
          document={document}
          engine={engine}
          resumeSession={resumeSession}
          onDocumentChange={setDocument}
          onContinue={() => document && setScreen("mode")}
          onResume={handleResume}
          onDismissResume={() => setResumeSession(null)}
          onSelectMode={handleSelectMode}
          onBackToImport={() => setScreen("import")}
          onStart={handleStart}
          onExitReader={() => {
            engine.exit();
            setScreen("mode");
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

interface ScreensProps {
  screen: Screen;
  document: Document | null;
  engine: ReturnType<typeof useReaderEngine>;
  resumeSession: LastSession | null;
  onDocumentChange: (doc: Document | null) => void;
  onContinue: () => void;
  onResume: () => void;
  onDismissResume: () => void;
  onSelectMode: (m: Mode) => void;
  onBackToImport: () => void;
  onStart: () => void;
  onExitReader: () => void;
}

function Screens({
  screen,
  document,
  engine,
  resumeSession,
  onDocumentChange,
  onContinue,
  onResume,
  onDismissResume,
  onSelectMode,
  onBackToImport,
  onStart,
  onExitReader,
}: ScreensProps) {
  const width = Dimensions.get("window").width;
  const anims = useRef({
    import: { x: new Animated.Value(0), o: new Animated.Value(1) },
    mode: { x: new Animated.Value(width), o: new Animated.Value(0) },
    reader: { x: new Animated.Value(width), o: new Animated.Value(0) },
  }).current;

  useEffect(() => {
    const cur = SCREEN_ORDER[screen];
    const runs = (Object.keys(anims) as Screen[]).map((key) => {
      const order = SCREEN_ORDER[key];
      const active = order === cur;
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
        style={[styles.layer, { transform: [{ translateX: anims.import.x }], opacity: anims.import.o }]}
        pointerEvents={screen === "import" ? "auto" : "none"}
      >
        <ImportScreen
          onDocumentChange={onDocumentChange}
          onContinue={onContinue}
          resumeSession={resumeSession}
          onResume={onResume}
          onDismissResume={onDismissResume}
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
