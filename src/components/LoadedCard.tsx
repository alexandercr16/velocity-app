import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { CheckIcon, DocIcon, LibraryIcon, LinesIcon, LinkIcon, SaveIcon, SparkleIcon } from "./Icons";

export type ImportKind = "paste" | "txt" | "pdf" | "epub" | "url" | "sample";

export const KIND_META: Record<
  ImportKind,
  { color: string; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }
> = {
  paste: { color: "#6E727B", label: "Pasted text", Icon: LinesIcon },
  txt: { color: "#4B4EDB", label: "TXT", Icon: DocIcon },
  pdf: { color: "#E2623C", label: "PDF", Icon: DocIcon },
  epub: { color: "#9B4FDB", label: "EPUB", Icon: LibraryIcon },
  url: { color: "#2E93A8", label: "Web link", Icon: LinkIcon },
  sample: { color: "#B8862F", label: "Sample", Icon: SparkleIcon },
};

interface Props {
  kind: ImportKind;
  title: string;
  wordCount: number;
  isSaved: boolean;
  onSave: () => void;
}

export default function LoadedCard({ kind, title, wordCount, isSaved, onSave }: Props) {
  const meta = KIND_META[kind];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(120),
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 170, useNativeDriver: true }),
    ]).start();
    // Mount-once entrance; a fresh `key` from the parent on each new load
    // remounts this component so the animation always replays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: meta.color }]}>
          <meta.Icon size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta}>
            {meta.label} · {wordCount.toLocaleString()} words
          </Text>
        </View>
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: checkScale }] }]}>
          <CheckIcon size={13} color="#fff" />
        </Animated.View>
      </View>
      <Pressable onPress={onSave} disabled={isSaved} style={styles.saveBtn}>
        <SaveIcon size={15} color={isSaved ? colors.sub : colors.accent} />
        <Text style={[styles.saveLabel, { color: isSaved ? colors.sub : colors.accent }]}>
          {isSaved ? "Saved ✓" : "Save to Library"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.screen,
    overflow: "hidden",
    shadowColor: "#14161c",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.uiSemibold, fontSize: 14.5, color: colors.ink },
  meta: { fontFamily: fonts.monoMedium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  checkWrap: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#1F8A5B",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.wash,
  },
  saveLabel: { fontFamily: fonts.uiSemibold, fontSize: 13 },
});
