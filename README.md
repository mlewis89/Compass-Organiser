# Compass Organiser

Scout group organiser for notice-board posts, events, skill-matched tasks, and members. Hosted as a Next.js App Router app on Vercel Hobby, with Neon Postgres and Clerk for identity.

**Live:** [https://compass-organiser.vercel.app](https://compass-organiser.vercel.app)

Public group pages live at `/groups/{slug}` (sample: `/groups/default`). The home page introduces Compass; it does not list a group's events.

## Stack

- Next.js App Router (TypeScript)
- Apollo GraphQL at `/api/graphql`
- Neon Postgres + Drizzle ORM
- Clerk for sign-in / sign-up (scout groups and roles stay in Neon)

## Local setup

1. Install dependencies: `npm install`
2. Link the Vercel project: `vercel link`
3. Provision Neon: `vercel integration add neon` (finish any browser claim step)
4. Provision Clerk: `npx vercel@latest integration add clerk` (Free plan is enough)
5. Set remaining secrets (names only here):

```bash
vercel env add JWT_SECRET development preview production
vercel env add JWT_EXPIRY development preview production
vercel env add DEFAULT_GROUP_SLUG development preview production
```

Use a long random value for `JWT_SECRET`, `7d` for `JWT_EXPIRY`, and `default` for `DEFAULT_GROUP_SLUG`. Clerk keys come from the Marketplace install.

6. Pull env: `vercel env pull .env.local --yes`
7. Push schema and seed (never run seed as a Vercel build hook):

```bash
npm run db:push
npm run db:seed
```

8. Start the app: `npm run dev`

Create a Clerk account with `alex.leader@example.com` to pick up the seeded group-leader membership. New emails get a Neon user and are joined to the default group until invites exist.

## Environment variables

| Name | Purpose |
|------|---------|
| `DATABASE_URL` | Neon connection string (Marketplace-provisioned) |
| `CLERK_SECRET_KEY` | Clerk server key (Marketplace-provisioned) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `JWT_SECRET` | Still used by leftover GraphQL password mutations |
| `JWT_EXPIRY` | Token lifetime, e.g. `7d` |
| `DEFAULT_GROUP_SLUG` | Active group until a group switcher exists |

Copy [`.env.example`](.env.example) for the list. Do not commit `.env.local`.

Preview deployments currently share the same Neon database as development unless you add a Neon branch later.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` / `npm run typecheck`
- `npm run db:push` — apply Drizzle schema (`dotenv-cli` loads `.env.local`)
- `npm run db:seed` — seed the default group (CLI only)

## Auth (Clerk + Neon)

Clerk is identity only. Scout groups and roles stay in Neon:

- `users.externalAuthId` — Clerk user id; `passwordHash` is unused for Clerk accounts
- First session upserts the Neon user by Clerk id, then by email
- `groups` + `memberships` + `membership_roles` — UnitLeader, Treasurer, and the rest live here
- `requireUser()` / `requireMembership()` still gate GraphQL after the Clerk session is mapped
- Cookie `compass_group` is reserved for a later group switcher

Do **not** use Clerk Organizations as the source of truth for scout roles.

Clerk production instances cannot use a `*.vercel.app` hostname. This Hobby deploy uses the Clerk development instance. A custom domain is required before switching to live keys.

## Hobby notes

- Fluid Compute / Node.js runtime (no Edge — Drizzle and JWT need Node)
- No crons, Blob, or image transformation pipeline
- Semantic UI assets are static files, not `next/image`
- Seed is a local CLI command only
