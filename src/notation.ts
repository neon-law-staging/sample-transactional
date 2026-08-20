// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * A contract under review, in Neon Law Navigator's markdown notation — fixture
 * data, and nothing else.
 *
 * A notation is one markdown file in two parts: a YAML frontmatter block that
 * is the machine-readable *contract* — the metadata, the `questionnaire:`
 * intake state machine, and the `workflow:` state machine that renders,
 * reviews, and signs the result — and a prose body carrying
 * `{{question_code}}` placeholders that are resolved from the client's answers
 * at render time. `docs/notation.md` in the Navigator repository is the
 * specification; the shape below follows `templates/neon_law/nexus/`.
 *
 * Keeping the whole document in the fixture rather than assembling it from
 * fragments is deliberate: the redline is a diff of two revisions, and a diff
 * of two assembled strings would show the assembler's seams rather than the
 * negotiation. What a reviewer needs to see is the file the other side sent.
 *
 * Every party, figure, and date here is invented. Widget Works, Inc. does not
 * exist and neither does Halcyon Freight Systems, LLC.
 */

/** Who sent a revision. The redline reads differently depending on the answer. */
export type Party = 'counterparty' | 'counsel'

export interface Revision {
  /** Stable id, and the value the `?rev=` link carries. */
  id: string
  /** The revision's short name — what the history list shows. */
  label: string
  /** Who produced it. */
  author: string
  party: Party
  /** Machine-readable date for the `<time>` element. */
  dateTime: string
  /** How that date reads to a human. */
  when: string
  /** One line on what this revision is. */
  summary: string
  /** What actually moved, clause by clause. Empty for the draft as received. */
  changes: string[]
  /** The whole notation document at this revision. */
  body: string
}

const RECEIVED = `---
title: Master Services Agreement
respondent_type: person_and_entity
jurisdiction: DE
code: nexus__msa
confidential: true
prompts:
  fee_monthly: What is the monthly service fee, in dollars?
questionnaire:
  BEGIN:
    _: person__signatory
  person__signatory:
    _: entity__company
  entity__company:
    _: entity__counterparty
  entity__counterparty:
    _: custom_usd__fee_monthly
  custom_usd__fee_monthly:
    _: END
  END: {}
workflow:
  BEGIN:
    intake_submitted: intake_persisted__client
  intake_persisted__client:
    msa_rendered: lawyer_review
  lawyer_review:
    approved: generate_pdf__msa_pdf
    rejected: END
  generate_pdf__msa_pdf:
    pdf_persisted: sent_for_signature__pending
  sent_for_signature__pending:
    signature_received: END
    signature_declined: END
  END: {}
---

## 1. Services

{{entity__counterparty.name}} (the "Provider") performs the services described in each Statement
of Work executed under this Agreement by {{entity__company.name}} (the "Client"). The Provider
may substitute personnel at its discretion.

## 2. Fees and payment

The Client pays {{custom_usd__fee_monthly}} per month. Invoices are due **net sixty (60) days**
from receipt. Amounts not paid when due accrue interest at 1.5% per month.

## 3. Intellectual property

All work product, including any pre-existing materials of the Client incorporated into it, is the
sole property of the Provider. The Client receives a non-exclusive, revocable licence to use the
work product during the term.

## 4. Limitation of liability

The Provider's liability under this Agreement is limited to the fees paid in the month giving rise
to the claim. Nothing in this Agreement limits the Client's liability to the Provider.

## 5. Term and termination

This Agreement continues until terminated by the Provider on thirty (30) days' written notice.

## 6. Governing law

This Agreement is governed by the laws of the State of Delaware, and the parties submit to the
exclusive jurisdiction of the courts of New Castle County.

{{client.signature}}

{{client.date}}

{{provider.signature}}

{{provider.date}}
`

const REDLINED = `---
title: Master Services Agreement
respondent_type: person_and_entity
jurisdiction: NV
code: nexus__msa
confidential: true
prompts:
  fee_monthly: What is the monthly service fee, in dollars?
  liability_cap: What is the aggregate liability cap, in dollars?
questionnaire:
  BEGIN:
    _: person__signatory
  person__signatory:
    _: entity__company
  entity__company:
    _: entity__counterparty
  entity__counterparty:
    _: custom_usd__fee_monthly
  custom_usd__fee_monthly:
    _: custom_usd__liability_cap
  custom_usd__liability_cap:
    _: END
  END: {}
workflow:
  BEGIN:
    intake_submitted: intake_persisted__client
  intake_persisted__client:
    msa_rendered: lawyer_review
  lawyer_review:
    approved: generate_pdf__msa_pdf
    changes_requested: reask__client
    rejected: END
  reask__client:
    intake_resubmitted: lawyer_review
  generate_pdf__msa_pdf:
    pdf_persisted: sent_for_signature__pending
  sent_for_signature__pending:
    signature_received: END
    signature_declined: END
  END: {}
---

## 1. Services

{{entity__counterparty.name}} (the "Provider") performs the services described in each Statement
of Work executed under this Agreement by {{entity__company.name}} (the "Client"). The Provider
may substitute personnel of equivalent seniority on notice to the Client.

## 2. Fees and payment

The Client pays {{custom_usd__fee_monthly}} per month. Invoices are due **net thirty (30) days**
from receipt of a conforming invoice. Amounts not paid when due accrue interest at 1.5% per month.

## 3. Intellectual property

Work product created under a Statement of Work is the sole property of the Client on payment. Each
party retains all right, title, and interest in materials it owned before this Agreement, and the
Provider grants the Client a perpetual, irrevocable licence to any such materials it embeds in the
work product.

## 4. Limitation of liability

Each party's aggregate liability under this Agreement is limited to
{{custom_usd__liability_cap}}. Neither party is liable for indirect, incidental, or consequential
damages.

## 5. Term and termination

This Agreement continues until terminated by either party on thirty (30) days' written notice. The
Client may terminate immediately for the Provider's material breach that is not cured within
fifteen (15) days of notice.

## 6. Governing law

This Agreement is governed by the laws of the State of Nevada, and the parties submit to the
exclusive jurisdiction of the courts of Clark County.

{{client.signature}}

{{client.date}}

{{provider.signature}}

{{provider.date}}
`

const COUNTERED = `---
title: Master Services Agreement
respondent_type: person_and_entity
jurisdiction: NV
code: nexus__msa
confidential: true
prompts:
  fee_monthly: What is the monthly service fee, in dollars?
  liability_cap: What is the aggregate liability cap, in dollars?
questionnaire:
  BEGIN:
    _: person__signatory
  person__signatory:
    _: entity__company
  entity__company:
    _: entity__counterparty
  entity__counterparty:
    _: custom_usd__fee_monthly
  custom_usd__fee_monthly:
    _: custom_usd__liability_cap
  custom_usd__liability_cap:
    _: END
  END: {}
workflow:
  BEGIN:
    intake_submitted: intake_persisted__client
  intake_persisted__client:
    msa_rendered: lawyer_review
  lawyer_review:
    approved: generate_pdf__msa_pdf
    changes_requested: reask__client
    rejected: END
  reask__client:
    intake_resubmitted: lawyer_review
  generate_pdf__msa_pdf:
    pdf_persisted: sent_for_signature__pending
  sent_for_signature__pending:
    signature_received: END
    signature_declined: END
  END: {}
---

## 1. Services

{{entity__counterparty.name}} (the "Provider") performs the services described in each Statement
of Work executed under this Agreement by {{entity__company.name}} (the "Client"). The Provider
may substitute personnel of equivalent seniority on notice to the Client.

## 2. Fees and payment

The Client pays {{custom_usd__fee_monthly}} per month. Invoices are due **net forty-five (45)
days** from receipt of a conforming invoice. Amounts not paid when due accrue interest at 1.5% per
month.

## 3. Intellectual property

Work product created under a Statement of Work is the sole property of the Client on payment. Each
party retains all right, title, and interest in materials it owned before this Agreement, and the
Provider grants the Client a perpetual, irrevocable licence to any such materials it embeds in the
work product.

## 4. Limitation of liability

Each party's aggregate liability under this Agreement is limited to
{{custom_usd__liability_cap}}, except that this limit does not apply to a breach of Section 7
(Confidentiality) or to a party's indemnity for third-party claims of infringement. Neither party
is liable for indirect, incidental, or consequential damages.

## 5. Term and termination

This Agreement continues until terminated by either party on thirty (30) days' written notice. The
Client may terminate immediately for the Provider's material breach that is not cured within
fifteen (15) days of notice.

## 6. Governing law

This Agreement is governed by the laws of the State of Nevada, and the parties submit to the
exclusive jurisdiction of the courts of Clark County.

{{client.signature}}

{{client.date}}

{{provider.signature}}

{{provider.date}}
`

/**
 * The negotiation, oldest first.
 *
 * Three revisions is the shortest sequence that shows the shape of one: a
 * draft arrives, counsel marks it up, and the other side answers the markup
 * rather than accepting it whole. Stepping backwards through them is the point
 * — "what did they change since we sent it" is the question a client actually
 * asks, and it is a diff between two adjacent revisions.
 */
export const REVISIONS: Revision[] = [
  {
    id: 'r1',
    label: 'Revision 1 — as received',
    author: 'Halcyon Freight Systems, LLC',
    party: 'counterparty',
    dateTime: '2026-08-11',
    when: '11 August 2026',
    summary: "The Provider's standard form, as it arrived. Nothing has been marked up yet.",
    changes: [],
    body: RECEIVED,
  },
  {
    id: 'r2',
    label: 'Revision 2 — our redline',
    author: 'Neon Law, outside counsel',
    party: 'counsel',
    dateTime: '2026-08-12',
    when: '12 August 2026',
    summary: 'Returned inside one business day, on the Redline lane.',
    changes: [
      'Section 3 — work product now vests in the Client on payment, and each party keeps what it owned coming in. The form assigned everything, including the Client’s own pre-existing materials, to the Provider.',
      'Section 4 — the liability cap is made mutual and given a figure. As drafted it bound only the Provider and left the Client uncapped.',
      'Section 2 — payment moves to net thirty, on a conforming invoice.',
      'Section 5 — either party may terminate, and the Client may exit immediately for an uncured material breach.',
      'Section 6 — governing law moves to Nevada, where the Client is.',
      'Frontmatter — `jurisdiction` follows Section 6 to NV, a `custom_usd__liability_cap` question is added for the new figure, and the workflow gains the `changes_requested` → `reask__client` loop so a review that asks for changes has somewhere to go.',
    ],
    body: REDLINED,
  },
  {
    id: 'r3',
    label: 'Revision 3 — their counter',
    author: 'Halcyon Freight Systems, LLC',
    party: 'counterparty',
    dateTime: '2026-08-18',
    when: '18 August 2026',
    summary: 'Two clauses answered, the rest of the redline accepted as written.',
    changes: [
      'Section 2 — net forty-five rather than net thirty. A compromise on the sixty they asked for.',
      'Section 4 — the mutual cap is accepted, carved out for a confidentiality breach and for infringement indemnities. The carve-outs are ordinary and run both ways.',
      'Sections 3, 5, and 6, and every frontmatter change, are accepted as redlined.',
    ],
    body: COUNTERED,
  },
]
