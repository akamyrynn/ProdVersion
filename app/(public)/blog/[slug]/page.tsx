import { getBlogPost, getBlogPosts } from "@/lib/actions/blog"
import SiteHeader from "@/components/landing/SiteHeader"
import LandingFooter from "@/components/landing/LandingFooter"
import Link from "next/link"
import { notFound } from "next/navigation"
import styles from "./article.module.css"

interface Props {
  params: Promise<{ slug: string }>
}

function getImageUrl(coverImage: unknown): string | null {
  if (!coverImage) return null
  if (typeof coverImage === "string") return coverImage
  const img = coverImage as { url?: string; filename?: string }
  if (img.url) return img.url
  if (img.filename) return `/api/media/file/${img.filename}`
  return null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
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
      if (tag === "h1") return <h1 key={i}>{children}</h1>
      if (tag === "h2") return <h2 key={i}>{children}</h2>
      if (tag === "h4") return <h4 key={i}>{children}</h4>
      if (tag === "h5") return <h5 key={i}>{children}</h5>
      if (tag === "h6") return <h6 key={i}>{children}</h6>
      return <h3 key={i}>{children}</h3>
    }
    case "list":
      return node.listType === "number" ? (
        <ol key={i}>{children}</ol>
      ) : (
        <ul key={i}>{children}</ul>
      )
    case "listitem":
      return <li key={i}>{children}</li>
    case "link":
      return (
        <a key={i} href={node.url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    case "upload": {
      const val = (node as any).value
      const uploadSrc = node.src || val?.url || (val?.filename ? `/api/media/file/${val.filename}` : null)
      return uploadSrc ? (
        <figure key={i} className={styles.contentImage}>
          <img src={uploadSrc} alt={node.altText || val?.alt || ""} />
        </figure>
      ) : null
    }
    case "quote":
      return <blockquote key={i}>{children}</blockquote>
    default:
      return children ? <div key={i}>{children}</div> : null
  }
}

function renderContent(content: unknown) {
  if (!content) return null

  // Lexical JSON object (Payload v3 richText)
  if (typeof content === "object" && content !== null) {
    const root = (content as { root?: LexicalNode }).root
    if (root?.children) {
      return (
        <div className={styles.prose}>
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
          <div className={styles.prose}>
            {parsed.root.children.map((node: LexicalNode, i: number) =>
              renderLexicalNode(node, i)
            )}
          </div>
        )
      }
    } catch {
      // Plain text
    }
    return <div className={styles.prose}><p>{content}</p></div>
  }

  return null
}

export const dynamic = "force-dynamic"

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  const imageUrl = getImageUrl(post.coverImage)

  return (
    <>
      <SiteHeader />

      <article>
        <header
          className={styles.hero}
          style={
            imageUrl
              ? { backgroundImage: `url(${imageUrl})` }
              : undefined
          }
        >
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {post.publishedAt && (
              <time className={styles.heroDate}>
                {formatDate(post.publishedAt as string)}
              </time>
            )}
            <h1 className={styles.heroTitle}>{post.title as string}</h1>
            {post.excerpt && (
              <p className={styles.heroExcerpt}>{post.excerpt as string}</p>
            )}
          </div>
        </header>

        <div className={styles.body}>
          <Link href="/blog" className={styles.back}>
            &larr; Все статьи
          </Link>

          {renderContent(post.content)}
        </div>
      </article>

      <LandingFooter />
    </>
  )
}
