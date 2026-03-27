"use client"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        background: "#ffffff",
        color: "#1d1d1b",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Что-то пошло не так</h1>
      <p style={{ fontSize: "1rem", color: "#2d1b11", marginTop: "0.75rem" }}>
        Произошла ошибка. Попробуйте обновить страницу.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem 2rem",
          background: "#5b328a",
          color: "#ffffff",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: 500,
        }}
      >
        Попробовать снова
      </button>
    </div>
  )
}
