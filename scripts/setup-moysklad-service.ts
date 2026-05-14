import { setupMoyskladDeliveryService } from "../lib/moysklad/service-setup"

async function main() {
  const result = await setupMoyskladDeliveryService()
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
