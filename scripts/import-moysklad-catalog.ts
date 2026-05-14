import { getPayload } from "payload"
import configPromise from "../payload.config"
import { importMoyskladCatalog } from "../lib/moysklad/import-catalog"

async function main() {
  const payload = await getPayload({ config: configPromise })
  const result = await importMoyskladCatalog(payload)
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
