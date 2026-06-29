# Security Policy

## Supported Versions

The following versions of `kuma-mieru` are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.7.x   | :white_check_mark: |
| < 1.7   | :x:                |

We generally support the latest minor release and any actively maintained release line. Users are encouraged to upgrade to the latest version as soon as possible.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately so we can fix it before public disclosure.

### Preferred method: GitHub Private Vulnerability Reporting

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** to open a draft security advisory.
3. Fill in the details and submit the report.

This is the fastest way for us to receive and triage your report.

### Alternative method: Email

If you are unable to use GitHub Private Vulnerability Reporting, please contact the maintainer privately using the email listed on their [GitHub profile](https://github.com/Alice39s).

Please include:

- A clear description of the vulnerability.
- Steps to reproduce or a proof of concept.
- The affected version(s) and component(s).
- Any possible mitigations you are aware of.

## Response Timeline

We aim to respond to security reports according to the following timeline:

| Stage                   | Target timeframe      |
| ----------------------- | --------------------- |
| Acknowledge receipt     | Within 3 days         |
| Initial assessment      | Within 7 days         |
| Fix released (critical) | As soon as possible   |
| Public disclosure       | After fix is released |

## Disclosure Policy

- Reports will be kept confidential until a fix is available.
- We will work with you to coordinate public disclosure.
- Credit will be given to reporters unless they wish to remain anonymous.
- If a reported issue is determined not to be a vulnerability, we will explain our reasoning.

## Security Best Practices for Users

- Keep your deployment up to date with the latest release.
- Do not expose the admin/debug interface to the public internet.
- Use HTTPS for all deployments.
- Report any suspected security issues promptly.
