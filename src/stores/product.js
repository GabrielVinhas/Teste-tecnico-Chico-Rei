import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { fetchProduct } from '@/services/api';

// O produto aberto na página de detalhe.
export const useProductStore = defineStore('product', () => {
  const current = ref(null);
  const status = ref('idle'); // idle | loading | ready | error
  const error = ref(null);

  const isLoading = computed(() => status.value === 'loading');
  const hasError = computed(() => status.value === 'error');
  const notFound = computed(() => status.value === 'error' && error.value?.status === 404);

  async function load(id) {
    current.value = null;
    status.value = 'loading';
    error.value = null;

    try {
      current.value = await fetchProduct(id);
      status.value = 'ready';
    } catch (requestError) {
      error.value = { message: requestError.message, status: requestError.status };
      status.value = 'error';
    }
  }

  return { current, status, error, isLoading, hasError, notFound, load };
});
