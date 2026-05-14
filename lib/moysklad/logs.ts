import { dbQuery } from "@/lib/db"

export type MoyskladSyncLogStatus = "success" | "error" | "skipped"

interface WriteMoyskladLogParams {
  entityType: string
  localId?: string | number | null
  moyskladId?: string | null
  direction: "site_to_moysklad" | "moysklad_to_site"
  status: MoyskladSyncLogStatus
  message?: string
  payload?: unknown
  response?: unknown
}

let tableReady = false

async function ensureLogsTable() {
  if (tableReady) return
  await dbQuery(`
    create table if not exists public.moysklad_sync_logs (
      id bigserial primary key,
      entity_type text not null,
      local_id text,
      moysklad_id text,
      direction text not null,
      status text not null,
      message text,
      payload jsonb,
      response jsonb,
      created_at timestamptz not null default now()
    )
  `)
  tableReady = true
}

export async function writeMoyskladLog(params: WriteMoyskladLogParams) {
  try {
    await ensureLogsTable()
    await dbQuery(
      `insert into public.moysklad_sync_logs
        (entity_type, local_id, moysklad_id, direction, status, message, payload, response)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        params.entityType,
        params.localId === null || params.localId === undefined ? null : String(params.localId),
        params.moyskladId || null,
        params.direction,
        params.status,
        params.message || null,
        params.payload === undefined ? null : JSON.stringify(params.payload),
        params.response === undefined ? null : JSON.stringify(params.response),
      ]
    )
  } catch (error) {
    console.error("Failed to write MoySklad sync log:", error)
  }
}
