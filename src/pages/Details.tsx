import { useEffect } from 'react';
import { Shield, ArrowRight, Clock } from 'lucide-react';
import { Link } from '../components/Link';
import { detailArticles } from '../data/detailsContent';

export function Details() {
  useEffect(() => {
    document.title = 'Guides & Resources — EnigmaKeep';
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
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

      <main className="max-w-3xl mx-auto px-4 py-14">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Guides &amp; Resources</h1>
          <p className="text-muted text-lg leading-relaxed">
            Practical, no-hype explanations of the ideas behind EnigmaKeep, from
            password hygiene to zero-knowledge encryption. Everything here reflects
            how the app actually works: fully offline, open source, and encrypted on
            your own device.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {detailArticles.map((article) => (
            <Link
              key={article.slug}
              href={'/details/' + article.slug}
              className="surface-card p-6 flex flex-col hover:border-accent/40 transition-colors group"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                {article.title}
              </h2>
              <p className="text-muted text-sm leading-relaxed flex-1">
                {article.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {article.readingTime}
                </span>
                <span className="inline-flex items-center gap-1 text-accent">
                  Read
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-line mt-8">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/" className="hover:text-accent transition-colors">
            Home
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
