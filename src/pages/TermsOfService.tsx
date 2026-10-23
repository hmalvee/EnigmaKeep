import { Code2, KeyRound, Scale, UserX } from 'lucide-react';
import { LegalDoc, type LegalSection } from '../site/LegalDoc';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: (
      <p>
        By accessing and using EnigmaKeep, you accept and agree to be bound by these Terms of Service.
        If you do not agree to these terms, please do not use the application.
      </p>
    ),
  },
  {
    id: 'description',
    title: 'Description of Service',
    body: (
      <>
        <p>EnigmaKeep is an offline-first, open-source password manager that:</p>
        <ul>
          <li>Stores encrypted passwords locally on your device</li>
          <li>Provides biometric authentication options</li>
          <li>Operates entirely offline without cloud storage</li>
          <li>Uses zero-knowledge encryption</li>
        </ul>
      </>
    ),
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    body: (
      <>
        <h3>3.1 Master Password</h3>
        <p>
          You are solely responsible for maintaining the confidentiality of your master password.
          If you lose your master password, you will lose access to your vault. We cannot recover it for you.
        </p>
        <h3>3.2 Recovery Phrase</h3>
        <p>
          You must securely store your recovery phrase. It is the only way to recover your vault if you
          forget your master password. Keep it in a safe place and never share it with anyone.
        </p>
        <h3>3.3 Backups</h3>
        <p>
          You are responsible for creating and maintaining backups of your vault. We recommend regular
          exports to ensure you don't lose your data.
        </p>
        <h3>3.4 Security</h3>
        <p>
          You must take reasonable security precautions with your device, including using device encryption,
          screen locks, and keeping your software up to date.
        </p>
      </>
    ),
  },
  {
    id: 'data-and-privacy',
    title: 'Data and Privacy',
    body: (
      <div className="callout">
        <p>
          <strong>We do not collect, store, or have access to your data.</strong>
        </p>
        <p>
          All data is stored locally on your device, encrypted. We cannot access, recover, or restore
          your data. You are the sole custodian of your information.
        </p>
      </div>
    ),
  },
  {
    id: 'disclaimer-of-warranties',
    title: 'Disclaimer of Warranties',
    body: (
      <>
        <p>
          <strong>ENIGMAKEEP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.</strong>
        </p>
        <p>We make no warranties, express or implied, including but not limited to:</p>
        <ul>
          <li>The application will be error-free or uninterrupted</li>
          <li>The application will meet your specific requirements</li>
          <li>Defects will be corrected</li>
          <li>The application is free from viruses or harmful components</li>
        </ul>
        <p>
          Use of EnigmaKeep is at your own risk. While we strive to provide a secure and reliable
          application, we cannot guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    body: (
      <div className="callout is-quiet">
        <p>
          <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
        </p>
        <p>
          We shall not be liable for any direct, indirect, incidental, special, consequential, or
          punitive damages arising from:
        </p>
        <ul>
          <li>Use or inability to use the application</li>
          <li>Loss of data or passwords</li>
          <li>Unauthorized access to your device or data</li>
          <li>Errors or omissions in the application</li>
          <li>Any other matter relating to the application</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'open-source-license',
    title: 'Open Source License',
    body: (
      <>
        <p>EnigmaKeep is open source software. The application is released under the GNU Affero General Public License, version 3 or later, and the cryptographic modules in <code>src/crypto</code> under the MIT License. You may:</p>
        <ul>
          <li>Use, copy, modify, and distribute the software</li>
          <li>Use it for commercial purposes</li>
          <li>Reuse the cryptographic modules in your own projects under the MIT terms</li>
        </ul>
        <p>If you distribute a modified version of the application, or run one for other people over a network, the AGPL requires you to publish your modifications under the same licence. The full terms are in the LICENSE and LICENSING.md files in our GitHub repository.</p>
      </>
    ),
  },
  {
    id: 'prohibited-uses',
    title: 'Prohibited Uses',
    body: (
      <>
        <p>You may not use EnigmaKeep to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon intellectual property rights</li>
          <li>Transmit malicious code or viruses</li>
          <li>Attempt to gain unauthorized access to other systems</li>
          <li>Interfere with the application's functionality</li>
        </ul>
      </>
    ),
  },
  {
    id: 'no-account',
    title: 'No Account or Registration',
    body: (
      <p>
        EnigmaKeep does not require account creation or registration. There are no user accounts,
        no email verification, and no login credentials to manage (other than your vault's master password).
      </p>
    ),
  },
  {
    id: 'updates',
    title: 'Updates and Modifications',
    body: (
      <>
        <p>We may update EnigmaKeep from time to time to:</p>
        <ul>
          <li>Add new features</li>
          <li>Fix bugs and security issues</li>
          <li>Improve performance</li>
          <li>Update dependencies</li>
        </ul>
        <p>
          The PWA will automatically update when you're online. You're always free to use older versions
          or fork the code.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <>
        <p>You may stop using EnigmaKeep at any time by:</p>
        <ul>
          <li>Uninstalling the PWA</li>
          <li>Clearing your browser data</li>
          <li>Simply not accessing the application</li>
        </ul>
        <p>Since there are no accounts, there is nothing to "terminate" on our end. You have complete control.</p>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    body: (
      <p>
        EnigmaKeep does not integrate with or rely on any third-party services. The application operates
        entirely independently on your device.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    body: (
      <p>
        These Terms shall be governed by and construed in accordance with the laws of your jurisdiction,
        without regard to its conflict of law provisions.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    body: (
      <p>
        We reserve the right to modify these terms at any time. Continued use of the application after
        changes constitutes acceptance of the new terms. Material changes will be announced through the
        application or GitHub repository.
      </p>
    ),
  },
  {
    id: 'severability',
    title: 'Severability',
    body: (
      <p>
        If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
        limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain
        in full force and effect.
      </p>
    ),
  },
  {
    id: 'contact-and-support',
    title: 'Contact and Support',
    body: (
      <>
        <p>For questions, issues, or contributions:</p>
        <ul>
          <li>
            Visit our <a href="https://github.com/hmalvee/EnigmaKeep">GitHub repository</a>
          </li>
          <li>Open an issue for bugs or feature requests</li>
          <li>Submit pull requests for improvements</li>
          <li>Read the documentation and guides</li>
        </ul>
      </>
    ),
  },
];

const SECTION_IDS = sections.map((s) => s.id);

const glance = [
  { icon: Scale, title: 'Provided as is', text: 'Open-source software with no warranty of any kind.' },
  { icon: KeyRound, title: 'You hold the keys', text: 'We cannot access, recover, or restore your vault.' },
  { icon: Code2, title: 'Open source', text: 'AGPL-3.0 app, MIT cryptography. Use, copy, modify, and distribute.' },
  { icon: UserX, title: 'No account', text: 'No registration, no email verification, no login.' },
];

const reminders = (
  <div className="legal-appendix callout is-quiet">
    <h2>Important Reminders</h2>
    <dl className="defs">
      <div>
        <dt>We cannot recover your data</dt>
        <dd>Keep your master password and recovery phrase safe</dd>
      </div>
      <div>
        <dt>Make regular backups</dt>
        <dd>Use the export feature to backup your vault</dd>
      </div>
      <div>
        <dt>It's open source</dt>
        <dd>Review the code, contribute, or fork it</dd>
      </div>
      <div>
        <dt>No cloud sync</dt>
        <dd>Everything stays on your device</dd>
      </div>
    </dl>
  </div>
);

export function TermsOfService() {
  return (
    <LegalDoc
      title={['Terms of', 'Service']}
      intro="Please read these Terms of Service carefully before using EnigmaKeep."
      glance={glance}
      sections={sections}
      sectionIds={SECTION_IDS}
      appendix={reminders}
      closing="By using EnigmaKeep, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service."
      pair={{ href: '/privacy', label: 'Privacy Policy' }}
    />
  );
}
