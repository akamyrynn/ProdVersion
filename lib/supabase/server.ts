import { createLocalClient } from "@/lib/supabase/local-adapter"

export async function createClient() {
  return createLocalClient()
}
