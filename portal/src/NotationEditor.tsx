// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { unifiedMergeView } from '@codemirror/merge'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { useEffect, useRef } from 'react'

import { notationLanguage } from './notation-language'

/**
 * The editor's own chrome, in the design system's tokens.
 *
 * CodeMirror styles itself through a generated stylesheet rather than through
 * class names a consumer can reach, so this is the seam: every declaration
 * resolves a `--nav-*` custom property, which is what keeps the editor on the
 * same palette as the panels around it and re-colors it with them when the
 * reader's OS scheme flips. Nothing here names a color of its own.
 */
const portalTheme = EditorView.theme({
  '&': {
    color: 'var(--nav-color-text)',
    backgroundColor: 'var(--nav-color-surface)',
    fontSize: '13px',
    border: '1px solid var(--nav-color-border)',
    borderRadius: 'var(--nav-radius-sm)',
  },
  '&.cm-focused': {
    outline: 'var(--nav-focus-ring) solid var(--nav-color-focus)',
    outlineOffset: 'var(--nav-focus-offset)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--nav-font-mono)',
    lineHeight: '1.6',
  },
  '.cm-content': { caretColor: 'var(--nav-color-primary)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--nav-color-primary)' },
  '.cm-gutters': {
    backgroundColor: 'var(--nav-color-surface-raised)',
    color: 'var(--nav-color-text-muted)',
    border: 'none',
    borderRight: '1px solid var(--nav-color-border)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--nav-color-surface-subtle)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--nav-color-surface-subtle)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--nav-color-selection)',
  },

  /* The redline itself: what the previous revision said, and what this one
     says instead. Struck-through deletions and a marked insertion are the
     conventions a lawyer already reads, so the diff wears them rather than a
     version-control green and red. */
  '.cm-deletedChunk': {
    backgroundColor: 'var(--nav-color-danger-subtle)',
    color: 'var(--nav-color-on-danger-subtle)',
  },
  '.cm-deletedChunk .cm-deletedText': {
    backgroundColor: 'transparent',
    textDecoration: 'line-through',
  },
  '.cm-changedLine': { backgroundColor: 'var(--nav-color-success-subtle)' },
  '.cm-changedText': {
    backgroundColor: 'transparent',
    borderBottom: '2px solid var(--nav-color-on-success-subtle)',
  },
  '.cm-changedLineGutter': { backgroundColor: 'var(--nav-color-success-subtle)' },
  '.cm-deletedLineGutter': { backgroundColor: 'var(--nav-color-danger-subtle)' },
  '.cm-collapsedLines': {
    backgroundColor: 'var(--nav-color-surface-raised)',
    color: 'var(--nav-color-text-muted)',
    padding: '3px 8px',
  },
})

export interface NotationEditorProps {
  /** The revision on show. */
  doc: string
  /**
   * The revision to redline against. Omit — or pass the same text — for a
   * clean copy: there is nothing to compare the first revision to.
   */
  against?: string
  /** Names the editor for assistive technology. */
  label: string
}

/**
 * The notation document, in an editor.
 *
 * A real editor rather than a highlighted `<pre>`, because the thing on show
 * is source: a reader expects to select a clause, scroll with the keyboard,
 * and see line numbers they can refer to. Edits are the reader's own scratch —
 * this bundle has nowhere to send them, and the buffer is rebuilt from the
 * fixture whenever the revision changes.
 *
 * The whole editor is torn down and recreated when `doc` or `against` changes
 * rather than reconfigured in place. Swapping a document *and* the diff it is
 * measured against is not a transaction CodeMirror can dispatch — the unified
 * merge view holds the original in its own state field — so recreating it is
 * both simpler and the only correct order of operations. Stepping revisions is
 * a button press, not a keystroke, so the cost does not show.
 */
export function NotationEditor({ doc, against, label }: NotationEditorProps) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = host.current
    if (!parent) return

    const redlining = typeof against === 'string' && against !== doc

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc,
        extensions: [
          lineNumbers(),
          history(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          notationLanguage,
          portalTheme,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': label }),
          ...(redlining
            ? [
                unifiedMergeView({
                  original: against,
                  // Accepting or rejecting a chunk would write to a fixture and
                  // report a decision nobody recorded. The redline here is to
                  // be read.
                  mergeControls: false,
                  allowInlineDiffs: true,
                  collapseUnchanged: { margin: 2, minSize: 6 },
                }),
              ]
            : []),
        ],
      }),
    })

    return () => view.destroy()
  }, [doc, against, label])

  return <div ref={host} />
}
