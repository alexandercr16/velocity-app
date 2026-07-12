import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts } from "../theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, loading }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primary, (disabled || loading) && styles.primaryDisabled]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryLabel}>{label}</Text>}
    </Pressable>
  );
}

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function GhostButton({ label, onPress, disabled, fullWidth }: GhostButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.ghost, fullWidth && styles.ghostFullWidth, disabled && styles.ghostDisabled]}
    >
      <Text style={[styles.ghostLabel, fullWidth && styles.ghostLabelFullWidth]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDisabled: {
    opacity: 0.4,
  },
  primaryLabel: {
    fontFamily: fonts.uiSemibold,
    fontSize: 15.5,
    color: "#fff",
  },
  ghost: {
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostFullWidth: {
    width: "100%",
    height: undefined,
    paddingVertical: 15,
    borderRadius: 15,
  },
  ghostDisabled: {
    opacity: 0.5,
  },
  ghostLabel: {
    fontFamily: fonts.uiSemibold,
    fontSize: 13,
    color: colors.ink,
  },
  ghostLabelFullWidth: {
    fontSize: 15.5,
  },
});
