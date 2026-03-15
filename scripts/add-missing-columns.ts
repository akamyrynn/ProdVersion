/**
 * One-time script: adds missing columns to DB.
 * Run: npx tsx scripts/add-missing-columns.ts
 */
import { Client } from "pg"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "../.env.local") })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set")
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  const migrations = [
    // Orders table
    ["orders", "discount_percent", "NUMERIC DEFAULT 0"],
    ["orders", "vat_rate", "VARCHAR DEFAULT 'none'"],
    ["orders", "vat_custom_rate", "NUMERIC DEFAULT NULL"],
    ["orders", "vat_amount", "NUMERIC DEFAULT 0"],
    // MapLocations — image field
    ["map_locations", "image_id", "INTEGER REFERENCES media(id) ON DELETE SET NULL"],
  ]

  for (const [table, col, def] of migrations) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`)
    console.log(`+ ${table}.${col}`)
  }

  console.log("\nDone!")
  await client.end()
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
