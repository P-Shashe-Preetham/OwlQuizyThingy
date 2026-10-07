# Contributing Guidelines

Thank you for contributing to OwlQuizThingy!

## Development Workflow

1. **Clone & Install**:
   ```bash
   pnpm install
   ```
2. **Build Packages**:
   ```bash
   pnpm build
   ```
3. **Run Quality Gates**:
   Before submitting a Pull Request, ensure all checks pass:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

## Commit Conventions

All commits must follow Conventional Commits format:
- `feat:` New features
- `fix:` Bug fixes
- `sec:` Security fixes & hardening
- `docs:` Documentation updates
- `refactor:` Code refactoring
- `test:` Adding or updating tests
