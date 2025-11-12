import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from '../components/Link';

export function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-8 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="text-lg mb-4">
              EnigmaKeep is committed to protecting your privacy. This policy explains how we handle your data.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">The Simple Truth</h2>
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-6">
              <p className="text-lg font-semibold text-cyan-400 mb-3">
                We don't collect, store, or transmit ANY of your data.
              </p>
              <p className="text-gray-300">
                EnigmaKeep is a 100% offline, client-side application. Your data never leaves your device.
                We have no servers, no databases, no cloud storage, and no way to access your information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What We Don't Collect</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1">•</span>
                <div>
                  <strong className="text-white">Personal Information:</strong> We don't collect names, emails, phone numbers, or any identifying information.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1">•</span>
                <div>
                  <strong className="text-white">Passwords & Vault Data:</strong> Your passwords, notes, and vault contents are stored locally on your device, encrypted. We never see them.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1">•</span>
                <div>
                  <strong className="text-white">Usage Analytics:</strong> We don't track how you use the app, what features you use, or how often you use it.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1">•</span>
                <div>
                  <strong className="text-white">Biometric Data:</strong> Your fingerprints, face data, etc. are handled by your device's operating system. We never access this data.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1">•</span>
                <div>
                  <strong className="text-white">Cookies & Trackers:</strong> No tracking cookies, no third-party analytics, no advertising trackers.
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How Your Data is Stored</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Local Storage</h3>
                <p>
                  All your vault data is stored in your browser's local storage, encrypted with AES-256-GCM.
                  Your master password never leaves your device and is never stored anywhere.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Encryption</h3>
                <p>
                  Your vault is encrypted using military-grade AES-256-GCM encryption with PBKDF2 key derivation
                  (600,000 iterations). Only you have the key to decrypt your data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Biometric Authentication</h3>
                <p>
                  When you enable biometric unlock, we use the Web Authentication API (WebAuthn). Your biometric
                  data is handled entirely by your device's secure enclave and never exposed to our application.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Progressive Web App (PWA)</h2>
            <p className="mb-4">
              When you install EnigmaKeep as a PWA, your browser caches the app's public assets (HTML, CSS, JavaScript)
              locally for offline access. This is handled by a service worker and contains NO sensitive data.
            </p>
            <p>
              The cached files include only the app's code and interface, never your passwords or vault data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="mb-4">
              EnigmaKeep does not use any third-party services, APIs, or integrations. There are no:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Analytics services (Google Analytics, etc.)</li>
              <li>Advertising networks</li>
              <li>Cloud storage providers</li>
              <li>CDNs for user data</li>
              <li>External authentication services</li>
            </ul>
            <p className="mt-4">
              The app is completely self-contained and operates entirely on your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Deletion</h2>
            <p className="mb-4">
              Since all data is stored locally on your device, you have complete control over deletion:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Delete individual entries from within the app</li>
              <li>Clear your browser's local storage</li>
              <li>Uninstall the PWA</li>
              <li>Clear browser cache and data</li>
            </ul>
            <p className="mt-4">
              Once deleted from your device, the data is gone forever. We don't have backups because we never had your data in the first place.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Open Source</h2>
            <p>
              EnigmaKeep is open source. You can review the entire codebase on GitHub to verify that we do exactly
              what we say: absolutely nothing with your data. The code is transparent and auditable by anyone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p>
              Since we don't collect data, this policy is unlikely to change. If we ever introduce any data
              collection (which we have no plans to do), we'll update this policy and notify users through the app.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              If you have questions about this privacy policy, you can:
            </p>
            <ul className="space-y-2 list-disc list-inside mt-4">
              <li>Open an issue on <a href="https://github.com/hmalvee/EnigmaKeep" className="text-cyan-400 hover:text-cyan-300">GitHub</a></li>
              <li>Review the source code to see exactly how the app works</li>
            </ul>
          </section>

          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="mb-4">
              Under GDPR, CCPA, and other privacy regulations, you have the right to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access your data (it's all on your device)</li>
              <li>Delete your data (clear local storage)</li>
              <li>Export your data (use the export feature in the app)</li>
              <li>Opt-out of data collection (there is no data collection)</li>
            </ul>
            <p className="mt-4 font-semibold text-cyan-400">
              Since we don't collect or store your data, these rights are inherently protected. You have complete
              control over your information at all times.
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
