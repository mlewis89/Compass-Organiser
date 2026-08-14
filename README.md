# Compass Organiser

Scout group organiser for notice-board posts, events, skill-matched tasks, and members. Hosted as a Next.js App Router app on Vercel Hobby, with Neon Postgres and a Group/Membership schema ready for Clerk later.

**Live:** [https://compass-organiser.vercel.app](https://compass-organiser.vercel.app)

Public group pages live at `/groups/{slug}` (sample: `/groups/default`). The home page introduces Compass; it does not list a group's events.

## Stack

- Next.js App Router (TypeScript)
- Apollo GraphQL at `/api/graphql`
- Neon Postgres + Drizzle ORM
- JWT login for Phase 1 (Clerk is the planned Phase 2 identity layer)

## Local setup

1. Install dependencies: `npm install`
2. Link the Vercel project: `vercel link`
3. Provision Neon: `vercel integration add neon` (finish any browser claim step)
4. Set secrets (names only here):

```bash
vercel env add JWT_SECRET development preview production
vercel env add JWT_EXPIRY development preview production
vercel env add DEFAULT_GROUP_SLUG development preview production
```

Use a long random value for `JWT_SECRET`, `7d` for `JWT_EXPIRY`, and `default` for `DEFAULT_GROUP_SLUG`.

5. Pull env: `vercel env pull .env.local --yes`
6. Push schema and seed (never run seed as a Vercel build hook):

```bash
npm run db:push
npm run db:seed
```

7. Start the app: `npm run dev`

Default seed login: `alex.leader@example.com` / `password`

## Environment variables

| Name | Purpose |
|------|---------|
| `DATABASE_URL` | Neon connection string (Marketplace-provisioned) |
| `JWT_SECRET` | Signs Phase 1 session tokens |
| `JWT_EXPIRY` | Token lifetime, e.g. `7d` |
| `DEFAULT_GROUP_SLUG` | Active group until a group switcher exists |

Copy [`.env.example`](.env.example) for the list. Do not commit `.env.local`.

Preview deployments currently share the same Neon database as development unless you add a Neon branch later.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` / `npm run typecheck`
- `npm run db:push` — apply Drizzle schema (`dotenv-cli` loads `.env.local`)
- `npm run db:seed` — seed the default group (CLI only)

## Auth Phase 2 (not implemented yet)

Clerk will replace JWT identity. The schema is already shaped for that:

- `users.externalAuthId` — store the Clerk user id; leave `passwordHash` null
- `users.email` unique — upsert on first Clerk session
- `groups` + `memberships` + `membership_roles` — scout groups and roles stay in Neon
- `lib/auth/jwt.ts` `requireUser()` and `lib/tenancy.ts` `requireMembership()` — swap the identity source, keep the same checks
- Cookie `compass_group` is reserved for a later group switcher

Do **not** use Clerk Organizations as the source of truth for scout roles (UnitLeader, Treasurer, etc.).

Install later with `vercel integration add clerk`, then `@clerk/nextjs` v7, `ClerkProvider`, and `proxy.ts` + `clerkMiddleware`.

## Hobby notes

- Fluid Compute / Node.js runtime (no Edge — Drizzle and JWT need Node)
- No crons, Blob, or image transformation pipeline
- Semantic UI assets are static files, not `next/image`
- Seed is a local CLI command only
