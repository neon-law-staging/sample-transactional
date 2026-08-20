// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactNode } from 'react'

import { cn } from './lib/utils'

/**
 * The one surface this portal composes everything from.
 *
 * It takes its content as props and imports no application module, so the seam
 * between "what this matter says" and "how a matter looks" is a file boundary
 * you can see. A real portal replaces the data modules beside it with a
 * same-origin read against Navigator's `/app/api`; this does not change.
 */
export function Card({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-300 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-900/60',
        className,
      )}
    >
      <h2 className="mb-3 text-base font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** A label/value strip: the facts a client should not have to hunt for. */
export function Facts({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {fact.label}
          </dt>
          <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
