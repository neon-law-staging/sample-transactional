// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Badge,
  Button,
  ButtonRow,
  Callout,
  DataTable,
  type DataColumn,
  Flash,
  FormCard,
  Panel,
  SelectField,
  SourceThread,
  StatusStrip,
  TextField,
  TextareaField,
} from '@neon-law-foundation/navigator-ux'
import { useState, type FormEvent } from 'react'

import { FEES } from './matter'
import { formatDay, formatMoment, money } from './format'
import {
  INTAKE,
  PERIOD,
  REQUESTS,
  type Lane,
  type RequestState,
  type WorkRequest,
  laneFor,
  nextArrival,
  periodTotal,
  triage,
} from './intake'

const LANE_LABEL: Record<Lane, string> = {
  redline: 'Redline — one business day',
  standard: 'Standard — five business days',
}

/** The lane's name mid-sentence, where the table's dashed label reads badly. */
const LANE_PROSE: Record<Lane, string> = {
  redline: 'one-business-day',
  standard: 'five-business-day',
}

const STATE_LABEL: Record<RequestState, string> = {
  received: 'Received',
  in_progress: 'In progress',
  delivered: 'Delivered',
}

/** The badge tone that carries a request's state without needing the word. */
const STATE_TONE: Record<RequestState, 'next' | 'active' | 'ready'> = {
  received: 'next',
  in_progress: 'active',
  delivered: 'ready',
}

/**
 * The inbox columns.
 *
 * Defined at module scope and taking `onRead` as an argument rather than
 * written inline in the component. A `cell` callback that returns JSX reads as
 * a component definition, and one defined during render is a new component
 * type on every render — React unmounts and remounts the subtree rather than
 * updating it. Here that would only cost a little work; the habit is what
 * matters, and `react/no-unstable-nested-components` enforces it.
 */
function INBOX_COLUMNS(onRead: (id: string) => void): DataColumn<WorkRequest>[] {
  return [
    {
      key: 'received',
      header: 'Received',
      cell: (request) => formatMoment(request.email.receivedAt),
    },
    { key: 'subject', header: 'Subject', cell: (request) => request.email.subject },
    { key: 'lane', header: 'Lane', cell: (request) => LANE_LABEL[triage(request.email).lane] },
    { key: 'due', header: 'Due', cell: (request) => formatDay(triage(request.email).dueAt) },
    {
      key: 'fee',
      header: 'Fee',
      cell: (request) => {
        const { fee } = triage(request.email)
        return fee === 0 ? 'Included' : money(fee)
      },
    },
    {
      key: 'state',
      header: 'State',
      cell: (request) => (
        <Badge tone={STATE_TONE[request.state]}>{STATE_LABEL[request.state]}</Badge>
      ),
    },
    {
      key: 'read',
      header: 'Email',
      // Named rather than left as a column of identical "Read" buttons, which
      // announce as "button" and nothing else. An `aria-label` rather than
      // visually-hidden text so the subject is not also duplicated into the
      // row's own text.
      cell: (request) => (
        <Button
          aria-label={`Read ${request.email.subject}`}
          onClick={() => onRead(request.email.id)}
        >
          Read
        </Button>
      ),
    },
  ]
}

/** Newest first — the thing that just arrived is the thing being asked about. */
function newestFirst(requests: WorkRequest[]): WorkRequest[] {
  return [...requests].sort((a, b) => b.email.receivedAt.localeCompare(a.email.receivedAt))
}

/**
 * The intake queue: what the client has asked for, and what was promised back.
 *
 * Requests arrive as email because that is how they actually arrive. The
 * interesting part is not the inbox but the triage beside it — the address the
 * client wrote to picks a lane, the lane sets a turnaround and a fee, and the
 * two together are the whole of what this engagement sells. Sending a simulated
 * email is the shortest way to make that legible: choose an address, watch a
 * due date and a charge appear.
 */
export function Requests() {
  const [requests, setRequests] = useState<WorkRequest[]>(REQUESTS)
  const [reading, setReading] = useState<string | null>(null)
  const [sent, setSent] = useState<WorkRequest | null>(null)

  const ordered = newestFirst(requests)
  const open = requests.filter((request) => request.state !== 'delivered')
  const expedited = requests.filter((request) => laneFor(request.email.to) === 'redline')

  const nextDue = open
    .map((request) => triage(request.email).dueAt)
    .sort((a, b) => a.localeCompare(b))[0]

  const shown = reading
    ? (requests.find((request) => request.email.id === reading) ?? null)
    : null

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    const subject = String(form.get('subject') ?? '').trim()
    const body = String(form.get('body') ?? '').trim()
    if (!subject || !body) return

    const arrival: WorkRequest = {
      state: 'received',
      email: {
        id: `req-${requests.length + 1}`,
        from: 'Dana Whitfield <dana.whitfield@widgetworks.example>',
        to: String(form.get('to') ?? INTAKE.standard),
        subject,
        receivedAt: nextArrival(requests),
        body,
        attachments: [],
      },
    }

    setRequests((queue) => [...queue, arrival])
    setSent(arrival)
    setReading(arrival.email.id)
    event.currentTarget.reset()
  }

  return (
    <>
      <Panel
        title="Requests"
        note={`Everything Widget Works has sent in ${PERIOD.label}, and what the engagement owes back`}
      >
        <StatusStrip
          cells={[
            { label: 'Received', value: `${requests.length} this period` },
            { label: 'Still open', value: `${open.length}` },
            {
              label: 'Next due',
              value: nextDue ? formatDay(nextDue) : 'Nothing outstanding',
            },
            {
              label: 'Charges',
              value: money(periodTotal(requests)),
              tone: expedited.length > 0 ? 'term-upside' : 'default',
            },
          ]}
        />
        <p>
          {money(FEES.baseMonthly)} base, plus {money(FEES.redlineContract)} for each of the{' '}
          {expedited.length} {expedited.length === 1 ? 'contract' : 'contracts'} sent to the
          one-business-day address. Everything else is covered by the base fee.
        </p>
      </Panel>

      {sent ? (
        <Flash tone="success">
          Received &ldquo;{sent.email.subject}&rdquo; on {formatMoment(sent.email.receivedAt)}.
          Routed to the {LANE_PROSE[triage(sent.email).lane]} lane, due{' '}
          {formatDay(triage(sent.email).dueAt)}
          {triage(sent.email).fee > 0
            ? `, and billed ${money(triage(sent.email).fee)} on top of the base fee.`
            : ', at no charge on top of the base fee.'}
        </Flash>
      ) : null}

      <FormCard
        title="Simulate an incoming email"
        intro="Send a request the way the client would. Which address you write to is what picks the lane — the firm does not read the subject line for urgency and bill you for what it finds."
        onSubmit={send}
      >
        <TextField
          label="From"
          name="from"
          value="Dana Whitfield <dana.whitfield@widgetworks.example>"
          readOnly
          help="The portal is signed in as the client, so mail can only come from them."
        />
        <SelectField
          label="To"
          name="to"
          required
          defaultValue={INTAKE.standard}
          options={[
            { value: INTAKE.standard, label: `${INTAKE.standard} — five business days, included` },
            {
              value: INTAKE.redline,
              label: `${INTAKE.redline} — one business day, ${money(FEES.redlineContract)} per contract`,
            },
          ]}
          help="The expedited address carries a per-contract fee. Choosing it is the client's decision to make, not an inference from the wording."
        />
        <TextField label="Subject" name="subject" required defaultValue="" />
        <TextareaField label="Message" name="body" required rows={5} defaultValue="" />
        <ButtonRow>
          <Button type="submit" variant="primary">
            Send it
          </Button>
        </ButtonRow>
      </FormCard>

      <Panel title="Inbox">
        <DataTable
          caption={`Requests received in ${PERIOD.label}, newest first`}
          rows={ordered}
          rowKey={(request) => request.email.id}
          empty="Nothing has come in this period."
          columns={INBOX_COLUMNS(setReading)}
        />
      </Panel>

      {shown ? (
        <Panel
          title="The email, as received"
          actions={
            <ButtonRow>
              <Badge tone="source">{LANE_LABEL[triage(shown.email).lane]}</Badge>
              <Button onClick={() => setReading(null)}>Close</Button>
            </ButtonRow>
          }
        >
          <SourceThread
            messages={[
              {
                id: shown.email.id,
                meta: [
                  { label: 'From', value: shown.email.from },
                  { label: 'To', value: shown.email.to },
                  { label: 'Received', value: formatMoment(shown.email.receivedAt) },
                  { label: 'Subject', value: shown.email.subject },
                  {
                    label: 'Attachments',
                    value:
                      shown.email.attachments.length > 0
                        ? shown.email.attachments.join(', ')
                        : 'None',
                  },
                ],
                body: shown.email.body,
              },
            ]}
          />
          <Callout tone="info">
            Addressed to <strong>{shown.email.to}</strong>, so it runs on the{' '}
            {LANE_PROSE[triage(shown.email).lane]} lane and is due{' '}
            {formatDay(triage(shown.email).dueAt)}.{' '}
            {triage(shown.email).fee > 0
              ? `It carries ${money(triage(shown.email).fee)} on top of the base fee.`
              : 'It is covered by the base fee.'}{' '}
            Weekends do not count against a turnaround, and public holidays are not modelled here.
          </Callout>
        </Panel>
      ) : null}
    </>
  )
}
