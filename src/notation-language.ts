// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { tags } from '@lezer/highlight'

/**
 * A tokenizer for Neon Law Navigator's markdown notation.
 *
 * Notation is two languages in one file — a YAML frontmatter block, then
 * markdown prose — so the highlighter is a small state machine rather than a
 * grammar: `---` on the first line opens the frontmatter, the next `---` closes
 * it for good, and each half tokenizes on its own terms.
 *
 * `StreamLanguage` rather than a Lezer grammar because the thing being
 * highlighted is a reading surface, not a compiler front end. A line-at-a-time
 * tokenizer cannot express nesting, and nothing here nests: the frontmatter is
 * flat two-level YAML and the body wants headings, bold, and placeholders
 * picked out. A grammar would be more machinery for the same four colors.
 */

interface NotationState {
  /**
   * Which part of the file the tokenizer is in.
   *
   * `start` is the position before the opening fence, and it exists so the
   * two fences can be told apart without asking the stream what line it is on:
   * the first `---` opens, the second closes, and after `body` a `---` is a
   * horizontal rule in prose like any other.
   */
  section: 'start' | 'frontmatter' | 'body'
}

const PLACEHOLDER = /^\{\{[^}]*\}\}/
const YAML_KEY = /^[A-Za-z_][\w-]*(?=\s*:)/
const STATE_ARROW = /^[A-Za-z_][\w]*__[\w]+/

export const notation = StreamLanguage.define<NotationState>({
  name: 'navigator-notation',

  startState: () => ({ section: 'start' }),

  token(stream, state) {
    // The fences, in order: the first opens the frontmatter and the second
    // closes it. A `---` in the body afterwards is a horizontal rule.
    if (stream.sol() && stream.match(/^---\s*$/)) {
      if (state.section === 'start') {
        state.section = 'frontmatter'
        return 'meta'
      }
      if (state.section === 'frontmatter') {
        state.section = 'body'
        return 'meta'
      }
      return 'meta'
    }

    // A file that opens with something other than a fence has no frontmatter.
    if (state.section === 'start') state.section = 'body'

    if (state.section === 'frontmatter') {
      if (stream.sol() && stream.match(/^\s*#.*$/)) return 'comment'
      if (stream.match(YAML_KEY)) return 'propertyName'
      if (stream.match(/^[:{}[\],]/)) return 'punctuation'
      if (stream.match(/^(true|false|null)\b/)) return 'atom'
      if (stream.match(STATE_ARROW)) return 'className'
      if (stream.match(/^_(?=\s*:)/)) return 'keyword'
      if (stream.match(/^(BEGIN|END)\b/)) return 'keyword'
      stream.next()
      return null
    }

    // The body: markdown, with placeholders as the thing worth finding.
    if (stream.match(PLACEHOLDER)) return 'variableName'
    if (stream.sol() && stream.match(/^#{1,6}\s.*$/)) return 'heading'
    if (stream.match(/^\*\*[^*]+\*\*/)) return 'strong'
    if (stream.match(/^"[^"]*"/)) return 'string'
    stream.next()
    return null
  },
})

/**
 * The token colors, drawn from the design system rather than from a palette of
 * this file's own.
 *
 * Every value is a `--nav-*` custom property, so the editor re-colors with the
 * rest of the portal when the reader's OS scheme flips and there is no second
 * palette to keep in sync. `tags.heading` is the one place a weight appears,
 * and it is 700 — the library ships 400 and 700 and nothing between.
 */
const notationHighlight = HighlightStyle.define([
  { tag: tags.meta, color: 'var(--nav-color-text-muted)' },
  { tag: tags.comment, color: 'var(--nav-color-text-muted)', fontStyle: 'italic' },
  { tag: tags.propertyName, color: 'var(--nav-color-primary)' },
  { tag: tags.keyword, color: 'var(--nav-color-link)', fontWeight: '700' },
  { tag: tags.className, color: 'var(--nav-color-text)' },
  { tag: tags.atom, color: 'var(--nav-color-link)' },
  { tag: tags.punctuation, color: 'var(--nav-color-text-muted)' },
  { tag: tags.variableName, color: 'var(--nav-color-link)' },
  { tag: tags.heading, color: 'var(--nav-color-text)', fontWeight: '700' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.string, color: 'var(--nav-color-text)' },
])

/** The language and its colors, as one extension. */
export const notationLanguage: Extension = [notation, syntaxHighlighting(notationHighlight)]
