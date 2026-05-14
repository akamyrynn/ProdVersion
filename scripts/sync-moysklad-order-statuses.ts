import { syncMoyskladOrderStatuses } from "../lib/moysklad/status-sync"
import { preparePayloadRuntime } from "./payload-runtime"

async function main() {
  preparePayloadRuntime()
  const [{ getPayload }, configModule] = await Promise.all([
    import("payload"),
    import("../payload.config"),
  ])
  const payload = await getPayload({ config: configModule.default })
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
