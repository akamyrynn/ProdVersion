import { Pool, type QueryResult, type QueryResultRow } from "pg"

declare global {
  var __coffeePgPool: Pool | undefined
}

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }
  return connectionString
}

function shouldUseSsl(connectionString: string) {
  if (process.env.DATABASE_SSL === "false") return false
  const { hostname } = new URL(connectionString)
  if (hostname === "localhost" || hostname === "127.0.0.1") return false
  if (hostname === "10coffee-postgres" || !hostname.includes(".")) return false
  return true
}

export function getPool() {
  if (!globalThis.__coffeePgPool) {
    const connectionString = getConnectionString()
    globalThis.__coffeePgPool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    })
  }

  return globalThis.__coffeePgPool
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values)
}

export function quoteIdent(identifier: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`)
  }
  return `"${identifier}"`
}
