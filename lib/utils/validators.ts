import { z } from "zod"

// ============================================================
// Auth validators
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
})

export const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  full_name: z.string().min(2, "Введите ваше имя"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Введите корректный email"),
})

// ============================================================
// Company validators
// ============================================================

export const companySchema = z.object({
  name: z.string().min(1, "Введите название компании"),
  inn: z.string().min(10, "ИНН должен содержать минимум 10 цифр").max(12),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  legal_address: z.string().optional(),
  actual_address: z.string().optional(),
  bank_name: z.string().optional(),
  bik: z.string().optional(),
  correspondent_account: z.string().optional(),
  settlement_account: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
})

// ============================================================
// Product validators (admin)
// ============================================================

const commonProductFields = z.object({
  name: z.string().min(1, "Введите название товара"),
  slug: z.string().min(1, "Введите slug"),
  category_id: z.string().uuid("Выберите категорию"),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
  stickers: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string(), color: z.string().optional() })).default([]),
})

export const coffeeProductSchema = commonProductFields.extend({
  product_type: z.literal("coffee"),
  roaster: z.string().optional(),
  roast_level: z.string().optional(),
  region: z.string().optional(),
  processing_method: z.string().optional(),
  growing_height: z.string().optional(),
  q_grader_rating: z.number().min(0).max(100).optional(),
  brewing_methods: z
    .array(
      z.object({
        method: z.string(),
        description: z.string(),
        image_url: z.string().optional(),
      })
    )
    .optional(),
})

export const teaProductSchema = commonProductFields.extend({
  product_type: z.literal("tea"),
  brewing_instructions: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        image_url: z.string().optional(),
      })
    )
    .optional(),
})

export const accessoryProductSchema = commonProductFields.extend({
  product_type: z.literal("accessory"),
})

export const productVariantSchema = z.object({
  name: z.string().min(1, "Введите название варианта"),
  sku: z.string().optional(),
  price: z.number().positive("Цена должна быть положительной"),
  weight_grams: z.number().int().positive().optional(),
  is_available: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  grind_options: z.array(z.string()).default([]),
})

// ============================================================
// Category validators
// ============================================================

export const categorySchema = z.object({
  name: z.string().min(1, "Введите название категории"),
  slug: z.string().min(1, "Введите slug"),
  product_type: z.enum(["coffee", "tea", "accessory"]),
  parent_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
})

// ============================================================
// Promo code validators
// ============================================================

export const promoCodeSchema = z.object({
  code: z.string().min(3, "Минимум 3 символа").toUpperCase(),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.number().positive("Значение должно быть положительным"),
  is_single_use: z.boolean().default(false),
  max_uses: z.number().int().positive().optional(),
  restricted_to_email: z.string().email().optional().or(z.literal("")),
  min_order_amount: z.number().positive().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().default(true),
})

// ============================================================
// Order validators
// ============================================================

export const checkoutSchema = z.object({
  company_id: z.string().optional(),
  delivery_method: z.enum(["self_pickup", "cdek", "cap_2000"]),
  delivery_address: z.string().optional(),
  comment: z.string().optional(),
})

// ============================================================
// News validators
// ============================================================

export const newsSchema = z.object({
  title: z.string().min(1, "Введите заголовок"),
  slug: z.string().min(1, "Введите slug"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Введите содержание"),
  is_published: z.boolean().default(false),
})

// ============================================================
// Admin invite validators
// ============================================================

export const adminInviteSchema = z.object({
  email: z.string().email("Введите корректный email"),
  role: z.enum(["ADMIN", "MANAGER"]),
})

// ============================================================
// Type exports
// ============================================================

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type CompanyFormData = z.infer<typeof companySchema>
export type CheckoutFormData = z.infer<typeof checkoutSchema>
export type PromoCodeFormData = z.infer<typeof promoCodeSchema>
export type NewsFormData = z.infer<typeof newsSchema>
export type AdminInviteFormData = z.infer<typeof adminInviteSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type ProductVariantFormData = z.infer<typeof productVariantSchema>
