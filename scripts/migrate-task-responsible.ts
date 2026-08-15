/**
 * One-off: create task_responsible, copy from tasks.responsible_user_id, drop the column.
 * Run: npm run db:migrate-responsible
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS task_responsible (
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, user_id)
    )
  `;

  const columns = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
      AND column_name = 'responsible_user_id'
    LIMIT 1
  `;

  if (columns.length > 0) {
    await sql`
      INSERT INTO task_responsible (task_id, user_id)
      SELECT id, responsible_user_id
      FROM tasks
      WHERE responsible_user_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `;

    await sql`
      ALTER TABLE tasks DROP COLUMN IF EXISTS responsible_user_id
    `;
    console.log("Migrated responsible_user_id → task_responsible and dropped column.");
  } else {
    console.log("responsible_user_id already absent; ensured task_responsible exists.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
