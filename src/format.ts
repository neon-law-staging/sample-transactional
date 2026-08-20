// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { FEES } from './matter'

/**
 * How this portal writes money and dates.
 *
 * Both formatters pin their locale and, for dates, their time zone. A portal
 * that formatted in the reader's zone would show a request received at
 * 09:14 UTC on a Friday as Thursday to a reader in Los Angeles — and a
 * turnaround commitment that disagrees with the client's calendar about which
 * day the clock started is worse than no date at all. The fixture's timestamps
 * are UTC, so UTC is what they render in.
 */

/** Format a whole-dollar fee. No fractional cents exist in this schedule. */
export function money(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: FEES.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const DAY = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const MOMENT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

/** "21 August 2026". */
export function formatDay(iso: string): string {
  return DAY.format(new Date(iso))
}

/** "12 August 2026, 09:14". */
export function formatMoment(iso: string): string {
  return MOMENT.format(new Date(iso))
}
