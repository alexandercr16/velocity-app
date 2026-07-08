import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { ImportError } from "./textIngestion";

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function buildHtml(base64: string): string {
  // pdf.js and the source bytes run inside a real browser engine (the WebView),
  // so atob/Uint8Array/pdfjsLib all behave exactly as they do in the original
  // browser prototype — no RN-specific PDF parsing is needed.
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script src="${PDFJS_CDN}"></script></head>
<body><script>
(function(){
  function post(msg){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function base64ToUint8Array(b64){
    var raw = atob(b64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  try {
    if (typeof pdfjsLib === "undefined"){ post({ error: "The PDF reader didn't load. Check your connection and try again." }); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = ${JSON.stringify(PDFJS_WORKER_CDN)};
    var data = base64ToUint8Array(${JSON.stringify(base64)});
    pdfjsLib.getDocument({ data: data }).promise.then(function(pdf){
      var pageTexts = [];
      var chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++){
        (function(n){
          chain = chain.then(function(){
            return pdf.getPage(n).then(function(pg){ return pg.getTextContent(); }).then(function(c){
              pageTexts.push(c.items.map(function(it){ return it.str; }).join(" "));
            });
          });
        })(i);
      }
      chain.then(function(){ post({ text: pageTexts.join("\\n\\n") }); })
           .catch(function(e){ post({ error: "Couldn't extract text from that PDF." }); });
    }).catch(function(e){ post({ error: "Couldn't open that PDF." }); });
  } catch (e) {
    post({ error: String((e && e.message) || e) });
  }
})();
</script></body></html>`;
}

interface Job {
  base64: string;
  resolve: (text: string) => void;
  reject: (err: Error) => void;
}

/**
 * Renders an offscreen WebView on demand to extract text from a PDF's base64
 * bytes via pdf.js, and returns an `extract()` function that resolves once
 * the extraction finishes. Mount the returned `node` anywhere in the tree.
 */
export function usePdfExtractor() {
  const [job, setJob] = useState<Job | null>(null);
  const jobRef = useRef<Job | null>(null);

  const extract = useCallback((base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const next: Job = { base64, resolve, reject };
      jobRef.current = next;
      setJob(next);
    });
  }, []);

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    const current = jobRef.current;
    if (!current) return;
    jobRef.current = null;
    setJob(null);
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.error) current.reject(new ImportError(msg.error));
      else current.resolve(msg.text || "");
    } catch {
      current.reject(new ImportError("Couldn't read that PDF's extracted text."));
    }
  }, []);

  const node = job ? (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        originWhitelist={["*"]}
        source={{ html: buildHtml(job.base64) }}
        onMessage={handleMessage}
        javaScriptEnabled
        onError={() => {
          const current = jobRef.current;
          if (current) {
            jobRef.current = null;
            setJob(null);
            current.reject(new ImportError("The PDF reader failed to load."));
          }
        }}
      />
    </View>
  ) : null;

  return { extract, node };
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    top: -1000,
    left: 0,
  },
});
