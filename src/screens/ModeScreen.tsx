import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, fonts } from "../theme";
import { ChevronLeftIcon, GuidedPaceGlyph, ReadAloudGlyph, SprintGlyph } from "../components/Icons";
import ModeCard from "../components/ModeCard";
import { PrimaryButton } from "../components/Buttons";
import { MODE_META, formatDuration } from "../lib/readerEngine";
import { Document, Mode } from "../types";

interface Props {
  document: Document | null;
  mode: Mode;
  wpm: number;
  ttsRate: number;
  onSelectMode: (m: Mode) => void;
  onChangeWpm: (v: number) => void;
  onChangeTtsRate: (v: number) => void;
  onBack: () => void;
  onStart: () => void;
}

export default function ModeScreen({
  document,
  mode,
  wpm,
  ttsRate,
  onSelectMode,
  onChangeWpm,
  onChangeTtsRate,
  onBack,
  onStart,
}: Props) {
  const meta = MODE_META[mode];
  const wordCount = document?.words.length ?? 0;
  const effectiveWpm = meta.isTTS ? Math.max(40, Math.round(ttsRate * 150)) : wpm;
  const estTime = wordCount ? formatDuration((wordCount / effectiveWpm) * 60) : "—";

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ChevronLeftIcon />
          </Pressable>
          <View style={{ minWidth: 0 }}>
            <Text style={styles.headerTitle}>Choose how to read</Text>
            <Text style={styles.headerMeta}>{wordCount ? `${wordCount.toLocaleString()} words loaded` : "—"}</Text>
          </View>
        </View>

        <View style={styles.cards}>
          <ModeCard
            title="Read Aloud"
            subtitle="A voice reads to you; each word lights up."
            glyph={<ReadAloudGlyph color={mode === "beginner" ? "#fff" : colors.sub} />}
            selected={mode === "beginner"}
            onPress={() => onSelectMode("beginner")}
          />
          <ModeCard
            title="Guided Pace"
            subtitle="A highlight paces you, word by word."
            glyph={<GuidedPaceGlyph color={mode === "medium" ? "#fff" : colors.sub} />}
            selected={mode === "medium"}
            onPress={() => onSelectMode("medium")}
          />
          <ModeCard
            title="Sprint"
            subtitle="One word at a time, flashed in place."
            glyph={<SprintGlyph color={mode === "pro" ? "#fff" : colors.sub} />}
            selected={mode === "pro"}
            onPress={() => onSelectMode("pro")}
          />
        </View>

        <View style={styles.speedPanel}>
          <View style={styles.speedHeader}>
            <Text style={styles.speedLabel}>{meta.isTTS ? "Voice speed" : "Words / minute"}</Text>
            <Text style={styles.speedValue}>
              {meta.isTTS ? `${ttsRate.toFixed(2)}×  ·  ~${Math.round(ttsRate * 150)} wpm` : `${wpm} wpm`}
            </Text>
          </View>
          <Slider
            minimumValue={meta.isTTS ? 50 : meta.min}
            maximumValue={meta.isTTS ? 250 : meta.max}
            step={meta.isTTS ? 5 : meta.step}
            value={meta.isTTS ? Math.round(ttsRate * 100) : wpm}
            onValueChange={(v) => (meta.isTTS ? onChangeTtsRate(v / 100) : onChangeWpm(Math.round(v)))}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.accent}
          />
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statValue}>{wordCount ? wordCount.toLocaleString() : "—"}</Text>
              <Text style={styles.statLabel}>WORDS</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{estTime}</Text>
              <Text style={styles.statLabel}>EST. TIME</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Start reading" onPress={onStart} disabled={!wordCount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 16, paddingBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 6, marginBottom: 20 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: fonts.uiSemibold, fontSize: 16, color: colors.ink, lineHeight: 18 },
  headerMeta: { fontFamily: fonts.monoMedium, fontSize: 11.5, color: colors.faint, marginTop: 2 },
  cards: { gap: 11 },
  speedPanel: {
    marginTop: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.wash,
  },
  speedHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 },
  speedLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.sub,
  },
  speedValue: { fontFamily: fonts.monoMedium, fontSize: 15, color: colors.ink },
  statsRow: {
    flexDirection: "row",
    gap: 26,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statValue: { fontFamily: fonts.uiMedium, fontSize: 17, color: colors.ink },
  statLabel: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.faint, letterSpacing: 0.4 },
  footer: {
    padding: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.screen,
  },
});
