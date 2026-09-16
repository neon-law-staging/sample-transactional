// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'

import { MOUNT, portalPath } from '../mount'

/**
 * The mount contract, which is the one thing in this bundle that breaks
 * silently. A hardcoded in-bundle link only fails when somebody clicks it, so
 * the rule — every in-bundle path goes through `portalPath` — is asserted here
 * rather than trusted.
 */
describe('portalPath', () => {
  it('always ends the mount with a slash', () => {
    expect(MOUNT.endsWith('/')).toBe(true)
  })

  it('returns the portal root for no argument', () => {
    expect(portalPath()).toBe(MOUNT)
    expect(portalPath('')).toBe(MOUNT)
  })

  it('joins without doubling the separator', () => {
    expect(portalPath('documents')).toBe(`${MOUNT}documents`)
    // A leading slash is stripped rather than honored: joining it naively
    // produces a double slash, which some proxies collapse and some do not.
    expect(portalPath('/documents')).toBe(`${MOUNT}documents`)
    expect(portalPath('///documents')).toBe(`${MOUNT}documents`)
  })
})
