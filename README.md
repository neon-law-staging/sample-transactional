# Navigator Sample Project — Transactional

A **project application** for [Navigator](https://github.com/neon-law-source-code/navigator): the client portal for the
fixture matter *Widget Works — Outside Counsel*. [Navigator UX](https://github.com/neon-law-source-code/navigator-ux)
supplies every component and every color; Vite and React 19 do the rest.

It exists so that "attach a React application to a matter" has a worked example a contributor can read, clone, and copy
— and so Navigator's own local development loop has something real to build and serve. It is one of three, each a
different shape of legal work: [litigation](https://github.com/neon-law-staging/sample-litigation),
[transactional](https://github.com/neon-law-staging/sample-transactional), and
[estate](https://github.com/neon-law-staging/sample-estate).

**Everything here is fixture data.** *Widget Works — Outside Counsel* is a simulated matter, and nobody named in this
repository is a real person. No client data belongs in a public repository, ever.

## The matter

This is the **transactional** sample: a company that is not in front of a court. Widget Works, Inc. buys a predictable
volume of routine legal work at a predictable price, so the portal leads with the fee schedule where a litigation portal
leads with the pleadings.

The engagement, in two numbers and two turnarounds:

| Work | Turnaround | Fee |
| --- | --- | --- |
| A contract from Redline | 1 business day | $100 per contract, on top of the base fee |
| Everything else | 5 business days | Included in the base fee |

The base fee is **$1,000 per month**. Every figure is invented and the schedule is illustrative rather than an offer — a
real engagement's terms live in a signed retainer, not in a bundle.

## The three views

The portal serves three views from one document, switched by a `?tab=` query parameter rather than a path segment: this
is a static bundle with no server-side router, and a deep path under the mount would need a rewrite the application
cannot declare. A query parameter still gives a real URL — bookmarkable, refreshable, openable in a new tab — which is
what client-side view state is not.

| View | URL | What it is |
| --- | --- | --- |
| Overview | the mount itself | What the engagement costs, the two turnaround lanes, and what the client does next. |
| Requests | `?tab=requests` | The intake queue — work arriving by email, triaged into a lane with a due date and fee. |
| Contract redline | `?tab=redline` | A Master Services Agreement under review, in notation, across three revisions. |

### Requests

Clients do not file tickets; they send mail. So intake is an inbox, and the interesting part is the triage beside it:
`src/intake.ts` derives the lane, the due date, and the charge rather than storing them, because a stored due date is
one that disagrees with the schedule the moment the schedule changes.

**The lane is chosen by the address the client wrote to**, not by reading the subject line for the word "urgent". That
is a commercial decision as much as a technical one: the expedited lane carries a per-contract fee, and a client should
never be billed for it because a keyword matcher decided their mail sounded rushed. `redline@` buys one business day and
the surcharge; `nexus@` is five business days, covered by the base fee; anything unrecognized falls to the free lane,
because guessing the other way charges somebody for a typo.

Due dates count business days and skip weekends, and mail that arrives on a weekend starts its clock on the next working
day — a contract sent at noon on Saturday is not already a day late on Monday morning. **Public holidays are not
modelled.** A real implementation resolves them against a jurisdiction's calendar, and that is not a thing a sample
bundle should invent.

The form sends a simulated email into the queue and shows the triage happening: pick an address, and a due date and a
charge appear. Arrivals are stamped an hour after whatever is already last in the queue rather than from `Date.now()`,
so the queue stays inside its named billing period and no test depends on the day it runs.

### The redline

Neon Law Navigator's [markdown notation](https://github.com/neon-law-source-code/navigator/blob/main/docs/notation.md) is
the format `src/notation.ts` writes its sample MSA in — a YAML frontmatter block declaring the intake `questionnaire:`
and the `workflow:` that renders, reviews, and signs the document, over a prose body carrying `{{question_code}}`
placeholders resolved from the client's answers. It follows the shape of the real templates under
`templates/neon_law/nexus/` in the Navigator repository, and `src/test/notation.test.ts` asserts that shape rather than
trusting it: fenced frontmatter, the required keys, one linear questionnaire chain from `BEGIN` to `END`, and a
`prompts:` entry for every `custom_*` question.

Three revisions carry one negotiation — the Provider's form as received, our redline returned inside a business day, and
their counter. The page steps **forwards and backwards** through them, and the editor diffs the revision on show against
the one before it: struck-through text is what the previous revision said, underlined text is what this one says
instead. Stepping backwards is the question a client actually asks — *what did they change since we sent it* — and it is
a diff between two adjacent revisions.

The editor is CodeMirror 6 with a `StreamLanguage` tokenizer for the notation format (`src/notation-language.ts`) and
`@codemirror/merge`'s unified view for the redline. Both are themed entirely in `--nav-*` custom properties, so the
editor re-colors with the rest of the portal when the reader's OS scheme flips. It is a real editor rather than a
highlighted `<pre>` because the thing on show is source, and a reader expects to select a clause and scroll it with the
keyboard. Edits are the reader's own scratch: this bundle has nowhere to send them, and the buffer is rebuilt from the
fixture whenever the revision changes.

It costs the bundle about 320 kB raw before compression, which is most of what this application weighs. That is the
price of an editor, and it is paid on the overview view too — code-splitting the redline behind a dynamic import is the
obvious next move if the overview's first paint starts to matter.

## Where it mounts

Navigator serves this bundle at:

```text
/app/projects/sample-transactional/portal/
```

`sample-transactional` is the Project code; `portal` is a literal segment of Navigator's route, not an application name
it looks up. Navigator streams the bytes through its own origin behind the session cookie and the participation gate; it
never redirects to a signed URL, because a signed URL is bearer-shareable and would not carry the session.

That has three consequences for this app:

1. **Vite `base` is baked at build time** and must be `/app/projects/sample-transactional/portal/`. A bundle built with
   the wrong base 404s on every asset. It is one named constant at the top of `vite.config.ts`.
2. **Never hardcode a mount-absolute link.** Write links relative to the base, or derive them — `src/mount.ts` is the
   whole of that job, and `portalPath()` is what every in-bundle link goes through. Hardcoded
   `/sample-transactional/...` strings are the single most common way one of these bundles breaks under its real mount,
   and they break silently, because the link only fails when somebody clicks it. Links to Navigator's *own* routes
   (`/app/projects`) stay absolute.
3. **Same-origin is the whole mechanism.** Because the bundle is served from Navigator's origin, its calls to
   Navigator's read and command APIs are session-gated automatically. There is no backend in this repository.

The serve CSP is:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'
```

Nothing in this bundle is inline or off-origin, which is why it needs no exception — and `src/test/bundle.test.ts`
asserts that against the built output rather than trusting it. In particular there is **no font CDN**: Navigator UX
vendors its woff2 files and Vite rewrites their URLs onto this bundle's own mount, because a remote asset works on the
dev server, is blocked in production, and in an authenticated portal is a third party watching every page of a matter.

## The one contract Navigator depends on

The bundle must show that it actually mounted, through an element carrying:

```text
id="sample-transactional-portal-ready"
```

Navigator's browser walkthrough waits for it. It is rendered by React (`src/ready.tsx`), never written into `index.html`
— a static marker would report "ready" for a bundle that threw on mount, which is the exact failure the signal exists to
catch.

## Which Project this bundle belongs to

`navigator.yaml` declares it:

```yaml
project: sample-transactional
```

Navigator re-reads that file at boot rather than trusting the directory the bundle was staged in, and refuses a bundle
naming a different Project. That is what lets three sample bundles be staged side by side: publishing one under the
wrong code would put this matter's application on another matter's portal.

## Developing

```bash
pnpm install --frozen-lockfile
pnpm dev                          # the Vite dev server
pnpm check                        # lint, typecheck, build, test — what CI runs
```

**The dev server serves under the mount, not the bare root.** `base` is baked into `vite.config.ts` unconditionally
rather than switched per mode, so the URL Vite prints is
`http://localhost:5173/app/projects/sample-transactional/portal/`. Opening the bare root works — Vite 302-redirects it
to the base — but that redirect is the only thing making it work, and it exists on the dev server alone. A link or a
fetch written as though the app were served from `/` is therefore broken in both places, and the dev server is where you
can still notice.

To build it the way Navigator does, from a Navigator checkout:

```bash
cargo run -p cli -- dev sample-project --project sample-transactional
```

That clones, builds, and stages this bundle for the next local `web` boot. Restart `web` afterwards so it reads the
newly staged output.

## Licence

`AGPL-3.0-only` over the whole tree. See [`LICENSE`](LICENSE) for the grant and [`NOTICE`](NOTICE) for the Foundation's
own statements, including the § 13 network clause and the trademark note. Contributions are closed; see
[`CONTRIBUTING.md`](CONTRIBUTING.md).
