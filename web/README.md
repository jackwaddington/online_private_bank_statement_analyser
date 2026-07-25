# Joint Account Analyser - web app

This is the web app source for the Joint Account Analyser. See the [root README](../README.md) for what the project does, screenshots, and a live demo link.

## Development

```bash
npm install
npm run dev        # dev server with HMR
npm run test:run   # run the Vitest suite once
npm run lint       # ESLint
npm run build      # type-check + production build
```

## Structure

- `src/core/` - pure TypeScript logic (parsers, processors, calculations, types); no React, fully unit-tested
- `src/components/` - React UI (screens, charts, common widgets)
- `src/context/` - app state (reducer + provider)
- `src/styles/` - theme and global styles
