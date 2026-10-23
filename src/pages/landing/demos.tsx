import { useEffect, useState } from 'react';
import { Check, FileKey2, FileSpreadsheet, FileText, Fingerprint, Lock, WifiOff } from 'lucide-react';
import { prefersReducedMotion, useInView } from '../../site/motion';

// Small, self-contained product demos for the feature bento. Everything is
// local and decorative: no real secrets, no network.

const HEX = '0123456789abcdef';
const randomHex = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('');
const groupHex = (s: string) => s.match(/.{1,4}/g)!.join(' ');

const PLAINTEXTS = [
  'correct horse battery staple',
  'bank pin · 4821',
  'github recovery codes',
  'wifi · home-5g · t0p-s3cret',
];

/** Plaintext on top, ciphertext that scrambles and settles underneath. */
export function CipherDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const [cipher, setCipher] = useState(() => groupHex(randomHex(32)));

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let frame = 0;
    let cycleStart = performance.now();
    let lastPaint = 0;
    let current = index;
    let target = groupHex(randomHex(32));
    const loop = (now: number) => {
      const t = now - cycleStart;
      if (t > 3400) {
        cycleStart = now;
        current = (current + 1) % PLAINTEXTS.length;
        setIndex(current);
        target = groupHex(randomHex(32));
      }
      if (now - lastPaint > 45) {
        lastPaint = now;
        const settled = Math.floor(Math.min(1, Math.max(0, t - 250) / 1100) * target.length);
        let next = '';
        for (let i = 0; i < target.length; i++) {
          next += i < settled || target[i] === ' ' ? target[i] : HEX[(Math.random() * 16) | 0];
        }
        setCipher(next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // `index` only seeds the loop; the loop owns it afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div ref={ref} className="lp-cipher" aria-hidden="true">
      <div className="lp-cipher-row">
        <div className="lp-cipher-meta">
          <span className="lp-tag">Plaintext</span>
          <span className="lp-note">in memory only</span>
        </div>
        <p key={index} className="lp-plain">{PLAINTEXTS[index]}</p>
      </div>
      <div className="lp-flow">
        <span className="lp-flow-line" />
        <span className="lp-flow-chip">AES-256-GCM · on this device</span>
        <span className="lp-flow-line" />
      </div>
      <div className="lp-cipher-row">
        <div className="lp-cipher-meta">
          <span className="lp-tag lp-tag-on">Ciphertext</span>
          <span className="lp-note">the only thing ever saved</span>
        </div>
        <p className="lp-ct">{cipher}</p>
      </div>
    </div>
  );
}

/** Master password + Secret Key flowing into one vault key. */
export function SecretKeyDemo() {
  return (
    <div className="lp-sk" aria-hidden="true">
      <div className="lp-sk-inputs">
        <div className="lp-pill">
          <span>Master password</span>
          <b>••••••••••••</b>
        </div>
        <div className="lp-pill">
          <span>Secret Key</span>
          <b>EK1-7Q2LX-H4M9P</b>
        </div>
      </div>
      <svg className="lp-sk-wires" viewBox="0 0 200 60" preserveAspectRatio="none">
        <path d="M50 0 C50 34 100 26 100 60" />
        <path d="M150 0 C150 34 100 26 100 60" />
      </svg>
      <div className="lp-sk-node">
        <span className="lp-sk-orb">
          <Lock size={18} strokeWidth={1.7} />
        </span>
        <span>Vault key</span>
      </div>
    </div>
  );
}

// Deterministic 6-digit code per 30s window, so it only changes on rollover.
function demoCode(window: number): string {
  let x = (window * 2654435761) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0x5bd1e995) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  return String(x % 1_000_000).padStart(6, '0');
}

/** A TOTP code with a real 30-second countdown ring. */
export function TotpDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!inView) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [inView]);

  const seconds = Math.floor(now / 1000);
  const period = Math.floor(seconds / 30);
  const remaining = 30 - (seconds % 30);
  const code = demoCode(period);
  const circumference = 2 * Math.PI * 21;
  const offset = circumference * (1 - remaining / 30);

  return (
    <div ref={ref} className="lp-totp" aria-hidden="true">
      <div className="lp-totp-main">
        <div>
          <p className="lp-totp-acct">GitHub</p>
          <p className="lp-totp-user">you@mail.com</p>
        </div>
        <svg className="lp-ring" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" className="lp-ring-track" />
          <circle
            cx="24"
            cy="24"
            r="21"
            className="lp-ring-bar"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: remaining === 30 ? 'none' : undefined,
            }}
          />
          <text x="24" y="28.5" textAnchor="middle">{remaining}</text>
        </svg>
      </div>
      <p key={period} className="lp-totp-code">
        {code.slice(0, 3)}
        <span>{code.slice(3)}</span>
      </p>
      <div className="lp-totp-next">
        <span>Google</span>
        <span>{demoCode(period + 7).replace(/(\d{3})/, '$1 ')}</span>
      </div>
    </div>
  );
}

/** Fingerprint that fills with light, then reports "Unlocked". */
export function FingerprintDemo() {
  return (
    <div className="lp-fp" aria-hidden="true">
      <div className="lp-fp-icon">
        <Fingerprint className="lp-fp-base" strokeWidth={1.1} />
        <Fingerprint className="lp-fp-lit" strokeWidth={1.1} />
        <i className="lp-fp-scan" />
      </div>
      <span className="lp-fp-status">
        <Check size={13} strokeWidth={2} /> Unlocked on this device
      </span>
    </div>
  );
}

/** A network panel that stays at zero. */
export function OfflineDemo() {
  return (
    <div className="lp-off" aria-hidden="true">
      <div className="lp-off-icon">
        <i />
        <i />
        <WifiOff size={20} strokeWidth={1.6} />
      </div>
      <dl className="lp-off-log">
        <div>
          <dt>Requests</dt>
          <dd>0</dd>
        </div>
        <div>
          <dt>Data sent</dt>
          <dd>0 B</dd>
        </div>
        <div>
          <dt>Accounts</dt>
          <dd>0</dd>
        </div>
      </dl>
    </div>
  );
}

const FILES = [
  { icon: FileText, name: 'passport-scan.pdf', size: '2.4 MB' },
  { icon: FileKey2, name: 'id_ed25519', size: '411 B' },
  { icon: FileSpreadsheet, name: 'taxes-2025.xlsx', size: '88 KB' },
];

/** Files encrypting one after another. */
export function FilesDemo() {
  return (
    <ul className="lp-files" aria-hidden="true">
      {FILES.map(({ icon: Icon, name, size }, i) => (
        <li key={name} style={{ '--i': i } as React.CSSProperties}>
          <Icon size={17} strokeWidth={1.6} />
          <div className="lp-file-body">
            <div className="lp-file-top">
              <span>{name}</span>
              <span className="lp-file-size">{size}</span>
            </div>
            <span className="lp-file-bar">
              <i />
            </span>
          </div>
          <span className="lp-file-lock">
            <Lock size={13} strokeWidth={1.8} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const HEX_ROWS = 6;
const HEX_COLS = 8;

/** What the saved vault file looks like from the outside: random bytes. */
export function HexDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [bytes, setBytes] = useState(() => Array.from({ length: HEX_ROWS * HEX_COLS }, () => randomHex(2)));
  const [hot, setHot] = useState<number[]>([]);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      const picks = Array.from({ length: 5 }, () => (Math.random() * HEX_ROWS * HEX_COLS) | 0);
      setBytes((prev) => {
        const next = prev.slice();
        picks.forEach((i) => (next[i] = randomHex(2)));
        return next;
      });
      setHot(picks);
    }, 140);
    return () => window.clearInterval(id);
  }, [inView]);

  return (
    <div ref={ref} className="lp-hex" aria-hidden="true">
      {Array.from({ length: HEX_ROWS }, (_, r) => (
        <div key={r} className="lp-hex-row">
          <span className="lp-hex-off">{(r * 16).toString(16).padStart(8, '0')}</span>
          {bytes.slice(r * HEX_COLS, (r + 1) * HEX_COLS).map((b, c) => (
            <span key={c} className={hot.includes(r * HEX_COLS + c) ? 'is-hot' : undefined}>
              {b}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
