import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { colors, fonts } from "../theme";
import { Back10Icon, ChevronLeftIcon, Fwd10Icon, PauseIcon, PlayIcon, RestartIcon } from "../components/Icons";
import FlowText from "../components/FlowText";
import ProgressBar from "../components/ProgressBar";
import { splitRSVPWord, useReaderEngine } from "../lib/readerEngine";

type Engine = ReturnType<typeof useReaderEngine>;

interface Props {
  engine: Engine;
  paragraphs: string[];
  onBack: () => void;
}

export default function ReaderScreen({ engine, paragraphs, onBack }: Props) {
  const {
    mode,
    modeMeta,
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
    progressPct,
    elapsedLabel,
    totalLabel,
    togglePlay,
    seekTo,
    seekBy,
    restart,
  } = engine;

  const currentWord = words[currentIndex] || "";
  const rsvp = splitRSVPWord(currentWord);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <ChevronLeftIcon size={17} color={colors.sub} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.modeTag}>{modeMeta.name}</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.wpmReadout}>{modeMeta.isTTS ? `${ttsRate.toFixed(2)}×` : `${wpm} wpm`}</Text>
          <Text style={styles.timeReadout}>
            {elapsedLabel} / {totalLabel}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {mode === "pro" ? (
          <View style={styles.rsvpStage}>
            <View style={styles.tickTop} />
            <View style={styles.tickBottom} />
            <View style={styles.rsvpWord}>
              <Text style={[styles.rsvpText, styles.rsvpPre]} numberOfLines={1}>
                {rsvp.pre}
              </Text>
              <Text style={[styles.rsvpText, styles.rsvpOrp]}>{rsvp.orp}</Text>
              <Text style={[styles.rsvpText, styles.rsvpPost]} numberOfLines={1}>
                {rsvp.post}
              </Text>
            </View>
          </View>
        ) : (
          <FlowText paragraphs={paragraphs} currentIndex={currentIndex} />
        )}
      </View>

      <View style={styles.controls}>
        <ProgressBar pct={progressPct} onSeekFraction={(f) => seekTo(Math.round(f * words.length))} />

        <View style={styles.controlsRow}>
          <Pressable onPress={restart} style={styles.ctrlBtn}>
            <RestartIcon />
          </Pressable>
          <Pressable onPress={() => seekBy(-10)} style={styles.ctrlBtn}>
            <Back10Icon />
          </Pressable>
          <Pressable onPress={togglePlay} style={styles.playBtn}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Pressable>
          <Pressable onPress={() => seekBy(10)} style={styles.ctrlBtn}>
            <Fwd10Icon />
          </Pressable>
        </View>

        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>{modeMeta.isTTS ? "SPEED" : "WPM"}</Text>
          <Slider
            style={styles.speedSlider}
            minimumValue={modeMeta.isTTS ? 50 : modeMeta.min}
            maximumValue={modeMeta.isTTS ? 250 : modeMeta.max}
            step={modeMeta.isTTS ? 5 : modeMeta.step}
            value={modeMeta.isTTS ? Math.round(ttsRate * 100) : wpm}
            onValueChange={(v) => (modeMeta.isTTS ? setTtsRate(v / 100) : setWpm(Math.round(v)))}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.accent}
          />
          <Text style={styles.speedValue}>{modeMeta.isTTS ? ttsRate.toFixed(2) : wpm}</Text>
        </View>

        {mode === "beginner" && voices.length ? (
          <View style={styles.voicePickerWrap}>
            <Picker
              selectedValue={selectedVoiceId ?? undefined}
              onValueChange={(v) => setVoice(String(v))}
              style={styles.voicePicker}
              itemStyle={styles.voicePickerItem}
            >
              {voices.map((v) => (
                <Picker.Item key={v.identifier} label={v.label} value={v.identifier} />
              ))}
            </Picker>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  backLabel: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.sub },
  modeTag: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.ink },
  wpmReadout: { fontFamily: fonts.monoMedium, fontSize: 12.5, color: colors.ink },
  timeReadout: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, overflow: "hidden" },
  rsvpStage: { width: "100%", maxWidth: 360, alignSelf: "center" },
  tickTop: { position: "absolute", left: "50%", top: -26, width: 2, height: 14, backgroundColor: colors.pivot, opacity: 0.5 },
  tickBottom: {
    position: "absolute",
    left: "50%",
    bottom: -26,
    width: 2,
    height: 14,
    backgroundColor: colors.pivot,
    opacity: 0.5,
  },
  rsvpWord: { flexDirection: "row", alignItems: "baseline" },
  rsvpText: { fontFamily: fonts.read, fontSize: 52, lineHeight: 58 },
  rsvpPre: { flex: 1, textAlign: "right", color: colors.ink },
  rsvpOrp: { color: colors.pivot, fontWeight: "600" },
  rsvpPost: { flex: 1, textAlign: "left", color: colors.ink },
  controls: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.screen,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  speedRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, justifyContent: "center" },
  speedLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1, color: colors.faint },
  speedSlider: { width: 150 },
  speedValue: { fontFamily: fonts.monoMedium, fontSize: 12.5, color: colors.ink, width: 34 },
  voicePickerWrap: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    backgroundColor: colors.wash,
    overflow: "hidden",
  },
  voicePicker: { width: "100%", color: colors.ink },
  voicePickerItem: { fontSize: 13, color: colors.ink },
});
