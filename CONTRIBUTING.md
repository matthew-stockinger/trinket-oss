# Contributing to Trinket

Thanks for your interest in contributing to Trinket! This document outlines the process for contributing to the project.

## Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/trinketapp/trinket-oss/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser/OS/Node version if relevant
   - Screenshots if applicable

## Suggesting Features

Open an issue with the `enhancement` label describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Pull Requests

### Before You Start

- For small fixes (typos, minor bugs), feel free to submit a PR directly
- For larger changes, open an issue first to discuss the approach

### Development Setup

1. Fork and clone the repository
2. Copy config and add your settings:
   ```bash
   cp config/local.example.yaml config/local.yaml
   ```
3. Start the development environment:
   ```bash
   docker-compose up
   ```

### Making Changes

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style below

3. Test your changes:
   ```bash
   npm test
   ```

4. Commit with a clear message:
   ```bash
   git commit -m "Add feature X that does Y"
   ```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Keep lines under 120 characters
- Use descriptive variable names

### Submitting

1. Push to your fork
2. Open a Pull Request
3. Wait for review

## Code of Conduct

Be respectful and constructive. We're all here to make coding education better.

## Questions?

Open an issue with the `question` label or reach out to the maintainers.
