# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Because this is a browser extension, permission- and privacy-related reports can
put users at risk if disclosed publicly before a fix ships. Instead, use GitHub's
[Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability):

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, affected versions, and reproduction steps.

We aim to acknowledge reports within a few days.

## Scope

Especially relevant for this project:

- Anything that would cause the extension to make an external network request.
- Anything that would broaden host permissions or read cookies / login state.
- Content-script code that could be abused by a malicious host page (e.g. DOM
  clobbering, prototype pollution via injected markup).

## Supported versions

Only the latest released version receives security fixes.
