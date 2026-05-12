import { createLocalAdminClient } from "@/lib/supabase/local-adapter"

export function createAdminClient() {
  return createLocalAdminClient()
}
