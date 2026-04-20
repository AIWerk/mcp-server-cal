# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in `@aiwerk/mcp-server-cal`, please report it **privately**. Do not open a public GitHub issue — those are visible to the world from the moment they are filed.

**Preferred channel:** [GitHub Security Advisory](https://github.com/AIWerk/mcp-server-cal/security/advisories/new) — this creates a private, encrypted discussion with the maintainers.

**Alternative:** email **security@aiwerk.ch** with:
- a description of the vulnerability
- the affected version(s)
- reproduction steps or proof-of-concept (if possible)
- your disclosure timeline preference

We do not currently run a bug bounty program, but we will publicly credit reporters (with permission) in the CHANGELOG entry for the fix.

## What to expect

- **Acknowledgement:** within **5 business days** of your initial report.
- **Initial assessment:** within **10 business days** (severity classification + estimated fix window).
- **Fix timeline:**
  - Critical (auth bypass, credential exfiltration, RCE): target **within 30 days** of confirmation.
  - High (information disclosure, DoS): target **within 60 days**.
  - Medium / low: next scheduled release.
- **Coordinated disclosure:** we prefer a **90-day** default embargo before public disclosure, extendable if the fix is complex.

## Scope

In scope:
- The `@aiwerk/mcp-server-cal` npm package (all currently-supported versions).
- The source in [`AIWerk/mcp-server-cal`](https://github.com/AIWerk/mcp-server-cal).

**Out of scope** (report to the relevant upstream project):
- Vulnerabilities in [Cal.com's own API](https://cal.com) → report to Cal.com directly.
- Issues in [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) or other dependencies → report to their maintainers.
- Issues in the AIWerk hosted bridge (`bridge.aiwerk.ch`) → report via [aiwerkmcp.com](https://aiwerkmcp.com) or email security@aiwerk.ch with subject prefix `[hosted-bridge]`.

## Supported versions

| Version | Status |
|---------|--------|
| 1.0.x   | Actively supported — security fixes backported |
| < 1.0   | Unsupported — please upgrade |

## Safe-harbor

We will not pursue legal action against researchers who:
- Make a good-faith effort to follow this policy.
- Avoid accessing, modifying, or destroying data that isn't theirs.
- Do not disrupt service for other users during testing.
- Give us reasonable time to remediate before public disclosure.

Thank you for helping keep AIWerk's MCP ecosystem safe.
