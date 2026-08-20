// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import react from '@vitejs/plugin-react'
// vitest/config re-exports defineConfig with the `test` block typed.
import { defineConfig, type Plugin } from 'vitest/config'

/**
 * Where Navigator mounts this bundle, baked in at build time.
 *
 * `portal` is a literal segment of Navigator's route, not an application name
 * it looks up. Vite joins every asset URL onto this base, so a bundle built
 * with a different one 404s on every asset the moment it is published. It is
 * the single most load-bearing line in this repository, which is why it is a
 * named constant with a comment rather than an inline string.
 *
 * The trailing slash is required: Navigator redirects the bare mount to the
 * slash form precisely because the base is joined directly onto it.
 */
const MOUNT = '/app/projects/sample-transactional/portal/'

/**
 * The licence notice carried into the published bundle.
 *
 * Kept to the identifier and the source pointer rather than the full notice:
 * `LICENSE` in the repository is the terms, and a reader who has the SPDX tag
 * and a way to reach the source can get to them.
 */
const LICENSE_BANNER = `/*!
 * Widget Works — Outside Counsel — Client Portal.
 * Copyright (C) 2026 Neon Law Foundation.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Source: https://github.com/neon-law-foundation/navigator-sample-project-transactional
 */`

/**
 * Prepend that notice to every emitted JavaScript chunk and stylesheet.
 *
 * `build.rollupOptions.output.banner` is the obvious place for this and does
 * nothing here: Vite 8 generates and minifies with Oxc, which drops the comment
 * on its way out. `generateBundle` sees the output after code generation, so a
 * notice added there is the notice that lands on disk.
 *
 * A `/*!` legal comment in `src/index.css` would be equally fragile: the CSS
 * minifier keeps a legal comment at the top of what it emits, so the notice
 * survives only while that stylesheet happens to be first. Emitting it here
 * makes it independent of import order.
 *
 * `index.html` needs no equivalent; it is not minified, so the comment written
 * into the template is the comment that ships.
 */
function licenseBanner(): Plugin {
  return {
    name: 'portal-license-banner',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          file.code = `${LICENSE_BANNER}\n${file.code}`
          continue
        }
        // Only the stylesheets are ours to annotate. Stamping this
        // repository's notice onto a third party's asset would be a false
        // claim rather than a formality.
        if (!file.fileName.endsWith('.css') || typeof file.source !== 'string') continue
        file.source = `${LICENSE_BANNER}\n${file.source}`
      }
    },
  }
}

export default defineConfig({
  base: MOUNT,
  plugins: [react(), licenseBanner()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
