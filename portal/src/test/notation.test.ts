// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'

import { REVISIONS } from '../notation'

/**
 * The sample is only worth reading if it is a real notation.
 *
 * A portal that showed a plausible-looking markdown file and called it
 * Navigator notation would teach the format wrong to exactly the audience this
 * repository exists for, and it would do it convincingly. So the shape is
 * asserted rather than assumed: fenced frontmatter, the keys `docs/notation.md`
 * requires, one linear questionnaire chain, and a workflow that terminates.
 */

/** The frontmatter block, without its fences. */
function frontmatter(body: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(body)
  if (!match?.[1]) throw new Error('no fenced frontmatter block')
  return match[1]
}

describe('the sample MSA, as Navigator notation', () => {
  it('is a negotiation rather than a single document', () => {
    expect(REVISIONS.length).toBeGreaterThanOrEqual(3)
    // Only the first revision arrives unmarked; every later one says what moved.
    expect(REVISIONS[0]?.changes).toHaveLength(0)
    for (const revision of REVISIONS.slice(1)) {
      expect(revision.changes.length, `${revision.id} lists no changes`).toBeGreaterThan(0)
    }
  })

  it('runs oldest first, so stepping forward moves forward in time', () => {
    const dates = REVISIONS.map((revision) => revision.dateTime)
    expect([...dates].sort()).toEqual(dates)
  })

  it.each(REVISIONS.map((revision) => [revision.id, revision] as const))(
    '%s declares the frontmatter a Template requires',
    (_id, revision) => {
      const front = frontmatter(revision.body)
      // N101–N105: the keys every template carries, whatever it is for.
      for (const key of ['title', 'respondent_type', 'jurisdiction', 'code', 'confidential']) {
        expect(front, `missing ${key}`).toMatch(new RegExp(`^${key}:`, 'm'))
      }
      expect(front).toContain('questionnaire:')
      expect(front).toContain('workflow:')
    },
  )

  it.each(REVISIONS.map((revision) => [revision.id, revision] as const))(
    '%s walks one linear questionnaire chain from BEGIN to END',
    (_id, revision) => {
      const front = frontmatter(revision.body)
      const block = /questionnaire:\n([\s\S]*?)\nworkflow:/.exec(front)?.[1] ?? ''

      // Each state's `_:` is the only transition a questionnaire may declare,
      // and the chain has to reach END through every state it names.
      const steps = new Map<string, string>()
      const lines = block.split('\n')
      for (const [at, line] of lines.entries()) {
        const state = /^ {2}(\S+):\s*(\{\})?\s*$/.exec(line)?.[1]
        if (!state) continue
        const next = /^ {4}_: (\S+)\s*$/.exec(lines[at + 1] ?? '')?.[1]
        if (next) steps.set(state, next)
      }

      expect(steps.get('BEGIN'), 'the chain does not start at BEGIN').toBeDefined()
      let state = 'BEGIN'
      const walked = new Set<string>([state])
      while (state !== 'END') {
        const next = steps.get(state)
        expect(next, `${state} has no \`_\` transition`).toBeDefined()
        state = next as string
        expect(walked.has(state), `${state} is revisited — the chain must be linear`).toBe(false)
        walked.add(state)
      }
      // Every state the block declares is on the walk, so none is stranded.
      expect(walked.size).toBe(steps.size + 1)
    },
  )

  it.each(REVISIONS.map((revision) => [revision.id, revision] as const))(
    '%s resolves every custom question it asks against a prompt',
    (_id, revision) => {
      const front = frontmatter(revision.body)
      // N104: a `custom_<type>__<key>` state needs a matching `prompts:` entry.
      for (const [, key] of front.matchAll(/^ {2}custom_\w+__(\w+):/gm)) {
        expect(front, `no prompt for ${key}`).toMatch(new RegExp(`^ {2}${key}:`, 'm'))
      }
    },
  )

  it.each(REVISIONS.map((revision) => [revision.id, revision] as const))(
    '%s carries a prose body under the frontmatter',
    (_id, revision) => {
      const body = revision.body.split(/\n---\n/)[1] ?? ''
      expect(body).toMatch(/^\s*## 1\. Services/m)
      // The placeholders are the point of the format: prose that resolves from
      // the client's answers rather than prose with a name typed into it.
      expect(body).toMatch(/\{\{entity__company\.name\}\}/)
      expect(body).toMatch(/\{\{entity__counterparty\.name\}\}/)
    },
  )

  it('actually redlines — each revision differs from the one before it', () => {
    for (const [at, revision] of REVISIONS.entries()) {
      if (at === 0) continue
      expect(revision.body).not.toBe(REVISIONS[at - 1]?.body)
    }
  })
})
