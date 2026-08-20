// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { Card, Facts } from './Card'
import { FEES, MATTER, MATTER_FACTS, NEXT_STEPS, TURNAROUND } from './matter'
import { Ready } from './ready'

/** Format a whole-dollar fee. No fractional cents exist in this schedule. */
function money(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: FEES.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-300 bg-white/60 px-6 py-8 dark:border-slate-700 dark:bg-slate-900/50">
        <Ready />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{MATTER.caption}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {MATTER.practice} — your matter workspace
        </p>
      </header>

      <main className="mx-auto grid max-w-3xl gap-4 px-6 py-8">
        <Card title="Your matter">
          <Facts facts={MATTER_FACTS} />
        </Card>

        <Card title="What the engagement costs">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {money(FEES.baseMonthly)} per month covers the standing work. A contract that has to
            come back inside one business day is {money(FEES.redlineContract)} on top of it.
          </p>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th scope="col" className="pb-2 font-medium">
                  Work
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Turnaround
                </th>
                <th scope="col" className="pb-2 font-medium">
                  Fee
                </th>
              </tr>
            </thead>
            <tbody>
              {TURNAROUND.map((lane) => (
                <tr key={lane.id} className="border-t border-slate-200 dark:border-slate-800">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {lane.work}
                  </th>
                  <td className="py-2 pr-3">
                    {lane.days} business {lane.days === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-2">
                    {lane.surcharge === 0 ? 'Included' : `${money(lane.surcharge)} per contract`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {TURNAROUND.map((lane) => (
              <li key={lane.id}>{lane.detail}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Illustrative fixture figures, not an offer. A real engagement&rsquo;s terms live in a
            signed retainer.
          </p>
        </Card>

        <Card title="Next steps">
          <ul className="space-y-3 text-sm">
            {NEXT_STEPS.map((step) => (
              <li key={step.id}>
                <span className="font-medium">{step.title}</span>
                <p className="text-slate-600 dark:text-slate-400">{step.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </main>

      <footer className="px-6 pb-10 text-xs text-slate-500 dark:text-slate-400">
        Fixture data only — {MATTER.caption} is a simulated matter, and Widget Works, Inc. does not
        exist.
      </footer>
    </div>
  )
}
