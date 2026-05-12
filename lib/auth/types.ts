export interface AppUserMetadata {
  user_type?: "client" | "admin" | string
  full_name?: string
  phone?: string
  avatar_url?: string
  admin_role?: string
  [key: string]: unknown
}

export interface AppUser {
  id: string
  email: string
  user_metadata: AppUserMetadata
  app_metadata: Record<string, unknown>
}
