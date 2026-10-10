// Único ponto do front que conhece HTTP. Em dev o proxy do Vite manda /api
// para o json-server, por isso não tem URL absoluta no código.

const BASE_URL = '/api';

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    const error = new Error(`A API respondeu ${response.status}`);
    error.status = response.status; // a tela de produto distingue 404 do resto
    throw error;
  }

  return response;
}

// Monta a query do json-server. Chave repetida vira OU:
// ?typeSlug=camiseta&typeSlug=caneca
function buildQuery({ types = [], colors = [], page = 1, perPage = 12 }) {
  const query = new URLSearchParams();

  types.forEach((type) => query.append('typeSlug', type));

  // _like em vez de = porque colorNames é um array: com igualdade o json-server
  // compara o array inteiro e só casa com produtos que tenham uma cor só.
  colors.forEach((color) => query.append('colorNames_like', color));

  query.set('_page', page);
  query.set('_limit', perPage);

  return query.toString();
}

export async function fetchProducts(filters = {}) {
  const perPage = filters.perPage ?? 12;
  const page = Number(filters.page) || 1;

  const response = await request(`/products?${buildQuery({ ...filters, page, perPage })}`);
  const items = await response.json();

  // O json-server devolve o array puro e manda o total no cabeçalho.
  const total = Number(response.headers.get('X-Total-Count')) || items.length;

  return {
    items,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
    },
  };
}

export async function fetchProduct(id) {
  const response = await request(`/products/${id}`);
  return response.json();
}

export async function fetchFilters() {
  const response = await request('/filters');
  return response.json();
}
