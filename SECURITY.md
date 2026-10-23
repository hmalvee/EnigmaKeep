# Security policy

EnigmaKeep is a password manager. Taking vulnerability reports seriously is
part of the deal. This document explains how to report an issue and what you
can expect in return.

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | yes       |
| < 1.0   | no        |

The latest `main` branch is the only supported development surface.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for anything that could affect
users' vault confidentiality or integrity. Instead:

1. Open a private advisory at
   https://github.com/hmalvee/EnigmaKeep/security/advisories/new (preferred).
2. Or email `security@enigmakeep.com`.

Include enough detail to reproduce the issue — code paths, environment,
specific inputs. If you have a proof of concept, attach it; if you can only
describe the shape of the problem, that is also useful.

If you need PGP, request a key in your initial message and we will exchange
one before you send sensitive details.

## What to expect

- **Within 72 hours:** acknowledgement of your report.
- **Within 7 days:** initial assessment — severity, scope, whether we can
  reproduce it, and a rough timeline.
- **Thereafter:** regular updates as we investigate and fix.

If a fix requires a new release, we will coordinate the disclosure timeline
with you. We prefer coordinated disclosure, but we will not drag it out
indefinitely — our default window is 90 days from the acknowledgement, and we
will publish earlier if a fix lands sooner.

## Scope

In scope:

- The EnigmaKeep PWA source at https://github.com/hmalvee/EnigmaKeep.
- The deployed site at https://www.enigmakeep.com (host, HTTP headers, CSP,
  service worker behavior, and how the app itself handles vault data).
- Any component shipped with the app that handles cryptographic material,
  session state, or vault files.

Out of scope:

- Issues in third-party dependencies that do not have a user-visible impact in
  EnigmaKeep. If you find such an issue, report it upstream and we are happy to
  track the version bump here.
- Phishing or social engineering of users without an EnigmaKeep-specific
  vector.
- Volumetric DoS (we do not run a server).
- Browser bugs that are not EnigmaKeep-specific.

## Hall of thanks

Researchers who report valid issues and want public credit will be listed
here once a fix ships. If you prefer to stay anonymous, tell us in your
report.

- *(none yet)*

## Our commitments to you

- We will not pursue legal action against good-faith security researchers who
  report issues through the channels above and give us a reasonable window
  before public disclosure.
- We will not demand you delete your proof of concept, provided it is not
  shared beyond what is necessary for the report.
- We will credit you (if you want) when we ship the fix.

## Related

- Public disclosure channel: https://www.enigmakeep.com/.well-known/security.txt
- Source: https://github.com/hmalvee/EnigmaKeep
