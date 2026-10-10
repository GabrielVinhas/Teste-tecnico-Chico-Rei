import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { fetchFilters, fetchProducts } from '@/services/api';

// Guarda o resultado da listagem. A seleção de filtros não mora aqui: ela vive
// na query string da rota, e a view só lê a URL e chama load().
export const useCatalogStore = defineStore('catalog', () => {
  const items = ref([]);
  const pagination = ref({ page: 1, perPage: 12, total: 0, totalPages: 1 });
  const status = ref('idle'); // idle | loading | ready | error
  const error = ref(null);

  const filters = ref({ types: [], colors: [] });

  const isLoading = computed(() => status.value === 'loading');
  const isEmpty = computed(() => status.value === 'ready' && items.value.length === 0);
  const hasError = computed(() => status.value === 'error');

  async function load(params = {}) {
    status.value = 'loading';
    error.value = null;

    try {
      const data = await fetchProducts(params);
      items.value = data.items;
      pagination.value = data.pagination;
      status.value = 'ready';
    } catch (requestError) {
      error.value = requestError.message;
      items.value = [];
      status.value = 'error';
    }
  }

  async function loadFilters() {
    try {
      const data = await fetchFilters();
      filters.value = { types: data.types ?? [], colors: data.colors ?? [] };
    } catch {
      // sem os filtros a vitrine ainda funciona; não vale derrubar a tela por isso
      filters.value = { types: [], colors: [] };
    }
  }

  return {
    items,
    pagination,
    status,
    error,
    filters,
    isLoading,
    isEmpty,
    hasError,
    load,
    loadFilters,
  };
});
