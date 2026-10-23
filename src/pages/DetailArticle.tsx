import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Link } from '../components/Link';
import { detailArticles, getDetailArticle } from '../data/detailsContent';
import { PageShell } from '../site/SiteChrome';
import { spotlight, useScrollSpy } from '../site/motion';
import { slugify } from '../site/text';
import { CtaBand, NotFound, PageHero, ReadingProgress, Toc } from '../site/content';

interface DetailArticleProps {
  slug: string;
}

export function DetailArticle({ slug }: DetailArticleProps) {
  const article = getDetailArticle(slug);
  const articleRef = useRef<HTMLElement>(null);

  const toc = useMemo(
    () => (article ? article.sections.map((s) => ({ id: slugify(s.heading), label: s.heading })) : []),
    [article]
  );
  const tocIds = useMemo(() => toc.map((t) => t.id), [toc]);
  const active = useScrollSpy(tocIds, '-96px 0px -70% 0px');

  useEffect(() => {
    if (article) {
      document.title = article.title + ' — EnigmaKeep';
    } else {
      document.title = 'Guide not found — EnigmaKeep';
    }
  }, [slug, article]);

  if (!article) {
    return (
      <PageShell active="guides">
        <NotFound
          title="Guide not found"
          body="We couldn't find the guide you were looking for."
          href="/details"
          label="Back to all guides"
        />
      </PageShell>
    );
  }

  const position = detailArticles.findIndex((a) => a.slug === article.slug);
  // The next three guides in order, wrapping around.
  const related = [1, 2, 3]
    .map((offset) => detailArticles[(position + offset) % detailArticles.length])
    .filter((a) => a.slug !== article.slug);
  const [firstPara, ...introRest] = article.intro.split('\n\n');

  return (
    <PageShell key={article.slug} active="guides">
      <ReadingProgress targetRef={articleRef} />

      <PageHero
        top={
          <nav data-rv className="pg-crumbs rv" aria-label="Breadcrumb">
            <Link href="/details">Guides</Link>
            <i />
            <span>Guide {String(position + 1).padStart(2, '0')}</span>
          </nav>
        }
        lines={[article.title]}
        article
        lead={article.description}
        meta={
          <>
            <span>
              <Clock size={14} /> {article.readingTime}
            </span>
            <span>{article.sections.length} sections</span>
          </>
        }
      />

      <div className="lp-wrap">
        <div className="pg-rule" />
        <div className="doc is-right">
          <Toc
            items={toc}
            active={active}
            footer={
              <Link href="/details" className="lp-link">
                <ArrowLeft size={14} /> All guides
              </Link>
            }
          />

          <article ref={articleRef} className="prose-lux">
            <p className="lede dropcap">{firstPara}</p>
            {introRest.map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 id={slugify(section.heading)}>{section.heading}</h2>
                {section.body.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </section>
            ))}
          </article>
        </div>

        {related.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <div className="related-head">
              <h2 id="related-title">Related guides</h2>
              <Link href="/details" className="lp-link">
                All guides <ArrowRight size={15} />
              </Link>
            </div>
            <ol className="guide-list">
              {related.map((a, i) => (
                <li key={a.slug}>
                  <Link
                    href={'/details/' + a.slug}
                    className="guide-row card-in"
                    style={{ '--i': i } as CSSProperties}
                    onPointerMove={spotlight}
                  >
                    <span className="guide-n">
                      {String(detailArticles.indexOf(a) + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h2>{a.title}</h2>
                      <p>{a.description}</p>
                    </div>
                    <span className="guide-go">
                      <Clock size={14} />
                      {a.readingTime}
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="pg-gap" />
        <CtaBand />
      </div>
    </PageShell>
  );
}
