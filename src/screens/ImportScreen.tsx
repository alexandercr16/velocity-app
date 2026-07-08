import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { colors, fonts } from "../theme";
import { PrimaryButton, GhostButton } from "../components/Buttons";
import { UploadIcon } from "../components/Icons";
import { usePdfExtractor } from "../lib/PdfExtractor";
import {
  buildDocument,
  fetchUrlText,
  ImportError,
  readEpubFile,
  readPdfFile,
  readTxtFile,
  SAMPLE_TEXT,
} from "../lib/textIngestion";
import { Document, LastSession } from "../types";

type Tab = "paste" | "file" | "url";

interface Props {
  onDocumentChange: (doc: Document | null) => void;
  onContinue: () => void;
  resumeSession: LastSession | null;
  onResume: () => void;
  onDismissResume: () => void;
}

export default function ImportScreen({ onDocumentChange, onContinue, resumeSession, onResume, onDismissResume }: Props) {
  const [tab, setTab] = useState<Tab>("paste");
  const [pasteText, setPasteText] = useState("");
  const [urlText, setUrlText] = useState("");
  const [doc, setDoc] = useState<Document | null>(null);
  const [status, setStatus] = useState<{ msg: string; isError: boolean }>({ msg: "", isError: false });
  const [busy, setBusy] = useState(false);
  const { extract: extractPdf, node: pdfExtractorNode } = usePdfExtractor();

  function applyDocument(next: Document) {
    setDoc(next);
    onDocumentChange(next);
    setStatus({ msg: `${next.sourceLabel} · ${next.words.length.toLocaleString()} words`, isError: false });
  }

  function fail(err: unknown) {
    const msg = err instanceof ImportError ? err.message : "Something went wrong reading that.";
    setStatus({ msg, isError: true });
  }

  function handlePasteChange(text: string) {
    setPasteText(text);
    if (!text.trim()) {
      setDoc(null);
      onDocumentChange(null);
      setStatus({ msg: "", isError: false });
      return;
    }
    try {
      applyDocument(buildDocument(text, "Pasted text"));
    } catch (err) {
      setDoc(null);
      onDocumentChange(null);
      fail(err);
    }
  }

  function handleSample() {
    setPasteText(SAMPLE_TEXT);
    setTab("paste");
    try {
      applyDocument(buildDocument(SAMPLE_TEXT, "Sample text"));
    } catch (err) {
      fail(err);
    }
  }

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.name.toLowerCase();
    setBusy(true);
    setStatus({ msg: `Reading ${asset.name}…`, isError: false });
    try {
      let next: Document;
      if (name.endsWith(".txt")) {
        next = await readTxtFile(asset.uri, asset.name);
      } else if (name.endsWith(".pdf")) {
        next = await readPdfFile(asset.uri, asset.name, extractPdf);
      } else if (name.endsWith(".epub")) {
        next = await readEpubFile(asset.uri, asset.name);
      } else {
        throw new ImportError("Unsupported file. Use .txt, .pdf, or .epub.");
      }
      applyDocument(next);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleFetchUrl() {
    const url = urlText.trim();
    if (!url) {
      setStatus({ msg: "Enter a URL first.", isError: true });
      return;
    }
    setBusy(true);
    setStatus({ msg: "Trying to fetch that page…", isError: false });
    try {
      applyDocument(await fetchUrlText(url));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      {pdfExtractorNode}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {resumeSession ? (
          <View style={styles.resumeBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeTitle}>Resume where you left off</Text>
              <Text style={styles.resumeSubtitle}>
                {resumeSession.document.sourceLabel} · word {resumeSession.currentIndex + 1} of{" "}
                {resumeSession.document.words.length.toLocaleString()}
              </Text>
            </View>
            <Pressable onPress={onResume} style={styles.resumeAction}>
              <Text style={styles.resumeActionLabel}>Resume</Text>
            </Pressable>
            <Pressable onPress={onDismissResume} hitSlop={8}>
              <Text style={styles.resumeDismiss}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.eyebrow}>Read faster</Text>
        <Text style={styles.logo}>
          Veloc<Text style={styles.logoItalic}>i</Text>ty
        </Text>
        <Text style={styles.subtitle}>Bring in an article, file, or page. Choose how you want to move through it.</Text>

        <View style={styles.tabs}>
          {(["paste", "file", "url"] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabLabel, { color: tab === t ? colors.ink : colors.sub }]}>
                {t === "paste" ? "Paste" : t === "file" ? "File" : "Link"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "paste" ? (
          <TextInput
            value={pasteText}
            onChangeText={handlePasteChange}
            placeholder="Paste an article, a chapter, or any text here…"
            placeholderTextColor={colors.faint}
            multiline
            style={styles.pasteArea}
          />
        ) : null}

        {tab === "file" ? (
          <Pressable onPress={handlePickFile} disabled={busy} style={styles.fileDrop}>
            <View style={styles.fileIconWrap}>
              <UploadIcon />
            </View>
            <Text style={styles.fileTitle}>Choose a file</Text>
            <Text style={styles.fileHint}>.txt · .pdf · .epub</Text>
          </Pressable>
        ) : null}

        {tab === "url" ? (
          <View>
            <View style={styles.urlRow}>
              <TextInput
                value={urlText}
                onChangeText={setUrlText}
                placeholder="https://example.com/article"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.urlInput}
              />
              <GhostButton label="Fetch" onPress={handleFetchUrl} disabled={busy} />
            </View>
            <Text style={styles.note}>
              Many sites block direct loading (CORS). If it fails, copy the article text and paste it instead.
            </Text>
          </View>
        ) : null}

        <Pressable onPress={handleSample} style={styles.sampleLink}>
          <Text style={styles.sampleLinkLabel}>Try a sample text →</Text>
        </Pressable>

        {status.msg ? (
          <Text style={[styles.loadStatus, status.isError && { color: colors.pivot }]}>{status.msg}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Continue" onPress={onContinue} disabled={!doc} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screen },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 8 },
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.accentWash,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  resumeTitle: { fontFamily: fonts.uiSemibold, fontSize: 13.5, color: colors.ink },
  resumeSubtitle: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  resumeAction: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resumeActionLabel: { fontFamily: fonts.uiSemibold, fontSize: 12.5, color: "#fff" },
  resumeDismiss: { fontFamily: fonts.ui, fontSize: 15, color: colors.faint, paddingHorizontal: 2 },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.faint,
    marginBottom: 10,
  },
  logo: {
    fontFamily: fonts.read,
    fontSize: 40,
    color: colors.ink,
    marginBottom: 8,
  },
  logoItalic: {
    fontFamily: fonts.readItalic,
    fontStyle: "italic",
    color: colors.accent,
  },
  subtitle: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    color: colors.sub,
    maxWidth: 320,
    marginBottom: 26,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    backgroundColor: colors.wash,
    borderRadius: 13,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.screen,
    shadowColor: "#14161c",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabLabel: {
    fontFamily: fonts.uiSemibold,
    fontSize: 13,
  },
  pasteArea: {
    width: "100%",
    minHeight: 180,
    padding: 15,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.wash,
    textAlignVertical: "top",
  },
  fileDrop: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 34,
    paddingHorizontal: 20,
    backgroundColor: colors.wash,
  },
  fileIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.screen,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  fileTitle: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.ink },
  fileHint: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.faint, letterSpacing: 0.4 },
  urlRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.wash,
  },
  note: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.faint,
    marginTop: 12,
  },
  sampleLink: { marginTop: 16, paddingVertical: 2 },
  sampleLinkLabel: { fontFamily: fonts.uiSemibold, fontSize: 13.5, color: colors.accent },
  loadStatus: {
    fontFamily: fonts.monoMedium,
    fontSize: 12.5,
    color: colors.sub,
    marginTop: 16,
    minHeight: 16,
  },
  footer: {
    padding: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.screen,
  },
});
