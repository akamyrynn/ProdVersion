import { moyskladGetList } from "./client"
import type { MoyskladAssortment, MoyskladProduct, MoyskladProductFolder, MoyskladVariant } from "./types"

export async function fetchMoyskladProductFolders(limit = 100, offset = 0) {
  return moyskladGetList<MoyskladProductFolder>("entity/productfolder", {
    limit,
    offset,
  })
}

export async function fetchMoyskladAssortment(limit = 100, offset = 0) {
  return moyskladGetList<MoyskladAssortment>("entity/assortment", {
    limit,
    offset,
    filter: "archived=false",
  })
}

export async function fetchMoyskladProducts(limit = 100, offset = 0) {
  return moyskladGetList<MoyskladProduct>("entity/product", {
    limit,
    offset,
    expand: "productFolder",
  })
}

export async function fetchMoyskladVariants(limit = 100, offset = 0) {
  return moyskladGetList<MoyskladVariant>("entity/variant", {
    limit,
    offset,
    expand: "product",
  })
}

export function getPrimarySalePrice(assortment: MoyskladAssortment) {
  const price = assortment.salePrices?.[0]?.value
  return price ? Math.round(price) / 100 : 0
}
