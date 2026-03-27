import Link from "next/link"
import { Newspaper } from "lucide-react"

export default function NewsNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <Newspaper className="h-7 w-7 text-neutral-300" />
      </div>
      <h2 className="text-[16px] font-bold text-neutral-900">Новость не найдена</h2>
      <p className="text-[12px] text-neutral-400 mt-1">
        Новость была удалена или не существует
      </p>
      <Link
        href="/dashboard/news"
        className="mt-4 text-[12px] font-semibold text-[#5b328a] hover:text-[#4a2870] transition-colors"
      >
        Вернуться к новостям
      </Link>
    </div>
  )
}
