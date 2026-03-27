"use client"

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-2xl font-bold text-[#1d1d1b]">Ошибка</h1>
      <p className="text-[#2d1b11] mt-2">
        Что-то пошло не так. Попробуйте обновить страницу.
      </p>
      <button
        onClick={reset}
        className="mt-4 px-6 py-2.5 bg-[#5b328a] text-white rounded-lg text-sm font-medium hover:bg-[#4a2870] transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  )
}
