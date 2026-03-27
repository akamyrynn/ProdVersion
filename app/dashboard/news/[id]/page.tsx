import { getNewsById } from "@/lib/actions/news"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils/format"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { News } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number
  tag?: string
  listType?: string
  url?: string
  src?: string
  altText?: string
}

function renderLexicalNode(node: LexicalNode, i: number): React.ReactNode {
  if (node.text !== undefined) {
    let el: React.ReactNode = node.text
    if (node.format && node.format & 1) el = <strong key={i}>{el}</strong>
    if (node.format && node.format & 2) el = <em key={i}>{el}</em>
    return el
  }

  const children = node.children?.map((child, ci) => renderLexicalNode(child, ci))

  switch (node.type) {
    case "paragraph":
      return <p key={i}>{children}</p>
    case "heading": {
      const tag = node.tag || "h3"
      if (tag === "h1") return <h1 key={i} className="text-xl font-bold">{children}</h1>
      if (tag === "h2") return <h2 key={i} className="text-lg font-bold">{children}</h2>
      return <h3 key={i} className="text-lg font-bold">{children}</h3>
    }
    case "list":
      return node.listType === "number" ? (
        <ol key={i} className="list-decimal pl-5 space-y-1">{children}</ol>
      ) : (
        <ul key={i} className="list-disc pl-5 space-y-1">{children}</ul>
      )
    case "listitem":
      return <li key={i}>{children}</li>
    case "link":
      return (
        <a key={i} href={node.url} target="_blank" rel="noopener noreferrer" className="text-[#5b328a] underline">
          {children}
        </a>
      )
    case "upload": {
      const val = (node as any).value
      const uploadSrc = node.src || val?.url || (val?.filename ? `/api/media/file/${val.filename}` : null)
      return uploadSrc ? (
        <figure key={i} className="my-4">
          <img src={uploadSrc} alt={node.altText || val?.alt || ""} className="rounded-lg max-w-full" />
        </figure>
      ) : null
    }
    case "quote":
      return <blockquote key={i} className="border-l-2 border-neutral-300 pl-4 italic text-neutral-500">{children}</blockquote>
    default:
      return children ? <div key={i}>{children}</div> : null
  }
}

function renderContent(content: unknown) {
  if (!content) return null

  // Lexical JSON object (Supabase returns JSONB as parsed object)
  if (typeof content === "object" && content !== null) {
    const root = (content as { root?: LexicalNode }).root
    if (root?.children) {
      return (
        <div className="space-y-4">
          {root.children.map((node, i) => renderLexicalNode(node, i))}
        </div>
      )
    }
  }

  // String content (legacy or plain text)
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content)
      if (parsed?.root?.children) {
        return (
          <div className="space-y-4">
            {parsed.root.children.map((node: LexicalNode, i: number) =>
              renderLexicalNode(node, i)
            )}
          </div>
        )
      }
    } catch {
      // Plain text
    }
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  return null
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params
  const news = await getNewsById(id) as News | null

  if (!news) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/news"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-400 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Назад к новостям
      </Link>

      {/* Cover */}
      {news.cover_image && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img
            src={news.cover_image}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title + date */}
      <div>
        <h1 className="text-[28px] font-black text-neutral-900 tracking-tight">
          {news.title}
        </h1>
        {news.published_at && (
          <p className="text-[12px] text-neutral-400 mt-2">
            {formatDate(news.published_at)}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="text-[14px] text-neutral-700 leading-relaxed">
        {renderContent(news.content)}
      </div>
    </div>
  )
}
