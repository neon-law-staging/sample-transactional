// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { Badge } from '@neon-law-foundation/navigator-ux'

/**
 * Navigator's mount signal.
 *
 * The element carrying `#sample-transactional-portal-ready` is what Navigator's browser
 * walkthrough waits for, so it has to be rendered by React — a static marker
 * in `index.html` would report "ready" for a bundle that threw on mount.
 *
 * It lives in its own module so the string exists once. An `id` must be unique
 * in a document, so the rule is: exactly one view renders at a time, and every
 * view spends this same kicker. Two copies in two files would eventually become
 * two different strings.
 *
 * The id sits on a wrapper rather than on the `Badge`, because `Badge` takes
 * only its tone and its children: a themed component that accepted arbitrary
 * DOM attributes would be a hole in the library's leaf rule, and the wrapper
 * costs one element to respect it.
 */
export const READY_ID = 'sample-transactional-portal-ready'

export function Ready() {
  return (
    <span id={READY_ID}>
      <Badge tone="ready">Client portal · live</Badge>
    </span>
  )
}
