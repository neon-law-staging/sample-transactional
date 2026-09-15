# Contributing

**This repository is open source, and it is currently closed to outside contributions.**

The Neon Law Foundation produces this software; Shook Law PLLC, trading as Neon Law, operates it. Pull requests from
outside those two organizations are not being accepted right now. This is a capacity decision rather than a licensing
one: the application is a teaching example for a platform that runs a live legal practice, and every change to it needs
review by someone who can weigh that.

**Write to [contact@neonlaw.org](mailto:contact@neonlaw.org).** Anyone is welcome to — a bug you hit, a security
concern, a fork you are running, or a question about the licences. The address is read by people, and a report that
never becomes a pull request is still worth sending.

Issues are off. Planning for the Foundation's software lives in Linear, so an issue reference in a commit or a pull
request body (`ENG-NN`) points there and `gh issue` has nothing to return.

The licence is a separate question, and it is open. This application is free software under the GNU Affero General
Public License, version 3 — `AGPL-3.0-only` — over the whole tree. You may run, fork, modify, and redistribute it, with
no permission to ask for. Section 13 is the obligation to know before you deploy: modify it, let users reach it over a
network, and you owe those users your modified source. See [`LICENSE`](LICENSE) for the grant and [`NOTICE`](NOTICE) for
what the Foundation says about it.

## How contributions are licensed

The terms are stated here so they are knowable in advance, and so a fork's own authors know where they stand.

Contributions are **inbound = outbound**: anything submitted for inclusion is licensed `AGPL-3.0-only` on the same terms
the project ships under. You keep the copyright in what you write. There is no contributor agreement to sign, no
copyright assignment, and no bot standing between an author and a merge.

Work by the Neon Law Foundation's personnel and contractors assigns to the Foundation under the agreement each of them
already holds. That is an arrangement between the Foundation and its own people; it changes nothing about the terms
above.

## No client data, ever

This repository is public, and everything in it is fixture data. No real client, party, beneficiary, document, or figure
belongs here — non-firm email addresses use reserved example domains, and phone numbers do not ship. That boundary is
not a style preference; it is the reason a legal-practice platform can publish a sample portal at all.

## Working in the tree

```bash
pnpm install --frozen-lockfile
pnpm check                        # lint, typecheck, build, test
```

`pnpm check` is what CI runs. Two things about it are worth knowing:

- **`pnpm test` runs after `pnpm build`, never before.** The bundle gate asserts on real output in `dist/` — that
  nothing reaches off-origin and that the licence notice survived into every emitted file. Running it first would pass
  by finding nothing to check rather than by being correct.
- **The Vite `base` is the most load-bearing line in the repository.** It bakes the mount into every asset URL at build
  time, so a bundle built with the wrong one 404s on everything the moment it is published. Every in-bundle link goes
  through `portalPath` in `src/mount.ts` rather than being written out.
