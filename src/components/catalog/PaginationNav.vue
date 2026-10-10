<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});

const emit = defineEmits(['change']);

const pages = computed(() => {
  const { page, totalPages } = props;
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const window = new Set([1, totalPages, page, page - 1, page + 1]);
  const visible = [...window]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  return visible.flatMap((value, index) => {
    const previous = visible[index - 1];
    return previous && value - previous > 1 ? [null, value] : [value];
  });
});
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-1.5 pt-12"
    aria-label="Paginação"
  >
    <button
      type="button"
      class="btn-ghost px-3"
      :disabled="page <= 1"
      @click="emit('change', page - 1)"
    >
      <span aria-hidden="true">←</span>
      <span class="sr-only">Página anterior</span>
    </button>

    <template v-for="(value, index) in pages">
      <span
        v-if="value === null"
        :key="`gap-${index}`"
        class="px-1 text-ink-muted"
        aria-hidden="true"
        >…</span
      >
      <button
        v-else
        :key="value"
        type="button"
        class="h-10 min-w-[2.5rem] rounded-full px-2 text-sm font-semibold tabular-nums transition"
        :class=" value === page ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-deep hover:text-ink'"
        :aria-current="value === page ? 'page' : undefined"
        @click="emit('change', value)"
      >
        {{ value }}
      </button>
    </template>

    <button
      type="button"
      class="btn-ghost px-3"
      :disabled="page >= totalPages"
      @click="emit('change', page + 1)"
    >
      <span class="sr-only">Próxima página</span>
      <span aria-hidden="true">→</span>
    </button>
  </nav>
</template>
