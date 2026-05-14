import fs from "node:fs"
import path from "node:path"

export function preparePayloadRuntime() {
  const loadEnvPath = path.join(process.cwd(), "node_modules/payload/dist/bin/loadEnv.js")
  if (!fs.existsSync(loadEnvPath)) return

  const source = fs.readFileSync(loadEnvPath, "utf8")
  if (!source.includes("nextEnvImport")) return

  fs.writeFileSync(
    loadEnvPath,
    [
      "export function loadEnv() {",
      "  return undefined;",
      "}",
      "",
    ].join("\n")
  )
}
