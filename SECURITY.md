# Security Policy

We take security seriously. We are responsible maintainers. Kysely is widely used in production and there's a lot at stake.

We're not perfect.

## Supply Chain Attacks

We're on the frontline. We listen, we adapt. We try to use up-to-date best practices and standards from the maintainer community.

Being hacked and helping distribute malicious code to our community will be soul crushing to us.

We're not perfect. GitHub is not perfect. [NPM](https://npmjs.com) is not perfect.

### Recommendations

These are not perfect.

1. Our runtimes are not perfect. Keep yours up-to-date - [End Of Life (EOL) versions don't receive security updates](https://nodejs.org/en/blog/announcements/node-18-eol-support) and there are less eyes watching.

1. [`pnpm`](https://pnpm.io) is not perfect, but it's the [closest](https://pnpm.io/supply-chain-security) we have - use it as your package manager.

    1. It offers out the box [protection from malicious `postinstall` scripts](https://pnpm.io/settings#onlybuiltdependencies) - many attackers use `postinstall` scripts to run/setup their malicious code while you install the package.
    1. It allows to [ignore new package versions](https://pnpm.io/settings#minimumreleaseage) with a configurable time period - response to supply chain attacks (regaining NPM/GitHub access, pulling the malicious package versions off NPM and publishing new safe versions) usually takes up to 24 hours.

1. [Provenance](https://docs.npmjs.com/viewing-package-provenance) is not perfect, but it's the closest we have - audit publish flows, source commits, builds, etc.

1. Our ecosystem is not perfect. Simplify/flatten your dependency graph. You probably don't need some of those libraries. Your runtime might have a native solution for some of these things. You can copy that single function over - attackers prey on (undermaintained) transitive dependencies as the blast radius is bigger, and response takes longer.

1. Auth is not perfect. Use secret/password managers. Encrypt. [2FA](https://en.wikipedia.org/wiki/Multi-factor_authentication) everything. Don't access production directly from laptops - many attacks involve exfiltration, and they're [getting more creative](https://www.anthropic.com/news/detecting-countering-misuse-aug-2025).

## Reporting Security Issues

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/kysely-org/kysely/security/advisories/new) tab.

Don't abuse the system. Don't waste our time with troll/spam/AI slop false reports.

Don't be an asshole. We're not perfect.
