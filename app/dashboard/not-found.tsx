import Link from "next/link"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-5xl font-bold text-[#5b328a]">404</h1>
      <p className="text-[#2d1b11] mt-2">Страница не найдена</p>
      <Link
        href="/dashboard"
        className="mt-4 px-6 py-2.5 bg-[#5b328a] text-white rounded-lg text-sm font-medium hover:bg-[#4a2870] transition-colors"
      >
        В личный кабинет
      </Link>
    </div>
  )
}
