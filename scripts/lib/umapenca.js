// A loja é uma SPA: o HTML servido não tem a grade de produtos, quem monta é o JS.
// Mas o estado de hidratação vem embutido no documento, e é dele que lemos:
//   listagem -> window.vueInitialData.products.hits[]
//   produto  -> window.initialScope.ELASTIC_PRODUCT (variations[], info)
// Mais estável que raspar HTML e dispensa navegador headless.

const LISTING_GLOBAL = 'window.vueInitialData';
const PRODUCT_GLOBAL = 'window.initialScope';

// Um indexOf('}') não serve aqui: o payload tem chaves dentro de strings
// (descrição em HTML, URL com query string), então o scanner ignora o que
// está entre aspas e respeita escapes.
function extractAssignedObject(html, globalName) {
  const declaration = html.indexOf(globalName);
  if (declaration === -1) {
    throw new Error(`"${globalName}" não encontrado no HTML`);
  }

  const assignment = html.indexOf('=', declaration);
  const objectStart = html.indexOf('{', assignment);
  if (assignment === -1 || objectStart === -1) {
    throw new Error(`"${globalName}" não é uma atribuição de objeto`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = objectStart; i < html.length; i++) {
    const char = html[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(objectStart, i + 1));
      }
    }
  }

  throw new Error(`objeto de "${globalName}" não fecha`);
}

export function parseListingPage(html) {
  const data = extractAssignedObject(html, LISTING_GLOBAL);
  const products = data.products ?? {};

  return {
    hits: products.hits ?? [],
    currentPage: products.current_page ?? 1,
    totalPages: products.total_pages ?? 1,
    perPage: products.per_page ?? (products.hits ?? []).length,
    filters: data.filters ?? {},
  };
}

export function parseProductPage(html) {
  const scope = extractAssignedObject(html, PRODUCT_GLOBAL);
  const product = scope.ELASTIC_PRODUCT;

  if (!product?.id) {
    throw new Error('ELASTIC_PRODUCT ausente ou sem id');
  }
  return product;
}

export const listingUrl = (page) => `https://umapenca.com/loja/?page=${page}`;
