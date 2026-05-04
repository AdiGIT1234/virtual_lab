import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "12px",
    fontFamily: "'Inconsolata', 'Fira Code', 'Courier New', monospace",
    background: "#0d1117",
  },
  ".cm-content": {
    padding: "8px 0",
    caretColor: "#00e5ff",
  },
  ".cm-scroller": {
    overflow: "auto",
    lineHeight: "1.6",
  },
  ".cm-gutters": {
    background: "#0d1117",
    color: "#3d4451",
    border: "none",
    borderRight: "1px solid #21262d",
  },
  ".cm-activeLineGutter": {
    background: "#161b22",
  },
  ".cm-activeLine": {
    background: "#161b22",
  },
  ".cm-cursor": {
    borderLeftColor: "#00e5ff",
  },
  ".cm-selectionBackground, ::selection": {
    background: "rgba(0,229,255,0.15) !important",
  },
  ".cm-matchingBracket": {
    outline: "1px solid rgba(0,229,255,0.6)",
    background: "rgba(0,229,255,0.08)",
  },
});

const extensions = [
  history(),
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  bracketMatching(),
  cpp(),
  oneDark,
  baseTheme,
  keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
];

export default function CodeEditor({ value, onChange }) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value ?? "",
        extensions: [
          ...extensions,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []); // mount once

  // Sync external value changes without losing cursor position
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value ?? "" },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", overflow: "hidden" }}
      aria-label="Code editor"
    />
  );
}
