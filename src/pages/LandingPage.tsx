import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Download,
  FileText,
  FolderLock,
  Github,
  KeyRound,
  KeySquare,
  Lock,
  MonitorSmartphone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  StickyNote,
  Upload,
} from 'lucide-react';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { Wordmark } from '../components/Wordmark';
import { SiteFooter, SiteNav } from '../site/SiteChrome';
import { GITHUB_URL, type NavLink } from '../site/links';
import { Eyebrow, Heading, Lead } from '../site/primitives';
import {
  CipherDemo,
  FilesDemo,
  FingerprintDemo,
  HexDemo,
  OfflineDemo,
  SecretKeyDemo,
  TotpDemo,
} from './landing/demos';
import {
  EASE_EXPO,
  EASE_QUINT,
  EASE_RULE,
  spotlight,
  useCountUp,
  useInView,
  useNightThemeColor,
  useReveal,
  useScrollProgress,
  useScrollSpy,
} from '../site/motion';
import './landingHero.css';
import './landing/landing.css';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261005_182549_18378239-da8f-48a7-9666-d6e0a6a88561.mp4';

// No-break spaces inside each sentence: the only wrap point is after the period.
const HERO_SUBHEAD =
  'Encrypted\u00a0in\u00a0your\u00a0browser. No\u00a0cloud,\u00a0no\u00a0account,\u00a0no\u00a0tracking.';

// The entrance plays once per page load, not on every client-side visit.
let heroIntroPlayed = false;

const platforms = [
  { id: 'android', name: 'Android', detail: 'Chrome, Edge' },
  { id: 'ios', name: 'iOS', detail: 'Safari' },
  { id: 'windows', name: 'Windows', detail: 'Chrome, Edge' },
  { id: 'macos', name: 'macOS', detail: 'Safari, Chrome' },
  { id: 'linux', name: 'Linux', detail: 'Chrome, Firefox' },
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
    question: 'What is the Secret Key?',
    answer:
      'New vaults are protected by two secrets: your master password and a 128-bit Secret Key. The key lives on your devices and in your printed Emergency Kit, never inside the vault file, so someone who copies the file still cannot brute-force it with your password alone.',
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
      'Completely. There are no paid tiers, no ads, and no data collection. The source is published on GitHub: the app under the AGPL-3.0 licence and the cryptography under the MIT licence.',
  },
];

/**
 * Hero entrance: masked headline lines rise, masthead fades down, the hairline
 * draws out. Runs once per load, only with Web Animations + matchMedia and
 * without reduced motion.
 */
function useHeroEntrance(heroRef: RefObject<HTMLDivElement>, videoRef: RefObject<HTMLVideoElement>) {
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || heroIntroPlayed) return;
    const canAnimate =
      typeof hero.animate === 'function' &&
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canAnimate) return;

    const docEl = document.documentElement;
    docEl.classList.add('intro');

    let disposed = false;
    let started = false;
    const animations: Animation[] = [];
    const bailout = window.setTimeout(() => {
      if (!started) docEl.classList.remove('intro');
    }, 3500);

    const video = videoRef.current;
    const videoReady = new Promise<void>((resolve) => {
      if (!video || video.readyState >= 2) return resolve();
      video.addEventListener('loadeddata', () => resolve(), { once: true });
    });
    const fontsReady = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
    let capTimer = 0;
    const cap = new Promise<void>((resolve) => {
      capTimer = window.setTimeout(resolve, 900);
    });

    const play = () => {
      if (disposed || started || !docEl.classList.contains('intro')) return;
      started = true;
      heroIntroPlayed = true;

      const logo = hero.querySelector('.wm svg');
      const k = Math.min(1, Math.max(0.65, (logo?.getBoundingClientRect().height || 23.5) / 23.5));
      const run = (el: Element | null | undefined, keyframes: Keyframe[], delay: number, duration: number, easing: string) => {
        if (el) animations.push(el.animate(keyframes, { delay, duration, easing, fill: 'both' }));
      };
      const rise = (dy: number, extra = ''): Keyframe[] => [
        { opacity: 0, transform: `translateY(${dy}px)${extra}` },
        { opacity: 1, transform: 'none' },
      ];

      const navLinks = hero.querySelectorAll('.nav a');
      run(hero.querySelector('.wm'), rise(-6 * k), 60, 900, EASE_QUINT);
      run(hero.querySelector('.rule'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 180, 1000, EASE_RULE);
      run(navLinks[1], rise(-4 * k), 420, 700, EASE_QUINT);
      run(navLinks[0], rise(-4 * k), 490, 700, EASE_QUINT);
      run(navLinks[2], rise(-4 * k), 490, 700, EASE_QUINT);
      hero.querySelectorAll('.li').forEach((line, i) =>
        run(line, [{ transform: 'translateY(104%)' }, { transform: 'none' }], i === 0 ? 200 : 290, 1100, EASE_EXPO)
      );
      run(hero.querySelector('.sub'), rise(10 * k), 700, 850, EASE_QUINT);
      run(hero.querySelector('.cta'), rise(12 * k, ' scale(0.975)'), 860, 900, EASE_EXPO);
      run(hero.querySelector('.disc'), rise(6 * k), 1040, 700, EASE_QUINT);
      run(hero.querySelector('.ar'), [{ transform: `translateY(${-5 * k}px)` }, { transform: 'none' }], 1120, 820, EASE_EXPO);

      Promise.all(animations.map((a) => a.finished)).then(
        () => {
          if (disposed) return;
          docEl.classList.remove('intro');
          animations.forEach((a) => a.cancel());
          // One display:none reflow so the line masks don't keep their own GPU layer.
          if (!hero.contains(document.activeElement)) {
            const y = window.scrollY;
            hero.style.display = 'none';
            void hero.offsetHeight;
            hero.style.display = '';
            if (window.scrollY !== y) window.scrollTo(0, y);
          }
          docEl.setAttribute('data-intro', 'done');
        },
        () => {}
      );
    };

    Promise.race([Promise.all([fontsReady, videoReady]), cap]).then(play);

    return () => {
      disposed = true;
      window.clearTimeout(bailout);
      window.clearTimeout(capTimer);
      animations.forEach((a) => a.cancel());
      docEl.classList.remove('intro');
    };
  }, [heroRef, videoRef]);
}

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useHeroEntrance(heroRef, videoRef);

  // React sets `muted` as a property only; some mobile browsers want the attribute to autoplay.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.play().catch(() => {});
  }, []);

  return (
    <div className="vx" ref={heroRef}>
      <header className="mast">
        <a className="wm" href="#" aria-label="EnigmaKeep home">
          <Wordmark />
        </a>
        <div className="rule" />
        <nav className="nav" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <div className="gap" />

      <div className="copy">
        <h1 className="h">
          <span className="l">
            <span className="li">Your secrets never</span>
          </span>
          <span className="l l2">
            <span className="li">leave your device.</span>
          </span>
        </h1>
        <p className="sub">{HERO_SUBHEAD}</p>
        <a className="cta" href="/app">
          Open your vault
        </a>
        <a className="disc" href="#features">
          Discover the features
          <span className="ar" aria-hidden="true">
            <svg viewBox="0 0 11 12.6">
              <path d="M5.5 .4V12M1 7.5L5.5 12L10 7.5" />
            </svg>
          </span>
        </a>
      </div>

      <div className="field" aria-hidden="true">
        <video
          ref={videoRef}
          className="vid"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          disablePictureInPicture
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sections below the hero. They share the hero's curves (motion.ts),
// hairlines and type scale; landing.css holds the styling.
// ─────────────────────────────────────────────────────────────

const LANDING_LINKS: NavLink[] = [
  { href: '#security', label: 'Security', key: 'security' },
  { href: '#features', label: 'Features', key: 'features' },
  { href: '#how', label: 'How it works', key: 'how' },
  { href: '#faq', label: 'FAQ', key: 'faq' },
];
const LANDING_SECTION_IDS = LANDING_LINKS.map((link) => link.key);

const STATS = [
  { value: 256, unit: '-bit', label: 'AES-GCM vault encryption' },
  { value: 600000, unit: '', label: 'PBKDF2-SHA256 iterations per unlock' },
  { value: 0, unit: '', label: 'servers, accounts, or trackers' },
  { value: 128, unit: '-bit', label: 'Secret Key mixed into every new vault' },
];

function Stat({ value, unit, label, start, index }: (typeof STATS)[number] & { start: boolean; index: number }) {
  const n = useCountUp(value, start);
  return (
    <div className="lp-stat" style={{ '--i': index } as CSSProperties}>
      <p className="lp-stat-num">
        {n.toLocaleString('en-US')}
        {unit && <small>{unit}</small>}
      </p>
      <p className="lp-stat-label">{label}</p>
    </div>
  );
}

function SecuritySection() {
  const [statsRef, statsInView] = useInView<HTMLDivElement>('0px');
  return (
    <section id="security" className="lp-section lp-statement" aria-labelledby="security-title">
      <div className="lp-spill" aria-hidden="true" />
      <div className="lp-wrap">
        <Eyebrow>Security model</Eyebrow>
        <Heading
          id="security-title"
          lines={[
            { text: 'Most password managers', dim: true },
            { text: 'keep your vault in their cloud.', dim: true },
            'EnigmaKeep doesn’t have one.',
          ]}
        />
        <Lead delay={300}>
          Encryption, decryption, and storage all happen on your device. There is no account to breach, no server to
          subpoena, and nothing to leak.
        </Lead>

        <div ref={statsRef} data-rv className="lp-stats rv-stagger" style={{ '--d': '200ms' } as CSSProperties}>
          {STATS.map((stat, i) => (
            <Stat key={stat.label} {...stat} index={i} start={statsInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

const MOCK_ENTRIES = [
  { title: 'GitHub', user: 'you@mail.com', host: 'github.com' },
  { title: 'Banking', user: 'alex.r', host: 'bank.example.com' },
  { title: 'Netflix', user: 'household@mail.com', host: 'netflix.com' },
  { title: 'Work SSO', user: 'alex@company.com', host: 'sso.company.com' },
  { title: 'Home router', user: 'admin', host: '192.168.1.1' },
  { title: 'Figma', user: 'you@mail.com', host: 'figma.com' },
];

const MOCK_NAV = [
  { icon: KeyRound, label: 'Passwords', count: 24, active: true },
  { icon: ShieldCheck, label: '2FA Codes', count: 8 },
  { icon: FileText, label: 'Notes', count: 5 },
  { icon: FolderLock, label: 'Files', count: 12 },
];

/** A miniature of the real unlocked vault (same layout and tokens as /app). */
function VaultMock() {
  return (
    <div className="vm" aria-hidden="true">
      <div className="vm-bar">
        <i />
        <i />
        <i />
        <span className="vm-url">enigmakeep.com/app</span>
      </div>
      <div className="vm-body">
        <aside className="vm-side">
          <Wordmark className="vm-wm" />
          <hr />
          <p className="vm-status">
            <i />
            Vault unlocked
          </p>
          {MOCK_NAV.map(({ icon: Icon, label, count, active }) => (
            <div key={label} className={active ? 'vm-nav is-on' : 'vm-nav'}>
              <span>
                <Icon size={15} strokeWidth={1.7} />
                {label}
              </span>
              <em>{count}</em>
            </div>
          ))}
          <div className="vm-nav" style={{ marginTop: 'auto' }}>
            <span>
              <Settings size={15} strokeWidth={1.7} />
              Settings
            </span>
          </div>
        </aside>

        <div className="vm-main">
          <div className="vm-head">
            <h4>Passwords</h4>
            <div className="vm-actions">
              <span className="vm-btn is-primary">
                <Download size={12} /> Save
              </span>
              <span className="vm-btn">
                <Lock size={12} /> Lock
              </span>
            </div>
          </div>
          <div className="vm-content">
            <div className="vm-tools">
              <div className="vm-search">
                <Search size={13} />
                Search title, username, site…
              </div>
              <span className="vm-btn">
                <Upload size={12} /> Import
              </span>
              <span className="vm-btn is-primary">
                <Plus size={12} /> Add
              </span>
            </div>
            <div className="vm-grid">
              {MOCK_ENTRIES.map((entry) => (
                <div key={entry.title} className="vm-card">
                  <div className="vm-card-top">
                    <span className="vm-av">{entry.title[0]}</span>
                    <div>
                      <b>{entry.title}</b>
                      <span>{entry.host}</span>
                    </div>
                  </div>
                  <div className="vm-rows">
                    <div className="vm-row">
                      <small>User</small>
                      <span>{entry.user}</span>
                      <em className="vm-copy">Copy</em>
                    </div>
                    <div className="vm-row">
                      <small>Pass</small>
                      <span>••••••••••••</span>
                      <em className="vm-copy is-sky">Copy</em>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShowcaseSection() {
  const mockRef = useScrollProgress<HTMLDivElement>(0.28);
  return (
    <section className="lp-section lp-center" aria-labelledby="vault-title" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <Eyebrow>The vault</Eyebrow>
        <Heading id="vault-title" lines={['One quiet place', { text: 'for every secret.', dim: true }]} />
        <Lead>
          Passwords, 2FA codes, notes, and files in a workspace that opens instantly and never phones home.
        </Lead>

        <div className="lp-stage">
          <div className="lp-stage-glow" aria-hidden="true" />
          <div className="lp-floor" aria-hidden="true" />
          <div ref={mockRef} className="lp-mock-wrap">
            <VaultMock />
            <div className="lp-float lp-float-a" aria-hidden="true">
              <span className="lp-float-ico">
                <ShieldCheck size={17} strokeWidth={1.7} />
              </span>
              <div>
                <b>GitHub · 2FA</b>
                <span className="lp-mono">482 193</span>
              </div>
            </div>
            <div className="lp-float lp-float-b" aria-hidden="true">
              <span className="lp-float-ico">
                <Check size={17} strokeWidth={2} />
              </span>
              <div>
                <b>Password copied</b>
                <span>Clipboard clears in 15s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  size,
  title,
  body,
  index,
  children,
}: {
  size?: 'w3' | 'w4';
  title: string;
  body: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <article
      className={size ? `lp-card ${size}` : 'lp-card'}
      style={{ '--i': index } as CSSProperties}
      onPointerMove={spotlight}
    >
      <div className="lp-card-vis">{children}</div>
      <div className="lp-card-txt">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

const MINIS = [
  { icon: KeySquare, title: 'Password generator', body: 'Long, random passwords with a live strength read-out.' },
  { icon: StickyNote, title: 'Secure notes', body: 'Recovery codes, licence keys, IDs — encrypted like everything else.' },
  { icon: Clock, title: 'Auto-lock & clipboard clear', body: 'Seals itself when idle and wipes anything you copied.' },
  { icon: MonitorSmartphone, title: 'Installable app', body: 'Add it to your home screen or desktop as a PWA.' },
];

function FeaturesSection() {
  return (
    <section id="features" className="lp-section" aria-labelledby="features-title">
      <div className="lp-wrap">
        <div className="lp-head">
          <div>
            <Eyebrow>Features</Eyebrow>
            <Heading
              id="features-title"
              lines={['Everything a vault should do.', { text: 'Nothing it shouldn’t.', dim: true }]}
            />
          </div>
          <Lead>
            Built on your browser’s Web Crypto API, with no telemetry, no ads, and no sync servers waiting to be
            breached.
          </Lead>
        </div>

        <div data-rv className="lp-bento rv-stagger">
          <BentoCard
            size="w4"
            index={0}
            title="AES-256-GCM, on your device"
            body="Your master password is stretched with 600,000 PBKDF2 rounds into a key that only lives in memory. Only ciphertext ever touches the disk."
          >
            <CipherDemo />
          </BentoCard>
          <BentoCard
            index={1}
            title="Two secrets, one vault"
            body="A 128-bit Secret Key is mixed in with your password, so a stolen vault file can’t be brute-forced."
          >
            <SecretKeyDemo />
          </BentoCard>
          <BentoCard index={2} title="Built-in 2FA codes" body="Time-based codes live right next to the logins they protect.">
            <TotpDemo />
          </BentoCard>
          <BentoCard
            index={3}
            title="Biometric unlock"
            body="Touch ID, Face ID, or Windows Hello through WebAuthn. Your biometrics never leave the device."
          >
            <FingerprintDemo />
          </BentoCard>
          <BentoCard index={4} title="Works with Wi-Fi off" body="No accounts and no backend. Pull the plug and nothing changes.">
            <OfflineDemo />
          </BentoCard>
          <BentoCard
            size="w3"
            index={5}
            title="Encrypted files & folders"
            body="Keep scans, keys, and documents inside the vault, sealed with the same encryption as your passwords."
          >
            <FilesDemo />
          </BentoCard>
          <BentoCard
            size="w3"
            index={6}
            title="An opaque vault file"
            body="Saved as high-entropy .dat bytes: no headers, no JSON, nothing for a hex dump to latch onto."
          >
            <HexDemo />
          </BentoCard>
        </div>

        <div data-rv className="lp-minis rv-stagger">
          {MINIS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="lp-mini" style={{ '--i': i } as CSSProperties}>
              <Icon size={20} strokeWidth={1.6} />
              <h4>{title}</h4>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const IMPORTS = ['1Password', 'LastPass', 'Bitwarden', 'Chrome', 'Any CSV', 'Any JSON'];

function ImportsBand() {
  const half = [...IMPORTS, ...IMPORTS];
  return (
    <section className="lp-imports" aria-label={`Import from ${IMPORTS.join(', ')}`}>
      <p data-rv className="rv">
        Move in from your old password manager in minutes
      </p>
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[...half, ...half].map((name, i) => (
            <span key={i} className="lp-marquee-item">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  return (
    <section id="how" className="lp-section" aria-labelledby="how-title">
      <div className="lp-wrap">
        <div className="lp-head">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <Heading id="how-title" lines={['From zero to sealed', { text: 'in under a minute.', dim: true }]} />
          </div>
          <Lead>No sign-up form, no email confirmation, no credit card. Just you and an encrypted file.</Lead>
        </div>

        <div data-rv className="lp-steps">
          <i data-rv className="lp-track rv-rule" style={{ '--d': '250ms' } as CSSProperties} aria-hidden="true" />
          {steps.map((step, i) => (
            <div
              key={step.n}
              data-rv
              className="lp-step rv"
              style={{ '--i': i, '--d': `${300 + i * 140}ms` } as CSSProperties}
            >
              <span className="lp-node" aria-hidden="true" />
              <span className="lp-step-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstallSection({ onSelect }: { onSelect: (platform: string) => void }) {
  return (
    <section id="download" className="lp-section" aria-labelledby="install-title" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="lp-head">
          <div>
            <Eyebrow>Install</Eyebrow>
            <Heading id="install-title" lines={['Runs everywhere', { text: 'you do.', dim: true }]} />
          </div>
          <Lead>Open it in any modern browser, or install it as an app. After the first load it works fully offline.</Lead>
        </div>

        <div data-rv className="lp-tiles rv-stagger">
          {platforms.map((platform, i) => (
            <button
              key={platform.id}
              type="button"
              className="lp-card lp-tile"
              style={{ '--i': i } as CSSProperties}
              onPointerMove={spotlight}
              onClick={() => onSelect(platform.id)}
            >
              <span className="lp-tile-top">
                <b>{platform.name}</b>
                <ArrowUpRight size={18} strokeWidth={1.6} />
              </span>
              <span>{platform.detail}</span>
            </button>
          ))}
        </div>

        <div data-rv className="lp-notes rv" style={{ '--d': '300ms' } as CSSProperties}>
          <span>
            <Check size={15} strokeWidth={2} /> No app store
          </span>
          <span>
            <Check size={15} strokeWidth={2} /> Works offline after the first load
          </span>
          <span>
            <Check size={15} strokeWidth={2} /> Updates itself
          </span>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="lp-section" aria-labelledby="faq-title">
      <div className="lp-wrap lp-faq">
        <div className="lp-faq-side">
          <Eyebrow>FAQ</Eyebrow>
          <Heading id="faq-title" lines={['Questions,', { text: 'answered.', dim: true }]} />
          <Lead>Still curious? Every line of EnigmaKeep is open source.</Lead>
          <p data-rv className="rv" style={{ '--d': '320ms', marginTop: 22 } as CSSProperties}>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-link">
              Read the source on GitHub <ArrowRight size={15} />
            </a>
          </p>
        </div>

        <div data-rv className="lp-faq-list rv-stagger">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question} className={isOpen ? 'lp-q is-open' : 'lp-q'} style={{ '--i': i } as CSSProperties}>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{faq.question}</span>
                  <span className="lp-plus" aria-hidden="true" />
                </button>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} aria-hidden={!isOpen} className="lp-ans">
                  <div>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Closing scene: the hero sphere rises again behind the last call to action. */
function FinaleSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sectionRef, near] = useInView<HTMLElement>('600px');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (near) {
      if (!video.getAttribute('src')) video.src = HERO_VIDEO;
      video.muted = true;
      video.setAttribute('muted', '');
      video.play().catch(() => {});
    } else if (video.getAttribute('src')) {
      video.pause();
    }
  }, [near]);

  return (
    <section ref={sectionRef} className="lp-finale" aria-labelledby="finale-title">
      <video
        ref={videoRef}
        className="lp-finale-vid"
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        aria-hidden="true"
        disablePictureInPicture
      />
      <div className="lp-finale-copy">
        <Heading id="finale-title" lines={['Keep your secrets', 'where they belong.']} />
        <Lead delay={260}>Create a vault in under a minute. No email, no payment, no catch.</Lead>
        <div data-rv className="lp-finale-actions rv" style={{ '--d': '380ms' } as CSSProperties}>
          <a href="/app" className="lp-cta">
            Open your vault
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="lp-link">
            <Github size={15} /> Read the source <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  useNightThemeColor();
  const activeSection = useScrollSpy(LANDING_SECTION_IDS);

  return (
    <div ref={rootRef} id="top" className="dark lp min-h-screen">
      <SiteNav links={LANDING_LINKS} active={activeSection} revealOnScroll />
      <Hero />
      <SecuritySection />
      <ShowcaseSection />
      <FeaturesSection />
      <ImportsBand />
      <HowSection />
      <InstallSection onSelect={setSelectedPlatform} />
      <FaqSection />
      <FinaleSection />
      <SiteFooter />

      {selectedPlatform && (
        <PwaInstallModal platform={selectedPlatform} onClose={() => setSelectedPlatform(null)} />
      )}
    </div>
  );
}
