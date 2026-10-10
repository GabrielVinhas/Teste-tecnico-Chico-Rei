<script setup>
import { onMounted, watch } from 'vue';

import FilterBar from '@/components/catalog/FilterBar.vue';
import PaginationNav from '@/components/catalog/PaginationNav.vue';
import ProductCard from '@/components/catalog/ProductCard.vue';
import ProductGridSkeleton from '@/components/catalog/ProductGridSkeleton.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import { useCatalogQuery } from '@/composables/useCatalogQuery';
import { useCatalogStore } from '@/stores/catalog';

const catalog = useCatalogStore();

const {
  selectedTypes,
  selectedColors,
  apiParams,
  toggleType,
  toggleColor,
  setPage,
  clear,
} = useCatalogQuery();

// a rota manda: filtro, busca e página chegam como query string e disparam uma busca
watch(apiParams, (params) => catalog.load(params), { immediate: true });

onMounted(() => catalog.loadFilters());

const retry = () => catalog.load(apiParams.value);
</script>

<template>
  <div>
    <!-- abertura da vitrine: é aqui e na grade que mora a identidade da tela -->
    <section class="relative overflow-hidden border-b border-ink/10 bg-paper-dim">
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full
               bg-banana/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full
               bg-leaf/10 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p
          class="mb-3 inline-flex items-center gap-2 rounded-full border border-ink/15
                 bg-paper px-3 py-1 text-xs font-semibold text-ink-soft"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-leaf" aria-hidden="true" />
          Feito sob demanda em Juiz de Fora
        </p>

        <h1
          class="max-w-3xl font-display text-4xl font-extrabold leading-[1.05]
                 tracking-tight sm:text-5xl lg:text-6xl"
        >
          Uma penca de ideias
          <span class="relative inline-block">
            <span class="relative z-10">vestíveis</span>
            <span
              class="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 bg-banana/60 sm:h-4"
              aria-hidden="true"
            />
          </span>
        </h1>

        <p class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
          Camisetas, moletons, canecas e cadernos criados por gente que vive de
          fazer arte. Escolha o tipo, escolha a cor, leve para casa.
        </p>
      </div>
    </section>

    <!-- gruda abaixo do cabeçalho pra trocar filtro sem voltar ao topo -->
    <div
      class="sticky top-16 z-20 border-b border-ink/10 bg-paper/90 py-4 backdrop-blur-md"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterBar
          :types="catalog.filters.types"
          :colors="catalog.filters.colors"
          :selected-types="selectedTypes"
          :selected-colors="selectedColors"
          :total="catalog.pagination.total"
          :loading="catalog.isLoading"
          @toggle-type="toggleType"
          @toggle-color="toggleColor"
          @clear="clear"
        />
      </div>
    </div>

    <section id="grade" class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductGridSkeleton v-if="catalog.isLoading" :count="catalog.pagination.perPage" />

      <StateMessage
        v-else-if="catalog.hasError"
        icon="📡"
        title="Não conseguimos carregar a vitrine"
        :description="catalog.error"
        action-label="Tentar de novo"
        @action="retry"
      />

      <StateMessage
        v-else-if="catalog.isEmpty"
        icon="🔍"
        title="Nenhum produto com esses filtros"
        description="A combinação escolhida não tem resultados. Tente remover a cor ou o tipo selecionado."
        action-label="Limpar filtros"
        @action="clear()"
      />

      <template v-else>
        <ul class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          <li
            v-for="(product, index) in catalog.items"
            :key="product.id"
            class="animate-fade-up"
            :style="{ animationDelay: `${Math.min(index, 7) * 40}ms` }"
          >
            <ProductCard :product="product" :eager="index < 4" />
          </li>
        </ul>

        <PaginationNav
          :page="catalog.pagination.page"
          :total-pages="catalog.pagination.totalPages"
          @change="setPage"
        />
      </template>
    </section>
  </div>
</template>
