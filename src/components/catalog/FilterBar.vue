<script setup>
import { computed } from 'vue';

import { pluralize } from '@/utils/format';

const props = defineProps({
  types: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] },
  selectedTypes: { type: Array, default: () => [] },
  selectedColors: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle-type', 'toggle-color', 'clear']);

const hasFilters = computed(
  () => props.selectedTypes.length > 0 || props.selectedColors.length > 0,
);

const isTypeOn = (slug) => props.selectedTypes.includes(slug);
const isColorOn = (slug) => props.selectedColors.includes(slug);
</script>

<template>
  <section aria-label="Filtros" class="space-y-4">
    <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        type="button"
        :class="selectedTypes.length === 0 ? 'chip-on' : 'chip-off'"
        @click="emit('clear', 'type')"
      >
        Tudo
      </button>

      <button
        v-for="type in types"
        :key="type.slug"
        type="button"
        :class="isTypeOn(type.slug) ? 'chip-on' : 'chip-off'"
        :aria-pressed="String(isTypeOn(type.slug))"
        @click="emit('toggle-type', type.slug)"
      >
        {{ type.name }}
        <span class="text-[11px] opacity-60 tabular-nums">{{ type.count }}</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-ink-soft">Cor</span>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="color in colors"
            :key="color.slug"
            type="button"
            class="group relative grid h-8 w-8 place-items-center rounded-full transition duration-200 ease-out hover:scale-110"
            :aria-pressed="String(isColorOn(color.slug))"
            :title="`${color.name} (${color.count})`"
            @click="emit('toggle-color', color.slug)"
          >
            <span
              class="h-6 w-6 rounded-full ring-1 ring-inset ring-ink/20"
              :style="{ backgroundColor: color.hex }"
            />

            <span
              v-if="isColorOn(color.slug)"
              class="absolute inset-0 rounded-full ring-2 ring-ink ring-offset-1 ring-offset-paper"
            />

            <span class="sr-only">{{ color.name }}</span>
          </button>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <p class="text-sm tabular-nums text-ink-muted" aria-live="polite">
          <span v-if="loading">Buscando…</span>
          <span v-else>{{ pluralize(total, 'produto', 'produtos') }}</span>
        </p>

        <button
          v-if="hasFilters"
          type="button"
          class="text-sm font-semibold text-clay underline underline-offset-4 hover:text-ink"
          @click="emit('clear')"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  </section>
</template>
