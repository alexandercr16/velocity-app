import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { PrimaryButton, GhostButton } from "../components/Buttons";

interface Props {
  onLogin: () => void;
  onSignup: () => void;
  onGuest: () => void;
}

export default function HomeScreen({ onLogin, onSignup, onGuest }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Text style={styles.markLabel}>V</Text>
        </View>
        <Text style={styles.logo}>
          Veloc<Text style={styles.logoItalic}>i</Text>ty
        </Text>
        <Text style={styles.tagline}>Read anything faster — aloud, paced, or in a flash.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Log in" onPress={onLogin} />
        <GhostButton label="Create an account" onPress={onSignup} fullWidth />
        <Pressable onPress={onGuest} style={styles.guestBtn}>
          <Text style={styles.guestLabel}>Continue as guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 24 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  markLabel: { fontFamily: fonts.read, fontSize: 30, color: "#fff" },
  logo: { fontFamily: fonts.read, fontSize: 42, color: colors.ink, marginBottom: 10 },
  logoItalic: { fontFamily: fonts.readItalic, fontStyle: "italic", color: colors.accent },
  tagline: {
    fontFamily: fonts.ui,
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.sub,
    textAlign: "center",
    maxWidth: 260,
  },
  actions: { paddingHorizontal: 28, paddingBottom: 40, gap: 11 },
  guestBtn: { width: "100%", paddingVertical: 8, alignItems: "center" },
  guestLabel: { fontFamily: fonts.uiSemibold, fontSize: 13.5, color: colors.sub },
});
