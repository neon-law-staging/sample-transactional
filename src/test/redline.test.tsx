// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { REVISIONS } from '../notation'

/**
 * The redline view, reached the way a reader reaches it.
 *
 * These render `App` rather than `Redline` directly, because half of what is
 * being asserted is the routing: the view is a real URL, so a test that
 * imported the page component would pass while the link that reaches it was
 * broken.
 */

function visit(search: string) {
  window.history.pushState({}, '', `/${search}`)
}

beforeEach(() => visit(''))
afterEach(() => visit(''))

describe('the contract redline', () => {
  it('is not the landing view', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'What the engagement costs' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Revision history' })).not.toBeInTheDocument()
  })

  it('is reachable by its own URL, so it can be linked and refreshed', () => {
    visit('?tab=redline')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Master Services Agreement' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contract redline' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens on the most recent revision, which is the one awaiting a reply', () => {
    visit('?tab=redline')
    render(<App />)
    expect(screen.getByText(`${REVISIONS.length} of ${REVISIONS.length}`)).toBeInTheDocument()
    expect(screen.getByText('Awaiting reply')).toBeInTheDocument()
  })

  /**
   * The whole point of the page. A client asks "what did they change since we
   * sent it", and answering it means stepping back one revision and reading
   * the diff — so both directions have to work, and the ends have to stop.
   */
  it('steps backwards and forwards through the negotiation', async () => {
    const user = userEvent.setup()
    visit('?tab=redline')
    render(<App />)

    const earlier = screen.getByRole('button', { name: /Earlier revision/ })
    const later = screen.getByRole('button', { name: /Later revision/ })

    expect(later).toBeDisabled()

    for (let at = REVISIONS.length - 1; at > 0; at -= 1) {
      // Serial on purpose: each click acts on the state the last one left, and
      // the assertion between them is what proves the step landed. `perf`
      // flags this shape because parallelizing independent awaits is usually
      // right; these are not independent.
      // eslint-disable-next-line no-await-in-loop
      await user.click(earlier)
      expect(screen.getByText(`${at} of ${REVISIONS.length}`)).toBeInTheDocument()
    }
    expect(earlier).toBeDisabled()

    await user.click(later)
    expect(screen.getByText(`2 of ${REVISIONS.length}`)).toBeInTheDocument()
  })

  it('names who sent the revision on show', async () => {
    const user = userEvent.setup()
    visit('?tab=redline')
    render(<App />)

    const last = REVISIONS[REVISIONS.length - 1]
    expect(screen.getAllByText(last?.author ?? '').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Earlier revision/ }))
    expect(screen.getAllByText(REVISIONS[1]?.author ?? '').length).toBeGreaterThan(0)
  })

  /**
   * There is nothing behind the first revision, so the redline controls have
   * to say so rather than offer a comparison against an empty document.
   */
  it('offers no redline on the draft as received', async () => {
    const user = userEvent.setup()
    visit('?tab=redline')
    render(<App />)

    for (let step = 0; step < REVISIONS.length - 1; step += 1) {
      // Serial for the same reason as above: this walks back to the first
      // revision one step at a time, which is the only way to get there.
      // eslint-disable-next-line no-await-in-loop
      await user.click(screen.getByRole('button', { name: /Earlier revision/ }))
    }

    expect(screen.getByRole('button', { name: /redline/i })).toBeDisabled()
    expect(screen.getByText(/nothing to compare it against/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Clean copy' })).toBeInTheDocument()
  })

  it('lists the history and jumps to a revision from it', async () => {
    const user = userEvent.setup()
    visit('?tab=redline')
    render(<App />)

    const history = screen
      .getByRole('heading', { name: 'Revision history' })
      .closest('section') as HTMLElement
    expect(history).not.toBeNull()

    for (const revision of REVISIONS) {
      expect(within(history).getByText(revision.label)).toBeInTheDocument()
    }

    const [jump] = within(history).getAllByRole('button', { name: 'Show this revision' })
    await user.click(jump as HTMLElement)
    expect(screen.getByText(`1 of ${REVISIONS.length}`)).toBeInTheDocument()
  })

  it('says the figures are fixture data, on this view too', () => {
    visit('?tab=redline')
    render(<App />)
    expect(screen.getByText(/simulated matter/)).toBeInTheDocument()
  })
})
