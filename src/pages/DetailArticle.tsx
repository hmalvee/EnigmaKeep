import { useEffect } from 'react';
import { Shield, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Link } from '../components/Link';
import { detailArticles, getDetailArticle } from '../data/detailsContent';

interface DetailArticleProps {
  slug: string;
}

function ArticleNav() {
  return (
    <nav className="border-b border-line">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display font-semibold text-ink hover:text-accent transition-colors"
        >
          <Shield size={22} className="text-accent" />
          <span>EnigmaKeep</span>
        </Link>
        <Link href="/app" className="btn-primary text-sm">
          Open Vault
        </Link>
      </div>
    </nav>
  );
}

export function DetailArticle({ slug }: DetailArticleProps) {
  const article = getDetailArticle(slug);

  useEffect(() => {
    if (article) {
      document.title = article.title + ' — EnigmaKeep';
    } else {
      document.title = 'Guide not found — EnigmaKeep';
    }
  }, [slug, article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-bg text-ink">
        <ArticleNav />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Guide not found</h1>
          <p className="text-muted mb-8">
            We couldn&apos;t find the guide you were looking for.
          </p>
          <Link href="/details" className="btn-primary">
            <ArrowLeft size={18} className="mr-2" />
            Back to all guides
          </Link>
        </main>
      </div>
    );
  }

  const related = detailArticles.filter((a) => a.slug !== article.slug);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <ArticleNav />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/details"
          className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors text-sm mb-8"
        >
          <ArrowLeft size={16} />
          <span>All guides</span>
        </Link>

        <article>
          <header className="mb-10">
            <h1 className="text-4xl font-bold mb-4 leading-tight">{article.title}</h1>
            <p className="text-muted text-lg leading-relaxed mb-5">
              {article.description}
            </p>
            <span className="ai-badge">
              <Clock size={14} />
              {article.readingTime}
            </span>
          </header>

          <div className="space-y-5 mb-12">
            {article.intro.split('\n\n').map((para, i) => (
              <p key={i} className="text-muted leading-relaxed text-lg">
                {para}
              </p>
            ))}
          </div>

          {article.sections.map((section) => (
            <section key={section.heading} className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
              <div className="space-y-4">
                {section.body.map((para, i) => (
                  <p key={i} className="text-muted leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <div className="section-divider my-12" />

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-5">Related guides</h2>
          <ul className="space-y-3">
            {related.map((a) => (
              <li key={a.slug}>
                <Link
                  href={'/details/' + a.slug}
                  className="surface-card px-5 py-4 flex items-center justify-between gap-4 hover:border-accent/40 transition-colors group"
                >
                  <span className="font-medium group-hover:text-accent transition-colors">
                    {a.title}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-accent shrink-0 group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-8 text-center bg-accent/5">
          <h2 className="text-2xl font-semibold mb-3">Ready to secure your passwords?</h2>
          <p className="text-muted leading-relaxed mb-6 max-w-xl mx-auto">
            EnigmaKeep keeps everything encrypted on your device, with no account and
            no servers. Open your vault and take control of your credentials.
          </p>
          <Link href="/app" className="btn-primary">
            Open Vault
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-line mt-8">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
          </Link>
          <Link href="/details" className="hover:text-accent transition-colors">
            All guides
          </Link>
          <Link href="/privacy" className="hover:text-accent transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-accent transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
