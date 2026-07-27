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
          'With a traditional cloud service, you have to trust that this chain is honored on servers you cannot inspect. EnigmaKeep removes the need for that trust by removing the server entirely. And because the project is open source under the MIT license, anyone can read the code and confirm that the encryption works exactly as described rather than taking the claim on faith.',
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
          'EnigmaKeep is released under the MIT license, and its full source is open for inspection. You can read exactly how it stores data, confirm that nothing is transmitted, and even build it yourself. The offline model and open code together turn "trust us" into "check for yourself."',
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
];

export function getDetailArticle(slug: string): DetailArticle | undefined {
  return detailArticles.find((article) => article.slug === slug);
}
