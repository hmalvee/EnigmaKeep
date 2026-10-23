import { Code2, EyeOff, HardDrive, Unplug } from 'lucide-react';
import { LegalDoc, type LegalSection } from '../site/LegalDoc';

const sections: LegalSection[] = [
  {
    id: 'simple-truth',
    title: 'The Simple Truth',
    body: (
      <div className="callout">
        <p className="callout-lede">We don't collect, store, or transmit ANY of your data.</p>
        <p>
          EnigmaKeep is a 100% offline, client-side application. Your data never leaves your device.
          We have no servers, no databases, no cloud storage, and no way to access your information.
        </p>
      </div>
    ),
  },
  {
    id: 'what-we-dont-collect',
    title: "What We Don't Collect",
    body: (
      <dl className="defs">
        <div>
          <dt>Personal Information<br /><em>Not collected</em></dt>
          <dd>We don't collect names, emails, phone numbers, or any identifying information.</dd>
        </div>
        <div>
          <dt>Passwords &amp; Vault Data<br /><em>Not collected</em></dt>
          <dd>Your passwords, notes, and vault contents are stored locally on your device, encrypted. We never see them.</dd>
        </div>
        <div>
          <dt>Usage Analytics<br /><em>Not collected</em></dt>
          <dd>We don't track how you use the app, what features you use, or how often you use it.</dd>
        </div>
        <div>
          <dt>Biometric Data<br /><em>Not collected</em></dt>
          <dd>Your fingerprints, face data, etc. are handled by your device's operating system. We never access this data.</dd>
        </div>
        <div>
          <dt>Cookies &amp; Trackers<br /><em>Not collected</em></dt>
          <dd>No tracking cookies, no third-party analytics, no advertising trackers.</dd>
        </div>
      </dl>
    ),
  },
  {
    id: 'how-your-data-is-stored',
    title: 'How Your Data is Stored',
    body: (
      <>
        <h3>Local Storage</h3>
        <p>
          All your vault data is stored in your browser's local storage, encrypted with AES-256-GCM.
          Your master password never leaves your device and is never stored anywhere.
        </p>
        <h3>Encryption</h3>
        <p>
          Your vault is encrypted using military-grade AES-256-GCM encryption with PBKDF2 key derivation
          (600,000 iterations). Only you have the key to decrypt your data.
        </p>
        <h3>Biometric Authentication</h3>
        <p>
          When you enable biometric unlock, we use the Web Authentication API (WebAuthn). Your biometric
          data is handled entirely by your device's secure enclave and never exposed to our application.
        </p>
      </>
    ),
  },
  {
    id: 'pwa',
    title: 'Progressive Web App (PWA)',
    body: (
      <>
        <p>
          When you install EnigmaKeep as a PWA, your browser caches the app's public assets (HTML, CSS, JavaScript)
          locally for offline access. This is handled by a service worker and contains NO sensitive data.
        </p>
        <p>The cached files include only the app's code and interface, never your passwords or vault data.</p>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    body: (
      <>
        <p>EnigmaKeep does not use any third-party services, APIs, or integrations. There are no:</p>
        <ul>
          <li>Analytics services (Google Analytics, etc.)</li>
          <li>Advertising networks</li>
          <li>Cloud storage providers</li>
          <li>CDNs for user data</li>
          <li>External authentication services</li>
        </ul>
        <p>The app is completely self-contained and operates entirely on your device.</p>
      </>
    ),
  },
  {
    id: 'data-deletion',
    title: 'Data Deletion',
    body: (
      <>
        <p>Since all data is stored locally on your device, you have complete control over deletion:</p>
        <ul>
          <li>Delete individual entries from within the app</li>
          <li>Clear your browser's local storage</li>
          <li>Uninstall the PWA</li>
          <li>Clear browser cache and data</li>
        </ul>
        <p>
          Once deleted from your device, the data is gone forever. We don't have backups because we never had your data in the first place.
        </p>
      </>
    ),
  },
  {
    id: 'open-source',
    title: 'Open Source',
    body: (
      <p>
        EnigmaKeep is open source. You can review the entire codebase on GitHub to verify that we do exactly
        what we say: absolutely nothing with your data. The code is transparent and auditable by anyone.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: (
      <p>
        Since we don't collect data, this policy is unlikely to change. If we ever introduce any data
        collection (which we have no plans to do), we'll update this policy and notify users through the app.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <>
        <p>If you have questions about this privacy policy, you can:</p>
        <ul>
          <li>
            Open an issue on <a href="https://github.com/hmalvee/EnigmaKeep">GitHub</a>
          </li>
          <li>Review the source code to see exactly how the app works</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    body: (
      <div className="callout is-quiet">
        <p>Under GDPR, CCPA, and other privacy regulations, you have the right to:</p>
        <ul>
          <li>Access your data (it's all on your device)</li>
          <li>Delete your data (clear local storage)</li>
          <li>Export your data (use the export feature in the app)</li>
          <li>Opt-out of data collection (there is no data collection)</li>
        </ul>
        <p>
          <strong>
            Since we don't collect or store your data, these rights are inherently protected. You have complete
            control over your information at all times.
          </strong>
        </p>
      </div>
    ),
  },
];

const SECTION_IDS = sections.map((s) => s.id);

const glance = [
  { icon: EyeOff, title: 'Nothing collected', text: 'No personal details, analytics, cookies, or trackers.' },
  { icon: HardDrive, title: 'Stays on your device', text: 'Your vault is encrypted locally with AES-256-GCM.' },
  { icon: Unplug, title: 'No third parties', text: 'No analytics, ad networks, or cloud providers in the app.' },
  { icon: Code2, title: 'Open source', text: 'Every line is public on GitHub, so you can verify it.' },
];

export function PrivacyPolicy() {
  return (
    <LegalDoc
      title={['Privacy', 'Policy']}
      intro="EnigmaKeep is committed to protecting your privacy. This policy explains how we handle your data."
      glance={glance}
      sections={sections}
      sectionIds={SECTION_IDS}
      pair={{ href: '/terms', label: 'Terms of Service' }}
    />
  );
}
