import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../components/Link';
import { getAllBlogPosts, type BlogPost } from '../data/blogPosts';
import { PageShell } from '../site/SiteChrome';
import { Eyebrow } from '../site/primitives';
import { spotlight } from '../site/motion';
import { Cover, CtaBand, PageHero, PostCard } from '../site/content';
import { formatDate } from '../site/text';

const ALL = 'All';

export function Blog() {
  const posts = useMemo(
    () => [...getAllBlogPosts()].sort((a, b) => b.publishDate.localeCompare(a.publishDate)),
    []
  );
  const categories = useMemo(() => [ALL, ...new Set(posts.map((p) => p.category))], [posts]);
  const [category, setCategory] = useState(ALL);

  const visible = category === ALL ? posts : posts.filter((p) => p.category === category);
  const [featured, ...rest] = visible;
  // Issue numbers count up from the oldest post, like a print journal.
  const issueOf = (post: BlogPost) => posts.length - posts.indexOf(post);

  return (
    <PageShell active="journal">
      <PageHero
        top={<Eyebrow>Journal</Eyebrow>}
        lines={['Password Security', { text: 'Knowledge Base', dim: true }]}
        lead="Learn about password security, zero-knowledge encryption, and best practices for protecting your digital life."
      >
        <div data-rv className="filters rv" style={{ '--d': '380ms' } as CSSProperties} role="group" aria-label="Filter by topic">
          {categories.map((name) => {
            const count = name === ALL ? posts.length : posts.filter((p) => p.category === name).length;
            return (
              <button
                key={name}
                type="button"
                className={category === name ? 'chip is-on' : 'chip'}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
                <small>{count}</small>
              </button>
            );
          })}
        </div>
      </PageHero>

      <div className="lp-wrap">
        {/* Remount on filter change so the cards replay their entrance */}
        <div key={category}>
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="lp-card feature-post card-in" onPointerMove={spotlight}>
              <Cover seed={featured.slug} label={`Latest · ${featured.category}`} index={issueOf(featured)} />
              <div className="feature-body">
                <div className="post-meta">
                  <span className="post-cat">{featured.category}</span>
                  <span>{formatDate(featured.publishDate)}</span>
                  <span>{featured.readTime}</span>
                </div>
                <h2>{featured.title}</h2>
                <p>{featured.description}</p>
                <span className="read-on">
                  Read the article <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="post-grid">
              {rest.map((post, i) => (
                <PostCard
                  key={post.id}
                  order={i + 1}
                  post={{
                    href: `/blog/${post.slug}`,
                    seed: post.slug,
                    category: post.category,
                    title: post.title,
                    description: post.description,
                    date: formatDate(post.publishDate, 'short'),
                    readTime: post.readTime,
                    index: issueOf(post),
                  }}
                />
              ))}
            </div>
          )}

          {!featured && <p className="empty-note">No articles in this topic yet.</p>}
        </div>

        <div className="pg-gap" />
        <CtaBand />
      </div>
    </PageShell>
  );
}
