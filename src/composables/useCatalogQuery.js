import { computed } from 'vue';

import { useRoute, useRouter } from '@/composables/useRouter';

// Os filtros vivem na query string, não em estado local. É o que faz a busca
// filtrada ser compartilhável, sobreviver ao recarregamento e deixar o botão
// voltar do navegador desfazer um filtro.

const toArray = (value) => {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
};

export function useCatalogQuery() {
  const route = useRoute();
  const router = useRouter();

  const selectedTypes = computed(() => toArray(route.value.query.type));
  const selectedColors = computed(() => toArray(route.value.query.color));
  const page = computed(() => Math.max(Number(route.value.query.page) || 1, 1));

  const apiParams = computed(() => ({
    types: selectedTypes.value,
    colors: selectedColors.value,
    page: page.value,
    perPage: 12,
  }));

  function apply(changes, { resetPage = true } = {}) {
    const next = { ...route.value.query, ...changes };
    if (resetPage) delete next.page;

    // chave vazia não entra na URL: a barra de endereço fica legível
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      }
    }

    // vue-router 3 rejeita push pra rota atual com NavigationDuplicated
    router.push({ name: 'catalog', query: next }).catch(() => {});
  }

  const toggle = (key, value) => {
    const current = toArray(route.value.query[key]);
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    apply({ [key]: next });
  };

  return {
    selectedTypes,
    selectedColors,
    page,
    apiParams,
    toggleType: (slug) => toggle('type', slug),
    toggleColor: (slug) => toggle('color', slug),
    setPage: (value) => apply({ page: value > 1 ? value : undefined }, { resetPage: false }),
    clear: (dimension) => apply(dimension ? { [dimension]: [] } : { type: [], color: [] }),
  };
}
