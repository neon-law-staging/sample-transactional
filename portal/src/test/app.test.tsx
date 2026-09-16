// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { FEES, MATTER } from '../matter'

describe('the Widget Works portal', () => {
  it('shows the matter it was built for', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(MATTER.caption)
  })

  /**
   * The fee schedule is the point of this sample: a transactional client buys
   * a predictable volume at a predictable price, so the portal has to actually
   * state both numbers and both turnarounds. A refactor that dropped one of
   * the four would leave a portal that reads fine and answers the client's
   * first question wrong.
   */
  it('states both fees and both turnarounds', () => {
    render(<App />)
    expect(screen.getByText(/\$1,000 per month/)).toBeInTheDocument()
    expect(screen.getByText(/\$100 on top of it/)).toBeInTheDocument()
    expect(screen.getByText('1 business day')).toBeInTheDocument()
    expect(screen.getByText('5 business days')).toBeInTheDocument()
  })

  it('says outright that the matter is simulated', () => {
    render(<App />)
    expect(screen.getByText(/simulated matter/)).toBeInTheDocument()
  })

  /** The one-day lane is the only one that carries a surcharge. */
  it('prices only the expedited lane', () => {
    expect(FEES.redlineContract).toBeGreaterThan(0)
    render(<App />)
    expect(screen.getByText('Included')).toBeInTheDocument()
  })
})
