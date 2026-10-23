import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, Share2 } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link } from '../components/Link';
import { getAllBlogPosts, getBlogPostBySlug } from '../data/blogPosts';
import { PageShell } from '../site/SiteChrome';
import { useScrollSpy } from '../site/motion';
import { formatDate, slugify, textOf } from '../site/text';
import {
  Cover,
  CtaBand,
  NotFound,
  PageHero,
  PostCard,
  ReadingProgress,
  Toc,
  type TocItem,
} from '../site/content';

interface BlogPostProps {
  slug: string;
}

// "## Heading" lines outside code fences become the table of contents.
function headingsOf(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const match = !inFence && /^#{1,2}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const label = match[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '');
    items.push({ id: slugify(label), label });
  }
  return items;
}

// Posts open with "# <title>"; the page header already shows it.
function withoutLeadingTitle(markdown: string, title: string): string {
  const match = /^\s*#\s+(.+)\n/.exec(markdown);
  return match && match[1].trim() === title.trim() ? markdown.slice(match[0].length) : markdown;
}

const markdownComponents: Components = {
  // The page title is the only h1; in-body h1s render as section headings.
  h1: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    ),
  table: ({ children }) => (
    <div className="prose-table">
      <table>{children}</table>
    </div>
  ),
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export function BlogPost({ slug }: BlogPostProps) {
  const post = getBlogPostBySlug(slug);
  const articleRef = useRef<HTMLElement>(null);
  const [shared, setShared] = useState(false);

  const body = useMemo(() => (post ? withoutLeadingTitle(post.content, post.title) : ''), [post]);
  const headings = useMemo(() => headingsOf(body), [body]);
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const active = useScrollSpy(headingIds, '-96px 0px -70% 0px');

  useEffect(() => {
    if (post) {
      // Update page title and meta tags dynamically
      document.title = `${post.title} | EnigmaKeep Blog`;

      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.description);
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (ogTitle) ogTitle.setAttribute('content', post.title);
      if (ogDescription) ogDescription.setAttribute('content', post.description);
      if (ogImage) ogImage.setAttribute('content', `https://www.enigmakeep.com${post.image}`);

      // Add structured data for the blog post
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.description,
        "image": `https://www.enigmakeep.com${post.image}`,
        "author": {
          "@type": "Person",
          "name": post.author,
          "url": post.authorUrl
        },
        "publisher": {
          "@type": "Organization",
          "name": "EnigmaKeep",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.enigmakeep.com/icons/icon-512x512.png"
          }
        },
        "datePublished": post.publishDate,
        "dateModified": post.updatedDate,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://www.enigmakeep.com/blog/${post.slug}`
        }
      });
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [post]);

  if (!post) {
    return (
      <PageShell active="journal">
        <NotFound
          title="Post not found"
          body="This article may have moved, or the link is mistyped."
          href="/blog"
          label="Back to the journal"
        />
      </PageShell>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href
        });
      } catch {
        console.log('Share cancelled');
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch {
      // Clipboard unavailable; nothing else to do.
    }
  };

  const related = getAllBlogPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  return (
    <PageShell key={post.slug} active="journal">
      <ReadingProgress targetRef={articleRef} />

      <PageHero
        top={
          <nav data-rv className="pg-crumbs rv" aria-label="Breadcrumb">
            <Link href="/blog">Journal</Link>
            <i />
            <span>{post.category}</span>
          </nav>
        }
        lines={[post.title]}
        article
        lead={post.description}
      >
        <div data-rv className="byline rv" style={{ '--d': '380ms' } as CSSProperties}>
          <div className="byline-who">
            <span className="avatar" aria-hidden="true">
              {initials(post.author)}
            </span>
            <div>
              <a href={post.authorUrl} target="_blank" rel="noopener noreferrer">
                <b>{post.author}</b>
              </a>
              <span>
                {formatDate(post.publishDate)} · {post.readTime}
              </span>
            </div>
          </div>
          <button type="button" onClick={handleShare} className={shared ? 'ghost-btn is-done' : 'ghost-btn'}>
            {shared ? <Check size={15} /> : <Share2 size={15} />}
            {shared ? 'Link copied' : 'Share'}
          </button>
        </div>
      </PageHero>

      <div className="lp-wrap">
        <div data-rv className="rv" style={{ '--d': '200ms' } as CSSProperties}>
          <Cover seed={post.slug} label={post.category} className="article-cover" />
        </div>

        <div className="doc is-right">
          {headings.length > 1 && (
            <Toc
              items={headings}
              active={active}
              footer={
                <Link href="/blog" className="lp-link">
                  <ArrowLeft size={14} /> All articles
                </Link>
              }
            />
          )}

          <article ref={articleRef}>
            <div className="prose-lux">
              <ReactMarkdown components={markdownComponents}>{body}</ReactMarkdown>
            </div>

            <div className="tagrow" aria-label="Tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        </div>

        {related.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <div className="related-head">
              <h2 id="related-title">Keep reading</h2>
              <Link href="/blog" className="lp-link">
                All articles <ArrowRight size={15} />
              </Link>
            </div>
            <div className="post-grid">
              {related.map((p, i) => (
                <PostCard
                  key={p.id}
                  order={i}
                  post={{
                    href: `/blog/${p.slug}`,
                    seed: p.slug,
                    category: p.category,
                    title: p.title,
                    description: p.description,
                    date: formatDate(p.publishDate, 'short'),
                    readTime: p.readTime,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <div className="pg-gap" />
        <CtaBand />
      </div>
    </PageShell>
  );
}
