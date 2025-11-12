import { useEffect } from 'react';
import { Calendar, Clock, Tag, ArrowLeft, Share2, User } from 'lucide-react';
import { Link } from '../components/Link';
import { getBlogPostBySlug } from '../data/blogPosts';
import ReactMarkdown from 'react-markdown';

interface BlogPostProps {
  slug: string;
}

export function BlogPost({ slug }: BlogPostProps) {
  const post = getBlogPostBySlug(slug);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-violet-600 hover:text-violet-700 font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
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
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">EnigmaKeep</span>
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 mb-8 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Blog
          </Link>

          {/* Category & Date */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full font-medium">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {new Date(post.publishDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author & Share */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <a
                  href={post.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  www.hmalveehasan.com
                </a>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          {/* Featured Image */}
          <div className="aspect-video bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl flex items-center justify-center">
                <span className="text-white font-bold text-6xl">E</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-violet max-w-none mb-12">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">{children}</ol>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-violet-600 hover:text-violet-700 font-medium underline"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-violet-600 pl-4 italic my-4 text-gray-600">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-violet-600">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-gray-200">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{children}</td>
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium"
              >
                <Tag size={14} />
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Ready to Secure Your Passwords?
            </h3>
            <p className="text-violet-100 mb-6">
              Start using EnigmaKeep today - 100% offline, zero-knowledge encryption.
            </p>
            <Link
              href="/app"
              className="inline-block px-8 py-3 bg-white text-violet-600 rounded-lg hover:bg-gray-50 transition-colors font-bold"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-bold text-white">EnigmaKeep</span>
          </div>
          <p className="text-sm mb-4">Your Digital Fortress</p>
          <p className="text-xs">
            © 2024 EnigmaKeep. Developed by <a href="https://www.hmalveehasan.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">HM Alvee Hasan</a>
          </p>
          <p className="text-xs mt-2">Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
}
