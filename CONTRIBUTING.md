# Contributing

Bug reports, accessibility improvements, clearer documentation, and focused pull requests are welcome. Please keep the project useful without a login, API key, or image upload.

## Run locally

Use a supported Node.js version from the README and run `npm ci`, then `npm run dev`. Source is TypeScript; there is no UI framework or backend. `src/lib/` holds image processing; `src/main.ts` owns UI state and interactions; `src/style.css` holds responsive styling.

Before submitting:

```bash
npm run build
npx playwright install chromium
npm test
```

For browser-specific changes, install Firefox/WebKit using `npx playwright install firefox webkit` and run `npm run test:browsers`. Add regression coverage for meaningful behavior changes, especially export dimensions, alpha, header validation, source-coordinate cropping, or asynchronous image loading. Document changed limits or format support.

## Report a bug

Include browser and OS versions, steps, expected behavior, and actual behavior. Use the built-in sample when possible. Share only images you have permission to publish, with private data removed. Do not attach private photographs, customer images, credentials, or full browser profiles.

## Pull requests

Explain the user-visible problem, final behavior, and relevant checks. Keep changes focused. Discuss large features before introducing a framework or processing dependency. Retain source notices, and identify the origin/license of new code or images. Contributions are provided under this repository's MIT license. Treat other contributors respectfully and keep discussions about the work.
