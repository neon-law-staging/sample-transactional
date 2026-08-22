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

## Notation lint

`pnpm check` covers the TypeScript. The Markdown and the YAML answer to the Neon Law Navigator rule set instead, and the
only thing that reads them is the Navigator CLI:

```bash
brew install neon-law-foundation/navigator/navigator   # macOS, and tap-qualified on purpose
pnpm validate                                          # navigator validate, over the whole tree
```

Install it tap-qualified. An unqualified `brew install navigator` resolves to a Homebrew cask for a trackpad utility of
the same name, which installs cleanly and then has no `validate` subcommand. `brew upgrade` keeps it current, and
`navigator --version` says which rule set you are holding this repository to.

CI does not use Homebrew. The `notation` job in `.github/workflows/ci.yml` runs on `ubuntu-latest` and unpacks the Linux
tarball from a pinned public Navigator release into `$HOME/.local/bin`: one static binary, no tap, no account, no sudo.
The pin is deliberate, so that a rule added upstream arrives when somebody bumps that line rather than turning a green
branch red overnight. `notation` is one of the three jobs the required `ci` check waits on, so a finding blocks the
merge — and the pinned version is worth keeping in step with the formula above, since the two together are what "it
passed on my machine" means here.

`pnpm validate` is deliberately not part of `pnpm check`: `check` needs only what `pnpm install` brings, so a
contributor who has not installed the CLI is not blocked by it. Run both before pushing.

`validate` takes no file list, and there is no list to keep current. It walks the tree itself and finds every Markdown,
event, and YAML file under it, so a document is covered the moment it exists rather than the moment somebody remembers
to register it. Each Markdown file it also classifies as it reads: prose gets the structural rules (`M*`) and the
line-width rules (`S*`), and a file whose frontmatter makes it a notation — a `code:`, a `questionnaire:`, a `workflow:`
— additionally gets the notation rules (`N*`). Vendored trees such as `node_modules/` are skipped, but `.gitignore` is
not consulted, so a generated file that sits in the tree is linted like any other.

A finding prints as `path:line RULE: message`, and an error exits non-zero where a warning is only reported.

`navigator validate --fix` applies in place the fixes that are safe by construction — whitespace, ATX heading spacing,
blockquote spacing — and then re-validates. The rest are diagnostic only: the `N*` notation rules, duplicate headings
(M024), trailing heading punctuation (M026). Those it names and leaves for a human, which is the right split; a notation
state machine is not something a formatter should rewrite.

Every document here is filled greedily to 120 columns, because that is what the width rules ask for: **S101** rejects a
line over 120, and **S102** rejects a line that stopped short of 120 with a word still to come. Match that when you edit
rather than rewrapping a paragraph to 80 or 100 columns.

Four things about writing prose that passes, none of them obvious from the message the rule prints:

- **Some spans cannot be broken across lines.** A link, because CommonMark forbids a line break inside a destination; an
  inline code span, because a break leaves whitespace at its edge (M038); an emphasis span, because the rules are
  line-scoped and a span crossing a line reads as unbalanced (M037). So a ~100-character link that lands at the start of
  a line reports S102 permanently — reword the sentence until the link sits inside a line, or make it the first thing in
  its paragraph.
- **Reference-style links are not the way out of that.** A definition line carrying a bare URL reports M034.
- **A literal too long to shorten belongs in a fenced block.** S101 does not reach inside a fence, so a CSP header or a
  long command goes in one — with a language tag, which is what M040 wants.
- **Italics inside a list item bulleted with an asterisk report M037.** The bullet's own asterisk is counted as an
  inline marker. A dash bullet has no such problem, and M004 holds a file to whichever character its first bullet used.

The whole Markdown surface here is four documents at the repository root, so a clean report is cheap to keep and worth
keeping at zero.

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
