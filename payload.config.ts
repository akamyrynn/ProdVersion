import path from "path"
import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { s3Storage } from "@payloadcms/storage-s3"
import sharp from "sharp"

import { Categories } from "./payload/collections/Categories"
import { Products } from "./payload/collections/Products"
import { Orders } from "./payload/collections/Orders"
import { PromoCodes } from "./payload/collections/PromoCodes"
import { News } from "./payload/collections/News"
import { Admins } from "./payload/collections/Admins"
import { Clients } from "./payload/collections/Clients"
import { Media } from "./payload/collections/Media"
import { CartItems } from "./payload/collections/CartItems"
import { Favorites } from "./payload/collections/Favorites"
import { SiteSettings } from "./payload/globals/SiteSettings"

export default buildConfig({
  admin: {
    user: Admins.slug,
    meta: {
      titleSuffix: " — 10coffee",
      description: "Панель управления 10coffee",
    },
    dateFormat: "dd.MM.yyyy HH:mm",
  },

  collections: [
    Orders,
    PromoCodes,
    Clients,
    CartItems,
    Favorites,
    Products,
    Categories,
    News,
    Media,
    Admins,
  ],

  globals: [SiteSettings],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || "your-secret-key-change-this",

  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    push: false,
  }),

  sharp,

  plugins: [
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
              },
              region: process.env.S3_REGION || "us-east-1",
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],

  localization: {
    locales: [{ label: "Русский", code: "ru" }],
    defaultLocale: "ru",
  },
})
