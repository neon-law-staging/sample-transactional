# Navigator Sample Project — Transactional

A **project application** for [Navigator](https://github.com/neon-law-foundation/navigator): the client portal for the
fixture matter *Widget Works — Outside Counsel*, built with Vite, React 19, and Tailwind CSS.

It exists so that "attach a React application to a matter" has a worked example a contributor can read, clone, and copy
— and so Navigator's own local development loop has something real to build and serve. It is one of three, each a
different shape of legal work: [litigation](https://github.com/neon-law-foundation/navigator-sample-project-litigation),
[transactional](https://github.com/neon-law-foundation/navigator-sample-project-transactional), and
[estate](https://github.com/neon-law-foundation/navigator-sample-project-estate).

**Everything here is fixture data.** *Widget Works — Outside Counsel* is a simulated matter, and nobody named in this repository is a
real person. No client data belongs in a public repository, ever.

## The matter

This is the **transactional** sample: a company that is not in front of a court. Widget Works, Inc. buys a
predictable volume of routine legal work at a predictable price, so the portal leads with the fee schedule where a
litigation portal leads with the pleadings.

The engagement, in two numbers and two turnarounds:

| Work | Turnaround | Fee |
| --- | --- | --- |
| A contract from Redline | 1 business day | $100 per contract, on top of the base fee |
| Everything else | 5 business days | Included in the base fee |

The base fee is **$1,000 per month**. Every figure is invented and the schedule is illustrative rather than an offer — a
real engagement's terms live in a signed retainer, not in a bundle.

## Where it mounts

Navigator serves this bundle at:

```text
/app/projects/sample-transactional/portal/
```

`sample-transactional` is the Project code; `portal` is a literal segment of Navigator's route, not an application name it looks up.
Navigator streams the bytes through its own origin behind the session cookie and the participation gate; it never
redirects to a signed URL, because a signed URL is bearer-shareable and would not carry the session.

That has three consequences for this app:

1. **Vite `base` is baked at build time** and must be `/app/projects/sample-transactional/portal/`. A bundle built with the wrong base
   404s on every asset. It is one named constant at the top of `vite.config.ts`.
2. **Never hardcode a mount-absolute link.** Write links relative to the base, or derive them — `src/mount.ts` is the
   whole of that job, and `portalPath()` is what every in-bundle link goes through. Hardcoded `/sample-transactional/...` strings are
   the single most common way one of these bundles breaks under its real mount, and they break silently, because the
   link only fails when somebody clicks it. Links to Navigator's *own* routes (`/app/projects`) stay absolute.
3. **Same-origin is the whole mechanism.** Because the bundle is served from Navigator's origin, its calls to
   Navigator's read and command APIs are session-gated automatically. There is no backend in this repository.

The serve CSP is `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self' data:; connect-src 'self'`. Nothing in this bundle is inline or off-origin, which is why it needs no
exception — and `src/test/bundle.test.ts` asserts that against the built output rather than trusting it. In particular
there is **no `cdn.tailwindcss.com`**: Tailwind is compiled into the hashed CSS asset by `@tailwindcss/vite`, because a
CDN script tag works on the dev server and is blocked in production.

## The one contract Navigator depends on

The bundle must show that it actually mounted, through an element carrying:

```text
id="sample-transactional-portal-ready"
```

Navigator's browser walkthrough waits for it. It is rendered by React (`src/ready.tsx`), never written into
`index.html` — a static marker would report "ready" for a bundle that threw on mount, which is the exact failure the
signal exists to catch.

## Which Project this bundle belongs to

`navigator.yml` declares it:

```yaml
name: sample-transactional
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
