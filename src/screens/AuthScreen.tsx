import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../theme";
import { ChevronLeftIcon } from "../components/Icons";
import { PrimaryButton } from "../components/Buttons";

export type AuthMode = "login" | "signup";

interface Props {
  mode: AuthMode;
  onToggleMode: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

const COPY: Record<AuthMode, { title: string; subtitle: string; toggle: string; submit: string }> = {
  login: {
    title: "Log in",
    subtitle: "Welcome back — pick up where you left off.",
    toggle: "Need an account? Sign up",
    submit: "Continue",
  },
  signup: {
    title: "Create an account",
    subtitle: "Save progress and your library across sessions.",
    toggle: "Already have an account? Log in",
    submit: "Sign up",
  },
};

export default function AuthScreen({ mode, onToggleMode, onBack, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const copy = COPY[mode];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.faint}
            secureTextEntry
            style={styles.input}
          />
        </View>
        <Pressable onPress={onToggleMode} style={styles.toggleBtn}>
          <Text style={styles.toggleLabel}>{copy.toggle}</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={copy.submit} onPress={onSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 22 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  title: { fontFamily: fonts.read, fontSize: 30, lineHeight: 33, color: colors.ink, marginBottom: 8 },
  subtitle: { fontFamily: fonts.ui, fontSize: 14.5, lineHeight: 21, color: colors.sub, marginBottom: 26 },
  form: { gap: 12 },
  input: {
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontFamily: fonts.ui,
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.wash,
  },
  toggleBtn: { marginTop: 16, paddingVertical: 2 },
  toggleLabel: { fontFamily: fonts.uiSemibold, fontSize: 13.5, color: colors.accent },
  footer: {
    padding: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.screen,
  },
});
