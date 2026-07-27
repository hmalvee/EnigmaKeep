import { useState } from 'react';
import {
  Shield,
  Github,
  ArrowRight,
  ArrowUpRight,
  Lock,
  WifiOff,
  Files,
  FileText,
  Fingerprint,
  KeyRound,
  StickyNote,
  KeySquare,
  Import,
  MonitorSmartphone,
  Clock,
  Check,
  Plus,
  Minus,
  Eye,
  Copy,
  Menu,
  X,
  Star,
} from 'lucide-react';
import { Link } from '../components/Link';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { useScrollReveal } from '../hooks/useScrollReveal';

const GITHUB_URL = 'https://github.com/hmalvee/EnigmaKeep';

const trustChips = ['Open source', '100% offline', 'Zero-knowledge', 'No account'];

const platforms = [
  { id: 'android', name: 'Android', detail: 'Chrome, Edge' },
  { id: 'ios', name: 'iOS', detail: 'Safari' },
  { id: 'windows', name: 'Windows', detail: 'Chrome, Edge' },
  { id: 'macos', name: 'macOS', detail: 'Safari, Chrome' },
  { id: 'linux', name: 'Linux', detail: 'Chrome, Firefox' },
];

const features = [
  {
    icon: Files,
    title: 'Encrypted file storage',
    isNew: true,
    body: 'Attach documents, keys, and images to any entry. Files are encrypted inside the vault alongside your passwords — never written to disk in the clear.',
  },
  {
    icon: FileText,
    title: 'Opaque vault file',
    isNew: true,
    body: 'Your vault saves as high-entropy .dat bytes — no readable headers, banners, or JSON for Wireshark or casual analysis to latch onto.',
  },
  {
    icon: KeyRound,
    title: 'Built-in 2FA authenticator',
    body: 'Generate time-based TOTP codes right next to the login they belong to. One app for the password and the second factor.',
  },
  {
    icon: Fingerprint,
    title: 'Biometric unlock',
    body: 'Open your vault with Touch ID, Face ID, or Windows Hello through WebAuthn. The biometric never leaves your device.',
  },
  {
    icon: StickyNote,
    title: 'Secure notes',
    body: 'Recovery codes, licence keys, passport numbers — keep sensitive text encrypted the same way as your logins.',
  },
  {
    icon: KeySquare,
    title: 'Generator & strength meter',
    body: 'Build long, random passwords with adjustable rules, and see a live strength read-out before you commit.',
  },
  {
    icon: Import,
    title: 'Import your history',
    body: 'Move in from 1Password, LastPass, Bitwarden, or Chrome with a CSV export in a few minutes.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Installable PWA',
    body: 'Add EnigmaKeep to your home screen or desktop. It runs like a native app and keeps working offline.',
  },
  {
    icon: Clock,
    title: 'Auto-lock & clipboard clear',
    body: 'The vault seals itself after inactivity, and anything you copy is wiped from the clipboard shortly after.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Open EnigmaKeep',
    body: 'Load the web app or install it as a PWA. There is no sign-up, no email, and no account to create.',
  },
  {
    n: '02',
    title: 'Create your vault',
    body: 'Choose a master password and write down the 12-word recovery phrase. Both stay with you — we never see either.',
  },
  {
    n: '03',
    title: 'Start securing',
    body: 'Add logins, generate strong passwords, store 2FA codes and files, or import everything from your old manager.',
  },
];

const faqs = [
  {
    question: 'How does EnigmaKeep keep my passwords secure?',
    answer:
      'Everything is encrypted with AES-256-GCM. Your master password is stretched into a key using PBKDF2-SHA256 with 600,000 iterations, and that key never leaves your device. Because encryption and decryption happen locally, EnigmaKeep follows a zero-knowledge model: there is no server that could read your data even in principle.',
  },
  {
    question: 'Is my data really stored offline?',
    answer:
      'Yes. Your vault lives encrypted on your device, and you can save it as a file. Nothing is transmitted to a server — you can confirm this yourself by watching the network tab. EnigmaKeep works with your connection switched off entirely.',
  },
  {
    question: 'What happens if I forget my master password?',
    answer:
      'When you set up your vault you receive a 12-word recovery phrase. Keep it somewhere safe and offline. If you forget the master password, that phrase restores access. Without either the password or the phrase, the data cannot be recovered — that is the trade-off of true zero-knowledge encryption.',
  },
  {
    question: 'What is the opaque vault file?',
    answer:
      'When you export your vault, EnigmaKeep writes an opaque binary .dat. There are no magic bytes, PEM banners, or plaintext metadata — a packet capture or hex dump sees random-looking data.',
  },
  {
    question: 'Can I store files, not just passwords?',
    answer:
      'Yes. You can attach files to entries and they are encrypted inside the vault with the same AES-256-GCM protection as your logins.',
  },
  {
    question: 'How does biometric unlock work?',
    answer:
      'EnigmaKeep uses WebAuthn. Your fingerprint or face data stays inside your device secure enclave and is never sent anywhere. The biometric simply authorises the local unlock of your encrypted vault.',
  },
  {
    question: 'Can I import from another password manager?',
    answer:
      'Yes. Export a CSV from 1Password, LastPass, Bitwarden, or Chrome and import it directly into EnigmaKeep. Your logins are encrypted the moment they land in your vault.',
  },
  {
    question: 'Is EnigmaKeep really free and open source?',
    answer:
      'Completely. There are no paid tiers, no ads, and no data collection. The source is published on GitHub under the MIT License.',
  },
];

function VaultPreviewMock() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div
        className="absolute -inset-8 md:-inset-16 rounded-full bg-accent/20 blur-3xl opacity-60 pointer-events-none"
        aria-hidden
      />
      <div className="relative rounded-2xl border border-line bg-surface shadow-[0_24px_80px_-32px_rgb(var(--shadow)/0.45)] overflow-hidden animate-scaleIn">
        {/* Fake window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-surface2/80">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted font-mono truncate">EnigmaKeep — Vault</span>
        </div>

        <div className="flex min-h-[280px] md:min-h-[340px]">
          {/* Mini sidebar */}
          <aside className="hidden sm:flex w-44 shrink-0 flex-col border-r border-line bg-bg-deep/50 p-3 gap-1">
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <KeyRound className="text-accent-ink" size={14} />
              </span>
              <span className="text-xs font-display font-semibold text-ink">EnigmaKeep</span>
            </div>
            {[
              { label: 'Passwords', active: true, n: 24 },
              { label: '2FA Codes', active: false, n: 8 },
              { label: 'Notes', active: false, n: 5 },
              { label: 'Files', active: false, n: 3 },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                  item.active
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted'
                }`}
              >
                <span>{item.label}</span>
                <span className="tabular-nums opacity-70">{item.n}</span>
              </div>
            ))}
          </aside>

          {/* Fake entries */}
          <div className="flex-1 p-3 sm:p-4 space-y-3 bg-bg/40">
            <div className="flex gap-2 mb-1">
              <div className="flex-1 h-9 rounded-xl bg-surface2 border border-line" />
              <div className="h-9 w-20 rounded-xl bg-accent" />
            </div>
            {[
              { t: 'GitHub', u: 'you@mail.com', fav: true },
              { t: 'Banking', u: '•••• 4821', fav: false },
              { t: 'Netflix', u: 'household', fav: false },
            ].map((row) => (
              <div
                key={row.t}
                className="rounded-xl border border-line bg-surface p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center font-display font-bold text-accent text-sm">
                  {row.t[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-ink truncate">{row.t}</p>
                    {row.fav && <Star size={11} className="text-accent" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-muted truncate">{row.u}</p>
                </div>
                <div className="flex gap-1 text-muted">
                  <Eye size={14} />
                  <Copy size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} id="top" className="min-h-screen bg-bg text-ink">
      {/* Navigation — glass sticky, inspired by 21st SaaS template */}
      <header className="fixed top-0 w-full z-50 border-b border-line/80 bg-bg/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_8px_20px_-10px_rgb(var(--accent)/0.8)] group-hover:scale-105 transition-transform">
              <Shield className="text-accent-ink" size={18} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">EnigmaKeep</span>
          </a>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm text-muted hover:text-ink transition-colors">Features</a>
            <a href="#how" className="text-sm text-muted hover:text-ink transition-colors">How it works</a>
            <a href="#faq" className="text-sm text-muted hover:text-ink transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-3 !py-2"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a href="/app" className="btn-primary !px-5 !py-2 text-sm gap-1.5">
              Open Vault
              <ArrowRight size={15} />
            </a>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-muted hover:text-ink"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden border-t border-line bg-bg/95 backdrop-blur-xl animate-slideIn">
            <div className="px-4 py-4 flex flex-col gap-3">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-muted hover:text-ink py-2">Features</a>
              <a href="#how" onClick={() => setMobileOpen(false)} className="text-sm text-muted hover:text-ink py-2">How it works</a>
              <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm text-muted hover:text-ink py-2">FAQ</a>
              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <ThemeToggle />
                <a href="/app" className="btn-primary flex-1 !py-2.5 text-sm justify-center">Open Vault</a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero — brand first, one CTA group, dominant product visual */}
      <section className="relative min-h-[100svh] flex flex-col items-center pt-24 md:pt-28 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 ai-grid-bg opacity-25" />
          <div className="ambient-orb top-20 left-1/4 w-[480px] h-[480px] bg-accent/25" />
          <div className="ambient-orb bottom-10 right-1/5 w-[360px] h-[360px] bg-accent-2/15" style={{ animationDelay: '-5s' }} />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <aside className="mb-7 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-line bg-surface/70 backdrop-blur-sm animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs text-muted font-mono tracking-wide">
              Open source · MIT · No account required
            </span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:text-accent-2 transition-colors">
              Star on GitHub
              <ArrowRight size={12} />
            </a>
          </aside>

          <p className="font-display text-sm sm:text-base font-semibold tracking-[0.2em] uppercase text-accent mb-4 animate-fadeIn">
            EnigmaKeep
          </p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl animate-fadeIn">
            <span className="text-ink">Your digital fortress.</span>
            <br />
            <span className="bg-gradient-to-b from-ink via-ink to-muted bg-clip-text text-transparent">
              Sealed on your device.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl leading-relaxed animate-fadeIn">
            Offline, zero-knowledge password manager. Encrypted locally. Never touches a server —
            because there isn&rsquo;t one.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
            <a href="/app" className="btn-primary gap-2 group !px-8 !py-3.5 text-base">
              Open Vault
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#features" className="btn-ghost gap-2 !px-8 !py-3.5 text-base">
              See features
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 animate-fadeIn">
            {trustChips.map((chip) => (
              <li key={chip} className="flex items-center gap-2 text-sm text-muted">
                <Check size={14} className="text-accent" />
                {chip}
              </li>
            ))}
          </ul>

          <div className="mt-14 md:mt-16 w-full animate-slideUp">
            <VaultPreviewMock />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-line bg-bg-deep relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid md:grid-cols-2 gap-5">
          <div className="scroll-reveal-left vault-entry-card p-8">
            <span className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center mb-5">
              <Lock className="text-accent" size={22} />
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Zero-knowledge encryption
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              AES-256-GCM with PBKDF2-SHA256 (600k iterations). The key stays on your device. We
              could not read your data if we tried — there is nothing on our side to read.
            </p>
            <p className="mt-5 font-mono text-xs text-accent tracking-wide">
              AES-256-GCM · PBKDF2 · 600,000 iterations
            </p>
          </div>

          <div className="scroll-reveal-right vault-entry-card p-8">
            <span className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center mb-5">
              <WifiOff className="text-accent" size={22} />
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              100% offline, no servers
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              No accounts. No backend. Everything runs in your browser and stays there. Turn off
              your connection — EnigmaKeep keeps working exactly the same.
            </p>
            <p className="mt-5 font-mono text-xs text-accent tracking-wide">
              No cloud · No tracking · No telemetry
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="scroll-reveal max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">Features</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Everything you need in one vault
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Passwords, authenticator, notes, and encrypted files — held together by local-only
            encryption.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 vault-stagger">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="vault-entry-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-surface2 border border-line flex items-center justify-center">
                    <Icon className="text-accent" size={20} />
                  </span>
                  {feature.isNew && (
                    <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/25">
                      New
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Install */}
      <section id="download" className="border-y border-line bg-bg-deep">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="scroll-reveal max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">Install</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Runs everywhere you do
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              Open it in a browser, or install as a PWA for an app icon and full offline use.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className="vault-entry-card p-5 text-left group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">{platform.name}</h3>
                  <ArrowUpRight
                    size={16}
                    className="text-muted group-hover:text-accent transition-colors"
                  />
                </div>
                <p className="mt-1 text-sm text-muted">{platform.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="scroll-reveal max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">How it works</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Three steps, no account
          </h2>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div key={step.n} className="scroll-reveal vault-entry-card p-8">
              <span className="font-mono text-sm text-accent">{step.n}</span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-bg-deep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="scroll-reveal mb-10">
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              Questions worth asking
            </h2>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq, index) => {
              const open = expandedFaq === index;
              return (
                <div key={faq.question} className="scroll-reveal">
                  <button
                    onClick={() => setExpandedFaq(open ? null : index)}
                    className="w-full py-5 flex items-start justify-between gap-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-display text-lg font-medium tracking-tight">
                      {faq.question}
                    </span>
                    <span className="mt-1 flex-shrink-0 text-accent">
                      {open ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  {open && (
                    <p className="pb-6 -mt-1 text-muted leading-relaxed animate-slideIn">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="scroll-scale relative overflow-hidden rounded-3xl border border-line bg-surface p-10 md:p-16 text-center">
          <div className="absolute inset-0 ai-grid-bg opacity-20 pointer-events-none" />
          <div className="ambient-orb top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/20" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl mx-auto">
              Keep your secrets where they belong — with you.
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto leading-relaxed">
              Create a vault in under a minute. No email, no payment, no catch.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/app" className="btn-primary gap-2 group !px-8">
                Open Vault
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost gap-2"
              >
                <Github size={18} />
                Read the source
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-bg-deep">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Shield className="text-accent-ink" size={16} />
                </span>
                <span className="font-display font-semibold tracking-tight">EnigmaKeep</span>
              </div>
              <p className="mt-4 text-sm text-muted leading-relaxed">
                Offline, zero-knowledge password manager. Open source, free forever.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Product</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="text-muted hover:text-ink transition-colors">Features</a></li>
                <li><a href="#download" className="text-muted hover:text-ink transition-colors">Install</a></li>
                <li><a href="/app" className="text-muted hover:text-ink transition-colors">Open Vault</a></li>
                <li><a href="#faq" className="text-muted hover:text-ink transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Guides</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/details" className="text-muted hover:text-ink transition-colors">All Guides</Link></li>
                <li><Link href="/details/password-security-guide" className="text-muted hover:text-ink transition-colors">Password Security</Link></li>
                <li><Link href="/details/zero-knowledge-encryption" className="text-muted hover:text-ink transition-colors">Zero-Knowledge</Link></li>
                <li><Link href="/details/offline-password-manager" className="text-muted hover:text-ink transition-colors">Offline Manager</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Resources</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/blog" className="text-muted hover:text-ink transition-colors">Blog</Link></li>
                <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">GitHub</a></li>
                <li><a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Legal</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy" className="text-muted hover:text-ink transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-muted hover:text-ink transition-colors">Terms</Link></li>
                <li><a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          <div className="section-divider my-10" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">© 2025 EnigmaKeep. Open source under MIT License.</p>
            <p className="text-sm text-muted">
              Developed by{' '}
              <a
                href="https://www.hmalveehasan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-2 transition-colors"
              >
                HM Alvee Hasan
              </a>
            </p>
          </div>
        </div>
      </footer>

      {selectedPlatform && (
        <PwaInstallModal platform={selectedPlatform} onClose={() => setSelectedPlatform(null)} />
      )}
    </div>
  );
}
