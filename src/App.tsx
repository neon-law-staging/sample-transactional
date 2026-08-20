// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { CaseHead, LegalDisclaimer, LinkTabs, Shell, Stack } from '@neon-law-foundation/navigator-ux'

import { MATTER } from './matter'
import { Overview } from './Overview'
import { Redline } from './Redline'
import { Requests } from './Requests'
import { portalPath } from './mount'
import { Ready } from './ready'

/** The views this portal serves, in the order they appear in the tab row. */
const VIEWS = ['overview', 'requests', 'redline'] as const
type View = (typeof VIEWS)[number]

const LABELS: Record<View, string> = {
  overview: 'Overview',
  requests: 'Requests',
  redline: 'Contract redline',
}

/**
 * Which view the URL asks for.
 *
 * `?tab=` rather than a path segment because this bundle is a static mount
 * with no server-side router: Navigator serves the document at the mount, and
 * a deep path under it would depend on a rewrite this application cannot
 * declare. A query parameter is served by the same document, and it is still a
 * real URL — bookmarkable, refreshable, and openable in a new tab, which is
 * what client-side view state is not.
 *
 * Anything unrecognized falls back to the overview rather than erroring. A
 * stale link is a reader who should land somewhere sensible.
 */
function requestedView(search: string): View {
  const tab = new URLSearchParams(search).get('tab')
  return VIEWS.find((view) => view === tab) ?? 'overview'
}

/**
 * The portal, composed entirely from Navigator UX.
 *
 * Every surface here is a library component reading the `--nav-*` tokens, so
 * this file carries no color, no spacing, and no type decision of its own —
 * restyling the portal is a token override in the library's layer 2, not an
 * edit to this file.
 */
export function App() {
  const view = requestedView(window.location.search)

  return (
    <Shell>
      <Stack>
        <CaseHead
          kicker={<Ready />}
          title={MATTER.caption}
          summary={`${MATTER.practice} — your matter workspace`}
        />

        <LinkTabs
          aria-label="Portal views"
          tabs={VIEWS.map((each) => ({
            label: LABELS[each],
            href: each === 'overview' ? portalPath('') : portalPath(`?tab=${each}`),
            current: each === view,
          }))}
        />

        {view === 'redline' ? <Redline /> : null}
        {view === 'requests' ? <Requests /> : null}
        {view === 'overview' ? <Overview /> : null}

        <LegalDisclaimer>
          Fixture data only — {MATTER.caption} is a simulated matter, and neither Widget Works,
          Inc. nor Halcyon Freight Systems, LLC exists.
        </LegalDisclaimer>
      </Stack>
    </Shell>
  )
}
