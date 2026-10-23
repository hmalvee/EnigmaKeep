# Licensing

EnigmaKeep uses two licences, chosen so that the cryptography can be reused
anywhere while the application itself stays open.

| Part | Licence | Why |
|---|---|---|
| The application: everything in this repository not listed below | [GNU AGPL-3.0-or-later](LICENSE) | Anyone may use, study, modify and redistribute it. Anyone who distributes a modified version, or runs one for others over a network, must publish their modifications under the same licence. |
| `src/crypto/` (vault format, key derivation, Secret Key, recovery phrase, Shamir sharing, time-lock puzzle, guardian recovery protocol) | [MIT](src/crypto/LICENSE) | So that other password managers, wallets and libraries can adopt the protocol without any copyleft obligation. |

Each file under `src/crypto/` carries an
`SPDX-License-Identifier: MIT` line. Files without an SPDX line are AGPL.

Releases published before 23 October 2026 were made under the MIT licence and
remain available under it; this split applies to that date and later. All code
to date is copyright HM Alvee Hasan, the sole contributor, which is what makes the
relicensing possible. Contributions are accepted under the licence of the
directory they land in (see CONTRIBUTING.md).

## Patents

If the project ever holds a patent on any of its mechanisms, it will be
defensive only. We pledge not to assert it against anyone using, building or
distributing open-source software or using the mechanism for personal,
non-commercial purposes, and never to use it to stop someone from building a
compatible tool. The pledge is binding on any successor that takes over the
project.
