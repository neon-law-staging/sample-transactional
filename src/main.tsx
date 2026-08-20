// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import './index.css'

const host = document.getElementById('root')
if (!host) {
  throw new Error('index.html must carry #root for this bundle to mount')
}
createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
