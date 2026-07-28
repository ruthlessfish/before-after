# Contributing to Before-After

We welcome contributions to Before-After! By participating in this project, you agree to abide by our code of conduct and follow the guidelines outlined in this document.

## How to Contribute

### Reporting Bugs

If you find a bug in Before-After, please open an issue on GitHub. Include a clear and concise description of the problem, steps to reproduce it, and any relevant screenshots or code snippets.

### Suggesting Features

If you have an idea for a new feature or improvement, please open an issue on GitHub. Provide a detailed description of the feature, its benefits, and any potential implementation details.

### Submitting Pull Requests

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Ensure your code follows the project's coding standards.
5. Write tests for your changes, if applicable.
6. Run the tests to ensure everything works correctly.
7. Submit a pull request with a clear description of your changes.

### Code Style

- Follow the existing code style and conventions.
- Write clear and concise commit messages.
- Ensure your code is well-documented.

### Testing

```bash
npm install
npx playwright install chromium   # once, on first checkout
npm test
```

The suite runs on [Vitest](https://vitest.dev). Component tests live in `test/browser/` and run in real headless Chromium — the element is mostly CSS and pointer behaviour, so a simulated DOM would not tell us much. `test/node/` holds a guard for the build-time template minifier.

- Write tests for new features and bug fixes.
- Run all tests to ensure nothing is broken.
- Do not commit `dist/`; it is ignored. CI builds it and publishes the demo site on every push to `main`, and `npm run dev` serves `lib/` directly, so you never need a build to see your own changes.
