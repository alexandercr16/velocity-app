import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../theme";
import { ChevronLeftIcon } from "../components/Icons";
import { PrimaryButton } from "../components/Buttons";
import { AuthError, logIn, signUp } from "../lib/authService";

export type AuthMode = "login" | "signup";

interface Props {
  mode: AuthMode;
  onToggleMode: () => void;
  onBack: () => void;
  onAuthenticated: () => void;
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

export default function AuthScreen({ mode, onToggleMode, onBack, onAuthenticated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const copy = COPY[mode];

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") await signUp(email, password);
      else await logIn(email, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

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
            editable={!busy}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.faint}
            secureTextEntry
            editable={!busy}
            style={styles.input}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable onPress={onToggleMode} disabled={busy} style={styles.toggleBtn}>
          <Text style={styles.toggleLabel}>{copy.toggle}</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label={copy.submit} onPress={handleSubmit} loading={busy} disabled={busy} />
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
  errorText: { fontFamily: fonts.ui, fontSize: 13, color: colors.pivot, marginTop: 12 },
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
