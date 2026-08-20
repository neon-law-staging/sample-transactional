// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Badge,
  Button,
  ButtonRow,
  Callout,
  Panel,
  Record,
  StatusStrip,
} from '@neon-law-foundation/navigator-ux'
import { useState } from 'react'

import { NotationEditor } from './NotationEditor'
import { REVISIONS } from './notation'

/** The badge tone that says who a revision came from. */
function toneFor(party: 'counterparty' | 'counsel') {
  return party === 'counsel' ? 'review' : 'source'
}

/**
 * The contract under review, one revision at a time.
 *
 * The page is a stepper rather than a list because a redline is inherently
 * pairwise: what is interesting is not revision 2 but what revision 2 did to
 * revision 1. Stepping backwards is the same question asked in the other
 * direction, and it is the one a client actually asks — "what did they change
 * since we sent it".
 *
 * The revision index is component state rather than a `?rev=` parameter. Every
 * other navigation in this portal is a real link for the reasons the design
 * system gives, but the redline is a comparison the reader scrubs through, and
 * a full document load per step would rebuild the editor and lose their scroll
 * position in the clause they were reading.
 */
export function Redline() {
  const [index, setIndex] = useState(REVISIONS.length - 1)

  const revision = REVISIONS[index]
  if (!revision) throw new Error('REVISIONS must not be empty')

  const previous = index > 0 ? REVISIONS[index - 1] : undefined
  const [redlining, setRedlining] = useState(true)
  const showingRedline = redlining && previous !== undefined

  return (
    <>
      <Panel
        title="Master Services Agreement"
        note="Widget Works, Inc. and Halcyon Freight Systems, LLC — under review on the Redline lane"
        actions={<Badge tone={toneFor(revision.party)}>{revision.author}</Badge>}
      >
        <StatusStrip
          cells={[
            { label: 'Revision', value: `${index + 1} of ${REVISIONS.length}` },
            { label: 'Received', value: revision.when },
            { label: 'Notation', value: 'nexus__msa' },
            { label: 'Status', value: index === REVISIONS.length - 1 ? 'Awaiting reply' : 'Superseded' },
          ]}
        />

        <ButtonRow>
          <Button onClick={() => setIndex((at) => Math.max(0, at - 1))} disabled={index === 0}>
            ← Earlier revision
          </Button>
          <Button
            variant="primary"
            onClick={() => setIndex((at) => Math.min(REVISIONS.length - 1, at + 1))}
            disabled={index === REVISIONS.length - 1}
          >
            Later revision →
          </Button>
          <Button onClick={() => setRedlining((on) => !on)} disabled={!previous}>
            {showingRedline ? 'Hide redline' : 'Show redline'}
          </Button>
        </ButtonRow>

        <p>{revision.summary}</p>

        {previous ? (
          <p>
            {showingRedline
              ? `Struck-through text is what ${previous.label.replace(/ —.*/, '').toLowerCase()} said; underlined text is what this revision says instead. Unchanged runs are collapsed.`
              : 'Showing the clean copy. Nothing is marked up.'}
          </p>
        ) : (
          <p>This is the draft as it arrived, so there is nothing to compare it against yet.</p>
        )}
      </Panel>

      <Panel title={showingRedline ? 'Redline' : 'Clean copy'}>
        <NotationEditor
          doc={revision.body}
          against={showingRedline ? previous?.body : undefined}
          label={`${revision.label}, in Navigator notation`}
        />
        <Callout tone="info">
          This is Neon Law Navigator&rsquo;s markdown notation: a YAML frontmatter block declaring
          the intake questionnaire and the workflow that renders, reviews, and signs the document,
          over a prose body carrying <code>{'{{question_code}}'}</code> placeholders resolved from
          the client&rsquo;s answers. Editing here is your own scratch — the buffer is rebuilt from
          the fixture each time you step.
        </Callout>
      </Panel>

      {revision.changes.length > 0 ? (
        <Panel title="What moved in this revision">
          <ul>
            {revision.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Revision history">
        {REVISIONS.map((entry, at) => (
          // `Record` renders its children inside a `<p>`, so they have to be
          // phrasing content. The control to jump to a revision is a sibling
          // rather than a child for that reason, not for a visual one.
          <div key={entry.id}>
            <Record
              dateTime={entry.dateTime}
              when={entry.when}
              title={
                at === index ? (
                  <>
                    {entry.label} <Badge tone="active">Showing</Badge>
                  </>
                ) : (
                  entry.label
                )
              }
            >
              {`${entry.author}. ${entry.summary}`}
            </Record>
            {at === index ? null : (
              <ButtonRow>
                <Button onClick={() => setIndex(at)}>Show this revision</Button>
              </ButtonRow>
            )}
          </div>
        ))}
      </Panel>
    </>
  )
}
