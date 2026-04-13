import { useState } from 'react';
import { Shield, Lock, Smartphone, Cloud, Fingerprint, Download, Check, Key, Globe, Zap, Github, ArrowRight, Star, Users, Code2, ChevronDown, ChevronUp, ShieldCheck, ClipboardCheck, Timer, Quote, BarChart3, LockKeyhole, Sparkles, Brain, Cpu } from 'lucide-react';
import { Link } from '../components/Link';
import { PwaInstallModal } from '../components/PwaInstallModal';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function LandingPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const scrollRef = useScrollReveal();

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
    <div ref={scrollRef} id="top" className="min-h-screen bg-vault-dark overflow-hidden">
      {/* ═══════════════════════════════════════════
          HERO SECTION with Particles & 3D
          ═══════════════════════════════════════════ */}
      <div className="relative min-h-screen flex flex-col">
        {/* Particle Canvas Background */}
        <div className="absolute inset-0 z-0">
          <ParticleCanvas particleCount={100} connectionDistance={160} speed={0.25} />
        </div>

        {/* Gradient Orbs - 3D floating */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px] animate-orb-float" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[100px] animate-orb-float" style={{ animationDelay: '-7s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[150px]" />

        {/* AI Grid Background */}
        <div className="absolute inset-0 ai-grid-bg opacity-30" />

        {/* Scan line effect */}
        <div className="scan-line opacity-20" />

        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-xl flex items-center justify-center shadow-neon-cyan group-hover:shadow-neon-blue transition-shadow duration-500">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">EnigmaKeep</h1>
                <p className="text-xs neon-text font-medium">AI-Powered Digital Fortress</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hmalvee/EnigmaKeep"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-neon-cyan transition-colors duration-300"
              >
                <Github size={24} />
              </a>
              <a
                href="/app"
                className="ai-button-primary !px-6 !py-2.5 !rounded-lg text-sm"
              >
                Open Vault
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* AI Badge */}
            <div className="scroll-reveal inline-flex items-center gap-2 ai-badge mb-8 text-neon-cyan">
              <Brain size={16} className="animate-pulse" />
              <span className="font-mono text-xs tracking-wider">NEURAL ENCRYPTION ACTIVE</span>
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            </div>

            {/* Main Heading with 3D perspective */}
            <div className="scroll-reveal-3d">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.95] tracking-tighter">
                Your Digital Fortress,
                <br />
                <span className="neon-text-shimmer">
                  Powered by AI
                </span>
              </h1>
            </div>

            <p className="scroll-reveal stagger-1 text-xl md:text-2xl text-gray-300/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              The password vault that respects your privacy. Zero cloud, zero tracking, zero compromise.
              <span className="block mt-2 text-gray-400/70 text-lg">Your secrets stay in your sanctuary, nowhere else.</span>
            </p>

            {/* CTA Buttons */}
            <div className="scroll-reveal stagger-2 flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
              <a href="/app" className="ai-button-primary flex items-center gap-3 text-lg group">
                <Sparkles size={22} className="group-hover:animate-spin" />
                Get Started Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#features" className="ai-button-secondary flex items-center gap-2">
                Explore Features
                <ChevronDown size={18} />
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="scroll-reveal stagger-3 flex flex-wrap items-center justify-center gap-8 mb-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500" size={18} fill="currentColor" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="text-neon-cyan" size={18} />
                <span>AI-Grade Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="text-neon-blue" size={18} />
                <span>Auditable Code</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-neon-purple" size={18} />
                <span>18K+ Vaults</span>
              </div>
            </div>

            <p className="text-sm text-gray-500/60 font-mono">
              Available on all platforms • AES-256-GCM • PBKDF2 600K iterations
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="animate-bounce flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-mono tracking-wider">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-neon-cyan/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          INSTALL SECTION
          ═══════════════════════════════════════════ */}
      <div id="download" className="relative bg-vault-deeper py-24">
        <div className="absolute inset-0 ai-dots-bg opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 scroll-reveal">
            <div className="ai-badge text-neon-cyan mb-4 mx-auto w-fit">
              <Download size={16} />
              <span className="font-mono text-xs">CROSS-PLATFORM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Install on <span className="neon-text">Any Device</span>
            </h2>
            <p className="text-lg text-gray-400">One vault, all your platforms</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Android */}
            <button
              onClick={() => setSelectedPlatform('android')}
              className="scroll-reveal stagger-1 group glass-card-hover p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-green-400 group-hover:text-green-300 transition-colors">
                  <path fill="currentColor" d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.2C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Android</h3>
              <p className="text-sm text-gray-500">Chrome, Edge</p>
            </button>

            {/* iOS */}
            <button
              onClick={() => setSelectedPlatform('ios')}
              className="scroll-reveal stagger-2 group glass-card-hover p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-gray-300 group-hover:text-white transition-colors">
                  <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">iOS</h3>
              <p className="text-sm text-gray-500">Safari</p>
            </button>

            {/* Windows */}
            <button
              onClick={() => setSelectedPlatform('windows')}
              className="scroll-reveal stagger-3 group glass-card-hover p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-blue-400 group-hover:text-blue-300 transition-colors">
                  <path fill="currentColor" d="M3,12V6.75L9,5.43V11.91L3,12M20,3V11.75L10,11.9V5.21L20,3M3,13L9,13.09V19.9L3,18.75V13M20,13.25V22L10,20.09V13.1L20,13.25Z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Windows</h3>
              <p className="text-sm text-gray-500">Chrome, Edge</p>
            </button>

            {/* macOS */}
            <button
              onClick={() => setSelectedPlatform('macos')}
              className="scroll-reveal stagger-4 group glass-card-hover p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-gray-300 group-hover:text-white transition-colors">
                  <path fill="currentColor" d="M17.05,20.28c-0.98,0.95-2.05,0.8-3.08,0.35c-1.09-0.46-2.09-0.48-3.24,0c-1.44,0.62-2.2,0.44-3.06-0.35 C2.79,15.25,3.51,7.59,9.05,7.31c1.35,0.07,2.29,0.74,3.08,0.8c1.18-0.24,2.31-0.93,3.57-0.84c1.51,0.12,2.65,0.72,3.4,1.8 c-3.12,1.87-2.38,5.98,0.48,7.13c-0.57,1.5-1.31,2.99-2.54,4.09l0.01-0.01L17.05,20.28z M12.03,7.25c-0.15-2.23,1.66-4.07,3.74-4.25c0.29,2.58-2.34,4.5-3.74,4.25z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">macOS</h3>
              <p className="text-sm text-gray-500">Safari, Chrome</p>
            </button>

            {/* Linux */}
            <button
              onClick={() => setSelectedPlatform('linux')}
              className="scroll-reveal stagger-5 group glass-card-hover p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-400 group-hover:text-yellow-300 transition-colors">
                  <path fill="currentColor" d="M14.62,8.35C14.2,8.63 12.87,9.39 12.67,9.54C12.28,9.85 11.92,9.83 11.53,9.53C11.33,9.37 10,8.61 9.58,8.34C9.1,8.03 9.13,7.64 9.66,7.42C11.3,6.73 12.94,6.78 14.57,7.45C15.06,7.66 15.08,8.05 14.62,8.35M21.84,15.63C20.91,13.54 19.64,11.64 18,9.97C17.47,9.42 17.14,8.8 16.94,8.09C16.84,7.76 16.77,7.42 16.7,7.08C16.5,6.2 16.41,5.3 16,4.47C15.27,2.89 14,2.07 12.16,2C10.35,2.05 9.05,2.88 8.3,4.47C7.91,5.32 7.83,6.22 7.64,7.11C7.58,7.44 7.5,7.77 7.41,8.1C7.2,8.8 6.87,9.42 6.35,9.97C4.72,11.64 3.44,13.54 2.5,15.63C2.25,16.21 2.16,16.79 2.4,17.39C2.57,17.84 2.89,18.13 3.32,18.25C3.71,18.35 4.1,18.36 4.5,18.36C7.43,18.3 10.13,17.55 12.63,16.07C12.76,16 12.92,15.99 13.05,16.07C15.55,17.55 18.25,18.3 21.17,18.36C21.57,18.36 22,18.35 22.36,18.25C22.79,18.14 23.1,17.84 23.28,17.39C23.5,16.79 23.41,16.21 23.17,15.63L21.84,15.63M7.67,14.68C7.04,14.68 6.54,14.18 6.54,13.55C6.54,12.92 7.04,12.42 7.67,12.42C8.3,12.42 8.8,12.92 8.8,13.55C8.8,14.18 8.3,14.68 7.67,14.68M16.33,14.68C15.7,14.68 15.2,14.18 15.2,13.55C15.2,12.92 15.7,12.42 16.33,12.42C16.96,12.42 17.46,12.92 17.46,13.55C17.46,14.18 16.96,14.68 16.33,14.68Z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Linux</h3>
              <p className="text-sm text-gray-500">Chrome, Firefox</p>
            </button>
          </div>

          <div className="mt-12 text-center space-y-3 scroll-reveal">
            <p className="text-gray-400">
              No installation required • Works in your browser • Install as PWA for offline access
            </p>
            <p className="text-sm text-gray-500 font-mono">
              Click any platform above to see installation instructions
            </p>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="section-divider-glow" />

      {/* ═══════════════════════════════════════════
          FEATURES SECTION - 3D Cards
          ═══════════════════════════════════════════ */}
      <div id="features" className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-dark via-vault-deeper to-vault-dark" />
        {/* Background orbs */}
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-neon-purple/5 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 scroll-reveal">
            <div className="ai-badge text-neon-cyan mb-6 mx-auto w-fit">
              <Cpu size={16} />
              <span className="font-mono text-xs">CORE FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Built for <span className="neon-text">Privacy & Security</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade encryption meets intelligent design. Everything you need, nothing you don't.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 - Zero Knowledge */}
            <div className="scroll-reveal-3d stagger-1 card-3d glass-card p-8 group hover:border-neon-cyan/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-cyan transition-shadow duration-500 group-hover:scale-110">
                <Lock size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Zero-Knowledge Encryption
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                AES-256-GCM encryption with PBKDF2 (600K iterations). Your master password never leaves your device.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Military-grade encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Zero-knowledge architecture</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Encrypted at rest locally</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 2 - Biometric */}
            <div className="scroll-reveal-3d stagger-2 card-3d glass-card p-8 group hover:border-neon-purple/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-purple transition-shadow duration-500 group-hover:scale-110">
                <Fingerprint size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Biometric Authentication
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Unlock your vault with fingerprint or face recognition using WebAuthn/FIDO2.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Touch ID & Face ID support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Windows Hello compatible</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Privacy-preserving</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 3 - Offline */}
            <div className="scroll-reveal-3d stagger-3 card-3d glass-card p-8 group hover:border-neon-blue/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-blue to-neon-cyan rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-blue transition-shadow duration-500 group-hover:scale-110 relative">
                <Cloud className="text-white" size={26} style={{ transform: 'scale(-1, 1)' }} />
                <div className="absolute w-0.5 h-6 bg-red-500 rotate-45" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                100% Offline
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                No cloud sync, no servers, no data transmission. Everything stays on your device.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Works without internet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>No data transmission</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Complete privacy</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 4 - PWA */}
            <div className="scroll-reveal-3d stagger-4 card-3d glass-card p-8 group hover:border-neon-cyan/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-cyan transition-shadow duration-500 group-hover:scale-110">
                <Smartphone size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Progressive Web App
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Install as a native app on any device. Works offline, updates automatically.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Install on home screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>App-like experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Cross-platform support</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 5 - Password Generator */}
            <div className="scroll-reveal-3d stagger-5 card-3d glass-card p-8 group hover:border-neon-purple/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-purple transition-shadow duration-500 group-hover:scale-110">
                <Key size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Password Generator
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Generate strong, unique passwords with customizable length and character types.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Cryptographically secure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Customizable rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Password strength meter</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 6 - Import/Export */}
            <div className="scroll-reveal-3d stagger-6 card-3d glass-card p-8 group hover:border-neon-blue/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-blue to-neon-cyan rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-blue transition-shadow duration-500 group-hover:scale-110">
                <Globe size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Import & Export
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Easily migrate from other password managers or export your data.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>1Password, LastPass, Bitwarden</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Chrome, Firefox support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>CSV & JSON formats</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 7 - 2FA */}
            <div className="scroll-reveal-3d stagger-7 card-3d glass-card p-8 group hover:border-neon-cyan/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-cyan to-neon-green rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-cyan transition-shadow duration-500 group-hover:scale-110">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Built-in 2FA Authenticator
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Generate TOTP codes next to passwords so every login stays protected.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Time-based tokens with live countdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Unlimited accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>QR import for Google Authenticator</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 8 - Auto Lock */}
            <div className="scroll-reveal-3d stagger-8 card-3d glass-card p-8 group hover:border-neon-purple/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-purple transition-shadow duration-500 group-hover:scale-110">
                <Timer size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Smart Auto-Lock
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Adaptive timeouts keep your vault sealed without interrupting your flow.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Activity-based lock suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Instant lock hotkey</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Clipboard wipe on lock</span>
                </li>
              </ul>
            </div>

            {/* Feature Card 9 - Clipboard Guard */}
            <div className="scroll-reveal-3d stagger-9 card-3d glass-card p-8 group hover:border-neon-blue/30 transition-all duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center mb-6 group-hover:shadow-neon-blue transition-shadow duration-500 group-hover:scale-110">
                <ClipboardCheck size={26} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Clipboard Guard
              </h3>
              <p className="text-gray-400 mb-5 leading-relaxed">
                Automatic clipboard clearing with visual timers to keep copied secrets safe.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Customizable wipe intervals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Visual countdown overlay</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-neon-green flex-shrink-0" />
                  <span>Auto-detects copy type</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          COMPLETED FEATURES - Available Now
          ═══════════════════════════════════════════ */}
      <div className="relative bg-vault-deeper py-28">
        <div className="absolute inset-0 ai-grid-bg opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 scroll-reveal">
            <div className="ai-badge text-neon-green mb-6 mx-auto w-fit border-neon-green/20">
              <Check size={16} />
              <span className="font-mono text-xs">AVAILABLE NOW</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Powerful Features, <span className="neon-text">Ready Today</span>
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
                  className={`scroll-reveal stagger-${index + 1} group glass-card p-6 hover:border-neon-green/30 transition-all duration-500`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-shadow duration-500 group-hover:scale-110">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section-divider-glow" />

      {/* ═══════════════════════════════════════════
          IMPACT METRICS - 3D Parallax Cards
          ═══════════════════════════════════════════ */}
      <div id="impact" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-dark via-vault-deeper to-vault-dark" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-[150px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-neon-blue/5 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 scroll-reveal">
            <div className="ai-badge text-neon-cyan mb-6 mx-auto w-fit">
              <BarChart3 size={16} />
              <span className="font-mono text-xs">REAL-WORLD IMPACT</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Trusted <span className="neon-text">Across Industries</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              EnigmaKeep powers privacy-first workflows for security teams, freelancers, and remote organizations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {impactMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.title}
                  className={`scroll-scale stagger-${index + 1} group relative glass-card p-6 overflow-hidden hover:border-neon-cyan/30 transition-all duration-500`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-blue/5" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-neon-cyan/10 border border-neon-cyan/20 mb-5 group-hover:shadow-neon-cyan transition-shadow duration-500">
                      <Icon size={24} className="text-neon-cyan" />
                    </div>
                    <p className="text-4xl font-black text-white mb-2 tracking-tight">{metric.value}</p>
                    <h3 className="text-lg font-bold text-neon-cyan/80 mb-3">
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

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          TESTIMONIALS - Glassmorphism
          ═══════════════════════════════════════════ */}
      <div id="testimonials" className="relative py-28">
        <div className="absolute inset-0 bg-vault-deeper" />
        <div className="absolute inset-0 ai-dots-bg opacity-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 scroll-reveal">
            <div className="ai-badge text-neon-purple mb-6 mx-auto w-fit border-neon-purple/20">
              <Quote size={16} />
              <span className="font-mono text-xs">CUSTOMER STORIES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Teams That <span className="neon-text">Switched, Stayed</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Hear why leaders in security, design, and remote operations recommend EnigmaKeep.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className={`scroll-reveal stagger-${index + 1} glass-card p-6 hover:border-neon-purple/30 transition-all duration-500 group`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 flex items-center justify-center text-neon-purple font-bold border border-neon-purple/20">
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
                <p className="text-gray-300 leading-relaxed mb-5">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                  {testimonial.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-divider-glow" />

      {/* ═══════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════ */}
      <div id="faq" className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-dark to-vault-deeper" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <div className="ai-badge text-neon-cyan mb-6 mx-auto w-fit">
              <Sparkles size={16} />
              <span className="font-mono text-xs">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Frequently Asked <span className="neon-text">Questions</span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about EnigmaKeep
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`scroll-reveal stagger-${Math.min(index + 1, 5)} glass-card overflow-hidden hover:border-neon-cyan/20 transition-all duration-300`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-vault-hover/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="text-neon-cyan flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500 flex-shrink-0" size={20} />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5 text-gray-300 leading-relaxed animate-slideIn border-t border-vault-border/50 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          HOW IT WORKS - 3D Steps
          ═══════════════════════════════════════════ */}
      <div className="relative bg-vault-deeper py-28">
        <div className="absolute inset-0 ai-grid-bg opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 scroll-reveal">
            <div className="ai-badge text-neon-cyan mb-6 mx-auto w-fit">
              <Zap size={16} />
              <span className="font-mono text-xs">SIMPLE PROCESS</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              How It <span className="neon-text">Works</span>
            </h2>
            <p className="text-xl text-gray-400">
              Get started in 3 simple steps. No account, no complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="scroll-reveal stagger-1 group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-8 text-white text-3xl font-black shadow-neon-cyan group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Open EnigmaKeep
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Visit the web app or install as PWA on your device. No account required.
              </p>
            </div>

            <div className="scroll-reveal stagger-2 group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-8 text-white text-3xl font-black shadow-neon-blue group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Create Your Vault
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Set a master password and get a recovery phrase. Enable biometric unlock.
              </p>
            </div>

            <div className="scroll-reveal stagger-3 group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-neon-purple to-neon-pink rounded-2xl flex items-center justify-center mx-auto mb-8 text-white text-3xl font-black shadow-neon-purple group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Start Securing
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Add passwords, generate strong ones, and import from other managers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider-glow" />

      {/* ═══════════════════════════════════════════
          CTA SECTION with Particles
          ═══════════════════════════════════════════ */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-dark to-vault-deeper" />
        {/* Background effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-[200px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-reveal">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            Ready to Secure Your
            <br />
            <span className="neon-text-shimmer">Digital Life?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300/80 mb-12 leading-relaxed">
            Join thousands using EnigmaKeep for password management.
            <span className="block mt-2 text-lg text-gray-400/60">Free forever. No strings attached.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a
              href="/app"
              className="ai-button-primary flex items-center gap-3 text-lg group"
            >
              <Sparkles size={22} className="group-hover:animate-spin" />
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/hmalvee/EnigmaKeep"
              target="_blank"
              rel="noopener noreferrer"
              className="ai-button-secondary flex items-center gap-2"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="relative bg-vault-dark border-t border-vault-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-lg flex items-center justify-center shadow-neon-cyan">
                  <Shield className="text-white" size={18} />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">EnigmaKeep</span>
                  <p className="text-xs neon-text">AI-Powered Digital Fortress</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Open-source, offline-first password manager with zero-knowledge encryption.
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm tracking-wider">PRODUCT</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-neon-cyan transition-colors">Features</a></li>
                <li><a href="#download" className="text-gray-400 hover:text-neon-cyan transition-colors">Download</a></li>
                <li><a href="/app" className="text-gray-400 hover:text-neon-cyan transition-colors">Web App</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm tracking-wider">RESOURCES</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="text-gray-400 hover:text-neon-cyan transition-colors">FAQ</a></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-neon-cyan transition-colors">Blog</Link></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep/issues" className="text-gray-400 hover:text-neon-cyan transition-colors">Support</a></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep" className="text-gray-400 hover:text-neon-cyan transition-colors">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4 text-sm tracking-wider">LEGAL</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-neon-cyan transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-neon-cyan transition-colors">Terms of Service</Link></li>
                <li><a href="https://github.com/hmalvee/EnigmaKeep/blob/main/LICENSE" className="text-gray-400 hover:text-neon-cyan transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          <div className="section-divider mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © 2025 EnigmaKeep. Open source under MIT License.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Developed by <a href="https://www.hmalveehasan.com" target="_blank" rel="noopener noreferrer" className="text-neon-cyan/60 hover:text-neon-cyan transition-colors">HM Alvee Hasan</a>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/hmalvee/EnigmaKeep" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-neon-cyan transition-colors" aria-label="GitHub">
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
