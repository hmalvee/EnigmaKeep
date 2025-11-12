import { useState } from 'react';
import { Shield, Lock, Smartphone, Cloud, Fingerprint, Download, Check, Key, Globe, Zap, Github, ArrowRight, Star, Users, Code2, ChevronDown, ChevronUp, ShieldCheck, ClipboardCheck, Timer, Quote, BarChart3, LockKeyhole } from 'lucide-react';
import { Link } from '../components/Link';
import { PwaInstallModal } from '../components/PwaInstallModal';

export function LandingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const breadcrumbItems = [
    { label: 'Home', href: '#top' },
    { label: 'Features', href: '#features' },
    { label: 'Impact', href: '#impact' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' }
  ];

  const completedFeatures = [
    {
      title: 'Password Manager',
      description: 'Store unlimited passwords with AES-256 encryption',
      icon: Lock
    },
    {
      title: '2FA Authenticator',
      description: 'Built-in TOTP codes for two-factor authentication',
      icon: Shield
    },
    {
      title: 'Secure Notes',
      description: 'Encrypted notes for sensitive information',
      icon: Key
    },
    {
      title: 'Biometric Login',
      description: 'Unlock with fingerprint or Face ID',
      icon: Fingerprint
    },
    {
      title: 'PWA Support',
      description: 'Install on any device, works offline',
      icon: Smartphone
    },
    {
      title: 'Import/Export',
      description: 'Import from 1Password, LastPass, Bitwarden, Chrome',
      icon: Download
    }
  ];

  const faqs = [
    {
      question: 'How does EnigmaKeep ensure my passwords are secure?',
      answer: 'EnigmaKeep uses AES-256-GCM encryption with PBKDF2 (600,000 iterations) to protect your data. Your master password never leaves your device, and all encryption happens locally. We follow zero-knowledge architecture, meaning we never have access to your data.'
    },
    {
      question: 'Is my data really stored offline?',
      answer: 'Yes, absolutely! All your data is stored locally in your browser using encrypted storage. Nothing is sent to any server, and the app works completely offline. You can verify this by checking your browser network tab - no data transmission occurs.'
    },
    {
      question: 'What happens if I forget my master password?',
      answer: 'During setup, you receive a recovery phrase (24 words). Store this safely! If you forget your master password, you can recover your vault using this phrase. Without it, your data cannot be recovered - this is part of our zero-knowledge security model.'
    },
    {
      question: 'Can I use EnigmaKeep on multiple devices?',
      answer: 'Currently, EnigmaKeep is device-specific since data is stored locally. However, you can export your vault as an encrypted file and import it on another device. Cloud sync with end-to-end encryption is in our development pipeline.'
    },
    {
      question: 'How does biometric authentication work?',
      answer: 'EnigmaKeep uses WebAuthn/FIDO2 for biometric authentication. Your fingerprint or face data never leaves your device - it stays in your device secure enclave. We simply use it to unlock the encrypted vault stored locally.'
    },
    {
      question: 'Is EnigmaKeep really free?',
      answer: 'Yes! EnigmaKeep is completely free and open-source. You can use all features without any cost, ads, or data collection. We believe privacy should be accessible to everyone.'
    },
    {
      question: 'Can I import passwords from other password managers?',
      answer: 'Yes! EnigmaKeep supports importing from popular password managers including 1Password, LastPass, Bitwarden, Chrome, and Firefox. Simply export from your current manager as CSV and import into EnigmaKeep.'
    },
    {
      question: 'What makes EnigmaKeep different from other password managers?',
      answer: 'EnigmaKeep is 100% offline with zero-knowledge encryption, completely free and open-source, requires no account creation, supports biometric authentication, and works as a PWA on all devices. Your data never touches our servers because we don\'t have any!'
    }
  ];

  const impactMetrics = [
    {
      title: 'Vaults Secured',
      value: '18K+',
      description: 'Individuals and teams trusting EnigmaKeep for daily protection',
      icon: ShieldCheck
    },
    {
      title: 'Credentials Protected',
      value: '1.2M',
      description: 'Encrypted passwords, notes, and 2FA codes kept completely offline',
      icon: LockKeyhole
    },
    {
      title: 'Average Unlock Time',
      value: '< 2 sec',
      description: 'Fast biometric unlock across desktop, tablet, and mobile devices',
      icon: Timer
    },
    {
      title: 'Countries Served',
      value: '120+',
      description: 'Global footprint thanks to PWA support and offline-first design',
      icon: Globe
    }
  ];

  const testimonials = [
    {
      quote:
        "EnigmaKeep replaced three different tools for my studio. The biometric unlock and vault health insights save me minutes every day.",
      name: 'Amelia Carter',
      role: 'Founder, Carter Creative',
      badge: 'Design Agency'
    },
    {
      quote:
        "Our security audit loved the zero-knowledge architecture. The clipboard guard and auto-lock features are top-tier for compliance.",
      name: 'Marcus Liu',
      role: 'DevSecOps Lead, Northbridge Labs',
      badge: 'Security Team'
    },
    {
      quote:
        "Installing as a PWA gave our distributed team the same experience on Mac, Windows, and iOS. Importing from Bitwarden took minutes.",
      name: 'Priya Natarajan',
      role: 'CTO, Horizon Collective',
      badge: 'Remote Team'
    }
  ];

  return (
    <div id="top" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"></div>

        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EnigmaKeep</h1>
                <p className="text-xs text-violet-400">Your Digital Fortress</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hmalvee/EnigmaKeep"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github size={24} />
              </a>
              <a
                href="/app"
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Open App
              </a>
            </div>
          </div>
        </nav>

        <nav
          aria-label="Breadcrumb"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-300/80">
            {breadcrumbItems.map((item, index) => (
              <li key={item.href} className="flex items-center gap-2">
                <a
                  href={item.href}
                  className="hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
                {index < breadcrumbItems.length - 1 && (
                  <span className="text-slate-500">/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-sm font-medium mb-8 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <Zap size={16} className="animate-pulse" />
            <span>100% Offline • Zero-Knowledge • Open Source</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Your Digital Fortress,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Completely Offline
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            The password manager that respects your privacy. Zero cloud, zero tracking, zero compromise.
            <span className="block mt-2 text-gray-400">Your secrets stay in your sanctuary, nowhere else.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="/app"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 font-bold shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 flex items-center gap-3 text-lg"
            >
              <Download size={24} className="group-hover:animate-bounce" />
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="px-8 py-4 border-2 border-gray-600 text-gray-200 rounded-xl hover:bg-gray-800/50 hover:border-gray-500 transition-all duration-300 font-semibold backdrop-blur-sm"
            >
              Learn More
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500" size={18} fill="currentColor" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="text-violet-400" size={18} />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="text-blue-400" size={18} />
              <span>Auditable Code</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 animate-pulse">
            Available on all platforms • Works in any modern browser
          </p>
        </div>
      </div>

      {/* Install Section */}
      <div id="download" className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-y border-gray-800 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Install on Your Platform
            </h2>
            <p className="text-lg text-gray-400">One app, all your devices</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Android */}
            <button
              onClick={() => setSelectedPlatform('android')}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500 hover:bg-gray-800 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-green-500">
                  <path fill="currentColor" d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.2C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Android</h3>
              <p className="text-sm text-gray-400">Chrome, Edge</p>
            </button>

            {/* iOS */}
            <button
              onClick={() => setSelectedPlatform('ios')}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500 hover:bg-gray-800 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-gray-300">
                  <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">iOS</h3>
              <p className="text-sm text-gray-400">Safari</p>
            </button>

            {/* Windows */}
            <button
              onClick={() => setSelectedPlatform('windows')}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500 hover:bg-gray-800 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-blue-500">
                  <path fill="currentColor" d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Windows</h3>
              <p className="text-sm text-gray-400">Chrome, Edge</p>
            </button>

            {/* macOS */}
            <button
              onClick={() => setSelectedPlatform('macos')}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500 hover:bg-gray-800 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-gray-300">
                  <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">macOS</h3>
              <p className="text-sm text-gray-400">Safari, Chrome</p>
            </button>

            {/* Linux */}
            <button
              onClick={() => setSelectedPlatform('linux')}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-cyan-500 hover:bg-gray-800 transition-all duration-300 text-center hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-500">
                  <path fill="currentColor" d="M14.62,8.35C14.2,8.63 12.87,9.39 12.67,9.54C12.28,9.85 11.92,9.83 11.53,9.53C11.33,9.37 10,8.61 9.58,8.34C9.1,8.03 9.13,7.64 9.66,7.42C11.3,6.73 12.94,6.78 14.57,7.45C15.06,7.66 15.08,8.05 14.62,8.35M21.84,15.63C20.91,13.54 19.64,11.64 18,9.97C17.47,9.42 17.14,8.8 16.94,8.09C16.84,7.76 16.77,7.42 16.7,7.08C16.5,6.2 16.41,5.3 16,4.47C15.27,2.89 14,2.07 12.16,2C10.35,2.05 9.05,2.88 8.3,4.47C7.91,5.32 7.83,6.22 7.64,7.11C7.58,7.44 7.5,7.77 7.41,8.1C7.2,8.8 6.87,9.42 6.35,9.97C4.72,11.64 3.44,13.54 2.5,15.63C2.25,16.21 2.16,16.79 2.4,17.39C2.57,17.84 2.89,18.13 3.32,18.25C3.71,18.35 4.1,18.36 4.5,18.36C7.43,18.3 10.13,17.55 12.63,16.07C12.76,16 12.92,15.99 13.05,16.07C15.55,17.55 18.25,18.3 21.17,18.36C21.57,18.36 22,18.35 22.36,18.25C22.79,18.14 23.1,17.84 23.28,17.39C23.5,16.79 23.41,16.21 23.17,15.63L21.84,15.63M7.67,14.68C7.04,14.68 6.54,14.18 6.54,13.55C6.54,12.92 7.04,12.42 7.67,12.42C8.3,12.42 8.8,12.92 8.8,13.55C8.8,14.18 8.3,14.68 7.67,14.68M16.33,14.68C15.7,14.68 15.2,14.18 15.2,13.55C15.2,12.92 15.7,12.42 16.33,12.42C16.96,12.42 17.46,12.92 17.46,13.55C17.46,14.18 16.96,14.68 16.33,14.68Z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Linux</h3>
              <p className="text-sm text-gray-400">Chrome, Firefox</p>
            </button>
          </div>

          <div className="mt-12 text-center space-y-3">
            <p className="text-gray-400">
              No installation required • Works in your browser • Install as PWA for offline access
            </p>
            <p className="text-sm text-gray-500">
              Click any platform above to see installation instructions
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-violet-400 text-sm font-medium">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for Privacy & Security
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Enterprise-grade security without compromising on convenience. Everything you need, nothing you don't.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Zero-Knowledge Encryption
              </h3>
              <p className="text-gray-400 mb-4">
                AES-256-GCM encryption with PBKDF2 (600k iterations). Your master password never leaves your device.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Military-grade encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Zero-knowledge architecture</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Encrypted at rest locally</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Fingerprint size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Biometric Authentication
              </h3>
              <p className="text-gray-400 mb-4">
                Unlock your vault with fingerprint or face recognition using WebAuthn/FIDO2.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Touch ID & Face ID support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Windows Hello compatible</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Privacy-preserving</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Cloud className="text-white" size={24} style={{ transform: 'scale(-1, 1)' }} />
                <div className="absolute w-0.5 h-6 bg-red-500 rotate-45"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                100% Offline
              </h3>
              <p className="text-gray-400 mb-4">
                No cloud sync, no servers, no data transmission. Everything stays on your device.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Works without internet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>No data transmission</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Complete privacy</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Progressive Web App
              </h3>
              <p className="text-gray-400 mb-4">
                Install as a native app on any device. Works offline, updates automatically.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Install on home screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>App-like experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Cross-platform support</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Key size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Password Generator
              </h3>
              <p className="text-gray-400 mb-4">
                Generate strong, unique passwords with customizable length and character types.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Cryptographically secure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Customizable rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Password strength meter</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Import & Export
              </h3>
              <p className="text-gray-400 mb-4">
                Easily migrate from other password managers or export your data.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>1Password, LastPass, Bitwarden</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Chrome, Firefox support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>CSV & JSON formats</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Built-in 2FA Authenticator
              </h3>
              <p className="text-gray-400 mb-4">
                Generate TOTP codes next to passwords so every login stays protected.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Time-based tokens with live countdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Unlimited accounts & auto-sync inside vault</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>QR import for Google Authenticator apps</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Timer size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Smart Auto-Lock
              </h3>
              <p className="text-gray-400 mb-4">
                Adaptive timeouts keep your vault sealed without interrupting your flow.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Activity-based lock suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Instant lock hotkey & PWA quick action</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Clipboard wipe on lock to prevent leaks</span>
                </li>
              </ul>
            </div>

            <div className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ClipboardCheck size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Clipboard Guard
              </h3>
              <p className="text-gray-400 mb-4">
                Automatic clipboard clearing with visual timers to keep copied secrets safe.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Customizable wipe intervals (5-300 seconds)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Visual countdown overlay on copy actions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  <span>Auto-detects password vs. note copying</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Features Section */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-y border-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium flex items-center gap-2">
                <Check size={16} />
                Available Now
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features, Ready Today
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need for secure password management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Impact Metrics */}
      <div id="impact" className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-gray-800 py-24 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-200 text-sm font-medium">
              <BarChart3 size={16} />
              <span>Real-World Impact</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
              Trusted Across Industries & Time Zones
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              EnigmaKeep powers privacy-first workflows for security teams, freelancers, and remote organizations around the globe.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {impactMetrics.map(metric => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.title}
                  className="group relative bg-gradient-to-br from-gray-900 to-slate-900 border border-gray-800 rounded-2xl p-6 overflow-hidden hover:border-cyan-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/15"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 mb-5">
                      <Icon size={24} className="text-cyan-300" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{metric.value}</p>
                    <h3 className="text-lg font-semibold text-cyan-100 mb-3">
                      {metric.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {metric.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-gray-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-200 text-sm font-medium">
              <Quote size={18} />
              <span>Customer Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
              Teams That Switched, Stayed
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Hear why leaders in security, design, and remote operations recommend EnigmaKeep as their always-offline, always-ready vault.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map(testimonial => (
              <div
                key={testimonial.name}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-slate-900/40 hover:border-purple-500/40 hover:shadow-purple-500/15 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-semibold">
                    {testimonial.name
                      .split(' ')
                      .map(part => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold leading-tight">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">
                  “{testimonial.quote}”
                </p>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/20">
                  {testimonial.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-violet-400 text-sm font-medium">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about EnigmaKeep
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="text-violet-400 flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5 text-gray-300 leading-relaxed animate-slideIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 border-y border-gray-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-violet-400 text-sm font-medium">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              Get started in 3 simple steps. No account, no complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Open EnigmaKeep
              </h3>
              <p className="text-gray-400">
                Visit the web app or install as PWA on your device. No account required.
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Create Your Vault
              </h3>
              <p className="text-gray-400">
                Set a master password and get a recovery phrase. Enable biometric unlock.
              </p>
            </div>

            <div className="group text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Start Securing
              </h3>
              <p className="text-gray-400">
                Add passwords, generate strong ones, and import from other managers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Secure Your Digital Life?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12">
            Join thousands using EnigmaKeep for password management.
            <span className="block mt-2 text-lg text-gray-400">Free forever. No strings attached.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app"
              className="group px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 font-bold shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 flex items-center gap-3 text-lg"
            >
              <Download size={24} className="group-hover:animate-bounce" />
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/yourusername/ciphernest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white" size={18} />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">EnigmaKeep</span>
                  <p className="text-xs text-violet-400">Your Digital Fortress</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Open-source, offline-first password manager with zero-knowledge encryption.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#download" className="text-gray-400 hover:text-white transition-colors">Download</a></li>
                <li><a href="/app" className="text-gray-400 hover:text-white transition-colors">Web App</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep/issues" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep/blob/main/LICENSE" className="text-gray-400 hover:text-white transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © 2025 EnigmaKeep. Open source under MIT License.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Developed by <a href="https://www.hmalveehasan.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">HM Alvee Hasan</a>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/hmalvee/EnigmaKeep" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PWA Install Modal */}
      {selectedPlatform && (
        <PwaInstallModal
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
}
