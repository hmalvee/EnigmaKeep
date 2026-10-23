# Changelog

All notable changes to EnigmaKeep. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] – 2026-10-23

### Added
- **Secret Key.** A 128-bit key kept on your devices is mixed into the vault key (HKDF), so a stolen vault file cannot be brute-forced from the master password alone. New devices scan it from the printed Emergency Kit.
- **Biometric unlock** through WebAuthn PRF: the key that wraps the master password only exists after the device's authenticator verifies you.
- **Guardian recovery.** Trusted people hold shares of a seed; a quorum plus the vault file plus a minimum delay of sequential computation (an RSW time-lock puzzle) are needed to recover, so the owner has time to notice and cancel. The recovery copy is refreshed on every save, and the owner can reset the delay without issuing new cards.
- **Graded delay for guardian recovery.** The delay can depend on how many guardians cooperate, for example 2 of 5 wait 30 days, 3 wait 7 days, all 5 wait 1 day. Each tier is an independent sharing and puzzle, so a smaller group cannot borrow a larger group's shorter wait.
- **Puzzle replaced on every save.** A finished recovery opens only the version of the file it started from, never anything saved since; guardian cards stay valid. Can be turned off in the guardian settings.
- **Decoy vault with a duress password.** A second password opens a harmless decoy vault from the same file; the real vault moves into the file's padding region, sealed behind key wraps for the master password and Secret Key, the recovery phrase and each guardian tier. Every vault file carries a random padding region (at least 1 MiB), so a file with a hidden vault cannot be told apart from one without. Saves from inside the decoy keep the hidden vault intact and saves of the real vault keep the decoy intact.
- **Rollback detection.** Every save stamps the vault with a counter and a random id inside the ciphertext, and each device keeps an encrypted record of the newest version it has seen. Opening an older file, or a different file claiming the same version, shows a warning first.
- **Device benchmark page** at `/bench`: measures how fast this device performs the sequential squarings guardian recovery needs and shows what a 1-, 7- or 30-day delay would take here. Nothing is sent anywhere.
- **Forgot password** flow on the unlock screen: reset with the recovery phrase or recover with guardian cards.
- **Local encrypted snapshots** of the vault, and **download mode** for browsers without the File System Access API (Firefox, Safari).
- Secure notes, an encrypted file manager with folders and previews, TOTP import/export, and importers for 1Password, Bitwarden, LastPass, Chrome, CSV and JSON.
- Redesigned vault, settings (General, Security, Recovery, Backup & export) and create-vault screens; mobile layout.
- Changelog, licensing guide, contributing guide and security policy.

### Changed
- Vault file format is now a header-less sequence of authenticated ciphertext blocks followed by random padding, with no readable metadata; files from 1.0 still open and receive the padding on their next save.
- Licence split: the application is AGPL-3.0-or-later; `src/crypto/` is MIT so other projects can reuse the cryptography.
- Stricter production Content Security Policy and cache headers; the service worker only caches same-origin files.
- Locking returns to the Passwords view.

### Security
- Generated passwords now come from the system CSPRNG (`crypto.getRandomValues`) instead of `Math.random`.
- Changing the master password also replaces the guardian puzzle, so someone who opened the vault once cannot skip the delay later.
- Every edit is written to disk before the screen updates; a failed save is reported instead of silently lost.
- Imported JSON, Bitwarden and 2FA files are validated field by field; otpauth URIs are validated before use.
- Unlock back-off survives new tabs and cannot be bypassed by parallel attempts.
- Dependency audit: runtime vulnerabilities resolved.

### Known limits
- Deniability is for a single copy of the file: someone who compares versions over time can see that the padding changes only when the hidden vault is saved.
- Rollback detection is per device; a device that never saw the newer version cannot notice the rollback, and clearing the browser's storage clears the record.

## [1.0.0] – 2026-07-27

- First public release: AES-256-GCM vault with PBKDF2-SHA-256 (600,000 iterations), 12-word recovery phrase, password generator and strength meter, TOTP codes, PWA install and offline use.
