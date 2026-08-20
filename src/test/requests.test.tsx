// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { FEES } from '../matter'
import { INTAKE, REQUESTS, laneFor, periodTotal } from '../intake'

function visit(search: string) {
  window.history.pushState({}, '', `/${search}`)
}

beforeEach(() => visit('?tab=requests'))
afterEach(() => visit(''))

/** The inbox table, so a query cannot match the form or the flash by accident. */
function inbox(): HTMLElement {
  const panel = screen.getByRole('heading', { name: 'Inbox' }).closest('section')
  if (!panel) throw new Error('the Inbox panel is missing')
  return panel as HTMLElement
}

describe('the requests view', () => {
  it('is reachable by its own URL', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Requests' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument()
  })

  it('lists everything that has come in', () => {
    render(<App />)
    const rows = within(inbox()).getAllByRole('row')
    // One header row, then the queue.
    expect(rows).toHaveLength(REQUESTS.length + 1)
    for (const request of REQUESTS) {
      expect(within(inbox()).getByText(request.email.subject)).toBeInTheDocument()
    }
  })

  it('leads with the most recent request', () => {
    render(<App />)
    const [, first] = within(inbox()).getAllByRole('row')
    const newest = [...REQUESTS].sort((a, b) =>
      b.email.receivedAt.localeCompare(a.email.receivedAt),
    )[0]
    expect(first).toHaveTextContent(newest?.email.subject ?? '')
  })

  it('states what the period costs, base fee included', () => {
    render(<App />)
    expect(screen.getByText(`$${periodTotal(REQUESTS).toLocaleString('en-US')}`)).toBeInTheDocument()
  })

  it('opens the email it was asked for, verbatim', async () => {
    const user = userEvent.setup()
    render(<App />)

    const target = REQUESTS[0]
    await user.click(
      within(inbox()).getByRole('button', { name: `Read ${target?.email.subject}` }),
    )

    expect(screen.getByRole('heading', { name: 'The email, as received' })).toBeInTheDocument()
    expect(screen.getByText(target?.email.from ?? '')).toBeInTheDocument()
    // The body renders as received, so a distinctive line from it survives.
    const line = (target?.email.body ?? '').split('\n')[0] ?? ''
    expect(screen.getByText(new RegExp(line.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument()
  })

  /**
   * The point of the view. Sending to the expedited address has to produce a
   * one-business-day commitment *and* a charge; sending to the standard one has
   * to produce neither. A portal that quietly billed the free lane, or quietly
   * failed to bill the paid one, is wrong in the way that costs money.
   */
  it('routes a simulated email to the expedited lane, with its fee', async () => {
    const user = userEvent.setup()
    render(<App />)

    const before = within(inbox()).getAllByRole('row').length

    await user.selectOptions(screen.getByLabelText(/^To/), INTAKE.redline)
    await user.type(screen.getByLabelText(/^Subject/), 'Vendor SOW, back tomorrow please')
    await user.type(screen.getByLabelText(/^Message/), 'Short SOW from a logistics vendor.')
    await user.click(screen.getByRole('button', { name: 'Send it' }))

    expect(within(inbox()).getAllByRole('row')).toHaveLength(before + 1)

    const flash = screen.getByText(/Received .Vendor SOW, back tomorrow please/)
    expect(flash).toHaveTextContent('one-business-day')
    expect(flash).toHaveTextContent(`$${FEES.redlineContract}`)
  })

  it('routes a simulated email to the standard lane at no extra charge', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText(/^To/), INTAKE.standard)
    await user.type(screen.getByLabelText(/^Subject/), 'Policy question about notice periods')
    await user.type(screen.getByLabelText(/^Message/), 'No contract attached, just a question.')
    await user.click(screen.getByRole('button', { name: 'Send it' }))

    const flash = screen.getByText(/Received .Policy question about notice periods/)
    expect(flash).toHaveTextContent('five-business-day')
    expect(flash).toHaveTextContent('no charge on top of the base fee')
  })

  it('adds the new request to what the period costs', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText(/^To/), INTAKE.redline)
    await user.type(screen.getByLabelText(/^Subject/), 'One more contract')
    await user.type(screen.getByLabelText(/^Message/), 'Please look at the indemnity.')
    await user.click(screen.getByRole('button', { name: 'Send it' }))

    const expected = periodTotal(REQUESTS) + FEES.redlineContract
    expect(screen.getByText(`$${expected.toLocaleString('en-US')}`)).toBeInTheDocument()
  })

  it('sends nothing when the subject or the message is empty', async () => {
    const user = userEvent.setup()
    render(<App />)

    const before = within(inbox()).getAllByRole('row').length
    await user.type(screen.getByLabelText(/^Subject/), 'Subject with no body')
    await user.click(screen.getByRole('button', { name: 'Send it' }))

    expect(within(inbox()).getAllByRole('row')).toHaveLength(before)
  })

  /**
   * Simulated arrivals are stamped in the fixture's own timeline rather than
   * from the wall clock, so the queue stays inside its billing period and the
   * test does not depend on the day it runs.
   */
  it('stamps a simulated email after the last one, not from the wall clock', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/^Subject/), 'Timeline check')
    await user.type(screen.getByLabelText(/^Message/), 'Checking the arrival stamp.')
    await user.click(screen.getByRole('button', { name: 'Send it' }))

    const latest = REQUESTS.map((request) => request.email.receivedAt).sort().at(-1) ?? ''
    // An hour after the last fixture arrival — 19 August 2026, not today.
    expect(screen.getByText(/Received .Timeline check/)).toHaveTextContent('19 August 2026')
    expect(new Date(latest).getUTCFullYear()).toBe(2026)
  })

  it('never bills a lane the client did not choose', () => {
    render(<App />)
    const expedited = REQUESTS.filter((request) => laneFor(request.email.to) === 'redline')
    const charged = within(inbox()).getAllByText(`$${FEES.redlineContract}`)
    expect(charged).toHaveLength(expedited.length)
  })
})
