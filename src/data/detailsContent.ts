export interface DetailSection {
  heading: string;
  body: string[];
}

export interface DetailArticle {
  slug: string;
  title: string;
  description: string;
  readingTime: string;
  intro: string;
  sections: DetailSection[];
}

export const detailArticles: DetailArticle[] = [
  {
    slug: 'best-offline-password-managers-2026',
    title: 'Best Offline Password Managers in 2026: Honest Comparison',
    description:
      'Best offline password managers in 2026 — honest comparison of EnigmaKeep, KeePassXC, KeePass, Bitwarden self-hosted, Vaultwarden, 1Password standalone, Enpass, and RoboForm. Offline model, platforms, open source, encryption, price, who each one fits.',
    readingTime: '16 min read',
    intro:
      'An offline password manager keeps your encrypted vault on your own device instead of a provider\'s cloud, which removes an entire class of risk — the vendor-infrastructure breach that leaked millions of LastPass vaults in 2022-2023 — and gives you direct control over encryption, storage, and recovery. This 2026 guide compares the eight offline-first options worth considering today — EnigmaKeep, KeePassXC, KeePass, Bitwarden (self-hosted), Vaultwarden, 1Password (standalone), Enpass, and RoboForm — on offline model, supported platforms, open-source status, encryption, price, and the kind of user each one fits. No sponsored rankings, no fake five-star ratings, no "best overall" award that was really just the highest commission.',
    sections: [
      {
        heading: 'What "offline" actually means (and the three flavors)',
        body: [
          'Nearly every password manager marketed as "offline" fits one of three patterns. Fully offline tools, like EnigmaKeep and KeePassXC, store the entire vault as a file on your device and have no server component at all. Self-hostable tools, like Bitwarden, run on infrastructure you control — your home server, a cheap VPS, or a Raspberry Pi — so the data is "off their cloud" but still on a server. And optional-sync tools, like 1Password in standalone mode or Proton Pass with local export, can be used without their cloud but are not designed around that mode.',
          'Which flavor you want depends on what you are optimizing for. "No server at all" minimizes attack surface and removes the trust problem entirely. "Self-hosted" keeps multi-device sync and sharing while removing the third-party provider. "Standalone mode of a cloud tool" is a compromise that works until you want to use the product as its vendor intends. Picking the right flavor is more important than picking the right brand within a flavor.',
        ],
      },
      {
        heading: 'The eight options at a glance',
        body: [
          'Below is a scannable comparison of the eight products. Every claim is a factual statement about the product as of October 2026; verify with each project\'s own documentation before committing. "Zero-knowledge" means the vault key is derived on the device and the provider has no technical ability to decrypt your data. "Fully offline" means no network traffic is required to read or write the vault. "Open source" means the full client source is published under an OSI-approved license.',
          'EnigmaKeep — Offline model: fully offline PWA, no server. Platforms: Web, Android, iOS, Windows, macOS, Linux. License: AGPL-3.0 app, MIT cryptography (open source). Encryption: AES-256-GCM with PBKDF2-SHA256 at 600,000 iterations. Price: free. Best for: single-user privacy-first users who want zero coordination between devices.',
          'KeePassXC — Offline model: fully offline native desktop. Platforms: Windows, macOS, Linux (community mobile forks: KeePassium on iOS, KeePassDX on Android). License: GPL v2/v3 (open source). Encryption: AES-256 or ChaCha20 with Argon2id. Price: free. Best for: Linux power users and anyone who prefers a native app over a browser PWA.',
          'KeePass (classic) — Offline model: fully offline native .NET desktop. Platforms: Windows (Mono on macOS and Linux). License: GPL v2 (open source). Encryption: AES-256 or ChaCha20 with Argon2d. Price: free. Best for: the original KDBX ecosystem on Windows, with the deepest third-party plugin and client support.',
          'Bitwarden (self-hosted) — Offline model: zero-knowledge, self-hosted server you run. Platforms: Windows, macOS, Linux, iOS, Android, browser extensions. License: GPL v3 for clients, AGPL v3 for server (open source). Encryption: AES-256-CBC with HMAC-SHA256 and PBKDF2 at 600,000 iterations (or Argon2id). Price: free self-hosted. Best for: family or team sharing with full official clients and your own server.',
          'Vaultwarden — Offline model: lightweight unofficial Rust reimplementation of the Bitwarden server, fully compatible with every official Bitwarden client. Platforms: runs anywhere Docker runs (home server, Raspberry Pi, VPS). License: GPL v3 (open source). Encryption: inherits Bitwarden\'s client-side AES-256-CBC + HMAC + PBKDF2. Price: free. Best for: home-lab self-hosters who want Bitwarden without the full Bitwarden server stack.',
          '1Password (standalone) — Offline model: legacy standalone .opvault files, synced via a folder you move yourself. Platforms: Windows, macOS, iOS, Android. License: closed source. Encryption: AES-256-GCM, Secret Key plus master password. Price: paid. Best for: existing 1Password users who are not ready for the subscription cloud product and accept that this path is a dead-end.',
          'Enpass — Offline model: local-first by default, with optional sync via a cloud folder you choose (iCloud, Google Drive, Dropbox, OneDrive, WebDAV). Platforms: Windows, macOS, Linux, iOS, Android. License: closed source. Encryption: AES-256 with PBKDF2 or Argon2. Price: desktop free, mobile free up to 25 items, otherwise paid. Best for: users who want a polished native app with bring-your-own-cloud sync instead of vendor sync.',
          'RoboForm — Offline model: cloud-sync by default with strong offline access to the cached vault; mostly-offline posture is supported but not the design target. Platforms: Windows, macOS, iOS, Android, browser extensions. License: closed source. Encryption: AES-256 with PBKDF2. Price: roughly $0.99 per month on an annual plan. Best for: form-fill-heavy workflows at a lower price than 1Password or Dashlane.',
        ],
      },
      {
        heading: 'How we evaluated these eight',
        body: [
          'Four binary tests qualify a product for this list. First, can you use the vault with network access completely disabled? Second, is the encryption key derived on your device rather than on a server? Third, is at least some meaningful recovery path available if you lose the device? Fourth, is there a way to inspect what the product actually does — open source, a published audit, or a documented threat model?',
          'All eight products on this list pass tests one and two. EnigmaKeep, KeePassXC, KeePass, Bitwarden, and Vaultwarden also pass test four with full source availability. 1Password standalone, Enpass, and RoboForm pass tests one and two but are closed source, so you take the implementation on trust. The ordering within the list is not a quality ranking — it is grouped by architecture (PWA, native desktop, self-hosted server, legacy standalone, local-first-with-sync) so you can pick the shape that fits your situation first and then the brand within that shape.',
        ],
      },
      {
        heading: 'EnigmaKeep — who it is for',
        body: [
          'EnigmaKeep is built for one person on their devices, with no team sharing, no SSO, and no sync. It is a Progressive Web App, which means you install it once from the browser and it runs locally forever after; the service worker caches the code, and after the first load there is no network traffic for using the vault. Encryption is AES-256-GCM, keys come from PBKDF2-SHA256 with 600,000 iterations, and the vault exports as an opaque binary .dat file with no magic bytes or metadata that would identify its format to a casual observer.',
          'The honest limitations: it is single-user, so there is no shared vault for a family or team. There is no autofill browser extension today, so you copy passwords out of the vault manually. Multi-device use means exporting the vault file and moving it yourself — there is no sync. If any of those are deal-breakers, pick something else; if they are features for you ("I want zero coordinate surface between my devices"), EnigmaKeep is a close fit.',
          'Pick EnigmaKeep if: you want a zero-knowledge, zero-account, zero-server tool that works everywhere a modern browser works, and you are willing to manage your own vault file like you would any other important document.',
        ],
      },
      {
        heading: 'KeePassXC — who it is for',
        body: [
          'KeePassXC has been the de facto standard for offline password management on Linux for a decade and remains the strongest option for anyone who wants a native desktop application they can audit, package themselves, and extend. The database format (.kdbx) is interoperable across every KeePass-family tool, including the community mobile apps KeePassium (iOS) and KeePassDX (Android), so you keep options open if the main project ever changes direction.',
          'The honest limitations: there is no official mobile app, so you depend on third-party forks for phones. The browser-integration extension works but requires the desktop app running to serve autofill. On very low-end Windows, startup can be slow. The default UI is functional and not particularly polished, which some people love and some find off-putting.',
          'Pick KeePassXC if: you live on a desktop OS, you prefer a native app over a PWA, you want a battle-tested on-disk format with multiple interoperable implementations, and you are comfortable choosing a trusted community mobile client for your phone.',
        ],
      },
      {
        heading: 'KeePass (classic) — who it is for',
        body: [
          'KeePass is the original offline password manager, a Windows-first .NET project from 2003 that defined the .kdbx vault format every KeePass-family tool reads today. On Linux and macOS it runs through Mono, which works but feels dated. On mobile you reach it through third-party clients that share the KDBX format — KeePassium on iOS, KeePassDX on Android, Strongbox on Apple platforms. The file you create in KeePass today will open in any of them tomorrow.',
          'The honest limitations: the native UI is dated and Windows-first in look and feel. On non-Windows platforms it is slower and less polished than KeePassXC. The plugin ecosystem is extensive but inconsistently maintained — some plugins are abandoned.',
          'Pick KeePass if: you specifically want the original implementation on Windows, you need the maximum breadth of plugins and third-party clients that read the .kdbx format, or you are moving an existing KeePass workflow forward without changing tools.',
        ],
      },
      {
        heading: 'Bitwarden self-hosted — who it is for',
        body: [
          'Bitwarden is the best option when you need a password manager with full official mobile apps, browser extensions, autofill, team sharing, and a web vault, but you do not trust the vendor-run cloud with your data. Self-hosting runs the Bitwarden server (or Vaultwarden, the much lighter unofficial Rust reimplementation) on your own infrastructure — a VPS, a NAS, a Raspberry Pi — behind HTTPS. Clients then point at your server instead of bitwarden.com, and you keep every piece of the official product experience minus the vendor dependency.',
          'The honest limitations: you have to run and secure a server. That means TLS certificates, backups, security updates, and some basic sysadmin ongoing. Vaultwarden lowers the operational cost significantly but is still a server. For a solo user who does not already run infrastructure, this is more operational burden than it is worth; for someone who already maintains a home lab, it is close to zero marginal effort.',
          'Pick Bitwarden self-hosted if: you need official mobile and browser-extension support, you want shared vaults for family or team, and you already run (or want to learn to run) a small server anyway.',
        ],
      },
      {
        heading: 'Vaultwarden — who it is for',
        body: [
          'Vaultwarden is a lightweight unofficial Rust reimplementation of the Bitwarden server, developed by the community. It speaks the Bitwarden wire protocol, so every official Bitwarden client — desktop, mobile, browser extension, CLI — connects to it as if it were a Bitwarden server. The appeal is operational: Vaultwarden runs in a single ~15 MB Docker image, needs less than 100 MB of RAM, and starts in a second. The full Bitwarden server stack, by contrast, is several containers and heavier infrastructure.',
          'The honest limitations: unofficial, so you depend on the maintainer and the community for parity with upstream Bitwarden. Some enterprise features (SSO, SCIM) are not implemented or work differently.',
          'Pick Vaultwarden if: you want Bitwarden-grade clients and features without running the full Bitwarden server, you already have a home server or Raspberry Pi, and you are comfortable with a lightly maintained community server as the trade for operational simplicity.',
        ],
      },
      {
        heading: '1Password standalone — who it is for',
        body: [
          '1Password has the best UX in the category by a comfortable margin. The modern product is subscription-only and cloud-based, which disqualifies it from this list, but 1Password 7 standalone (and its .opvault format) can still be used without an account, syncing a local file across your devices through iCloud Drive, Dropbox, or a plain folder you move around. This is not the mode the company sells, and over time it will be increasingly inconvenient as 1Password 7 ages out of support.',
          'The honest limitations: closed source, so you take the security model on trust. Standalone mode is a legacy feature kept alive but not developed. On a long enough timeline this path dead-ends and you will need to migrate.',
          'Pick 1Password standalone if: you are already invested in the 1Password ecosystem, you want the polished UX and are willing to pay for it, and you accept that your long-term direction will probably involve migrating to the cloud product or to another tool.',
        ],
      },
      {
        heading: 'Enpass — who it is for',
        body: [
          'Enpass is a cross-platform password manager that defaults to local-only storage with optional sync through a cloud folder you choose yourself — iCloud, Google Drive, Dropbox, OneDrive, or any WebDAV endpoint — rather than through Enpass\'s own servers. "Offline" here means the vault lives as a local file on each device; if you want sync, you point Enpass at a sync folder you control. The desktop apps are free; the mobile app caps the free tier at 25 items and asks for a subscription above that.',
          'The honest limitations: closed source, so you take the implementation on trust. The mobile free-tier cap is restrictive enough that most multi-device users will end up paying. The bring-your-own-cloud sync model is less private than a fully offline tool but more private than a vendor-hosted vault.',
          'Pick Enpass if: you want a polished native app that works offline by default, you are comfortable with closed-source trust in exchange for UX, and the bring-your-own-cloud sync pattern matches how you already share files between your devices.',
        ],
      },
      {
        heading: 'RoboForm — who it is for',
        body: [
          'RoboForm is primarily a cloud-sync password manager with unusually strong offline access to the cached vault. It is on this list because the cached-offline experience is more complete than most cloud managers — you can read, add, and edit entries without network access and let them sync up later. Form-fill is RoboForm\'s historical strength and remains the deepest in the category, with handling for complex multi-step checkouts and job-application forms that lesser tools miss. Pricing is lower than 1Password or Dashlane at roughly $0.99 per month on an annual plan.',
          'The honest limitations: closed source. The default model is cloud-sync, not offline-only; you can use it in a mostly-offline posture, but it is designed around sync and the vendor holds encrypted vaults by default. If vendor-held encrypted vaults are a dealbreaker, RoboForm is not the tool.',
          'Pick RoboForm if: you have form-fill-heavy workflows and want cheap pricing with cloud sync, and "offline" means "works when the plane doesn\'t have Wi-Fi" rather than "nothing ever reaches a server."',
        ],
      },
      {
        heading: 'Proton Pass (honorable mention)',
        body: [
          'Proton Pass is a cloud-first zero-knowledge manager from the Proton Mail company, with open source clients and strong aliasing integration via SimpleLogin. "Local" here is a stretch: the product is designed around the Proton account and sync, and the only sense in which it is offline is that encryption happens client-side and you can periodically export an encrypted archive. It belongs on this list only because people searching for "offline password manager" often actually want "zero-knowledge, not on US servers," which Proton provides.',
          'The honest limitations: there is no supported way to use the product without the Proton cloud. If you want a vault file you own and control, this is not the tool.',
          'Pick Proton Pass if: your real requirement was zero-knowledge rather than fully offline, and you prefer the Proton ecosystem to large US cloud providers.',
        ],
      },
      {
        heading: 'How to actually choose',
        body: [
          'Think about three questions in order. First, how many people and devices does this need to serve? If one person on one or two devices, EnigmaKeep and KeePassXC are both correct answers. If a household or a team, Bitwarden self-hosted is almost certainly the right choice. Second, do you want a server at all? If no, pick between EnigmaKeep (PWA, mobile-friendly) and KeePassXC (native desktop). If yes, pick Bitwarden self-hosted. Third, how much are you willing to pay? Every option on this list except 1Password standalone is free; if that budget constraint is firm, 1Password is out.',
          'Everything else — exact crypto parameters, UI polish, specific features — is a tiebreaker, not the decision. All five options on this list use industry-standard authenticated encryption with modern key derivation, so you will not meaningfully improve or worsen your security by picking one over another. The real variable is whether the tool fits your life well enough that you actually use it consistently.',
        ],
      },
      {
        heading: 'A note on the stars-and-ratings SEO problem',
        body: [
          'If you spent any time comparing password managers on review sites, you have seen pages full of 5-star ratings for products the author probably has not used. We are not going to do that. There are no ratings in this comparison because ratings between fundamentally different tools (a solo PWA vs. a self-hosted server vs. a cloud SaaS) are not meaningful — they would compare apples to a bicycle. What matters is whether a tool\'s shape matches your situation; the sections above are written to answer that.',
          'If you want third-party validation, read each project\'s GitHub issues, security disclosures, and community forum. Those are the ground truth. A sponsored "best of" article is marketing.',
        ],
      },
      {
        heading: 'FAQ — offline password managers',
        body: [
          'What is an offline password manager? An offline password manager stores your encrypted vault as a file on your own device, with no server, no account, and no cloud sync required to read or write it. The master password unlocks the file locally; the plaintext never travels anywhere.',
          'Are offline password managers safer than cloud-based ones? They remove one entire class of risk — the vendor-infrastructure breach that leaked LastPass vaults in 2022-2023 — and replace it with a different responsibility: you are now in charge of backups and recovery. For most privacy-conscious individuals, that trade favours offline.',
          'Can I sync passwords across devices using an offline manager? Yes, but you handle the sync yourself — file-sync tools like Syncthing or iCloud Drive, a USB stick, or the WebDAV/Nextcloud pattern that KeePassXC and Enpass both support. There is no built-in vendor cloud sync by design.',
          'What happens if I lose my offline password vault? If you kept a backup, you restore from the backup. If you kept a recovery phrase — EnigmaKeep issues a 12-word BIP39 phrase at setup, and KeePassXC supports a key file alongside the master password — you restore from that. If you kept neither, the vault is unrecoverable. That is the honest cost of true zero-knowledge encryption.',
          'Which offline password manager is best for beginners? EnigmaKeep for a browser-native single-user experience that installs in a minute; Bitwarden self-hosted (ideally via Vaultwarden on a home server or Raspberry Pi) if you want polished mobile apps and family sharing. KeePassXC is excellent but has a steeper learning curve and no official mobile app.',
          'Can I use an offline password manager on mobile? Yes. EnigmaKeep installs as a PWA on iOS and Android. KeePassium (iOS) and KeePassDX (Android) are KeePass-format mobile clients that open your KDBX file directly. Bitwarden and Vaultwarden have full native mobile apps. Enpass and RoboForm both ship native apps.',
          'Who should use an offline password manager? Anyone whose threat model includes "the vendor gets breached" or "I prefer not to trust a company with my credentials," plus anyone operating in environments where internet access is unreliable — travel, rural areas, air-gapped workflows, or compliance regimes that forbid cloud storage of credentials.',
        ],
      },
      {
        heading: 'Where to go from here',
        body: [
          'If you want to try EnigmaKeep, you can open it directly in your browser — there is nothing to install besides the PWA, and your vault stays on your device from the first keystroke. There is no account to create and no email to give. Our guides on zero-knowledge encryption, recovery phrases, and two-factor authentication go into more detail on how the pieces work under the hood.',
          'If any of the other tools on this list fit your situation better, use them. The important thing is that you move off reused passwords in a browser, not which specific tool you move to. A good password manager you actually use beats the "best" one you never install.',
        ],
      },
    ],
  },
  {
    slug: 'password-security-guide',
    title: 'Password Security: A Practical Guide',
    description:
      'A practical, no-hype guide to building strong passwords, avoiding reuse, and understanding what actually keeps your accounts safe.',
    readingTime: '7 min read',
    intro:
      'Most account breaches do not begin with someone cracking encryption. They begin with a password that was weak, reused, or already exposed in an earlier leak. Understanding why some passwords hold up and others fall apart is the first step toward taking your own security seriously. This guide walks through the practical decisions that matter, without the marketing language that usually surrounds the topic. The goal is simple: help you build habits that make your accounts genuinely harder to compromise, using tools like a password manager to remove the friction that used to make good habits impractical.',
    sections: [
      {
        heading: 'Why length beats complexity',
        body: [
          'For years, people were told to build passwords out of a jumble of symbols, numbers, and mixed case. The result was passwords that were hard for humans to remember but not especially hard for computers to guess. Modern guidance from bodies such as NIST has shifted toward a simpler principle: length is the single most important factor in resisting a brute-force attack.',
          'A longer passphrase made of several unrelated words is easier to recall and can be far stronger than a short string of random symbols. The reason is mathematical. Each additional character multiplies the number of possible combinations an attacker must try. A password manager lets you sidestep this trade-off entirely by generating and storing long, random values you never need to memorize.',
        ],
      },
      {
        heading: 'The real danger of reuse',
        body: [
          'When the same password protects several accounts, a single breach anywhere puts all of them at risk. Attackers take username and password pairs leaked from one site and try them automatically across banks, email providers, and social networks. This technique, called credential stuffing, is cheap, automated, and effective precisely because reuse is so common.',
          'The fix is to use a unique password for every account. That is impossible to do by memory across dozens of logins, which is exactly the problem a password manager solves. It generates a distinct credential for each site and remembers all of them for you, so a leak in one place cannot cascade into others.',
        ],
      },
      {
        heading: 'Recognizing exposed passwords',
        body: [
          'Billions of credentials have appeared in public data breaches over the years. If a password you use has been part of one of these dumps, attackers already have it on a list, no guessing required. This is why security professionals treat any previously breached password as compromised, regardless of how complex it looks.',
          'Treat every password as single-use and disposable. When you learn a service you use has been breached, change that password immediately, and change it anywhere else you might have reused it. A manager that stores one unique password per site keeps the blast radius of any single breach contained to that one account.',
        ],
      },
      {
        heading: 'Where password managers fit in',
        body: [
          'A password manager exists to remove the tension between security and convenience. Instead of remembering many strong passwords, you remember one master password that unlocks an encrypted vault. Everything inside is generated to be long and random, and filled in for you when you need it.',
          'EnigmaKeep takes this a step further by keeping the entire vault on your own device. There is no account to create and no server that holds your data. Your vault is encrypted locally with AES-256-GCM, and the key is derived from your master password using PBKDF2-SHA256 with 600,000 iterations, so the effort required to attack it stays high even if the encrypted file is somehow obtained.',
        ],
      },
      {
        heading: 'Layering defenses beyond the password',
        body: [
          'A strong, unique password is the foundation, but it should not be the only lock on the door. Two-factor authentication adds a second requirement that an attacker cannot satisfy with a stolen password alone. Even if your password leaks, the second factor stands in the way.',
          'EnigmaKeep includes a built-in authenticator that generates time-based one-time codes, so your second factor lives in the same encrypted vault as your passwords. Combined with biometric unlock through WebAuthn on supported devices, you get quick access for yourself while keeping the barrier high for everyone else.',
        ],
      },
      {
        heading: 'Building habits that last',
        body: [
          'Good security is less about a single heroic effort and more about small habits repeated consistently. Generate a unique password whenever you sign up for something new. Turn on two-factor authentication where it is offered. Review your vault occasionally and update anything old or reused.',
          'Because these steps take seconds once a manager handles the heavy lifting, they are easy to keep up over time. Security that fits into your routine is security you will actually maintain, and that consistency is what protects you far more than any single clever trick.',
        ],
      },
    ],
  },
  {
    slug: 'zero-knowledge-encryption',
    title: 'How Zero-Knowledge Encryption Works',
    description:
      'Understand zero-knowledge encryption: client-side AES-256-GCM, PBKDF2 key derivation, salts and IVs, and why a provider never sees your data.',
    readingTime: '8 min read',
    intro:
      'The phrase "zero-knowledge" describes a straightforward promise: the service that helps you store your data has no ability to read it. All encryption and decryption happen on your device, using a key that only you hold. The provider stores or transmits nothing but scrambled bytes, and never possesses the means to unscramble them. This article explains the mechanics behind that promise, using EnigmaKeep as a concrete example. Understanding how the pieces fit together helps you judge for yourself whether a claim of privacy is real or just a slogan.',
    sections: [
      {
        heading: 'What zero-knowledge actually means',
        body: [
          'In a zero-knowledge system, your data is encrypted before it ever leaves your control, and the key needed to decrypt it never leaves either. The provider might hold a copy of the encrypted blob, but without the key that blob is meaningless. Crucially, the key is never uploaded, never escrowed, and never recoverable by the provider.',
          'EnigmaKeep is stricter still. Because it is fully offline with no servers and no account, there is no provider holding your encrypted data at all. Everything lives on your device. The zero-knowledge principle is satisfied by design: there is simply no other party in the picture who could learn anything about your vault.',
        ],
      },
      {
        heading: 'Deriving a key from your master password',
        body: [
          'A master password is something a human can remember, but a raw password makes a weak encryption key. Attackers can guess common passwords quickly, so a system must make each guess expensive. This is the job of a key derivation function.',
          'EnigmaKeep uses PBKDF2 with SHA-256 and 600,000 iterations. That means turning your master password into an encryption key requires running the hashing process 600,000 times. For you, unlocking once, this delay is imperceptible. For an attacker trying to guess billions of passwords, the same cost is multiplied across every attempt, making large-scale guessing dramatically slower and more expensive.',
        ],
      },
      {
        heading: 'The role of salts',
        body: [
          'A salt is a random value combined with your password before the key derivation runs. Its purpose is to make sure that two people with the same password do not end up with the same derived key, and to defeat precomputed lookup tables that attackers build in advance.',
          'Because each vault uses its own unique salt, an attacker cannot prepare a single table of results and reuse it against many vaults. They would have to redo the full, deliberately slow derivation for every guess against every individual vault. The salt is not secret, but its randomness forces the attacker to do the expensive work from scratch every time.',
        ],
      },
      {
        heading: 'AES-256-GCM and the initialization vector',
        body: [
          'Once a key is derived, EnigmaKeep encrypts your vault with AES-256-GCM. AES-256 is a widely trusted, standardized cipher, and the GCM mode adds authentication: it does not just scramble the data, it also produces a tag that detects any tampering. If even a single byte of the ciphertext is altered, decryption fails rather than silently returning corrupted data.',
          'GCM requires a unique initialization vector, or IV, for each encryption operation. The IV ensures that encrypting the same data twice does not produce the same output, which would otherwise leak information about what changed. A fresh random IV is used each time the vault is written, keeping the ciphertext unpredictable.',
        ],
      },
      {
        heading: 'Why the provider never sees your data',
        body: [
          'Put the pieces together and the guarantee becomes clear. Your master password never leaves your device. The derived key is computed locally and used locally. The vault is encrypted locally before it is stored. At no point does readable data or the key to produce it travel anywhere.',
          'With a traditional cloud service, you have to trust that this chain is honored on servers you cannot inspect. EnigmaKeep removes the need for that trust by removing the server entirely. And because the project is open source (AGPL-3.0 for the app, MIT for the cryptography), anyone can read the code and confirm that the encryption works exactly as described rather than taking the claim on faith.',
        ],
      },
      {
        heading: 'The trade-off you accept',
        body: [
          'Zero-knowledge encryption comes with an honest limitation: because no one else can decrypt your vault, no one else can recover it if you lose your master password. There is no reset link, because a reset link would mean someone other than you had a way in.',
          'This is why EnigmaKeep provides a 12-word recovery phrase when you set up your vault. It is the one backstop that lets you restore access if you forget your master password, and it is meant to be written down and stored safely offline. The responsibility shifts to you, which is the natural consequence of no one else being able to read your data.',
        ],
      },
    ],
  },
  {
    slug: 'offline-password-manager',
    title: 'Why Choose an Offline Password Manager',
    description:
      'Offline password managers keep your vault on your own device with no servers and no account. Here is what that changes for your security and privacy.',
    readingTime: '6 min read',
    intro:
      'Most password managers are built around the cloud. You create an account, your encrypted vault is stored on the provider\'s servers, and it syncs across your devices automatically. That model is convenient, but it also means your data sits on infrastructure you do not control and depends on a company that could be breached, change its policies, or disappear. An offline password manager takes a different path: your vault stays on your device and nowhere else. This article explains what you gain from that choice, and the trade-offs worth understanding before you make it.',
    sections: [
      {
        heading: 'No servers means no central target',
        body: [
          'When millions of encrypted vaults sit on one company\'s servers, that collection becomes an attractive target. Even with strong encryption, a breach of the storage infrastructure hands attackers a trove of vaults they can attempt to crack at their leisure, offline and without any rate limiting.',
          'An offline manager like EnigmaKeep has no such central store. Your vault exists only on your device. There is no giant database of user vaults for an attacker to steal, because there is no database at all. The attack surface shrinks to your own device, which you control directly.',
        ],
      },
      {
        heading: 'No account, nothing to leak',
        body: [
          'Cloud services require an account, and an account requires personal information: at minimum an email address, often more. That information becomes part of the provider\'s records and can be exposed in a breach even when your vault contents remain encrypted.',
          'EnigmaKeep asks for no account and no email. There is no sign-up, no profile, and no personal data collected. You cannot leak information that was never gathered in the first place. This is privacy by structure rather than privacy by promise.',
        ],
      },
      {
        heading: 'Working anywhere, online or not',
        body: [
          'Because everything happens locally, an offline manager keeps working regardless of network conditions. You can unlock your vault and retrieve a password on a plane, in a dead zone, or during an internet outage. There is no server to reach and no login request to time out.',
          'EnigmaKeep is a Progressive Web App, so after the first visit it caches its own code and runs fully offline. The service worker stores only the app\'s interface and logic, never your vault data, so you get the reliability of a local application through your browser.',
        ],
      },
      {
        heading: 'You own the data, literally',
        body: [
          'With an offline manager, your vault is a file under your control. You decide where it lives, how it is backed up, and when it is deleted. Removing your data is as simple as clearing it from your device, with no request to a company and no waiting for their systems to catch up.',
          'This ownership cuts both ways, and it is worth being honest about it. There is no company maintaining backups on your behalf. If you lose your device without a backup, your vault goes with it, which is exactly why EnigmaKeep includes an export feature and a recovery phrase to help you keep your own safe copies.',
        ],
      },
      {
        heading: 'Handling sync yourself',
        body: [
          'The main convenience you give up with an offline manager is automatic multi-device sync. A cloud service quietly keeps your phone and laptop in step. An offline tool leaves that coordination to you.',
          'In practice this means using the export and import features to move your vault between devices deliberately, on your own terms and through channels you trust. For people who value keeping their data off third-party servers, that small amount of manual effort is a reasonable price for staying fully in control.',
        ],
      },
      {
        heading: 'Verifiable by anyone',
        body: [
          'A privacy claim is only as good as your ability to check it. Closed, server-based products ask you to trust descriptions of what happens out of view. An offline, open-source tool lets you confirm the behavior directly.',
          'EnigmaKeep is released as open source (AGPL-3.0 for the app, MIT for the cryptography), and its full source is open for inspection. You can read exactly how it stores data, confirm that nothing is transmitted, and even build it yourself. The offline model and open code together turn "trust us" into "check for yourself."',
        ],
      },
    ],
  },
  {
    slug: 'two-factor-authentication',
    title: 'Two-Factor Authentication (2FA & TOTP) Explained',
    description:
      'Learn how two-factor authentication and TOTP codes work, why they stop most account takeovers, and how to keep your second factor safe.',
    readingTime: '7 min read',
    intro:
      'A password proves you know a secret. Two-factor authentication adds a second, independent proof, so that knowing the password alone is not enough to get in. This simple idea blocks the overwhelming majority of automated account takeovers, because an attacker who steals or guesses your password still hits a wall. This article explains how two-factor authentication works, focuses on the widely used TOTP method, and covers how to set it up and keep your second factor secure. EnigmaKeep includes a built-in authenticator, so you can keep these codes in the same encrypted vault as your passwords.',
    sections: [
      {
        heading: 'The idea behind two factors',
        body: [
          'Authentication factors fall into categories: something you know, such as a password; something you have, such as a phone or security key; and something you are, such as a fingerprint. Two-factor authentication combines two of these categories so that compromising one is not enough.',
          'The power of this approach is independence. A password can be phished, guessed, or leaked, but that alone does not give an attacker the second factor. They would need to defeat two different kinds of protection at the same time, which is far harder than defeating one.',
        ],
      },
      {
        heading: 'How TOTP codes work',
        body: [
          'TOTP stands for Time-based One-Time Password. When you enable it on a service, the service shares a secret key with your authenticator, usually by showing a QR code. Your authenticator stores that secret and uses it, combined with the current time, to compute a short code that changes every thirty seconds.',
          'Because both the service and your authenticator know the same secret and share a clock, they independently arrive at the same code at the same moment. The code is valid only briefly, and it is never transmitted when it is created, so intercepting one leaked code is of little use to an attacker after it expires.',
        ],
      },
      {
        heading: 'Why TOTP beats SMS codes',
        body: [
          'Receiving a code by text message is a common form of two-factor authentication, but it has real weaknesses. Phone numbers can be hijacked through SIM-swapping, where an attacker convinces a carrier to move your number to their device, and SMS messages can be intercepted in some circumstances.',
          'TOTP has no such dependency on the phone network. The codes are generated locally from a stored secret, with no message to intercept and no carrier to social-engineer. This makes app-based TOTP a meaningfully stronger choice than SMS wherever a service offers it.',
        ],
      },
      {
        heading: 'Keeping the second factor separate, or together on purpose',
        body: [
          'Conventional advice is to keep your TOTP secrets separate from your passwords, so that compromising one store does not compromise both. That advice assumes your password store lives on someone else\'s server, where a breach is a realistic concern.',
          'EnigmaKeep changes the calculation by keeping everything in a single vault that stays on your device, encrypted with AES-256-GCM and never uploaded. Storing your TOTP codes alongside your passwords in that offline vault is convenient without exposing them to a central server, because there is no central server to breach. Your master password and, if you enable it, biometric unlock guard the whole vault together.',
        ],
      },
      {
        heading: 'Setting up TOTP in your vault',
        body: [
          'Adding a code is straightforward. When a service offers authenticator-app two-factor authentication, it presents a QR code or a text secret. You add that secret to EnigmaKeep, and from then on the app generates the rotating six-digit code you need at sign-in.',
          'When you log in, you open your vault, read the current code for that service, and enter it alongside your password. Because the code refreshes every thirty seconds, you always have a fresh, valid value ready, and you never have to juggle a separate authenticator app.',
        ],
      },
      {
        heading: 'Planning for lost access',
        body: [
          'Two-factor authentication protects you so well that it can also lock you out if you are not prepared. Most services provide backup codes when you enable it. Save these somewhere safe, because they are your way back in if you cannot generate a normal code.',
          'Keeping your TOTP secrets in EnigmaKeep, protected by your vault backups and recovery phrase, means your second factors are covered by the same safety net as the rest of your vault. When you restore your vault, your authenticator codes come back with it, so a lost or replaced device does not mean starting your two-factor setup over from scratch.',
        ],
      },
    ],
  },
  {
    slug: 'encrypted-file-storage',
    title: 'Encrypted File Storage in Your Vault',
    description:
      'Store sensitive documents alongside your passwords with encrypted file storage, protected by the same client-side AES-256-GCM encryption.',
    readingTime: '6 min read',
    intro:
      'Passwords are not the only sensitive things worth protecting. Scanned passports, insurance documents, software licenses, recovery kits, and private notes all deserve the same care you give your logins. EnigmaKeep\'s encrypted file storage lets you keep these documents inside your vault, protected by the same encryption that guards your passwords. This article explains how encrypted file storage works, what it is well suited for, and how to use it sensibly. As with everything in EnigmaKeep, the files never leave your device and are never readable by anyone but you.',
    sections: [
      {
        heading: 'What encrypted file storage is for',
        body: [
          'Everyone accumulates documents that would cause real harm if they fell into the wrong hands. A photo of an ID card, a tax form, a private key, or a set of account recovery details are all things you want available to yourself but hidden from everyone else.',
          'Encrypted file storage gives these documents a home that is as protected as your passwords. Instead of leaving sensitive files scattered in a downloads folder or an unprotected cloud drive, you keep them in one place that is encrypted at rest and unlocked only by you.',
        ],
      },
      {
        heading: 'The same encryption as your passwords',
        body: [
          'Files you store in EnigmaKeep are encrypted with AES-256-GCM, the same authenticated cipher used for the rest of your vault. The key comes from your master password through PBKDF2-SHA256 with 600,000 iterations, so a file is exactly as hard to access as any password entry.',
          'The GCM mode does more than scramble the file; it also verifies integrity. If stored data is altered, decryption fails rather than handing back a corrupted file, so you can trust that what you get out is exactly what you put in.',
        ],
      },
      {
        heading: 'Everything stays on your device',
        body: [
          'Just like your passwords, stored files never leave your device. They are not uploaded to a server, because EnigmaKeep has no server. They are encrypted locally and held locally, which means the privacy guarantees you rely on for passwords extend naturally to your documents.',
          'This matters most for exactly the kind of files worth encrypting. A copy of your passport or a private key is far too sensitive to trust to a third party. Keeping it in a local, offline vault means no company holds it and no breach elsewhere can reach it.',
        ],
      },
      {
        heading: 'Choosing what to store',
        body: [
          'Encrypted file storage is best suited to small, high-value documents rather than large media libraries. Think identity documents, certificates, recovery sheets, and confidential notes, the kinds of files that are irreplaceable or dangerous if leaked, but modest in size.',
          'Being selective keeps your vault focused and quick to back up. A lean vault of genuinely sensitive material is easier to manage and protect than one padded with large files that were never really secret to begin with.',
        ],
      },
      {
        heading: 'Backing up encrypted files',
        body: [
          'Because your files live on your device, their safety depends on your backups. If you would be upset to lose a document, make sure it is included when you export a copy of your vault, and keep that copy somewhere secure.',
          'EnigmaKeep\'s export produces an encrypted copy that you can store safely, since it is protected by the same encryption as the live vault. Even a backup that ends up on a USB drive or another disk stays unreadable without your master password, so the act of backing up does not weaken your security.',
        ],
      },
    ],
  },
  {
    slug: 'recovery-phrase-guide',
    title: 'Recovery Phrases: Backing Up and Restoring Your Vault',
    description:
      'How a 12-word BIP39 recovery phrase lets you restore your vault, why it exists, and how to store it safely for the long term.',
    readingTime: '7 min read',
    intro:
      'A truly private vault has one unavoidable consequence: if only you can decrypt your data, then only you can recover it. There is no support team with a master key and no reset link, because either of those would mean someone other than you could get in. To give you a safe way back in, EnigmaKeep generates a 12-word recovery phrase when you set up your vault. This article explains what that phrase is, how the BIP39 standard behind it works, and how to store and use it so that you never lose access to your own data.',
    sections: [
      {
        heading: 'Why a recovery phrase is necessary',
        body: [
          'EnigmaKeep is designed so that no one but you can read your vault. Your master password never leaves your device and is never stored anywhere it could be recovered. That design is what makes the tool trustworthy, but it also means a forgotten master password would ordinarily lock you out permanently.',
          'The recovery phrase is the deliberate escape hatch. It is a separate secret that can restore access to your vault, ensuring that a single forgotten password does not destroy your data. It exists precisely because there is no back door, giving you a front door that only you hold the key to.',
        ],
      },
      {
        heading: 'What BIP39 is',
        body: [
          'The 12-word phrase follows BIP39, a well-established standard originally created for cryptocurrency wallets. BIP39 defines a fixed list of 2,048 common words and a method for encoding a secret as a sequence of words drawn from that list.',
          'Words are far easier for people to write down and transcribe accurately than long strings of random characters. The standardized word list also includes a built-in checksum, so an accidental mistake, like a misspelled or swapped word, can be detected rather than silently producing the wrong result.',
        ],
      },
      {
        heading: 'How the phrase restores your vault',
        body: [
          'The twelve words encode the secret material needed to regain access to your vault. When you restore, you enter the phrase, and EnigmaKeep uses it to unlock your data and let you set a new master password, bringing your vault back on a new or reset device.',
          'This is why the phrase deserves the same protection as the vault itself. Anyone who holds your recovery phrase can restore your vault, so it must be kept as carefully as the master password. The two together are the only paths into your data, by design.',
        ],
      },
      {
        heading: 'Storing your phrase safely',
        body: [
          'The safest home for a recovery phrase is offline. Writing the twelve words on paper and keeping that paper somewhere secure, such as a locked drawer or a safe, keeps them beyond the reach of any online attacker. Some people keep a second copy in a separate secure location in case the first is lost or damaged.',
          'Avoid storing the phrase in places that defeat the purpose, such as a plain text file on a synced cloud drive, a photo in your camera roll, or an email to yourself. Each of these reintroduces exactly the kind of third-party exposure that an offline vault is meant to avoid.',
        ],
      },
      {
        heading: 'Recording it at setup',
        body: [
          'The right moment to secure your phrase is the moment you create your vault, when EnigmaKeep first shows it to you. Write the words down carefully, in order, and double-check each one against the display. Order matters, and a single wrong word will prevent recovery.',
          'Do not put off this step. Because the vault is offline and holds no back door, there is no way to retrieve the phrase later if you skipped recording it. A few minutes of care at setup is what stands between a minor inconvenience and permanent loss of access.',
        ],
      },
      {
        heading: 'Combining backups for peace of mind',
        body: [
          'A recovery phrase pairs naturally with EnigmaKeep\'s encrypted export. The export gives you a full, encrypted copy of your current vault, while the recovery phrase gives you a way to regain access even without that file. Together they cover different failure scenarios.',
          'A sensible routine is to keep an up-to-date encrypted export somewhere safe and store your recovery phrase separately offline. With both in place, you are protected against a lost device, a forgotten password, and simple bad luck, so that owning your own data never means risking it.',
        ],
      },
    ],
  },
  {
    slug: 'password-manager-without-cloud',
    title: 'Password Manager Without the Cloud: Options That Keep Your Vault Local',
    description:
      'A password manager without the cloud keeps your encrypted vault on your own device, with no vendor server in the middle. Compare the real options for 2026 — PWA, native desktop, self-hosted server — and pick the shape that fits.',
    readingTime: '10 min read',
    intro:
      'A password manager without the cloud keeps every byte of your vault on your own device, with no vendor server in the middle and no account that could be breached. In 2026 you have three distinct shapes to choose from — a browser-native PWA that encrypts locally, a native desktop app that writes a vault file, and a self-hosted server you run yourself — and the right choice depends on how many people share the vault, how many devices they use, and how much server operations you want to take on. This guide walks through each shape, names the specific products that implement it well, and tells you honestly how far "no cloud" takes you.',
    sections: [
      {
        heading: 'What "cloud" actually means for a password manager',
        body: [
          'When people talk about a "cloud password manager," they almost always mean the model where a vendor runs a server, you create an account, and your encrypted vault lives on their infrastructure, synced to your devices. The vault is encrypted client-side in well-designed products, so the vendor cannot read the data — but they do hold the ciphertext, and they do hold your account metadata (email, device list, billing information, sometimes vault structure). That is what gets stolen in a breach.',
          'A password manager without the cloud removes both pieces: no encrypted vault on a vendor server, and no account record at all. The vault is a file on your device, or a database on a server you own. There is no central database to breach and no account to leak. You trade one risk model for another, where the responsibility for backups and sync shifts onto you.',
        ],
      },
      {
        heading: 'The three cloud-free shapes',
        body: [
          'Shape 1 — Fully offline, no server anywhere. The vault is a file on your device. Examples: EnigmaKeep (PWA), KeePassXC (native desktop), KeePass (native Windows). This is the strictest interpretation of "no cloud" and the only one where no server is involved at any point.',
          'Shape 2 — Self-hosted server you run. The vault lives on a server you own and administer, with clients that sync to it. Examples: Bitwarden (official self-hosted), Vaultwarden (lightweight community server). The vendor is you.',
          'Shape 3 — Local-first with optional sync via a cloud folder you choose. The vault lives as a local file, and you optionally point the app at a sync folder (iCloud Drive, Dropbox, OneDrive, WebDAV) that the app uses as transport. Examples: Enpass, KeePassXC via WebDAV, KeePass via file sync. The vendor still has no vault, but your sync folder provider sees the encrypted file.',
          'All three remove the vendor-breach risk. They differ on who runs the server, who owns the sync pipe, and how much operational burden sits on you.',
        ],
      },
      {
        heading: 'Products worth considering, by shape',
        body: [
          'For Shape 1 (fully offline): EnigmaKeep is the strongest choice for a single-user browser-native experience — install the PWA once and the vault file lives on your device forever after, with no account anywhere. KeePassXC is the strongest native desktop choice on Linux and macOS; KeePass is the original on Windows. All three are free and open source. All three use authenticated AES-256 with modern key derivation.',
          'For Shape 2 (self-hosted server): Bitwarden self-hosted gives you the full official Bitwarden client ecosystem (desktop, mobile, browser extensions) talking to a server you run. Vaultwarden is a lightweight unofficial Rust reimplementation of the same server that fits in a 15 MB Docker image and runs on a Raspberry Pi. Both are free; both let you keep family sharing and admin features that the Shape 1 tools do not have.',
          'For Shape 3 (local-first with your own cloud): Enpass is the main option, with sync via iCloud, Dropbox, OneDrive, Google Drive, or WebDAV. KeePassXC also fits here if you point it at a WebDAV or Nextcloud folder. The appeal is "I want sync, but I pick the pipe."',
        ],
      },
      {
        heading: 'Sync without the cloud (handling the actual logistics)',
        body: [
          'The most common objection to a cloudless password manager is "how do I keep my phone and laptop in step?" There are five patterns that work, in rough order of operational simplicity.',
          'Syncthing is a peer-to-peer file-sync tool that moves the vault file between your own devices directly, with no server in the middle. It is open source and works on every platform. If you run it on a laptop and a phone, your vault file stays current between them without any vendor seeing it. This is the cleanest answer for Shape 1 vaults.',
          'Nextcloud, Seafile, or Owncloud running on a home server gives you a WebDAV endpoint that KeePassXC, Enpass, and other tools can sync to natively. The vault file lives on your own storage.',
          'iCloud Drive, Dropbox, Google Drive, OneDrive — the public clouds — still work as transport if the vault file is encrypted end-to-end before it reaches them. You trade the pure "no cloud" promise for simplicity. Many people run this hybrid intentionally: the vault is encrypted locally, the sync happens over the public cloud, and the vendor sees nothing but ciphertext.',
          'USB stick or hardware device sync is the slowest but most private option. Plug in, copy the vault file, plug out. Works when you have two devices and move between them weekly.',
          'For a single-device user, no sync is required at all. The vault lives on that device and is backed up with the device.',
        ],
      },
      {
        heading: 'Backup without the cloud',
        body: [
          'Removing the cloud removes the automatic vendor backup. That is a feature, not a bug — the vendor backup is also what gets stolen in a breach — but it does mean backups are now your job. The honest minimum is two copies in two locations, one of them offline.',
          'Practical pattern: every month, export your vault as an encrypted file (EnigmaKeep does this through its Export Backup feature; KeePassXC\'s database file is already the backup; Bitwarden exports via its CLI or UI). Save a copy to a USB stick or hardware drive you keep in a drawer. Save another copy to a different device. If your phone, your laptop, and your backup drive all die simultaneously, your recovery phrase lets you rebuild — EnigmaKeep issues a 12-word BIP39 phrase at setup, KeePassXC supports a key file, Bitwarden supports a two-step login recovery code.',
          'The two-location rule exists because the common failure mode is "my hard drive died and so did my backup drive, which was in the same bag." Keep them in different physical places.',
        ],
      },
      {
        heading: 'Who should NOT pick a cloudless manager',
        body: [
          'Not everyone benefits from going cloudless, and it is honest to say so. If you consistently fail to maintain backups, if a lost phone would be a disaster rather than an inconvenience, if you share passwords with family members who are not technical, or if you need a password manager available on devices you do not own (a corporate laptop you cannot install software on), a well-run cloud manager will serve you better. The vendor\'s automatic backup, account recovery, and polished autofill prevent the kind of practical lapses that actually cause harm.',
          'Pick cloudless if you will do the backups. Pick a cloud manager if you will not. Both are fine answers.',
        ],
      },
      {
        heading: 'FAQ — cloudless password management',
        body: [
          'What is a password manager without the cloud? A password manager without the cloud stores your encrypted vault on your own device or on a server you run yourself, instead of on a vendor\'s infrastructure. There is no account on a vendor server and no vault database to be breached.',
          'Is a cloudless password manager safer? Safer against the specific risk of a vendor breach, yes — that failure mode is removed by construction. It shifts responsibility for backups and recovery onto you.',
          'How do I sync passwords between devices without the cloud? Peer-to-peer file sync (Syncthing), a self-hosted WebDAV/Nextcloud server, a USB drive moved between devices, or a hybrid where the vault file travels through a cloud drive but is encrypted end-to-end so the provider sees only ciphertext.',
          'Can I use a cloudless password manager on mobile? Yes. EnigmaKeep installs as a PWA on iOS and Android. KeePassium (iOS) and KeePassDX (Android) are KeePass-format clients. Bitwarden and Vaultwarden ship full native mobile apps.',
          'What if I forget my master password? If you kept the recovery phrase (EnigmaKeep gives you a 12-word BIP39 phrase at setup) or key file (KeePassXC) somewhere safe, you restore from that. Without a recovery mechanism and the master password, the vault is unrecoverable — the honest cost of true zero-knowledge encryption.',
        ],
      },
    ],
  },
  {
    slug: 'open-source-password-manager',
    title: 'Open-Source Password Manager: The Serious 2026 Options',
    description:
      'Open-source password managers let you — or an auditor you trust — read the code that encrypts your vault. Compare EnigmaKeep (AGPL, MIT crypto), KeePassXC (GPL), KeePass (GPL), Bitwarden/Vaultwarden (GPL/AGPL), Passbolt (AGPL), and how to actually judge an open-source manager.',
    readingTime: '11 min read',
    intro:
      'An open-source password manager publishes the exact source code that encrypts your vault, so anyone — you, an independent auditor, a motivated attacker — can read how it actually works instead of trusting a vendor\'s marketing. In 2026 the serious options are EnigmaKeep (AGPL, with MIT cryptography), KeePassXC (GPL), KeePass (GPL), Bitwarden and Vaultwarden (GPL and AGPL), and Passbolt (AGPL). This guide compares them on license, which parts are open, how auditable each is in practice, and how to tell a genuinely open-source project from one that only ships an open-source client while running a closed server.',
    sections: [
      {
        heading: 'What "open source" actually means for a password manager',
        body: [
          'Open source means the source code is published under a license that lets you read it, build it, modify it, and in most cases redistribute it. For a password manager this matters more than for most categories, because the entire security model depends on code the user cannot otherwise see — specifically, the code that derives the key from the master password and encrypts the vault.',
          'A closed-source manager asks you to trust vendor documentation. An open-source manager lets you verify. The practical value is not that most users will read the code; it is that security researchers and the community will, and bugs or backdoors become findable instead of theoretical. The LastPass incidents of 2022-2023, where closed-source code made it harder to independently audit what the leaked vaults contained, are the clearest recent case for choosing open source.',
          'Watch for the common trap: a vendor whose client is open source but whose server is closed, or whose free tier is open but whose business tier runs on undisclosed code. Both are legitimate business models, but "open source" alone does not mean "fully open" — ask what specifically is published.',
        ],
      },
      {
        heading: 'The license comparison',
        body: [
          'EnigmaKeep — Full stack open source: the app under AGPL-3.0, the cryptography under MIT. There is no server, so "client" and "stack" are the same thing: the PWA that runs in your browser. Anyone can fork or modify it; the AGPL asks that modified versions offered to others stay open, and the MIT cryptography can be reused without reciprocity.',
          'KeePassXC — Full client open source under GPL v2 or v3 (user\'s choice). Copyleft license: forks and modified versions must also be open source. No server component.',
          'KeePass (classic) — Full client open source under GPL v2. .NET Windows-first. Copyleft.',
          'Bitwarden — Clients under GPL v3, server under AGPL v3 and GPL v3 depending on component. AGPL is a strong copyleft that extends obligations to services run over a network. The paid business features sit in a separately-licensed Bitwarden Portable Server (closed) that most users will never see.',
          'Vaultwarden — Full server under GPL v3, speaks the Bitwarden protocol to the Bitwarden clients. Community project, not Bitwarden Inc.',
          'Passbolt — Full stack open source under AGPL v3. Server + client both published. Team-focused product, strongest option for a self-hosted team vault with full source access.',
        ],
      },
      {
        heading: 'How to actually audit an open-source password manager',
        body: [
          'You do not have to read every line to benefit from open source. A short checklist tells you most of what you need to know about a specific project.',
          'First, look at how long it has been active and how often it is updated. A project with the last meaningful commit two years ago is a project that is not getting security fixes. Second, look at the issues list — specifically, look for how security reports are handled. Projects with a published security policy (SECURITY.md), a disclosure channel, and visible responses to past reports are serious. Third, look at the dependency list and whether CI runs on every change. A project that pins dependencies, scans for CVEs in CI, and signs releases is operating like infrastructure, not a hobby.',
          'EnigmaKeep publishes SECURITY.md with a disclosure contact at https://github.com/hmalvee/EnigmaKeep/security/advisories/new. KeePassXC has one of the most responsive security teams in the category. Bitwarden runs an active bug bounty. Vaultwarden\'s small maintainer surface is both an advantage (simple) and a risk (bus factor); use at your discretion.',
        ],
      },
      {
        heading: 'Features that matter when the code is open',
        body: [
          'Open-source status is not a feature by itself — it is a property that makes other features verifiable. The features worth verifying on each candidate project are: the exact cipher (AES-256-GCM, ChaCha20-Poly1305, or AES-CBC with a separate MAC are safe modern choices), the key derivation function and its parameters (PBKDF2 with at least 600,000 iterations, scrypt with modern parameters, or Argon2id — the best current choice), per-encryption random salts and IVs, and that the key never leaves the device.',
          'EnigmaKeep uses AES-256-GCM with PBKDF2-SHA256 at 600,000 iterations, a 32-byte salt per encryption, and a fresh IV per encryption; the key is derived in the browser and never transmitted. KeePassXC supports Argon2id as the default KDF, AES-256 or ChaCha20 cipher, and a key file as an optional second factor. Bitwarden uses AES-256-CBC with HMAC-SHA256 and PBKDF2 at 600,000 iterations (or Argon2id, selectable per account).',
        ],
      },
      {
        heading: 'When open source is not enough',
        body: [
          'Open source is necessary for verifiability, not sufficient for security. A perfectly open codebase can still have bugs; a well-maintained project with security hygiene can still miss something. The strongest signal is open source plus an active maintenance posture plus (ideally) an external audit.',
          'As of 2026, KeePassXC has had multiple third-party audits across its history. 1Password (closed source) has published more audit reports than most, which is why it stays respected despite the closed source. Bitwarden has had audits of its clients and server. EnigmaKeep has not yet undergone a third-party audit — it is community-review-driven while young, with the full source public and the security disclosure channel active. If independent audits are a hard requirement, KeePassXC and Bitwarden are the strongest open-source choices in 2026.',
        ],
      },
      {
        heading: 'FAQ — open-source password managers',
        body: [
          'What is an open-source password manager? An open-source password manager publishes the source code of the software that encrypts your vault, under a license that lets you read, build, and modify it. Any user or researcher can inspect exactly how the product works instead of trusting marketing claims.',
          'Is an open-source password manager actually safer? Not automatically. Open source is the property that makes safety verifiable, not a guarantee. Combined with active maintenance, a published security policy, and ideally a third-party audit, it is a stronger foundation than closed-source trust.',
          'Who audits open-source password managers? Independent security firms (contracted by the vendor or by the community), academic researchers, bug bounty participants, and anyone with the time to read the code. KeePassXC and Bitwarden have both had multiple third-party audits.',
          'Can I fork an open-source password manager if the project changes direction? Yes — that is one of the defining benefits. The KeePass format has been reimplemented by multiple projects (KeePassXC, KeePassium, KeePassDX) because the format and the code were open. EnigmaKeep under AGPL and Bitwarden under GPL/AGPL both permit forks.',
          'Is a closed-source password manager automatically unsafe? No. Closed-source managers with strong published audits (1Password is the usual example) can be more trustworthy than an open-source project that is one person\'s abandoned side project. Open source is a tool for verification; it is not a substitute for competence.',
        ],
      },
    ],
  },
];

export function getDetailArticle(slug: string): DetailArticle | undefined {
  return detailArticles.find((article) => article.slug === slug);
}
