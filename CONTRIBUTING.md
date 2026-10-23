# Contributing to EnigmaKeep

Thanks for helping. EnigmaKeep protects people's secrets, so the bar for changes that touch cryptography or vault data is higher than for most projects. The rest is ordinary open-source work.

## Setting up

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Pull requests

Branch from `main` and keep each pull request to one change. Describe what changed and why, and include screenshots for UI changes. Say so explicitly in the pull request if your change sends anything off the device, touches recovery, or adds a dependency.

Changes to `src/crypto/`, the vault format or any recovery path also need:

- tests that fail without the change and pass with it;
- an explanation in the pull request of the construction and the threat it addresses, in plain words;
- confirmation that existing vault files still open (old formats are read-only, never dropped);
- a plain-language note of how the security properties change, if they do.

We don't merge new cryptographic primitives or home-made constructions. Use WebCrypto or a well-reviewed library, and expect questions.

## Writing

Write docs, UI text and comments in plain language. Describe what the code protects against and what it doesn't. Avoid claims such as "military grade" or "unbreakable"; reviewers will ask you to remove them.

## Security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md). Never paste recovery phrases, Secret Keys, guardian cards or vault files anywhere public, including test fixtures.

## Licence

By contributing you agree that your work is released under the licence of the directory it lands in: [MIT](src/crypto/LICENSE) for `src/crypto/`, [AGPL-3.0-or-later](LICENSE) for everything else (see [LICENSING.md](LICENSING.md)).
