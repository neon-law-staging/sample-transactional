// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'

/*
 * The contract Navigator depends on, asserted against what `pnpm build`
 * actually emitted — not against what this source says it should emit.
 *
 * The built tree is read with `import.meta.glob` rather than `node:fs`, which
 * keeps Node's globals out of this project's types: nothing in a browser bundle
 * should be able to reach for `process`, and the way to guarantee that is to
 * never put it in scope. `tsconfig.json` leaves `node` out of `types` for
 * exactly this reason, so a test that reached for `readFileSync` would not
 * compile.
 *
 * A missing `dist/` makes each glob empty, and the first assertion below fails
 * with the command to run. It deliberately does not self-skip: a gate that goes
 * green when it did not run is worse than no gate.
 */

const MOUNT = '/app/projects/sample-transactional/portal/'
const READY_HOOK = 'sample-transactional-portal-ready'
const BUILD_FIRST = 'no dist/ — run `pnpm build` before `pnpm test`, or run `pnpm check`'

const documents = import.meta.glob<string>('../../dist/index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const scripts = import.meta.glob<string>('../../dist/assets/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const styles = import.meta.glob<string>('../../dist/assets/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const bundledJs = Object.values(scripts).join('\n')

/** The built entry document, or a failure naming the command that emits it. */
function builtDocument(): string {
  const html = Object.values(documents)[0]
  if (typeof html !== 'string') throw new Error(BUILD_FIRST)
  return html
}

describe('the built bundle', () => {
  it('emits an entry document and its hashed assets', () => {
    expect(builtDocument()).toContain('<!doctype html>')
    expect(Object.keys(scripts).length, BUILD_FIRST).toBeGreaterThan(0)
  })

  it('carries the ready hook Navigator keys on', () => {
    // The element itself is rendered by React, so it appears in the emitted
    // JavaScript rather than in the document — that is what makes it proof of a
    // successful mount rather than proof the document was served. The built
    // document names the hook in a meta tag as well, so a check that reads the
    // published `index.html` alone can still find it.
    expect(builtDocument()).toContain(`content="${READY_HOOK}"`)
    expect(bundledJs).toContain(READY_HOOK)
  })

  it('joins every asset URL onto this matter\'s own mount', () => {
    // A bundle built with the wrong base 404s on every asset, and it does so
    // only once it is published, where nobody is watching a build log. With
    // three sample bundles in play, the wrong base is also how one matter's
    // application ends up reaching for another's assets.
    const urls = Array.from(builtDocument().matchAll(/(?:src|href)="([^"]+)"/g)).map(
      (match) => match[1] ?? '',
    )

    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url.startsWith(MOUNT), `${url} is not under ${MOUNT}`).toBe(true)
    }
  })

  it('inlines no script, because the portal CSP is `script-src \'self\'`', () => {
    expect(builtDocument()).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>[^]*?<\/script>/)
    expect(builtDocument()).not.toMatch(/\son[a-z]+="/)
  })

  it('loads no stylesheet or script from a CDN', () => {
    // Tailwind is compiled into the hashed CSS asset by `@tailwindcss/vite`. A
    // `cdn.tailwindcss.com` tag would work on the dev server and be blocked in
    // production, which is the worst possible place to find out.
    expect(builtDocument()).not.toMatch(/cdn\./)
    expect(bundledJs).not.toMatch(/https?:\/\/cdn\./)
  })

  it('references nothing off-origin', () => {
    // `default-src 'self'` blocks it, and in an authenticated portal a remote
    // asset is a third party watching every page of a matter.
    expect(builtDocument()).not.toMatch(/(?:src|href)="https?:\/\//)
    const css = Object.values(styles).join('\n')
    const urls = Array.from(css.matchAll(/url\(([^)]+)\)/g)).map((match) => match[1] ?? '')
    for (const url of urls) {
      expect(url.startsWith('data:') || url.startsWith(MOUNT), `${url} is off-origin`).toBe(true)
    }
  })

  it('declares the licence in the emitted JavaScript', () => {
    expect(bundledJs, BUILD_FIRST).toContain('AGPL-3.0-only')
  })
})
