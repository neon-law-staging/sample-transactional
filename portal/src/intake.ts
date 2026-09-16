// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { FEES, TURNAROUND } from './matter'

/**
 * Work arriving by email, and what the engagement promises back.
 *
 * The client does not file a ticket; they send mail, the way they always have.
 * So the intake surface is an inbox, and the interesting logic is triage: which
 * lane an email lands in, when that lane's clock says it is due, and what it
 * adds to the month. All three are derived here rather than stored, because a
 * stored due date is a due date that disagrees with the schedule the moment the
 * schedule changes.
 *
 * Fixture data, all of it. Widget Works, Inc. and Halcyon Freight Systems, LLC
 * do not exist, nobody named below is a real person, and no address here
 * resolves — `.example` is reserved by RFC 2606 precisely so a sample cannot
 * mail a stranger.
 */

/** The two lanes the engagement sells. */
export type Lane = 'redline' | 'standard'

/** Where a request has got to. */
export type RequestState = 'received' | 'in_progress' | 'delivered'

export interface InboundEmail {
  id: string
  /** The sender, as the header carries them. */
  from: string
  /** Which intake address they wrote to. This is what picks the lane. */
  to: string
  subject: string
  /** UTC, and rendered in UTC. See `src/format.ts`. */
  receivedAt: string
  body: string
  attachments: string[]
}

export interface WorkRequest {
  email: InboundEmail
  state: RequestState
}

/**
 * The two intake addresses.
 *
 * The lane is chosen by which address the client wrote to, not by reading the
 * subject line for the word "urgent". That matters commercially: the expedited
 * lane carries a per-contract fee, and a client should never be billed for it
 * because a keyword matcher decided their mail sounded rushed. Addressing it is
 * an explicit, auditable choice, and it is the client's to make.
 */
export const INTAKE = {
  redline: 'redline@neonlaw.example',
  standard: 'nexus@neonlaw.example',
} as const

/** Which lane an address buys. Anything unrecognized is the standard lane. */
export function laneFor(to: string): Lane {
  return to.trim().toLowerCase() === INTAKE.redline ? 'redline' : 'standard'
}

/** The schedule row a lane is sold on. */
export function commitmentFor(lane: Lane) {
  const id = lane === 'redline' ? 'redline' : 'standard'
  const commitment = TURNAROUND.find((row) => row.id === id)
  if (!commitment) throw new Error(`no turnaround commitment for the ${lane} lane`)
  return commitment
}

/** What this request adds to the invoice, on top of the base fee. */
export function feeFor(lane: Lane): number {
  return commitmentFor(lane).surcharge
}

const SATURDAY = 6
const SUNDAY = 0

/** Whether a UTC date falls on a working day. */
function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay()
  return day !== SATURDAY && day !== SUNDAY
}

/**
 * When a request received at `receivedAt` is due.
 *
 * Two rules, both of which a real engagement has to state somewhere and this
 * one states here. Mail that arrives on a weekend starts its clock on the next
 * working day, so a contract sent at noon on Saturday is not already a day late
 * on Monday morning. And the count itself skips weekends, because "one business
 * day" is a promise about the firm's working days rather than about the
 * calendar's.
 *
 * It knows nothing about public holidays. A real implementation resolves them
 * against a jurisdiction's calendar — Nevada's, here — and that is a lookup
 * this bundle has no business making up. Treat the result as the schedule's
 * intent rather than as a date to diary.
 */
export function dueAt(receivedAt: string, businessDays: number): string {
  const due = new Date(receivedAt)

  // Weekend arrivals wait for the clock to start.
  while (!isBusinessDay(due)) due.setUTCDate(due.getUTCDate() + 1)

  for (let counted = 0; counted < businessDays; counted += 1) {
    do {
      due.setUTCDate(due.getUTCDate() + 1)
    } while (!isBusinessDay(due))
  }

  return due.toISOString()
}

/** The lane, the commitment, and the due date for one request. */
export function triage(email: InboundEmail) {
  const lane = laneFor(email.to)
  const commitment = commitmentFor(lane)
  return {
    lane,
    commitment,
    fee: commitment.surcharge,
    dueAt: dueAt(email.receivedAt, commitment.days),
  }
}

/**
 * The billing period this queue belongs to.
 *
 * Named rather than derived from the clock. A sample that computed "this month"
 * from `Date.now()` would show an empty queue and a $1,000 invoice from the
 * first of September onwards, and it would do it silently — the kind of bug
 * that is only ever found by whoever demonstrates the thing.
 */
export const PERIOD = {
  label: 'August 2026',
  start: '2026-08-01T00:00:00.000Z',
  end: '2026-08-31T23:59:59.999Z',
} as const

/** The base fee plus every surcharge the queue has earned. */
export function periodTotal(requests: WorkRequest[]): number {
  // `reduce<number>` because `FEES` is `as const`, so `baseMonthly` is the
  // literal type `1000` and would narrow the accumulator to it.
  return requests.reduce<number>(
    (total, request) => total + feeFor(laneFor(request.email.to)),
    FEES.baseMonthly,
  )
}

const CLIENT = 'Dana Whitfield <dana.whitfield@widgetworks.example>'

/** What has come in this period, oldest first. */
export const REQUESTS: WorkRequest[] = [
  {
    state: 'delivered',
    email: {
      id: 'req-1',
      from: CLIENT,
      to: INTAKE.redline,
      subject: 'NDA from Halcyon Freight — need it back tomorrow',
      receivedAt: '2026-08-04T14:22:00.000Z',
      body: `Hi —

Halcyon sent their mutual NDA ahead of the MSA talks and they want it signed before
Thursday's call. Nothing exotic as far as I can tell, but I would rather you look at
the term and the carve-outs than have me guess at them.

Sending this to the redline address so it comes back tomorrow. I understand that
carries the per-contract fee.

Thanks,
Dana`,
      attachments: ['halcyon-mutual-nda.pdf'],
    },
  },
  {
    state: 'delivered',
    email: {
      id: 'req-2',
      from: CLIENT,
      to: INTAKE.standard,
      subject: 'Can we require arbitration in the contractor agreements?',
      receivedAt: '2026-08-06T09:41:00.000Z',
      body: `Not urgent — no contract attached, this is a policy question.

Our contractor agreements are silent on dispute resolution. Someone on the board
asked whether we should be requiring arbitration in them. I do not have a view and
would like one before I am asked again.

Dana`,
      attachments: [],
    },
  },
  {
    state: 'in_progress',
    email: {
      id: 'req-3',
      from: CLIENT,
      to: INTAKE.standard,
      subject: 'Four offer letters for the Q3 engineering hires',
      receivedAt: '2026-08-17T16:05:00.000Z',
      body: `Four offers, all Nevada, all on the standard template we used in Q2. Two are
senior and carry the longer notice period; the other two do not.

Headcount is confirmed, so these are ready to go out as soon as they are checked.
No rush beyond the usual — I have not put them on the redline address.

Dana`,
      attachments: ['q3-offers-draft.docx', 'headcount-approval.pdf'],
    },
  },
  {
    state: 'received',
    email: {
      id: 'req-4',
      from: CLIENT,
      to: INTAKE.redline,
      subject: 'Halcyon MSA — their counter came back, Section 4',
      receivedAt: '2026-08-19T11:30:00.000Z',
      body: `Their counter to our redline just landed. They took most of it but came back on
two clauses — the payment terms and the liability cap, which now has carve-outs I do
not understand well enough to sign off on.

I would like to answer them tomorrow if we can, so this is going to the redline
address. The revision is in the portal already.

Dana`,
      attachments: ['halcyon-msa-r3.md'],
    },
  },
]

/**
 * The timestamp a simulated email arrives at.
 *
 * An hour after whatever is already last in the queue, rather than `Date.now()`.
 * The queue is fixture data sitting in a named billing period, and stamping a
 * new arrival with the wall clock would drop it outside that period, sort it
 * away from its neighbours, and make every test that touched it depend on the
 * day it ran. Simulated time advances with the simulation.
 */
export function nextArrival(requests: WorkRequest[]): string {
  const latest = requests.reduce(
    (at, request) => Math.max(at, new Date(request.email.receivedAt).getTime()),
    new Date(PERIOD.start).getTime(),
  )
  return new Date(latest + 60 * 60 * 1000).toISOString()
}
