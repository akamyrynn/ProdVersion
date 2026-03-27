"use client"

import React, { useState } from "react"
import { useDocumentInfo } from "@payloadcms/ui"

const PROMO_PRESETS = [
  {
    id: "welcome_10",
    label: "Приветственный 10%",
    description: "10% на 30 дней, 1 использование",
  },
  {
    id: "loyalty_15",
    label: "Лояльность 15%",
    description: "15% на 60 дней, до 3 использований",
  },
  {
    id: "fixed_500",
    label: "Скидка 500 руб",
    description: "При заказе от 3 000 руб",
  },
  {
    id: "fixed_1000",
    label: "Скидка 1 000 руб",
    description: "При заказе от 5 000 руб",
  },
]

export const IssuePromoButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!id) return null

  const clientEmail = (initialData as Record<string, unknown>)?.email as
    | string
    | undefined

  async function handleIssue(presetId: string) {
    setLoading(presetId)
    setResult(null)
    setError(null)
    try {
      const res = await fetch("/api/promo-codes/issue-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ presetId, clientEmail, clientId: id }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ code: data.promoCode.code })
      } else {
        setError(data.error || "Ошибка при создании промокода")
      }
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        marginTop: "8px",
      }}
    >
      <h4
        style={{
          margin: "0 0 4px 0",
          fontSize: "15px",
          fontWeight: 600,
          color: "#1d1d1b",
        }}
      >
        Выдать промокод
      </h4>
      {clientEmail && (
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "13px",
            color: "#666",
          }}
        >
          Будет привязан к: {clientEmail}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        {PROMO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleIssue(preset.id)}
            disabled={loading !== null}
            type="button"
            style={{
              padding: "12px 14px",
              border: `1px solid ${loading === preset.id ? "#5b328a" : "#d0d0d0"}`,
              borderRadius: "8px",
              background: loading === preset.id ? "#5b328a" : "#fff",
              color: loading === preset.id ? "#fff" : "#1d1d1b",
              cursor: loading ? "wait" : "pointer",
              textAlign: "left",
              fontSize: "13px",
              transition: "all 0.15s ease",
            }}
          >
            <strong style={{ display: "block", marginBottom: "2px" }}>
              {preset.label}
            </strong>
            <span style={{ fontSize: "11px", opacity: 0.6 }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>
      {result && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#166534",
          }}
        >
          Промокод создан:{" "}
          <strong style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
            {result.code}
          </strong>
          {clientEmail && (
            <span style={{ opacity: 0.7 }}> (привязан к {clientEmail})</span>
          )}
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

export default IssuePromoButton
