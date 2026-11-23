# www.recx.co.uk

Source for the Recx website. It is a static site built with [Astro](https://astro.build/) and published to GitHub Pages by GitHub Actions. The output is plain HTML and CSS with no client-side framework, no cookies, no analytics and no third-party requests.

## Quick reference

| Task | How |
|---|---|
| Preview locally with live reload | `npm ci` then `npm run dev`, open http://localhost:4321/ |
| Production build into `dist/` | `npm run build` (type check, then build) |
| Preview the production build | `npm run preview` |
| Edit services, testimonials, staff bios | Edit the YAML in `src/data/` |
| Edit company details, navigation, social links | `src/data/site.ts` |
| Add, remove or reorder client logos | `npm run clients -- add / remove / move / list` |
| Publish | Merge to `main`. The workflow builds, checks and deploys |

Use the current Node.js LTS release (`.nvmrc` says `lts/*`, and CI always picks up the newest LTS and the newest npm). Dependencies in `package.json` use `^` ranges, so patch and minor releases are taken automatically when the lockfile is refreshed. `package-lock.json` records the exact versions so every build is the same; use `npm ci` rather than `npm install` to keep it unchanged, and `npm update` to move to the newest versions within the ranges.

## Project layout

```
astro.config.mjs        Astro configuration (site URL, strict CSP-friendly output)
src/
  data/                 Site content
    services.yaml         Service cards (Cyber Security Services)
    testimonials.yaml     Quotes; `section` picks where each one appears
    staff.yaml            Team bios and LinkedIn URLs
    clients.yaml          Client logos (managed with `npm run clients`)
    site.ts               Company details, navigation, social links, CSP
  content.config.ts     Schemas that validate the YAML at build time
  layouts/Base.astro    <head> (CSP, canonical, Open Graph, JSON-LD) and page frame
  components/           Header, footer, section, service, staff, testimonial,
                        client logo and contact components
  pages/                index, 404, apexsec/ (redirect) and sitemap.xml
  styles/global.css     All styling: design tokens, layout, responsive, print
  assets/               Images optimised at build time (staff photos, client
                        logos, icons, brand mark, screenshots)
public/                 Copied unchanged to the site root: CNAME, robots.txt,
                        favicon, images/, downloads/ (PDFs), js/
scripts/clients.mjs     Client logo helper
```

## Editing content

All copy lives in `src/data/`. The build fails with a clear message if an entry is missing a field or has the wrong type, so mistakes are caught before anything is published.

**Services, testimonials and staff.** Each entry has an `order` field that controls its position. Testimonials also have a `section` (`services`, `apexsec`, `team` or `about`). A staff member's photo is `src/assets/staff/<id>.png`, where `<id>` matches their entry.

**Client logos.** Prefer an SVG from the organisation's brand or press kit; otherwise use a PNG at least 300px wide. Make sure the organisation is happy to be named before adding it.

```sh
npm run clients -- list
npm run clients -- add --name "Example Ltd" --url https://www.example.com/ --logo ~/Downloads/example.svg
npm run clients -- add --name "Example Ltd" --url https://www.example.com/ --logo example.png --scale 0.9
npm run clients -- move example-ltd 2
npm run clients -- remove example-ltd
```

`add` cleans SVGs (removing scripts, event handlers, external references and inline styles) and rejects any it cannot make safe. Logos are sized by visual area so wide wordmarks and compact marks look balanced. Use `--scale` (or edit `scale` in `clients.yaml`) to nudge one that still looks too large or small. They appear in greyscale and turn to full colour on hover.

**Images.** Put images that appear on the page in `src/assets/`. Astro converts them to AVIF and WebP with fallbacks and sets their dimensions. Only files that must keep a fixed URL (favicon, social preview image, PDFs) go in `public/`.

**Contact email.** The email address is deliberately shown as an image (`src/assets/contact-email.png`, 2x resolution) rather than text or a `mailto:` link.

## How it is built

`npm run build` runs `astro check` (TypeScript and template checks) and then `astro build`, which writes the finished site to `dist/`:

- HTML is generated from the layouts, components and YAML, then minified
- CSS is bundled into one hashed file under `/_astro/`
- Images in `src/assets/` are resized and converted to modern formats
- `sitemap.xml` is generated from `src/pages/sitemap.xml.ts`
- `public/` is copied as-is

There is no client-side JavaScript apart from `public/js/404script.js`, which the 404 page uses to send old URLs to the right place.

## Deployment

`.github/workflows/deploy.yml` runs on every push and pull request:

1. The newest Node.js LTS and npm, then `npm ci` with the committed lockfile
2. `npm run build` (type check and build)
3. An offline link check of the built pages (lychee), including `#fragment` links
4. On `main` only: upload `dist/` and deploy it to GitHub Pages

Pull requests are built and checked but never deployed. The workflow uses least-privilege permissions, and every action is pinned to a full commit SHA. Dependabot (`.github/dependabot.yml`) proposes weekly updates for npm packages and actions, waiting until a release is at least 14 days old.

## Security notes

GitHub Pages cannot send custom HTTP response headers, so the Content Security Policy is delivered as a `<meta>` tag (defined in `src/data/site.ts`):

```
default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self';
object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'
```

To keep that policy workable, the site must not contain inline styles, inline scripts, `style=""` attributes or `data:` URIs. `astro.config.mjs` stops Astro from inlining CSS or small assets. The only inline `<script>` is the JSON-LD block, which browsers treat as data and do not run. When editing components, keep styling in `global.css` and any scripts in external files under `public/js/`.

## URLs that must keep working

`/`, `/index.html`, `/404.html`, `/apexsec/` (redirects to ApexSec), `/downloads/*.pdf` (referenced by third-party scanners), `/sitemap.xml`, `/robots.txt`, `/favicon.ico`, `/images/logo.png`, `/images/apple-touch-icon.png`, and the in-page anchors `#services`, `#apexsec`, `#about` and `#contact`.

## Going live and rolling back

The first switch from the previous hand-written site (whose files are removed from the repository root in the same change):

1. In **Settings → Pages**, set **Source** to **GitHub Actions** *before* merging.
2. Merge this project to `main` under `site/`, with the workflow in `.github/`.
3. Check the live site: the URLs above, a nested missing page (should show the custom 404), the apex redirect to `www`, and HTTPS.

To roll back a bad change, revert its commit on `main`; the workflow rebuilds and redeploys the previous version. A previous deployment can also be re-run from the **Actions** tab.
