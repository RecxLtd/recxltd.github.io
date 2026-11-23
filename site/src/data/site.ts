export const site = {
  name: 'Recx',
  legalName: 'Recx Ltd',
  url: 'https://www.recx.co.uk',
  title: 'Bespoke cyber security solutions | Recx',
  tagline: 'Bespoke cyber security solutions',
  description:
    'Welcome to Recx, an agile British company, formed in 2009 by a group of highly skilled security professionals.',
  foundingDate: '2009',
  companyNumber: '07100978',
  companiesHouseUrl: 'https://find-and-update.company-information.service.gov.uk/company/07100978',
  vatNumber: 'GB100686541',
  address: {
    street: '18/22 Church Street',
    locality: 'Malvern',
    region: 'Worcestershire',
    postcode: 'WR14 2AY',
    country: 'GB',
  },
  social: {
    linkedin: { url: 'https://www.linkedin.com/company/recx-ltd', label: 'Recx on LinkedIn' },
  },
  apexsecUrl: 'https://apexsec.recx.co.uk/',
} as const;

export const nav = [
  { href: '#services', label: 'Services' },
  { href: '#apexsec', label: 'ApexSec' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
] as const;

// Content Security Policy, set as a <meta> tag because GitHub Pages cannot send
// custom headers. Everything is served from this origin: no inline styles or
// scripts (Astro is configured not to inline any), no third-party content.
export const csp = [
  "default-src 'self'",
  "img-src 'self'",
  "style-src 'self'",
  "script-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');
