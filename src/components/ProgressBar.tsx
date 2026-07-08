import React, { useRef } from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme";

interface Props {
  pct: number;
  onSeekFraction: (fraction: number) => void;
}

export default function ProgressBar({ pct, onSeekFraction }: Props) {
  const widthRef = useRef(1);

  function handlePress(e: GestureResponderEvent) {
    const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current));
    onSeekFraction(frac);
  }

  return (
    <Pressable
      onPress={handlePress}
      onLayout={(e: LayoutChangeEvent) => {
        widthRef.current = e.nativeEvent.layout.width || 1;
      }}
      style={styles.track}
      hitSlop={{ top: 10, bottom: 10 }}
    >
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 3,
    marginBottom: 18,
    justifyContent: "center",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
});
