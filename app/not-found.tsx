import Link from "next/link"

export default function NotFound() {
  return (
    <html lang="ru">
      <body
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
        <h1 style={{ fontSize: "6rem", fontWeight: 700, margin: 0, color: "#5b328a" }}>
          404
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#2d1b11", marginTop: "1rem" }}>
          Страница не найдена
        </p>
        <Link
          href="/"
          style={{
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            background: "#5b328a",
            color: "#ffffff",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          На главную
        </Link>
      </body>
    </html>
  )
}
