# EnigmaKeep - Your Digital Fortress

![EnigmaKeep Logo](./public/icons/icon-192x192.png)

**EnigmaKeep** is a 100% offline password manager with zero-knowledge encryption and biometric authentication. Your digital fortress for complete privacy - no cloud, no tracking, completely free and open source.

[![GitHub](https://img.shields.io/badge/GitHub-EnigmaKeep-violet)](https://github.com/hmalvee/EnigmaKeep)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Enabled-success)](https://enigmakeep.app)

## 🔐 Key Features

- **100% Offline** - No internet required, works completely offline
- **Zero-Knowledge Encryption** - AES-256-GCM with PBKDF2 (600,000 iterations)
- **Biometric Authentication** - WebAuthn/FIDO2 for fingerprint and face recognition
- **Cross-Platform PWA** - Works on all devices (mobile, desktop, tablet)
- **No Account Required** - Your data stays on your device only
- **Open Source** - Fully transparent and auditable code
- **Import/Export** - Compatible with 1Password, LastPass, Bitwarden, and more
- **Password Generator** - Create strong, unique passwords instantly
- **12-Word Recovery Phrase** - BIP39-compatible recovery system
- **Dark Mode** - Beautiful, modern interface with dark/light themes

## 🚀 Quick Start

### Option 1: Use Online (PWA)

Visit [EnigmaKeep.com](https://enigmakeep.com) and install as a Progressive Web App:

1. Open in Chrome, Edge, or Safari
2. Click "Install" or "Add to Home Screen"
3. Launch EnigmaKeep like a native app


## 📖 Documentation

- [PWA Installation Guide](./docs/PWA_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Features](./docs/SECURITY_FEATURES.md)

## 🔒 Security

EnigmaKeep uses industry-standard encryption:

- **AES-256-GCM** for vault encryption
- **PBKDF2** with 600,000 iterations for key derivation
- **WebAuthn/FIDO2** for biometric authentication
- **Device binding** for additional security layer
- **Zero-knowledge architecture** - we never see your data

All encryption happens locally on your device. Your master password never leaves your device, and we have no servers to store your data.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Crypto**: Web Crypto API + BIP39
- **PWA**: Vite PWA Plugin + Workbox
- **Build**: Vite

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS 14.3+)
- Opera 76+

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**HM Alvee Hasan**
- Portfolio: [www.hmalveehasan.com](https://www.hmalveehasan.com)
- GitHub: [@hmalvee](https://github.com/hmalvee)

## 🙏 Acknowledgments

- Built with ❤️ for privacy and security
- Inspired by the need for truly offline password management
- Thanks to all contributors and users

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/hmalvee/EnigmaKeep/issues)
- Discussions: [Join the conversation](https://github.com/hmalvee/EnigmaKeep/discussions)

---

**EnigmaKeep** - Your Digital Fortress. Built with privacy in mind.

© 2024 HM Alvee Hasan. Open source under MIT License.
