# Contributing to BlockyEdu

Thank you for your interest in contributing to BlockyEdu! This document applies to all repositories in the `blockyedu` organization.

## How to Contribute

- Report bugs (GitHub Issues)
- Propose features (Issues / Discussions)
- Submit code (Pull Requests)
- Improve documentation (Pull Requests)
- Participate in community discussions

## Getting Started

1. Read our [Code of Conduct](./CODE_OF_CONDUCT.md).
2. Find the repository owner in [playbooks/repository-owners.md](./playbooks/repository-owners.md).
3. Search for or create an Issue in the target repository to discuss your approach before coding.

## Development Workflow

```bash
# 1. Fork the target repository
# 2. Create a feature branch
git checkout -b feature/my-feature

# 3. Develop and test
npm test

# 4. Commit (Conventional Commits)
git commit -m "feat: add block-to-code converter"

# 5. Push and open a PR
git push origin feature/my-feature
```

## Pull Request Guidelines

- All CI checks must pass (lint, test, security scan).
- Code follows our [coding standards](./docs/development/development-guide.md).
- Include necessary tests and documentation updates.
- One PR, one clear intent.
- Link related Issue numbers.

## First-Time Contributors

Look for Issues labeled `good first issue` — these are suitable for newcomers.

## Architecture Changes

Significant architecture decisions require an ADR (Architecture Decision Record) in MetaRepo's `adr/` directory. See the [development guide](./docs/development/development-guide.md) for details.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](./LICENSE).
