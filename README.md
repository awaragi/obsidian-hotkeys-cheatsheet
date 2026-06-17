# Hotkeys Cheatsheet

An Obsidian plugin that displays a searchable cheatsheet of all your configured hotkeys.

## Development

```bash
# Install dependencies
npm install

# Copy .env.example and set your vault plugin path
cp .env.example .env

# Development build (with sourcemaps)
npm run dev

# Production build
npm run build

# Copy dist/ to your local vault (reads OBSIDIAN_PLUGIN_DIR from .env)
npm run deploy

# Development build + deploy in one step
npm run dev:deploy

# Remove dist/
npm run clean
```

### Releases

Push a version tag to trigger a GitHub Actions build and draft release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Localisation

The plugin UI is available in **English** (default), **French**, and **Spanish**. The language is detected automatically from Obsidian's language setting.

To add a new language:

1. Copy `src/ts/i18n/en.json` to `src/ts/i18n/<code>.json` (e.g. `de.json`)
2. Translate all values — keys must stay identical to `en.json`
3. Import and register it in `src/ts/i18n.ts`:
   ```ts
   import de from "./i18n/de.json";
   const locales = { en, fr, es, de };
   ```
4. Rebuild with `npm run build`
