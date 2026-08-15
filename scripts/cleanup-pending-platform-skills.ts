/**
 * One-off: delete unused platform skill copies left by the old request/approve
 * promotion flow (`scope = platform` and `status = pending`).
 * Tasks never pointed at those rows.
 * Run: npm run db:cleanup-pending-skills
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);

  const removed = await sql`
    DELETE FROM skills
    WHERE scope = 'platform'
      AND status = 'pending'
    RETURNING id, name
  `;

  if (removed.length === 0) {
    console.log("No pending platform skill copies to delete.");
    return;
  }

  console.log(`Deleted ${removed.length} pending platform skill(s):`);
  for (const row of removed) {
    console.log(`  ${row.id} ${row.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
