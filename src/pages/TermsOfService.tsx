import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from '../components/Link';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-8 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="text-lg">
              Please read these Terms of Service carefully before using EnigmaKeep.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using EnigmaKeep, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="mb-4">
              EnigmaKeep is an offline-first, open-source password manager that:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Stores encrypted passwords locally on your device</li>
              <li>Provides biometric authentication options</li>
              <li>Operates entirely offline without cloud storage</li>
              <li>Uses zero-knowledge encryption</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.1 Master Password</h3>
                <p>
                  You are solely responsible for maintaining the confidentiality of your master password.
                  If you lose your master password, you will lose access to your vault. We cannot recover it for you.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.2 Recovery Phrase</h3>
                <p>
                  You must securely store your recovery phrase. It is the only way to recover your vault if you
                  forget your master password. Keep it in a safe place and never share it with anyone.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.3 Backups</h3>
                <p>
                  You are responsible for creating and maintaining backups of your vault. We recommend regular
                  exports to ensure you don't lose your data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.4 Security</h3>
                <p>
                  You must take reasonable security precautions with your device, including using device encryption,
                  screen locks, and keeping your software up to date.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data and Privacy</h2>
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
              <p className="mb-4">
                <strong className="text-white">We do not collect, store, or have access to your data.</strong>
              </p>
              <p>
                All data is stored locally on your device, encrypted. We cannot access, recover, or restore
                your data. You are the sole custodian of your information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer of Warranties</h2>
            <div className="space-y-4">
              <p className="font-semibold text-white">
                ENIGMAKEEP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
              </p>
              <p>
                We make no warranties, express or implied, including but not limited to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>The application will be error-free or uninterrupted</li>
                <li>The application will meet your specific requirements</li>
                <li>Defects will be corrected</li>
                <li>The application is free from viruses or harmful components</li>
              </ul>
              <p>
                Use of EnigmaKeep is at your own risk. While we strive to provide a secure and reliable
                application, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6">
              <p className="mb-4">
                <strong className="text-white">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <p className="mb-4">
                We shall not be liable for any direct, indirect, incidental, special, consequential, or
                punitive damages arising from:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use or inability to use the application</li>
                <li>Loss of data or passwords</li>
                <li>Unauthorized access to your device or data</li>
                <li>Errors or omissions in the application</li>
                <li>Any other matter relating to the application</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Open Source License</h2>
            <p className="mb-4">
              EnigmaKeep is open source software released under the MIT License. You may:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Use, copy, modify, and distribute the software</li>
              <li>Use it for commercial purposes</li>
              <li>Sublicense and sell copies</li>
            </ul>
            <p className="mt-4">
              The full license terms are available in the LICENSE file in our GitHub repository.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Prohibited Uses</h2>
            <p className="mb-4">You may not use EnigmaKeep to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to other systems</li>
              <li>Interfere with the application's functionality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. No Account or Registration</h2>
            <p>
              EnigmaKeep does not require account creation or registration. There are no user accounts,
              no email verification, and no login credentials to manage (other than your vault's master password).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Updates and Modifications</h2>
            <p className="mb-4">
              We may update EnigmaKeep from time to time to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Add new features</li>
              <li>Fix bugs and security issues</li>
              <li>Improve performance</li>
              <li>Update dependencies</li>
            </ul>
            <p className="mt-4">
              The PWA will automatically update when you're online. You're always free to use older versions
              or fork the code.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
            <p>
              You may stop using EnigmaKeep at any time by:
            </p>
            <ul className="space-y-2 list-disc list-inside mt-4">
              <li>Uninstalling the PWA</li>
              <li>Clearing your browser data</li>
              <li>Simply not accessing the application</li>
            </ul>
            <p className="mt-4">
              Since there are no accounts, there is nothing to "terminate" on our end. You have complete control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Third-Party Services</h2>
            <p>
              EnigmaKeep does not integrate with or rely on any third-party services. The application operates
              entirely independently on your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of your jurisdiction,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the application after
              changes constitutes acceptance of the new terms. Material changes will be announced through the
              application or GitHub repository.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
              limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain
              in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">16. Contact and Support</h2>
            <p className="mb-4">
              For questions, issues, or contributions:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Visit our <a href="https://github.com/hmalvee/EnigmaKeep" className="text-cyan-400 hover:text-cyan-300">GitHub repository</a></li>
              <li>Open an issue for bugs or feature requests</li>
              <li>Submit pull requests for improvements</li>
              <li>Read the documentation and guides</li>
            </ul>
          </section>

          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Important Reminders</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-cyan-400">• </strong>
                <strong className="text-white">We cannot recover your data</strong> - Keep your master password and recovery phrase safe
              </p>
              <p>
                <strong className="text-cyan-400">• </strong>
                <strong className="text-white">Make regular backups</strong> - Use the export feature to backup your vault
              </p>
              <p>
                <strong className="text-cyan-400">• </strong>
                <strong className="text-white">It's open source</strong> - Review the code, contribute, or fork it
              </p>
              <p>
                <strong className="text-cyan-400">• </strong>
                <strong className="text-white">No cloud sync</strong> - Everything stays on your device
              </p>
            </div>
          </section>

          <section>
            <p className="text-sm text-gray-400">
              By using EnigmaKeep, you acknowledge that you have read, understood, and agree to be bound by
              these Terms of Service.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
