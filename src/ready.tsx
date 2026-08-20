// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Navigator's mount signal.
 *
 * The element carrying `#widget-works-portal-ready` is what Navigator's browser
 * walkthrough waits for, so it has to be rendered by React — a static marker
 * in `index.html` would report "ready" for a bundle that threw on mount.
 *
 * It lives in its own module so the string exists once. An `id` must be unique
 * in a document, so the rule is: exactly one view renders at a time, and every
 * view spends this same kicker. Two copies in two files would eventually become
 * two different strings.
 */
export const READY_ID = 'widget-works-portal-ready'

export function Ready() {
  return (
    <span
      id={READY_ID}
      className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
    >
      Client portal · live
    </span>
  )
}
