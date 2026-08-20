// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * The design system's one stylesheet: the fonts, the `--nav-*` tokens, and
 * every component rule. Navigator serves this bundle under a CSP of
 * `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`, and this
 * import stays inside it — the library vendors its woff2 files and Vite
 * rewrites their relative URLs onto this bundle's own mount, so nothing is
 * fetched off-origin. `src/test/bundle.test.ts` asserts that against the built
 * output rather than against this comment.
 *
 * `./index.css` is imported after it and is not a brand layer: the sample
 * wears the Foundation's teal, so there is no token to override. It carries a
 * workaround for one upstream rule, and says so.
 */
import '@neon-law-foundation/navigator-ux/styles.css'
import './index.css'

import { App } from './App'

const host = document.getElementById('root')
if (!host) {
  throw new Error('index.html must carry #root for this bundle to mount')
}
createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
