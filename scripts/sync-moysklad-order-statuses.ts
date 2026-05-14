import { getPayload } from "payload"
import configPromise from "../payload.config"
import { syncMoyskladOrderStatuses } from "../lib/moysklad/status-sync"

async function main() {
  const payload = await getPayload({ config: configPromise })
  const result = await syncMoyskladOrderStatuses(payload)
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
