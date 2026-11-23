// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.recx.co.uk',
  trailingSlash: 'ignore',
  // HTML-aware whitespace handling keeps spaces between inline elements
  compressHTML: true,
  build: {
    // Keep all CSS in external files so the Content-Security-Policy
    // (style-src 'self') is satisfied without 'unsafe-inline'
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Never inline assets as data: URIs (blocked by img-src 'self')
      assetsInlineLimit: 0,
    },
  },
  devToolbar: {
    enabled: false,
  },
});
