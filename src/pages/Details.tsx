import { useEffect, type CSSProperties } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from '../components/Link';
import { detailArticles } from '../data/detailsContent';
import { PageShell } from '../site/SiteChrome';
import { Eyebrow } from '../site/primitives';
import { spotlight } from '../site/motion';
import { CtaBand, PageHero } from '../site/content';

export function Details() {
  useEffect(() => {
    document.title = 'Guides & Resources — EnigmaKeep';
  }, []);

  return (
    <PageShell active="guides">
      <PageHero
        top={<Eyebrow>Guides</Eyebrow>}
        lines={['Guides &', { text: 'Resources', dim: true }]}
        lead="Practical, no-hype explanations of the ideas behind EnigmaKeep, from password hygiene to zero-knowledge encryption. Everything here reflects how the app actually works: fully offline, open source, and encrypted on your own device."
        meta={<span>{detailArticles.length} in-depth guides</span>}
      />

      <div className="lp-wrap">
        <ol className="guide-list">
          {detailArticles.map((article, i) => (
            <li key={article.slug}>
              <Link
                href={'/details/' + article.slug}
                className="guide-row card-in"
                style={{ '--i': i } as CSSProperties}
                onPointerMove={spotlight}
              >
                <span className="guide-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h2>{article.title}</h2>
                  <p>{article.description}</p>
                </div>
                <span className="guide-go">
                  <Clock size={14} />
                  {article.readingTime}
                  <ArrowRight size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="pg-gap" />
        <CtaBand />
      </div>
    </PageShell>
  );
}
