# Velocity

A speed-reading app with three modes — **Read Aloud** (TTS with word sync), **Guided Pace** (WPM highlighter), and **Sprint** (RSVP) — built with Expo/React Native from the `Velocity.dc.html` design.

Implements the design's 3-screen flow (Import → Choose mode → Reader) filling the real device viewport (no decorative phone-frame chrome), plus persistence of the last-used mode/speed and in-progress reading position via AsyncStorage.

## Running it

```
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator/emulator.

## Notes & known limitations

- **PDF text extraction** runs pdf.js inside a hidden WebView (same engine the original browser prototype used), so it requires network access to fetch `pdf.js` from cdnjs the first time.
- **EPUB parsing** uses JSZip + regex-based XML parsing (no DOM parser available in React Native), which covers standard EPUB2/3 structures but is less forgiving of malformed markup than a full XML parser.
- **URL import** strips tags with regex rather than a DOM parser; it works well for article-style pages but won't render JS-driven sites.
- **Read Aloud speed control**: `expo-speech` doesn't support true pause/resume on Android, so — matching the original prototype's own approach — resuming always restarts speech from the current word rather than the exact mid-word position.
- Persisted state lives in `AsyncStorage`: `velocity:settings` (mode/speed) and `velocity:lastSession` (current document + reading position, cleared on completion).
