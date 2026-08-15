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
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` after Account Portal sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` after Account Portal sign-up |
| `JWT_SECRET` | Still used by leftover GraphQL password mutations |
| `JWT_EXPIRY` | Token lifetime, e.g. `7d` |
| `DEFAULT_GROUP_SLUG` | Seed/bootstrap slug for the first group only (not live tenancy) |
| `GROUP_ADMIN_EMAILS` | Platform admins (`/admin/groups`); also GroupLeader bootstrap |

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
- Cookie `compass_group` stores **this user's** active group slug (from their memberships, or any group for platform admins)
- Self-signups are **orphans** (no membership) until invited or assigned by a platform admin

Do **not** use Clerk Organizations as the source of truth for scout roles.

### Multi-group / platform admin

Emails in `GROUP_ADMIN_EMAILS` are platform admins. They can open **Groups** in the
nav (`/admin/groups`) to:

- Create, rename, activate/deactivate groups
- View members of a group and remove them
- Assign orphaned users (no active membership) into a group

Everyone else only sees groups they belong to. The nav dropdown switches the
active group for that session via `POST /api/active-group` (sets `compass_group`).

### Inviting new members

From the Members page, an admin with `GroupLeader` / `AssistGroupLeader` / `Secretary`
can invite someone by email and (optionally) pre-assign roles:

- If the email already has a Neon or Clerk account, they're added to the group
  immediately (no email sent).
- Otherwise a placeholder Neon user + membership + roles are created, and Clerk
  emails them an invitation link (`clerkClient().invitations.createInvitation`).
  The invitation sets `redirectUrl` to `${NEXT_PUBLIC_APP_URL}/sign-up` so the
  invitee lands on this app's own sign-up page (not Clerk's `*.accounts.dev`
  Account Portal, which is confusing for users). Set `NEXT_PUBLIC_APP_URL` in
  every environment (see [`.env.example`](.env.example)).
  When they create their account, the existing Clerk-to-Neon sync links it by
  email and their roles are already in place.
- Members who haven't created their account yet show an "Invited" badge and can
  have their invite resent from the member detail modal.

Clerk sends the invitation email itself — there's no separate transactional
email provider configured in this app.

Clerk production instances cannot use a `*.vercel.app` hostname. This Hobby deploy uses the Clerk development instance and redirects `/sign-in` and `/sign-up` to the `*.accounts.dev` Account Portal. Remove any `compass-organiser.vercel.app` production domain from the Clerk dashboard if sign-in tries to use `accounts.compass-organiser.vercel.app`. A custom domain you own is required before switching to live keys.

## Hobby notes

- Fluid Compute / Node.js runtime (no Edge — Drizzle and JWT need Node)
- No crons, Blob, or image transformation pipeline
- Semantic UI assets are static files, not `next/image`
- Seed is a local CLI command only
