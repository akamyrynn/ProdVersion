import path from "path"
import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { s3Storage } from "@payloadcms/storage-s3"
import { ru } from "@payloadcms/translations/languages/ru"
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
import { MapLocations } from "./payload/collections/MapLocations"
import { BlogPosts } from "./payload/collections/BlogPosts"
import { Tags } from "./payload/collections/Tags"
import { PriceListRequests } from "./payload/collections/PriceListRequests"
import { SiteSettings } from "./payload/globals/SiteSettings"

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "",

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
    PriceListRequests,
    PromoCodes,
    Clients,
    CartItems,
    Favorites,
    Tags,
    Products,
    Categories,
    News,
    MapLocations,
    BlogPosts,
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
    push: true,
  }),

  sharp,

  plugins: [
    s3Storage({
      collections: {
        media: { prefix: "media/" },
      },
      bucket: process.env.S3_BUCKET || "placeholder",
      config: {
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        region: process.env.S3_REGION || "us-east-1",
        forcePathStyle: true,
      },
      ...(process.env.S3_BUCKET ? {} : { enabled: false }),
    }),
  ],

  localization: {
    locales: [{ label: "Русский", code: "ru" }],
    defaultLocale: "ru",
  },

  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: "ru",
  },
})
