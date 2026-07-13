import { useCallback, useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import { Document, Mode, ModeMeta } from "../types";
import { detectLanguageCode } from "./languageDetect";

const MAX_VOICE_SLOTS = 5;

// Apple's iOS/macOS bundle a set of "novelty" voices (robotic, whispering,
// singing, etc.) alongside the normal ones. They match the same language
// codes as real voices, so without excluding them by name they'd get mixed
// into the curated list and sound garbled/unintelligible.
const NOVELTY_VOICE_NAMES = new Set(
  [
    "Albert",
    "Bad News",
    "Bahh",
    "Bells",
    "Boing",
    "Bubbles",
    "Cellos",
    "Wobble",
    "Deranged",
    "Good News",
    "Hysterical",
    "Jester",
    "Organ",
    "Superstar",
    "Trinoids",
    "Whisper",
    "Zarvox",
    "Bruce",
    "Fred",
    "Junior",
    "Ralph",
    "Kathy",
    "Princess",
    "Pipe Organ",
  ].map((n) => n.toLowerCase())
);

// Restart TTS at most this often in response to speed/voice changes, so
// dragging the speed slider (which fires many onValueChange events per
// second) doesn't flood expo-speech with overlapping stop/speak calls.
const RESTART_DEBOUNCE_MS = 350;

interface BoundaryEvent {
  charIndex: number;
  charLength: number;
}

export const MODE_META: Record<Mode, ModeMeta> = {
  beginner: { name: "Read Aloud", isTTS: true, min: 50, max: 250, step: 5, default: 100 },
  medium: { name: "Guided Pace", isTTS: false, min: 150, max: 600, step: 10, default: 300 },
  pro: { name: "Sprint", isTTS: false, min: 200, max: 900, step: 10, default: 400 },
};

export function orpIndex(word: string): number {
  const len = word.replace(/[^a-zA-Z0-9]/g, "").length || word.length;
  if (len <= 1) return 0;
  if (len <= 4) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

export function splitRSVPWord(word: string): { pre: string; orp: string; post: string } {
  const idx = Math.min(orpIndex(word), Math.max(0, word.length - 1));
  return {
    pre: word.slice(0, idx),
    orp: word.slice(idx, idx + 1) || "",
    post: word.slice(idx + 1),
  };
}

function pauseMultiplierFor(word: string): number {
  let mult = 1;
  if (/[.!?]["')]?$/.test(word)) mult *= 1.9;
  else if (/[,;:]["')]?$/.test(word)) mult *= 1.4;
  if (word.length > 7) mult *= 1 + Math.min((word.length - 7) * 0.05, 0.4);
  return mult;
}

export function formatDuration(totalSeconds: number): string {
  totalSeconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function computeWordOffsets(text: string): number[] {
  const offsets: number[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) offsets.push(m.index);
  return offsets;
}

export interface VoiceOption {
  identifier: string;
  label: string;
}

interface Params {
  document: Document | null;
  initialMode: Mode;
  initialWpm: number;
  initialTtsRate: number;
  onProgress?: (index: number) => void;
}

export function useReaderEngine({ document, initialMode, initialWpm, initialTtsRate, onProgress }: Params) {
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [wpm, setWpmState] = useState(initialWpm);
  const [ttsRate, setTtsRateState] = useState(initialTtsRate);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  const words = document?.words ?? [];
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const documentRef = useRef(document);
  documentRef.current = document;

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  const ttsRateRef = useRef(ttsRate);
  ttsRateRef.current = ttsRate;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const selectedVoiceIdRef = useRef(selectedVoiceId);
  selectedVoiceIdRef.current = selectedVoiceId;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundarySupportedRef = useRef(false);
  const persistIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  // Bumped on every stop/restart of TTS so a native callback belonging to a
  // superseded utterance (expo-speech's stop() is async and can race with a
  // fresh speak() call) can recognize itself as stale and no-op instead of
  // corrupting isPlaying/currentIndex.
  const ttsGenRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const effectiveWpm = useCallback(() => {
    return MODE_META[modeRef.current].isTTS
      ? Math.max(40, Math.round(ttsRateRef.current * 150))
      : wpmRef.current;
  }, []);

  // Stable across renders: always reads the latest onProgress via a ref, so
  // the schedulers below (memoized once) never call a stale callback.
  const finish = useCallback(() => {
    clearTimers();
    isPlayingRef.current = false;
    setIsPlaying(false);
    onProgressRef.current?.(currentIndexRef.current);
  }, [clearTimers]);

  // ---------- RSVP (Sprint) ----------
  const scheduleRSVP = useCallback(() => {
    if (!isPlayingRef.current) return;
    const word = wordsRef.current[currentIndexRef.current];
    const interval = (60000 / wpmRef.current) * pauseMultiplierFor(word || "");
    timerRef.current = setTimeout(() => {
      const next = currentIndexRef.current + 1;
      if (next >= wordsRef.current.length) {
        finish();
        return;
      }
      currentIndexRef.current = next;
      setCurrentIndex(next);
      scheduleRSVP();
    }, interval);
  }, [finish]);

  // ---------- Guided Pace ----------
  const scheduleGuided = useCallback(() => {
    if (!isPlayingRef.current) return;
    const word = wordsRef.current[currentIndexRef.current];
    const interval = (60000 / wpmRef.current) * pauseMultiplierFor(word || "");
    timerRef.current = setTimeout(() => {
      const next = currentIndexRef.current + 1;
      if (next >= wordsRef.current.length) {
        finish();
        return;
      }
      currentIndexRef.current = next;
      setCurrentIndex(next);
      scheduleGuided();
    }, interval);
  }, [finish]);

  // ---------- Read Aloud (TTS) ----------
  const startTTS = useCallback(() => {
    const doc = documentRef.current;
    if (!doc) return;
    const fullText = doc.paragraphs.join("\n\n");
    const fullOffsets = computeWordOffsets(fullText);
    const startIdx = Math.min(currentIndexRef.current, fullOffsets.length - 1);
    const startChar = fullOffsets[startIdx] || 0;
    const textToSpeak = fullText.slice(startChar);
    const subOffsets = fullOffsets.slice(startIdx).map((o) => o - startChar);
    const detectedLang = detectLanguageCode(doc.rawText);

    // Claim this generation before awaiting stop() so any earlier in-flight
    // restart (its own stop().then() below) recognizes itself as superseded
    // and skips speaking once its stop() resolves.
    const myGen = ++ttsGenRef.current;
    let pointer = startIdx;

    Speech.stop().finally(() => {
      if (myGen !== ttsGenRef.current) return; // a newer call already took over
      boundarySupportedRef.current = false;
      Speech.speak(textToSpeak, {
        language: detectedLang,
        rate: Math.max(0.5, Math.min(2.5, ttsRateRef.current)),
        voice: selectedVoiceIdRef.current ?? undefined,
        onBoundary: (ev: BoundaryEvent) => {
          if (myGen !== ttsGenRef.current) return;
          boundarySupportedRef.current = true;
          const idx = ev.charIndex;
          let rel = pointer - startIdx;
          while (rel < subOffsets.length - 1 && subOffsets[rel + 1] <= idx) {
            rel++;
            pointer++;
          }
          currentIndexRef.current = pointer;
          setCurrentIndex(pointer);
        },
        onDone: () => {
          if (myGen === ttsGenRef.current) finish();
        },
        onError: () => {
          if (myGen === ttsGenRef.current) finish();
        },
      });

      fallbackTimerRef.current = setTimeout(function check() {
        if (myGen !== ttsGenRef.current) return;
        if (!isPlayingRef.current) return;
        if (boundarySupportedRef.current) return;
        const approxWpm = Math.max(40, Math.round(ttsRateRef.current * 150));
        const interval = 60000 / approxWpm;
        const next = currentIndexRef.current + 1;
        if (next >= wordsRef.current.length) return;
        currentIndexRef.current = next;
        setCurrentIndex(next);
        fallbackTimerRef.current = setTimeout(check, interval);
      }, 1200);
    });
  }, [finish]);

  const restartTTSFromCurrent = useCallback(() => {
    startTTS();
  }, [startTTS]);

  // Coalesces rapid-fire speed/voice changes (e.g. dragging a slider fires
  // many events per second) into a single restart after things go quiet,
  // instead of flooding expo-speech with overlapping stop/speak calls.
  const scheduleRestartTTS = useCallback(() => {
    if (restartDebounceRef.current) clearTimeout(restartDebounceRef.current);
    restartDebounceRef.current = setTimeout(() => {
      restartDebounceRef.current = null;
      if (isPlayingRef.current && MODE_META[modeRef.current].isTTS) restartTTSFromCurrent();
    }, RESTART_DEBOUNCE_MS);
  }, [restartTTSFromCurrent]);

  const pause = useCallback(() => {
    ttsGenRef.current++;
    clearTimers();
    if (restartDebounceRef.current) {
      clearTimeout(restartDebounceRef.current);
      restartDebounceRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (MODE_META[modeRef.current].isTTS) Speech.stop();
    onProgressRef.current?.(currentIndexRef.current);
  }, [clearTimers]);

  const play = useCallback(() => {
    if (currentIndexRef.current >= wordsRef.current.length) {
      currentIndexRef.current = 0;
      setCurrentIndex(0);
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    const m = modeRef.current;
    if (m === "pro") scheduleRSVP();
    else if (m === "medium") scheduleGuided();
    else startTTS();
  }, [scheduleRSVP, scheduleGuided, startTTS]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [pause, play]);

  const seekTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(wordsRef.current.length - 1, idx));
      const wasPlaying = isPlayingRef.current;
      pause();
      currentIndexRef.current = clamped;
      setCurrentIndex(clamped);
      if (wasPlaying) play();
    },
    [pause, play]
  );

  const seekBy = useCallback((delta: number) => seekTo(currentIndexRef.current + delta), [seekTo]);
  const restart = useCallback(() => seekTo(0), [seekTo]);

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const setWpm = useCallback((v: number) => {
    wpmRef.current = v;
    setWpmState(v);
  }, []);

  const setTtsRate = useCallback(
    (v: number) => {
      ttsRateRef.current = v;
      setTtsRateState(v);
      if (isPlayingRef.current && MODE_META[modeRef.current].isTTS) scheduleRestartTTS();
    },
    [scheduleRestartTTS]
  );

  const setVoice = useCallback(
    (id: string) => {
      selectedVoiceIdRef.current = id;
      setSelectedVoiceId(id);
      if (isPlayingRef.current && MODE_META[modeRef.current].isTTS) scheduleRestartTTS();
    },
    [scheduleRestartTTS]
  );

  const loadVoices = useCallback(() => {
    Speech.getAvailableVoicesAsync()
      .then((list) => {
        const clean = list.filter((v) => !NOVELTY_VOICE_NAMES.has(v.name.trim().toLowerCase()));

        const detected = detectLanguageCode(documentRef.current?.rawText || "");
        const matching = (code: string) => clean.filter((v) => v.language.toLowerCase().startsWith(code));

        let pool = matching(detected);
        if (!pool.length) pool = matching("en");
        if (!pool.length) pool = clean;
        if (!pool.length) pool = list;

        const seenNames = new Set<string>();
        const deduped = pool.filter((v) => {
          if (seenNames.has(v.name)) return false;
          seenNames.add(v.name);
          return true;
        });
        deduped.sort((a, b) => {
          if (a.quality !== b.quality) return a.quality === "Enhanced" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        const picked = deduped.slice(0, MAX_VOICE_SLOTS);

        const opts = picked.map((v, i) => ({ identifier: v.identifier, label: `Voice ${i + 1} · ${v.name}` }));
        setVoices(opts);
        if (opts.length && !picked.some((v) => v.identifier === selectedVoiceIdRef.current)) {
          selectedVoiceIdRef.current = picked[0].identifier;
          setSelectedVoiceId(picked[0].identifier);
        }
      })
      .catch(() => setVoices([]));
  }, []);

  const enter = useCallback(
    (startIndex = 0) => {
      ttsGenRef.current++;
      clearTimers();
      if (restartDebounceRef.current) {
        clearTimeout(restartDebounceRef.current);
        restartDebounceRef.current = null;
      }
      Speech.stop();
      isPlayingRef.current = false;
      setIsPlaying(false);
      currentIndexRef.current = startIndex;
      setCurrentIndex(startIndex);
      if (modeRef.current === "beginner") loadVoices();
    },
    [clearTimers, loadVoices]
  );

  const exit = useCallback(() => {
    pause();
  }, [pause]);

  // Autosave progress every couple seconds while actively playing, so a crash
  // or kill mid-session doesn't lose more than a few words of position.
  useEffect(() => {
    if (isPlaying) {
      persistIntervalRef.current = setInterval(() => onProgressRef.current?.(currentIndexRef.current), 2500);
    }
    return () => {
      if (persistIntervalRef.current) clearInterval(persistIntervalRef.current);
      persistIntervalRef.current = null;
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (restartDebounceRef.current) clearTimeout(restartDebounceRef.current);
      Speech.stop();
    };
  }, [clearTimers]);

  const n = words.length || 1;
  const progressPct = Math.min(100, (currentIndex / n) * 100);
  const wpmForTiming = effectiveWpm();
  const elapsedLabel = formatDuration((currentIndex / wpmForTiming) * 60);
  const totalLabel = formatDuration((words.length / wpmForTiming) * 60);

  return {
    mode,
    setMode,
    wpm,
    setWpm,
    ttsRate,
    setTtsRate,
    currentIndex,
    isPlaying,
    voices,
    selectedVoiceId,
    setVoice,
    words,
    modeMeta: MODE_META[mode],
    progressPct,
    elapsedLabel,
    totalLabel,
    play,
    pause,
    togglePlay,
    seekTo,
    seekBy,
    restart,
    enter,
    exit,
  };
}
