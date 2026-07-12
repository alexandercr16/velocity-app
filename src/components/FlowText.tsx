import React, { useEffect, useRef } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

interface Props {
  paragraphs: string[];
  currentIndex: number;
}

// How long after the user stops manually dragging before auto-follow resumes.
const RESUME_AUTOSCROLL_DELAY = 2500;

export default function FlowText({ paragraphs, currentIndex }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  // Word onLayout gives coordinates relative to its own paragraph box, not
  // the scrollable content — so we track each paragraph's offset separately
  // and compose (paragraphOffset + wordLocalOffset) into an absolute Y at
  // scroll time, rather than trying to keep a single flat coordinate space.
  const paraOffsetsRef = useRef<Record<number, number>>({});
  const wordLocalRef = useRef<Record<number, { paraIdx: number; y: number; height: number }>>({});
  const viewportHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isUserScrollingRef.current) return;
    const local = wordLocalRef.current[currentIndex];
    if (!local || !scrollRef.current) return;
    const paraY = paraOffsetsRef.current[local.paraIdx] ?? 0;
    const absoluteY = paraY + local.y;
    const target = Math.max(0, absoluteY - viewportHeightRef.current / 2 + local.height / 2);
    scrollRef.current.scrollTo({ y: target, animated: true });
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  function pauseAutoFollow() {
    isUserScrollingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }
  function scheduleResumeAutoFollow() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, RESUME_AUTOSCROLL_DELAY);
  }

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
            wordLocalRef.current[idx] = { paraIdx: pIdx, y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height };
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
      <View
        key={pIdx}
        style={styles.paraBreak}
        onLayout={(e: LayoutChangeEvent) => {
          paraOffsetsRef.current[pIdx] = e.nativeEvent.layout.y;
        }}
      >
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
      onScrollBeginDrag={pauseAutoFollow}
      onScrollEndDrag={scheduleResumeAutoFollow}
      onMomentumScrollEnd={scheduleResumeAutoFollow}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.flowWrap}>{paragraphNodes}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: "100%" },
  content: { paddingVertical: 20, paddingHorizontal: 2, alignItems: "center", flexGrow: 1 },
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
