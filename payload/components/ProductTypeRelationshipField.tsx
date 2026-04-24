"use client"

import { useEffect } from "react"
import { RelationshipField, useField, useFormFields } from "@payloadcms/ui"
import type { ProductDetailsSchema } from "@/types"
import { getRelationshipId, normalizeProductDetailsSchema } from "@/lib/product-types"

type RelationshipFieldProps = React.ComponentProps<typeof RelationshipField>

function getSiblingPath(path: string, siblingName: string): string {
  const parts = path.split(".")
  parts[parts.length - 1] = siblingName
  return parts.join(".")
}

function getDetailsSchema(value: unknown): ProductDetailsSchema | null {
  if (!value || typeof value !== "object") return null

  const schema = (value as { detailsSchema?: unknown }).detailsSchema
  if (schema === undefined) return null

  return normalizeProductDetailsSchema(schema)
}

export default function ProductTypeRelationshipField(props: RelationshipFieldProps) {
  const currentValue = useFormFields(([fields]) => fields?.[props.path]?.value)
  const detailsSchemaPath = getSiblingPath(props.path, "detailsSchema")
  const { value: detailsSchema, setValue: setDetailsSchema } = useField<ProductDetailsSchema>({
    path: detailsSchemaPath,
  })

  useEffect(() => {
    const inlineSchema = getDetailsSchema(currentValue)
    if (inlineSchema) {
      if (detailsSchema !== inlineSchema) {
        setDetailsSchema(inlineSchema, true)
      }
      return
    }

    const typeId = getRelationshipId(currentValue)
    if (!typeId) {
      if (detailsSchema !== "generic") {
        setDetailsSchema("generic", true)
      }
      return
    }

    const controller = new AbortController()

    void fetch(`/api/product-types/${typeId}?depth=0`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load product type")
        return response.json() as Promise<{ detailsSchema?: unknown }>
      })
      .then((doc) => {
        const nextSchema = normalizeProductDetailsSchema(doc.detailsSchema)
        if (detailsSchema !== nextSchema) {
          setDetailsSchema(nextSchema, true)
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        if (detailsSchema !== "generic") {
          setDetailsSchema("generic", true)
        }
      })

    return () => controller.abort()
  }, [currentValue, detailsSchema, setDetailsSchema])

  return <RelationshipField {...props} />
}
