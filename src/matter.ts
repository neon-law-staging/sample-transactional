// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The matter this portal renders — fixture data, and nothing else.
 *
 * *Widget Works — Outside Counsel* is simulated. Widget Works, Inc. does not
 * exist, nobody named below is a real person, and no figure here describes a
 * real engagement. It is one of the three matters Navigator's own seed opens
 * (`store/src/seed.rs`), which is why the code and the caption match that seed
 * exactly: a sample that disagrees with the fixture it is served beside
 * teaches the wrong thing.
 *
 * Data lives here rather than inside a component on purpose. The components
 * take their data as props and import no application module, so the seam
 * between "what this matter says" and "how a matter looks" is a file boundary.
 * A real portal replaces this module with a same-origin read against
 * Navigator's `/app/api`; the components above it do not change.
 */

export const MATTER = {
  /** The Project code. It is also the first segment of the bucket prefix. */
  code: 'widget-works',
  caption: 'Widget Works — Outside Counsel',
  client: 'Widget Works, Inc.',
  practice: 'Employment agreements and contract review',
  jurisdiction: 'Nevada',
} as const

/**
 * What the engagement costs, and what it buys.
 *
 * The point of this matter as a sample is that it is *transactional*: the
 * client is not in front of a court, they are buying a predictable volume of
 * routine work at a predictable price. So the fee schedule is the thing the
 * portal leads with, where a litigation portal would lead with the pleadings.
 *
 * Every figure is invented, and the schedule is illustrative rather than an
 * offer. A real engagement's terms live in a signed retainer, not in a bundle.
 */
export const FEES = {
  baseMonthly: 1_000,
  redlineContract: 100,
  currency: 'USD',
} as const

/**
 * The two turnaround commitments, which are the whole shape of the deal: one
 * business day for a Redline contract at a per-contract fee, five for
 * everything else at no extra charge.
 */
export const TURNAROUND = [
  {
    id: 'redline',
    work: 'A contract from Redline',
    days: 1,
    surcharge: FEES.redlineContract,
    detail:
      'One business day. Billed per contract on top of the base fee, because a next-day commitment is what costs the firm its own scheduling flexibility.',
  },
  {
    id: 'standard',
    work: 'Everything else',
    days: 5,
    surcharge: 0,
    detail:
      'Five business days, covered by the base fee. Employment agreements, amendments, policy review, and the ordinary questions a company counsel answers.',
  },
] as const

export const MATTER_FACTS = [
  { label: 'Client', value: MATTER.client },
  { label: 'Practice', value: MATTER.practice },
  { label: 'Jurisdiction', value: MATTER.jurisdiction },
  { label: 'Data', value: 'Fixture only' },
]

/** What the client is being asked to do next. */
export const NEXT_STEPS = [
  {
    id: 'employment-queue',
    title: "Review this month's employment agreement queue",
    detail:
      'Four offers are drafted and waiting on your headcount confirmation before they go out.',
  },
  {
    id: 'redline-contract',
    title: 'Send a Redline contract for one-business-day turnaround',
    detail:
      'Anything you need back tomorrow goes through this lane. It carries a per-contract fee; everything else runs on the five-day standard.',
  },
  {
    id: 'ask-questions',
    title: 'Message your legal team with questions',
    detail: 'Anything unclear is worth raising early rather than at a deadline.',
  },
]
