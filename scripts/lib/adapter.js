export const CANONICAL_COLORS = [
  { id: 8, name: 'Preto', slug: 'preto', hex: '#000000' },
  { id: 3, name: 'Branco', slug: 'branco', hex: '#FFFFFF' },
  { id: 13, name: 'Mescla', slug: 'mescla', hex: '#B3B5B7' },
  { id: 2, name: 'Azul', slug: 'azul', hex: '#455491' },
  { id: 11, name: 'Verde', slug: 'verde', hex: '#79A675' },
  { id: 12, name: 'Vermelho', slug: 'vermelho', hex: '#CB3921' },
  { id: 1, name: 'Amarelo', slug: 'amarelo', hex: '#F2D848' },
  { id: 5, name: 'Bege', slug: 'bege', hex: '#F4F3D2' },
  { id: 7, name: 'Marrom', slug: 'marrom', hex: '#673F3F' },
  { id: 14, name: 'Multicolorido', slug: 'multicolorido', hex: '#5E5B5D' },
];

const COLOR_BY_ID = new Map(CANONICAL_COLORS.map((color) => [color.id, color]));

const ADULT_SIZES = ['PP', 'P', 'M', 'G', 'GG', '2GG', '3GG', '4GG'];
const CHILD_SIZES = ['2', '4', '6', '8', '10', '12', '14'];
const SINGLE_SIZE = ['Único'];

export const slugify = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stripHtml = (html) =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

function cleanName(rawName, typeName) {
  const name = String(rawName ?? '').trim();
  if (!typeName) return name;

  const prefix = `${typeName} `;
  return name.toLowerCase().startsWith(prefix.toLowerCase())
    ? name.slice(prefix.length).trim() || name
    : name;
}

function extractColors(variations) {
  const byId = new Map();

  for (const variation of variations) {
    const id = variation.product_color_id ?? variation.color_id;
    if (id == null || byId.has(id)) continue;

    const canonical = COLOR_BY_ID.get(variation.color_id);
    byId.set(id, {
      id,
      name: variation.product_color_name ?? variation.color_name ?? 'Única',
      hex: variation.product_color_hexa ?? canonical?.hex ?? '#CCCCCC',
      canonicalId: variation.color_id ?? null,
      canonicalName: canonical?.name ?? variation.color_name ?? 'Multicolorido',
      fabricId: variation.fabric_id ?? null,
    });
  }

  return [...byId.values()];
}

function extractSizes(variations) {
  const seen = new Map();
  for (const variation of variations) {
    const name = variation.size_name;
    if (name && !seen.has(name)) seen.set(name, { name, slug: slugify(name) });
  }
  return [...seen.values()];
}

function mapSizesByColor(variations) {
  const map = {};

  for (const variation of variations) {
    const colorId = variation.product_color_id ?? variation.color_id;
    if (colorId == null || !variation.size_name) continue;

    map[colorId] ??= [];
    if (!map[colorId].includes(variation.size_name)) {
      map[colorId].push(variation.size_name);
    }
  }

  return map;
}

function mapImagesByColor(product, colors) {
  const colorByFabric = new Map(
    (product.fabrics ?? []).map((fabric) => [fabric.id, fabric.product_color_id]),
  );
  const map = {};

  for (const image of product.images ?? []) {
    const colorId = colorByFabric.get(image.fabric_id);
    if (colorId == null || map[colorId] || !image.url) continue;
    map[colorId] = image.url;
  }

  for (const color of colors) map[color.id] ??= product.img_cover;
  return map;
}

function buildDescription(product) {
  const info = stripHtml(product.info);
  const observations = String(product.type?.observations ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  if (info) {
    return { text: [info, ...observations].join('\n'), source: 'scraped' };
  }

  const typeName = product.type?.name ?? 'Produto';
  const storeName = product.store?.name;
  const generated =
    `${typeName} da linha ${storeName ?? 'Uma Penca'}, produzida sob demanda pela Uma Penca.` +
    ' A descrição detalhada não foi publicada pela loja parceira.';

  return { text: [generated, ...observations].join('\n'), source: 'derived' };
}

function fallbackSizes(product) {
  if (!product.is_clothing) return SINGLE_SIZE;
  const typeUrl = product.type?.url ?? '';
  return typeUrl.includes('infantil') ? CHILD_SIZES : ADULT_SIZES;
}

function fallbackColors(product) {
  const declared = product.product_color ?? product.color;
  const canonical = COLOR_BY_ID.get(declared?.cor_id ?? declared?.id) ??
    COLOR_BY_ID.get(14);

  return [
    {
      id: declared?.id ?? canonical.id,
      name: declared?.name ?? canonical.name,
      hex: declared?.hexa ?? canonical.hex ?? '#5E5B5D',
      canonicalId: canonical.id,
      canonicalName: canonical.name,
      fabricId: null,
    },
  ];
}

// listing = item da listagem; detail = ELASTIC_PRODUCT da página do produto
export function adaptProduct(listing, detail = null) {
  const source = detail ?? listing;
  const variations = detail?.variations ?? [];

  const enrichment = { colors: 'scraped', sizes: 'scraped', description: 'scraped' };

  let colors = extractColors(variations);
  if (colors.length === 0) {
    colors = fallbackColors(source);
    enrichment.colors = 'derived';
  }

  let sizes = extractSizes(variations);
  if (sizes.length === 0) {
    sizes = fallbackSizes(source).map((name) => ({ name, slug: slugify(name) }));
    enrichment.sizes = 'derived';
  }

  const description = buildDescription(source);
  enrichment.description = description.source;

  const sizesByColor =
    enrichment.colors === 'scraped' && enrichment.sizes === 'scraped'
      ? mapSizesByColor(variations)
      : Object.fromEntries(colors.map((c) => [c.id, sizes.map((s) => s.name)]));

  const typeName = source.type?.name ?? 'Produto';
  const name = cleanName(source.name, typeName);

  return {
    id: source.id,
    name,
    slug: slugify(`${name}-${source.id}`),
    price: Number(source.price) || 0,
    priceOld: Number(source.price_old) || 0,
    type: {
      id: source.type?.id ?? null,
      name: typeName,
      slug: source.type?.url ?? slugify(typeName),
    },
    store: {
      name: source.store?.name ?? 'Uma Penca',
      slug: source.store?.url ?? 'uma-penca',
    },

    // Campos repetidos em formato simples porque o json-server só filtra por
    // igualdade num campo raso — ele não entra em objeto nem em array de objetos.
    typeSlug: source.type?.url ?? slugify(typeName),
    colorNames: [...new Set(colors.map((color) => color.canonicalName))],

    image: source.img_cover ?? listing.img_cover ?? null,
    imagesByColor: mapImagesByColor(source, colors),
    description: description.text,
    colors,
    sizes,
    sizesByColor,
    isNew: Boolean(source.is_new),
    isClothing: Boolean(source.is_clothing),
    sourceUrl: source.full_link ?? `https://umapenca.com${source.link ?? ''}`,
    enrichment,
  };
}

// as opções de filtro saem dos produtos coletados, não de uma lista fixa
export function buildFilters(products) {
  const types = new Map();
  const colors = new Map();

  for (const product of products) {
    if (product.type?.slug && !types.has(product.type.slug)) {
      types.set(product.type.slug, { ...product.type, count: 0 });
    }
    if (product.type?.slug) types.get(product.type.slug).count++;

    for (const color of product.colors) {
      const key = color.canonicalName;
      if (!colors.has(key)) {
        const canonical = COLOR_BY_ID.get(color.canonicalId);
        colors.set(key, {
          id: color.canonicalId,
          name: key,
          slug: slugify(key),
          hex: canonical?.hex ?? color.hex,
          count: 0,
        });
      }
      colors.get(key).count++;
    }
  }

  const byCountDesc = (a, b) => b.count - a.count || a.name.localeCompare(b.name);
  return {
    types: [...types.values()].sort(byCountDesc),
    colors: [...colors.values()].sort(byCountDesc),
  };
}

// REGRAS DE ENRIQUECIMENTO (fallback)
//
// Na prática a fonte entrega cor e tamanho reais de todo produto cujo detalhe foi
// coletado, inclusive os que não são roupa ("325 ml", "A4 - Pautado"). As regras
// abaixo só valem quando o detalhe falhou ou veio sem variações. Nenhuma depende
// de sorteio ou da posição na lista: mesmo insumo, mesma saída.
//
//   cor       -> product_color/color do próprio produto; na falta, Multicolorido
//   tamanho   -> adulto PP..4GG | infantil 2..14 | resto "Único"
//   descrição -> frase montada do tipo + loja, declarando que não houve texto
//
// product.enrichment marca cada campo como 'scraped' ou 'derived'.
