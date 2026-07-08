import React, { useEffect, useRef } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

interface Props {
  paragraphs: string[];
  currentIndex: number;
}

export default function FlowText({ paragraphs, currentIndex }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const positionsRef = useRef<Record<number, { y: number; height: number }>>({});
  const viewportHeightRef = useRef(0);

  useEffect(() => {
    const pos = positionsRef.current[currentIndex];
    if (!pos || !scrollRef.current) return;
    const target = Math.max(0, pos.y - viewportHeightRef.current / 2 + pos.height / 2);
    scrollRef.current.scrollTo({ y: target, animated: true });
  }, [currentIndex]);

  let globalIndex = 0;
  const paragraphNodes = paragraphs.map((para, pIdx) => {
    const words = para.split(/\s+/).filter(Boolean);
    const wordNodes = words.map((w) => {
      const idx = globalIndex++;
      const state = idx < currentIndex ? "read" : idx === currentIndex ? "current" : "upcoming";
      return (
        <Text
          key={idx}
          onLayout={(e: LayoutChangeEvent) => {
            positionsRef.current[idx] = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height };
          }}
          style={[
            styles.word,
            state === "current" && styles.wordCurrent,
            state === "read" && styles.wordRead,
            state === "upcoming" && styles.wordUpcoming,
          ]}
        >
          {w + " "}
        </Text>
      );
    });
    return (
      <View key={pIdx} style={styles.paraBreak}>
        {wordNodes}
      </View>
    );
  });

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      onLayout={(e) => {
        viewportHeightRef.current = e.nativeEvent.layout.height;
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.flowWrap}>{paragraphNodes}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: "100%" },
  content: { paddingVertical: 20, paddingHorizontal: 2, alignItems: "center" },
  flowWrap: { width: "100%", maxWidth: 400, alignSelf: "center", flexDirection: "row", flexWrap: "wrap" },
  paraBreak: { width: "100%", flexDirection: "row", flexWrap: "wrap", marginBottom: 18 },
  word: {
    fontFamily: fonts.readBody,
    fontSize: 21,
    lineHeight: 37,
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  wordCurrent: {
    backgroundColor: colors.accent,
    color: "#fff",
    overflow: "hidden",
  },
  wordRead: { color: colors.faint },
  wordUpcoming: { color: colors.ink },
});
