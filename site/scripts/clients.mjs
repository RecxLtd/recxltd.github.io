#!/usr/bin/env node
// Manage the client logos shown in the Services section.
//
//   npm run clients -- list
//   npm run clients -- add --name "Example Ltd" --url https://example.com/ --logo ~/Downloads/example.svg [--scale 0.9] [--id example]
//   npm run clients -- remove example
//   npm run clients -- move example 3
//
// SVG logos are cleaned with svgo (scripts, event handlers, external
// references and inline styles are not allowed). PNG, WebP and JPEG logos are
// copied as-is; supply them at least 2x the displayed size (300px+ wide).

import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { optimize } from 'svgo';
import { parseDocument } from 'yaml';

const ROOT = resolve(import.meta.dirname, '..');
const DATA = join(ROOT, 'src/data/clients.yaml');
const ASSETS = join(ROOT, 'src/assets/clients');
const RASTER = new Set(['.png', '.webp', '.jpg', '.jpeg']);

const fail = (msg) => {
  console.error(`error: ${msg}`);
  process.exit(1);
};

const load = () => parseDocument(readFileSync(DATA, 'utf8'));
const entries = (doc) => doc.contents.items;
const get = (item, key) => item.get(key);

function save(doc) {
  // Renumber so `order` always runs 1..n in file order
  entries(doc)
    .sort((a, b) => get(a, 'order') - get(b, 'order'))
    .forEach((item, i) => item.set('order', i + 1));
  doc.contents.items.forEach((item, i) => {
    if (i > 0) item.spaceBefore = true;
  });
  writeFileSync(DATA, doc.toString({ lineWidth: 0 }));
}

function cleanSvg(source, file) {
  const banned = [
    [/<script/i, 'a <script> element'],
    [/<foreignObject/i, 'a <foreignObject> element'],
    [/\son[a-z]+\s*=/i, 'an event handler attribute'],
    [/(?:xlink:)?href\s*=\s*["'](?!#)/i, 'an external reference'],
    [/<image/i, 'an embedded <image>'],
  ];
  const { data } = optimize(source, {
    path: file,
    multipass: true,
    plugins: [
      'preset-default',
      'removeScripts',
      'removeDimensions',
      'convertStyleToAttrs',
      { name: 'removeAttrs', params: { attrs: ['class', 'id', 'data-.*', 'aria-.*', 'role', 'style'] } },
    ],
  });
  for (const [re, what] of banned) {
    if (re.test(data)) fail(`${basename(file)} still contains ${what} after cleaning; use a different logo file`);
  }
  if (!/viewBox=/.test(data)) fail(`${basename(file)} has no viewBox, so it cannot be scaled`);
  if (/<style/i.test(data)) fail(`${basename(file)} uses a <style> block, which the site's CSP blocks; export the logo with presentation attributes`);
  return data;
}

function rasterWidth(file) {
  const buf = readFileSync(file);
  if (buf.subarray(1, 4).toString() === 'PNG') return buf.readUInt32BE(16);
  return undefined;
}

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case 'list': {
    const items = entries(load()).sort((a, b) => get(a, 'order') - get(b, 'order'));
    const width = (key) => Math.max(...items.map((item) => get(item, key).length));
    const [idWidth, nameWidth] = [width('id'), width('name')];
    for (const item of items) {
      const scale = get(item, 'scale');
      console.log(
        `${String(get(item, 'order')).padStart(2)}  ${get(item, 'id').padEnd(idWidth)}  ${get(item, 'name').padEnd(nameWidth)}  ${get(item, 'logo')}${scale ? `  (scale ${scale})` : ''}`,
      );
    }
    break;
  }

  case 'add': {
    const { values } = parseArgs({
      args: rest,
      options: {
        name: { type: 'string' },
        url: { type: 'string' },
        logo: { type: 'string' },
        scale: { type: 'string' },
        id: { type: 'string' },
      },
    });
    if (!values.name || !values.url || !values.logo) fail('add needs --name, --url and --logo');
    let url;
    try {
      url = new URL(values.url);
    } catch {
      fail(`not a valid URL: ${values.url}`);
    }
    if (url.protocol !== 'https:') fail('the URL must start with https://');
    const src = resolve(values.logo.replace(/^~(?=\/)/, process.env.HOME ?? '~'));
    if (!existsSync(src)) fail(`logo file not found: ${src}`);

    const id = values.id ?? slug(values.name);
    if (!id) fail('could not make an id from the name; pass --id');
    const doc = load();
    if (entries(doc).some((item) => get(item, 'id') === id)) fail(`a client with id "${id}" already exists`);

    const ext = extname(src).toLowerCase();
    let logo;
    if (ext === '.svg') {
      logo = `${id}.svg`;
      writeFileSync(join(ASSETS, logo), cleanSvg(readFileSync(src, 'utf8'), src));
    } else if (RASTER.has(ext)) {
      logo = `${id}${ext === '.jpeg' ? '.jpg' : ext}`;
      copyFileSync(src, join(ASSETS, logo));
      const width = rasterWidth(src);
      if (width !== undefined && width < 300) {
        console.warn(`warning: ${basename(src)} is only ${width}px wide and may look soft on high-DPI screens`);
      }
    } else {
      fail(`unsupported logo type ${ext}; use SVG, PNG, WebP or JPEG`);
    }

    const entry = { id, order: entries(doc).length + 1, name: values.name, url: url.href, logo };
    if (values.scale) {
      const scale = Number(values.scale);
      if (!(scale > 0)) fail('--scale must be a positive number');
      entry.scale = scale;
    }
    doc.contents.items.push(doc.createNode(entry));
    save(doc);
    console.log(`Added ${values.name} (${id}) as src/assets/clients/${logo}`);
    break;
  }

  case 'remove': {
    const [id] = rest;
    if (!id) fail('remove needs a client id (see: npm run clients -- list)');
    const doc = load();
    const index = entries(doc).findIndex((item) => get(item, 'id') === id);
    if (index < 0) fail(`no client with id "${id}"`);
    const logo = get(entries(doc)[index], 'logo');
    doc.contents.items.splice(index, 1);
    save(doc);
    const stillUsed = entries(doc).some((item) => get(item, 'logo') === logo);
    if (!stillUsed) rmSync(join(ASSETS, logo), { force: true });
    console.log(`Removed ${id}${stillUsed ? '' : ` and src/assets/clients/${logo}`}`);
    break;
  }

  case 'move': {
    const [id, position] = rest;
    const pos = Number(position);
    if (!id || !Number.isInteger(pos) || pos < 1) fail('move needs a client id and a position (1 = first)');
    const doc = load();
    const item = entries(doc).find((i) => get(i, 'id') === id);
    if (!item) fail(`no client with id "${id}"`);
    // Put it just before the item currently at that position
    item.set('order', pos - 0.5 + (pos > get(item, 'order') ? 1 : 0));
    save(doc);
    console.log(`Moved ${id} to position ${Math.min(pos, entries(doc).length)}`);
    break;
  }

  default:
    console.log(`Usage:
  npm run clients -- list
  npm run clients -- add --name "Name" --url https://example.com/ --logo path/to/logo.svg [--scale 0.9] [--id slug]
  npm run clients -- remove <id>
  npm run clients -- move <id> <position>`);
    process.exit(command ? 1 : 0);
}
