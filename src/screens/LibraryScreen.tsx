import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { ChevronLeftIcon, CloseIcon, LibraryIcon } from "../components/Icons";
import { LibraryEntry } from "../types";

interface Props {
  entries: LibraryEntry[];
  onOpen: (entry: LibraryEntry) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const COVER_COLORS = ["#4B4EDB", "#E2623C", "#1F8A5B", "#B8862F", "#9B4FDB", "#2E93A8"];

function colorFor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return COVER_COLORS[h % COVER_COLORS.length];
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function LibraryScreen({ entries, onOpen, onDelete, onBack, isLoggedIn, onLogout }: Props) {
  const ordered = [...entries].sort((a, b) => (b.lastOpenedAt ?? b.savedAt) - (a.lastOpenedAt ?? a.savedAt));

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ChevronLeftIcon />
          </Pressable>
          <Text style={[styles.headerTitle, { flex: 1 }]}>My Library</Text>
          {isLoggedIn ? (
            <Pressable onPress={onLogout} hitSlop={8}>
              <Text style={styles.logoutLabel}>Log out</Text>
            </Pressable>
          ) : null}
        </View>

        {ordered.length === 0 ? (
          <View style={styles.empty}>
            <LibraryIcon size={34} color={colors.faint} />
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptySubtitle}>Saved articles, PDFs, and books will appear here.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {ordered.map((entry) => (
              <Pressable key={entry.id} style={styles.card} onPress={() => onOpen(entry)}>
                <View style={[styles.cover, { backgroundColor: colorFor(entry.title) }]}>
                  <Text style={styles.coverInitial}>{(entry.title.trim()[0] || "?").toUpperCase()}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    style={styles.deleteBtn}
                    hitSlop={8}
                  >
                    <CloseIcon size={12} color="#fff" />
                  </Pressable>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {entry.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {entry.wordCount.toLocaleString()} words · {timeAgo(entry.lastOpenedAt ?? entry.savedAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: fonts.uiSemibold, fontSize: 17, color: colors.ink },
  logoutLabel: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.sub },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: fonts.uiSemibold, fontSize: 14.5, color: colors.sub, marginTop: 14, marginBottom: 4 },
  emptySubtitle: { fontFamily: fonts.ui, fontSize: 13, color: colors.faint, textAlign: "center", maxWidth: 200 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", marginBottom: 22 },
  cover: {
    aspectRatio: 3 / 4,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#14161c",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  coverInitial: { fontFamily: fonts.read, fontSize: 40, color: "rgba(255,255,255,0.92)" },
  deleteBtn: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontFamily: fonts.uiSemibold, fontSize: 13, color: colors.ink, marginTop: 9 },
  cardMeta: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.faint, marginTop: 2 },
});
