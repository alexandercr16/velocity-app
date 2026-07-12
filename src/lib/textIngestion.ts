import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";
import { Document } from "../types";

export class ImportError extends Error {}

export const SAMPLE_TEXT =
  'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"\n\nSo she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy and stupid, whether the pleasure of making a daisy chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\nThere was nothing so very remarkable in that, nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually took a watch out of its waistcoat pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it.';

export function tokenize(rawText: string) {
  const paragraphs = rawText
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const words: string[] = [];
  const paraWordCounts: number[] = [];
  paragraphs.forEach((p) => {
    const ws = p.split(/\s+/).filter(Boolean);
    paraWordCounts.push(ws.length);
    words.push(...ws);
  });
  return { paragraphs, words, paraWordCounts };
}

export function buildDocument(rawText: string, sourceLabel: string, title?: string): Document {
  const trimmed = (rawText || "").trim();
  if (!trimmed) throw new ImportError("That didn't produce any readable text.");
  const tok = tokenize(trimmed);
  if (tok.words.length < 5) {
    throw new ImportError("That's very short — try a longer piece.");
  }
  return { rawText: trimmed, ...tok, sourceLabel, title: title || sourceLabel };
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export async function readTxtFile(uri: string, name: string): Promise<Document> {
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return buildDocument(text, name, stripExtension(name));
}

export async function readEpubFile(uri: string, name: string): Promise<Document> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  let zip;
  try {
    zip = await JSZip.loadAsync(base64, { base64: true });
  } catch {
    throw new ImportError("Couldn't open that EPUB.");
  }

  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new ImportError("Couldn't find the EPUB's container.xml.");
  const containerXml = await containerFile.async("string");
  const opfPath = matchAttr(containerXml, "full-path");
  if (!opfPath) throw new ImportError("Couldn't locate the EPUB's content file.");

  const opfFile = zip.file(opfPath) || zip.file(decodeURIComponent(opfPath));
  if (!opfFile) throw new ImportError("Couldn't read the EPUB's content file.");
  const opfXml = await opfFile.async("string");

  const manifest: Record<string, string> = {};
  for (const tag of opfXml.match(/<item\b[^>]*>/gi) || []) {
    const id = matchAttr(tag, "id");
    const href = matchAttr(tag, "href");
    if (id && href) manifest[id] = href;
  }

  const spine: string[] = [];
  for (const tag of opfXml.match(/<itemref\b[^>]*>/gi) || []) {
    const idref = matchAttr(tag, "idref");
    if (idref) spine.push(idref);
  }
  if (!spine.length) throw new ImportError("Couldn't find the EPUB's reading order.");

  const dir = opfPath.includes("/") ? opfPath.split("/").slice(0, -1).join("/") : "";
  const parts: string[] = [];
  for (const id of spine) {
    const href = manifest[id];
    if (!href) continue;
    const filePath = dir ? `${dir}/${href}` : href;
    const entry = zip.file(filePath) || zip.file(decodeURIComponent(filePath));
    if (!entry) continue;
    const html = await entry.async("string");
    parts.push(stripHtml(html));
  }
  return buildDocument(parts.join("\n\n"), name, stripExtension(name));
}

export async function fetchUrlText(url: string): Promise<Document> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ImportError("Couldn't load that URL. Paste the text instead.");
  }
  if (!res.ok) {
    throw new ImportError(`Couldn't load that URL (${res.status}). Paste the text instead.`);
  }
  const html = await res.text();
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  const scope = articleMatch ? articleMatch[0] : bodyMatch ? bodyMatch[0] : html;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
  if (!title) {
    try {
      title = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      title = "Web article";
    }
  }

  return buildDocument(stripHtml(scope), "Page", title);
}

function matchAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"|\\b${attr}\\s*=\\s*'([^']*)'`, "i");
  const m = tag.match(re);
  return m ? m[1] ?? m[2] ?? null : null;
}

function stripHtml(html: string): string {
  let text = html
    .replace(/<(script|style|nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  text = decodeEntities(text);
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function readPdfFile(
  uri: string,
  name: string,
  extractPdfText: (base64: string) => Promise<string>
): Promise<Document> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const text = await extractPdfText(base64);
  return buildDocument(text, name, stripExtension(name));
}
