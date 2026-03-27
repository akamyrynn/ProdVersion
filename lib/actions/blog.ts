"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"

export async function getBlogPosts(page = 1, limit = 9) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "blog_posts",
    where: {
      isPublished: { equals: true },
    },
    sort: "-publishedAt",
    page,
    limit,
    depth: 1,
  })

  return {
    posts: result.docs,
    totalPages: result.totalPages,
    page: result.page || 1,
    totalDocs: result.totalDocs,
  }
}

export async function getBlogPost(slug: string) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: "blog_posts",
    where: {
      slug: { equals: slug },
      isPublished: { equals: true },
    },
    limit: 1,
    depth: 1,
  })

  return result.docs[0] || null
}
