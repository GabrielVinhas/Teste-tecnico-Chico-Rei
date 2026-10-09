import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_DELAY_MS, PoliteClient } from './lib/http.js';
import { listingUrl, parseListingPage, parseProductPage } from './lib/umapenca.js';
import { adaptProduct, buildFilters } from './lib/adapter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, '.cache');
const SEED_PATH = path.join(ROOT, 'api', 'seed.json');

// o enunciado limita a 5 páginas de listagem; o clamp garante isso
const MAX_PAGES = 5;

function parseArgs(argv) {
  const flags = Object.fromEntries(
    argv
      .filter((arg) => arg.startsWith('--'))
      .map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
      }),
  );

  return {
    pages: Math.min(Number(flags.pages) || MAX_PAGES, MAX_PAGES),
    delay: Number(flags.delay) || DEFAULT_DELAY_MS,
    limit: Number(flags.limit) || Infinity,
    details: flags['no-details'] !== true,
    refresh: flags.refresh === true,
  };
}

const cachePath = (key) => path.join(CACHE_DIR, `${key}.html`);

// só toca a rede se o arquivo não existe ou veio --refresh
async function fetchCached(client, key, url, { refresh }) {
  const file = cachePath(key);

  if (!refresh && existsSync(file)) {
    return { html: await readFile(file, 'utf8'), cached: true };
  }

  const html = await client.get(url);
  await writeFile(file, html);
  return { html, cached: false };
}

const formatDuration = (ms) => {
  const total = Math.round(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}m${String(total % 60).padStart(2, '0')}s`;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();

  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(path.dirname(SEED_PATH), { recursive: true });

  const client = new PoliteClient({ delayMs: options.delay });

  console.log('Coleta de umapenca.com/loja');
  console.log(
    `  páginas: ${options.pages} · intervalo: ${options.delay}ms · detalhes: ${options.details ? 'sim' : 'não'}`,
  );
  if (options.refresh) console.log('  cache ignorado (--refresh)');
  console.log('');

  // ── 1. Listagem ───────────────────────────────────────────────────────────
  const listings = [];
  let sourceTotalPages = null;

  for (let page = 1; page <= options.pages; page++) {
    const { html, cached } = await fetchCached(
      client,
      `listing-${page}`,
      listingUrl(page),
      options,
    );
    const parsed = parseListingPage(html);
    sourceTotalPages ??= parsed.totalPages;

    listings.push(...parsed.hits);
    console.log(
      `  listagem ${page}/${options.pages}: ${parsed.hits.length} produtos${cached ? ' (cache)' : ''}`,
    );
  }

  // Os itens "personalizados" são a porta de entrada do personalizador da Uma
  // Penca, não peças de vitrine: não têm loja, variações fixas nem página de
  // produto — a URL deles abre o editor de estampa. Ficam fora do catálogo.
  const deduped = [...new Map(listings.map((hit) => [hit.id, hit])).values()];
  const customizable = deduped.filter((hit) => hit.is_customizable);
  const unique = deduped
    .filter((hit) => !hit.is_customizable)
    .slice(0, options.limit);

  console.log(`\n  ${unique.length} produtos únicos coletados`);
  if (customizable.length) {
    console.log(`  ${customizable.length} itens personalizáveis ignorados\n`);
  }

  // ── 2. Detalhe de cada produto ────────────────────────────────────────────
  const products = [];
  const failures = [];

  for (const [index, hit] of unique.entries()) {
    let detail = null;

    if (options.details) {
      const url = hit.full_link ?? `https://umapenca.com${hit.link}`;
      try {
        const { html, cached } = await fetchCached(client, `product-${hit.id}`, url, options);
        detail = parseProductPage(html);
        if (!cached && index % 10 === 0) {
          console.log(`  detalhe ${index + 1}/${unique.length}…`);
        }
      } catch (error) {
        // Um produto sem detalhe não derruba a coleta: ele entra com os dados
        // da listagem e o adapter preenche o que faltar.
        failures.push({ id: hit.id, name: hit.name, reason: error.message });
      }
    }

    products.push(adaptProduct(hit, detail));
  }

  // ── 3. Seed ───────────────────────────────────────────────────────────────
  const derived = (field) => products.filter((p) => p.enrichment[field] === 'derived').length;

  const seed = {
    meta: {
      source: 'https://umapenca.com/loja/',
      collectedAt: new Date().toISOString(),
      listingPages: options.pages,
      sourceTotalPages,
      skippedCustomizable: customizable.length,
      requestDelayMs: options.delay,
      networkRequests: client.requestCount,
      productCount: products.length,
      derived: {
        colors: derived('colors'),
        sizes: derived('sizes'),
        description: derived('description'),
      },
      failures,
    },
    filters: buildFilters(products),
    products,
  };

  await writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`);

  console.log('\nSeed gravado em api/seed.json');
  console.log(`  produtos          : ${products.length}`);
  console.log(`  tipos             : ${seed.filters.types.length}`);
  console.log(`  cores             : ${seed.filters.colors.length}`);
  console.log(`  requisições à rede: ${client.requestCount}`);
  console.log(
    `  dados derivados   : cor ${seed.meta.derived.colors} · tamanho ${seed.meta.derived.sizes} · descrição ${seed.meta.derived.description}`,
  );
  if (failures.length) console.log(`  detalhes que falharam: ${failures.length}`);
  console.log(`  tempo total       : ${formatDuration(Date.now() - startedAt)}`);
}

main().catch((error) => {
  console.error('\nFalha na coleta:', error.message);
  process.exit(1);
});
