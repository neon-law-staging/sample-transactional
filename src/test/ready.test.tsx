// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { READY_ID } from '../ready'

/**
 * The one contract Navigator depends on. The walkthrough waits for this id, so
 * it has to be rendered by React rather than sat in `index.html`: a static
 * marker would report "ready" for a bundle that threw on mount, which is the
 * exact failure the signal exists to catch.
 */
describe('the mount signal', () => {
  it('is named for this matter', () => {
    expect(READY_ID).toBe('sample-transactional-portal-ready')
  })

  it('is rendered by the app rather than by the document', () => {
    const { container } = render(<App />)
    expect(container.querySelector(`#${READY_ID}`)).not.toBeNull()
  })
})
