# Security Policy

## EU Cyber Resilience Act (CRA) Compliance Statement

This software is provided as **free and open-source software (FOSS)** under the GPL-3.0 license and is **not monetized** by its maintainers. Under the EU Cyber Resilience Act (Regulation 2024/2847), non-commercial open-source software is exempt from manufacturer obligations.

### Project Status

- **License**: GPL-3.0 (Free and Open Source)
- **Commercial Activity**: None - this software is provided free of charge
- **Monetization**: None
- **CRA Classification**: Exempt (non-commercial FOSS)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly at: hi@kul.site
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

## Security Best Practices

This project follows these security practices:

1. **No Hardcoded Secrets**: API keys are stored server-side (Firebase)
2. **Input Validation**: User inputs are validated before processing
3. **Secure Storage**: Sensitive data uses platform secure storage
4. **Dependency Updates**: Regular review of dependency vulnerabilities
5. **Code Review**: Changes reviewed before merging

## Vulnerability Disclosure

When a vulnerability is confirmed and fixed:

1. A security advisory will be published on GitHub
2. A new version will be released with the fix
3. Users will be notified through release notes

## Third-Party Dependencies

This project uses third-party open-source dependencies. We monitor these for known vulnerabilities using:

- GitHub Dependabot alerts
- npm audit

## Contact

Security issues: hi@kul.site
Maintainer: Alexandru Negoita
