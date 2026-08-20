// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ActionList,
  Callout,
  Panel,
  Prose,
  StatusStrip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@neon-law-foundation/navigator-ux'

import { FEES, MATTER_FACTS, NEXT_STEPS, TURNAROUND } from './matter'
import { money } from './format'

/** What the engagement is and what it costs — the portal's landing view. */
export function Overview() {
  return (
    <>
      <StatusStrip cells={MATTER_FACTS.map(({ label, value }) => ({ label, value }))} />

      <Panel title="What the engagement costs">
        <p>
          {money(FEES.baseMonthly)} per month covers the standing work. A contract that has to come
          back inside one business day is {money(FEES.redlineContract)} on top of it.
        </p>

        <Table caption="Turnaround commitments and what each lane costs">
          <TableHeader>
            <TableRow>
              <TableHead>Work</TableHead>
              <TableHead>Turnaround</TableHead>
              <TableHead>Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TURNAROUND.map((lane) => (
              <TableRow key={lane.id}>
                <TableHead scope="row">{lane.work}</TableHead>
                <TableCell>
                  {lane.days} business {lane.days === 1 ? 'day' : 'days'}
                </TableCell>
                <TableCell>
                  {lane.surcharge === 0 ? 'Included' : `${money(lane.surcharge)} per contract`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Prose paragraphs={TURNAROUND.map((lane) => [{ text: lane.detail }])} />

        <Callout tone="warning">
          Illustrative fixture figures, not an offer. A real engagement&rsquo;s terms live in a
          signed retainer.
        </Callout>
      </Panel>

      <Panel title="Next steps">
        <ActionList items={NEXT_STEPS.map(({ id, title, detail }) => ({ id, title, detail }))} />
      </Panel>
    </>
  )
}
