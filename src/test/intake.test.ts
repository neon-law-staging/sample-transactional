// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'

import { FEES } from '../matter'
import { INTAKE, PERIOD, REQUESTS, dueAt, feeFor, laneFor, periodTotal, triage } from '../intake'

/**
 * Triage is the only real logic in this sample, and it is the logic a client
 * would notice being wrong: a lane decides both when work comes back and
 * whether it is billed on top of the base fee.
 */

describe('which lane an email lands in', () => {
  it('is decided by the address it was sent to', () => {
    expect(laneFor(INTAKE.redline)).toBe('redline')
    expect(laneFor(INTAKE.standard)).toBe('standard')
  })

  it('ignores case and stray whitespace, the way a mail header does', () => {
    expect(laneFor(`  ${INTAKE.redline.toUpperCase()} `)).toBe('redline')
  })

  /**
   * The expedited lane is billable, so an address nobody recognizes must fall
   * to the free lane. Guessing the other way would charge a client for a
   * typo.
   */
  it('falls back to the standard lane for anything unrecognized', () => {
    expect(laneFor('hello@neonlaw.example')).toBe('standard')
    expect(laneFor('')).toBe('standard')
  })

  it('prices only the expedited lane', () => {
    expect(feeFor('redline')).toBe(FEES.redlineContract)
    expect(feeFor('standard')).toBe(0)
  })
})

describe('when a request is due', () => {
  /** Monday 17 August 2026 is a Monday; the fixtures are built around it. */
  const monday = '2026-08-17T09:00:00.000Z'

  it('counts one business day as the next working day', () => {
    expect(dueAt(monday, 1)).toBe('2026-08-18T09:00:00.000Z')
  })

  it('skips the weekend rather than the calendar', () => {
    // Monday + 5 business days is the following Monday, not Saturday.
    expect(dueAt(monday, 5)).toBe('2026-08-24T09:00:00.000Z')
  })

  it('rolls a Friday arrival over the weekend', () => {
    // Friday 21 August + one business day is Monday 24 August.
    expect(dueAt('2026-08-21T15:00:00.000Z', 1)).toBe('2026-08-24T15:00:00.000Z')
  })

  /**
   * A contract sent at noon on Saturday should not already be a day late on
   * Monday morning: the clock starts when the firm's week does.
   */
  it('starts the clock on the next working day for a weekend arrival', () => {
    // Saturday 22 August → clock starts Monday 24th → due Tuesday 25th.
    expect(dueAt('2026-08-22T12:00:00.000Z', 1)).toBe('2026-08-25T12:00:00.000Z')
  })
})

describe('the queue as billed', () => {
  it('charges the base fee plus one surcharge per expedited request', () => {
    const expedited = REQUESTS.filter((request) => laneFor(request.email.to) === 'redline')
    expect(expedited.length).toBeGreaterThan(0)
    expect(periodTotal(REQUESTS)).toBe(
      FEES.baseMonthly + expedited.length * FEES.redlineContract,
    )
  })

  it('bills the base fee and nothing else for an empty period', () => {
    expect(periodTotal([])).toBe(FEES.baseMonthly)
  })

  it('keeps every fixture request inside the period it is billed in', () => {
    for (const request of REQUESTS) {
      expect(request.email.receivedAt >= PERIOD.start).toBe(true)
      expect(request.email.receivedAt <= PERIOD.end).toBe(true)
    }
  })

  it('mails nobody real — every address is under a reserved domain', () => {
    for (const request of REQUESTS) {
      expect(request.email.from).toMatch(/\.example>?$/)
      expect(request.email.to).toMatch(/\.example$/)
    }
  })

  it('triages every fixture request to a lane, a due date, and a fee', () => {
    for (const request of REQUESTS) {
      const { lane, fee, dueAt: due } = triage(request.email)
      expect(['redline', 'standard']).toContain(lane)
      expect(due > request.email.receivedAt).toBe(true)
      expect(fee).toBe(lane === 'redline' ? FEES.redlineContract : 0)
    }
  })
})
