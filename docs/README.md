# EnigmaKeep Documentation

EnigmaKeep is a 100% offline, zero-knowledge password manager. This document collects the key concepts, security guarantees, and operational guides for contributors and power users.

## Project Essentials

- **Homepage:** https://enigmakeep.com/  
- **Repository:** https://github.com/hmalvee/EnigmaKeep  
- **License:** MIT  
- **Maintainer:** HM Alvee Hasan ([@hmalvee](https://github.com/hmalvee))

## Feature Overview

- **Offline-first architecture** – no servers, no telemetry, zero data leaving the device.
- **Local AES-256-GCM encryption** driven by PBKDF2 (600k iterations) per vault.
- **Built-in biometric unlock** using WebAuthn/FIDO2, with device-bound credentials.
- **Integrated TOTP authenticator** for managing 2FA codes alongside credentials.
- **Secure notes & categories** for organizing sensitive records.
- **Password generator & strength meter** with entropy heuristics.
- **Import/export pipeline** compatible with 1Password, LastPass, Bitwarden, Chrome, and Firefox.
- **PWA distribution** with install prompts for desktop and mobile browsers.

## Architecture Quick Reference

- **Frontend:** React 18 + TypeScript 5
- **Styling:** Tailwind CSS, custom gradients, dark-mode by default
- **Build Tooling:** Vite, PostCSS, ESBuild, Workbox (for service worker)
- **Crypto Utilities:** Web Crypto API, BIP39 (recovery phrases), custom vault manager
- **State & Hooks:** Local React state, custom hooks for timers and auto-lock
- **Storage Surface:** IndexedDB & LocalStorage for metadata, File System Access API (desktop) for vault backups

## Security Model

| Capability | Implementation |
|------------|----------------|
| Vault encryption | AES-256-GCM with random IVs |
| Key derivation | PBKDF2 (600,000 iterations, SHA-256) |
| Recovery phrase | 12-word BIP39 mnemonic → SHA-256 derived key (`EnigmaKeep-Recovery-Salt`) |
| Biometric unlock | WebAuthn resident credential stored in device secure enclave |
| Auto-lock | Configurable inactivity timer + clipboard purge |

**Zero Knowledge:** The application never sends secrets over the network. All cryptographic operations occur inside the browser. If users lose their master password and recovery phrase, data is unrecoverable by design.

## Core Workflows

### Vault Creation
1. User supplies a master password (minimum strength enforced).
2. App generates a 12-word BIP39 recovery phrase.
3. User must copy or download the phrase (`EnigmaKeep-Recovery-Phrase.txt`) and verify random words.
4. Vault metadata is initialized and encrypted locally.

### Vault Unlock
1. Master password is provided or biometric credential is asserted.
2. Derived key decrypts vault; decrypted contents live only in memory.
3. Clipboard operations auto-clear based on preference settings.

### Regenerate Recovery Phrase
1. User enters master password to confirm access.
2. New BIP39 phrase is generated; old phrase is invalidated once verified.
3. Updated hash is stored inside the encrypted vault payload.

### Import / Export
- Imports support CSV and JSON formats from popular managers. Imported entries are normalized before encryption.
- Export produces an encrypted `.enc` vault file and optional CSV (user-controlled).

## PWA & Installation Notes

- Service worker precaches static assets; vault data is never cached.
- Install prompt is shown when the browser exposes `beforeinstallprompt`.
- On desktop Chrome/Edge the File System Access API allows seamless backup saving.
- Mobile browsers fallback to manual export downloads.

### Manual Installation

```bash
git clone https://github.com/hmalvee/EnigmaKeep.git
cd EnigmaKeep
npm install
npm run dev         # local development
npm run build       # production bundle
npm run preview     # preview the production build
```

Deploy the contents of `dist/` to any static host (Netlify, GitHub Pages, Vercel, etc.).

## UI Map

- `LandingPage` – marketing site, CTA to `/app`
- `LoginScreen` – master password entry, biometric prompt, recovery flow
- `CreateVaultFlow` – guided onboarding + recovery phrase confirmation
- `VaultSettings` – tabs for general settings, security, backups
- `PasswordEntry` & `NotesList` – main vault content views
- `TotpList` – TOTP token manager with QR import
- `PwaInstallModal` – per-platform installation instructions

## Testing & Quality

- **Linting:** `npm run lint`
- **Type checking:** `npm run typecheck`
- **Unit/Integration tests:** add under `src/__tests__` (Jest/Vitest recommended). _Note: current project has limited automated test coverage; contributions welcome._
- **Manual QA checklist:**
  - Create → lock → unlock → regenerate recovery phrase
  - Import CSV from Bitwarden, confirm normalization
  - Enable biometric unlock (desktop Windows Hello / macOS Touch ID)
  - Install PWA, verify offline mode, relaunch while offline
  - Generate TOTP code and confirm countdown accuracy

## Contribution Guide

1. Fork the repository and create a feature branch.
2. Keep brand references consistent (`EnigmaKeep`) and update marketing copy if flows change.
3. Maintain accessibility: keyboard navigation, focus states, ARIA labels on modals.
4. For crypto changes, include clear reasoning and references.
5. Submit PRs against `main` with screenshots/GIFs for UI updates.

## Support & Feedback

- **Issues:** https://github.com/hmalvee/EnigmaKeep/issues  
- **Discussions:** https://github.com/hmalvee/EnigmaKeep/discussions  
- **Security disclosures:** email listed on the maintainer’s GitHub profile  

Please avoid submitting the recovery phrase or encrypted vault file in public channels. If you encounter a security bug, disclose privately first.

---

**EnigmaKeep** – Your Digital Fortress. Built to keep secrets offline, forever.

