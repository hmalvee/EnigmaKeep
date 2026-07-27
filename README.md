# EnigmaKeep

Offline, zero-knowledge password manager. Your vault stays on your device — no accounts, no cloud sync, no telemetry.

**Maintainer:** [HM Alvee Hasan (@hmalvee)](https://github.com/hmalvee)  
**Homepage:** [enigmakeep.com](https://enigmakeep.com/)  
**Repository:** [github.com/hmalvee/EnigmaKeep](https://github.com/hmalvee/EnigmaKeep)  
**License:** MIT

## Features

- **Offline-first** — no servers; nothing leaves the browser
- **AES-256-GCM vault encryption** with PBKDF2 (600k iterations)
- **Opaque binary vault files** (`.dat`) — high-entropy ciphertext only; no plaintext metadata banners
- **Encrypted file manager** — folders, upload, preview, and edit inside the vault
- **Biometric unlock** via WebAuthn / platform authenticators
- **12-word BIP39 recovery phrase** with derived recovery key
- **Built-in TOTP authenticator**, secure notes, categories
- **Password generator** and strength meter
- **Import / export** for common password managers (CSV / JSON)
- **PWA** install for desktop and mobile
- **Local encrypted snapshots** for recovery if a save fails
- **Auto-lock**, unlock backoff, and secure clipboard clearing

## Stack

| Area | Choice |
|------|--------|
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build | Vite + vite-plugin-pwa |
| Crypto | Web Crypto API, BIP39 |
| Storage | File System Access API, IndexedDB |

## Security model

| Capability | Implementation |
|------------|----------------|
| Vault encryption | AES-256-GCM with random IVs |
| Key derivation | PBKDF2 (600,000 iterations, SHA-256) |
| Vault format | Opaque binary container (legacy formats still readable) |
| Recovery phrase | BIP39 mnemonic → derived encryption password |
| Biometric unlock | WebAuthn; wrapped credential, not a plaintext password cache |
| Auto-lock | Inactivity timer + clipboard purge |

**Zero knowledge:** All crypto runs in the browser. If the master password and recovery phrase are lost, the vault cannot be recovered by anyone — including the developer.

## Quick start

```bash
git clone https://github.com/hmalvee/EnigmaKeep.git
cd EnigmaKeep
npm install
npm run dev       # local development
npm run build     # production bundle
npm run preview   # preview production build
```

Deploy the contents of `dist/` to any static host (Netlify, GitHub Pages, Vercel, etc.).

## Core workflows

### Create a vault
1. Choose a strong master password (minimum length enforced).
2. Save the 12-word recovery phrase offline and verify it.
3. Save the encrypted vault file when prompted (File System Access API on supported browsers).

### Unlock
1. Enter the master password, or use biometrics when enabled.
2. Decrypted data lives only in memory for the session.
3. Lock or idle timeout clears session secrets.

### Files inside the vault
Use the built-in file manager to store encrypted files and folders alongside passwords and notes. Large vaults use a raw binary save path to avoid encoding blow-up.

### Recovery
Unlock with the recovery phrase if the master password is forgotten. Regenerating the phrase invalidates the previous one after verification.

## Project map

- `src/pages/LandingPage.tsx` — marketing site
- `src/App.tsx` — unlocked vault shell
- `src/crypto/` — encryption, vault format, recovery, device binding
- `src/utils/vaultManager.ts` — save / load / verify
- `src/components/FileExplorer.tsx` — encrypted file manager
- `src/components/LoginScreen.tsx` — unlock, biometric, snapshot restore

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Contributing

1. Fork and branch from `main`.
2. Keep branding consistent (`EnigmaKeep`).
3. Prefer accessible UI (keyboard, focus, ARIA on modals).
4. Document crypto changes clearly in the PR.
5. Open a PR against `main` with UI screenshots when relevant.

## Support

- **Issues:** https://github.com/hmalvee/EnigmaKeep/issues  
- **Discussions:** https://github.com/hmalvee/EnigmaKeep/discussions  
- **Security:** contact via the maintainer’s [GitHub profile](https://github.com/hmalvee)

Never paste recovery phrases or vault files into public issues.

---

**EnigmaKeep** — offline secrets, under your control.
