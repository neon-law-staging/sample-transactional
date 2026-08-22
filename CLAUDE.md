# Working in this repository

## Stay inside this repository

Read, search, and edit only files inside this repository's working tree. Do not open, read, or search files elsewhere on
the machine — not the home directory, not sibling checkouts, not other projects under the same parent directory, not
system paths, and not another worktree of this repository.

If something you need appears to live outside the tree, say so and ask, rather than going to look for it. The one
exception is what the toolchain reaches for on its own: `node_modules/` inside this tree is fair to read when you need a
dependency's types or its shipped stylesheet.

This is a scope rule, not a security boundary. The point is that work on this sample stays reproducible from this
checkout alone: a change justified by a file nobody else has is a change the next contributor cannot verify.

## What this is

A **project application** for [Navigator](https://github.com/neon-law-foundation/navigator): a static client portal for
the fixture matter *Widget Works — Outside Counsel*, published as a bundle that Navigator serves under one mount.
`README.md` is the orientation; read it before changing anything structural.

Everything in the portal is fixture data. Widget Works, Inc. does not exist, no figure describes a real engagement, and
nothing here is legal advice or an offer. Copy that states otherwise is a bug.

## The two things that break silently

1. **The mount.** `vite.config.ts` bakes `/app/projects/sample-transactional/portal/` in as Vite's `base`, and every
   asset URL is joined onto it. A bundle built with the wrong base 404s on every asset *after* it is published, where no
   build log is being read. Links inside the bundle derive from `src/mount.ts` rather than hardcoding the path.

2. **The ready hook.** Navigator's walkthrough waits for `#sample-transactional-portal-ready`, so it must be rendered by
   React (`src/ready.tsx`) rather than sat in `index.html` — a static marker would report success for a bundle that
   threw on mount.

`src/test/bundle.test.ts` pins both against the built output. It does not self-skip when `dist/` is missing; it fails
and names the command.

## Styling

Every surface comes from [`@neon-law-foundation/navigator-ux`](https://github.com/neon-law-foundation/navigator-ux),
installed from a release tarball pinned by URL in `package.json`. There is no Tailwind and no CSS framework: components
emit semantic class names and every color resolves through a `--nav-*` custom property.

- Reach for a library component before writing markup. Its `dist/components/*.d.ts` files are the API reference, and
  they carry the reasoning as doc comments.
- Do not write literal colors, font stacks, or radii. Use the tokens.
- `src/index.css` is not a brand layer — it holds one documented workaround for an upstream rule. Add to it only for the
  same kind of reason, and say why in a comment.

## Conventions

- Fixture data lives in its own module (`src/matter.ts`, `src/notation.ts`); components take it as props and import no
  application module. Keep that seam.
- Every source file opens with the AGPL-3.0-only SPDX header.
- Comments explain *why*, at the density the surrounding files already use. This repository is a worked example someone
  reads — a comment that restates the code is noise, and a load-bearing line with no explanation is a trap.

## Checks

Run the full gate before calling anything done:

```bash
pnpm check
```

That is `lint`, `typecheck`, `build`, and `test` in order. `pnpm test` reads `dist/`, so run the build first or run
`pnpm check`, which does.

## Merging

A green gate arms GitHub auto-merge on its own: the `enable-automerge` job in `.github/workflows/ci.yml` squash-merges
the pull request once `ci` passes and review threads are resolved. To hold a pull request that is ready, convert it to
draft rather than disabling auto-merge — a push re-arms it.

It arms as the `neon-law-staging-merge-queue` App and never as `GITHUB_TOKEN`, and that distinction is load-bearing
rather than cosmetic. GitHub creates no workflow runs for a push attributed to `GITHUB_TOKEN`, and auto-merge merges as
whoever armed it, so a merge armed with the run's own token lands on `main` and starts nothing — not a skipped run, not
a red one: none. Nothing goes red, because nothing runs. `.github/automerge-identity.py` runs inside `ci` and fails the
gate if that fallback is ever reintroduced.

If the App secrets are absent the job arms nothing and the pull request visibly waits for a human, which is the safe
direction to fail. Merge by hand in that case.
