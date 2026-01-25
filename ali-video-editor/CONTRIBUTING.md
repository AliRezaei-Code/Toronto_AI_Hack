# Contributing to Video Copilot

Thank you for your interest in contributing to Video Copilot! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file based on `.env.example`
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Quality

- All code must pass ESLint and TypeScript checks
- Use Prettier for consistent formatting
- Follow SOLID principles
- Write comprehensive JSDoc comments
- Implement proper error handling for all operations

### Before Submitting

Run these commands before committing:

```bash
# Run linting and fix issues
npm run lint:fix

# Run type checking
npm run typecheck

# Format code
npm run format
```

## 🔄 Contribution Workflow

1. **Create an Issue** (if applicable)
   - Describe the problem or feature request
   - Discuss the approach with maintainers

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

4. **Commit Changes**
   - Use conventional commit messages:
     ```
     feat: add new feature
     fix: fix bug
     docs: update documentation
     style: format code
     refactor: refactor code
     test: add tests
     chore: update dependencies
     ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

   - Create a Pull Request with a clear description
   - Link any related issues
   - Ensure all CI checks pass

## 🧪 Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting
- Use descriptive test names

## 📝 Documentation

- Update README.md if adding new features
- Add inline documentation for complex logic
- Update API documentation if applicable

## 🐛 Bug Reports

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser)
- Screenshots if applicable

## 💡 Feature Requests

- Use the issue tracker for feature requests
- Provide a clear description of the proposed feature
- Explain the use case and benefits
- Consider implementation suggestions

## 🤝 Code of Conduct

Please be respectful and professional in all interactions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

## 🙏 Thank You

We appreciate all contributions, whether they're code, documentation, bug reports, or feature suggestions!
