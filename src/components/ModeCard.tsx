import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

interface Props {
  title: string;
  subtitle: string;
  glyph: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}

export default function ModeCard({ title, subtitle, glyph, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: selected ? colors.accent : colors.line, backgroundColor: selected ? colors.accentWash : colors.screen },
      ]}
    >
      <View style={[styles.glyph, { backgroundColor: selected ? colors.accent : colors.wash }]}>{glyph}</View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.faint }]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    borderWidth: 1,
    borderRadius: 18,
  },
  glyph: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.uiSemibold,
    fontSize: 15.5,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.sub,
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
