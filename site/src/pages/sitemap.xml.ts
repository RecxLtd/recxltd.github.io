import type { APIRoute } from 'astro';

const paths = [
  '/',
  '/downloads/Recx-Apex-CVE-2011-3525.pdf',
  '/downloads/Recx-Apex-CVE-2012-1708.pdf',
];

export const GET: APIRoute = ({ site }) => {
  const urls = paths
    .map((path) => `  <url>\n    <loc>${new URL(path, site).href}</loc>\n  </url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
