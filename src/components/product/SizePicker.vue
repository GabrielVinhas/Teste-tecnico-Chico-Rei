<script setup>
const props = defineProps({
  sizes: { type: Array, required: true },
  value: { type: String, default: '' },
  available: { type: Array, default: () => [] },
});

defineEmits(['input']);

const isAvailable = (name) => props.available.length === 0 || props.available.includes(name);
</script>

<template>
  <fieldset>
    <legend class="mb-2 flex items-baseline gap-2 text-sm font-semibold">
      Tamanho
      <span v-if="value" class="font-normal text-ink-muted">{{ value }}</span>
      <span v-else class="font-normal text-clay">escolha um</span>
    </legend>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="size in sizes"
        :key="size.slug"
        type="button"
        class="min-w-[3rem] rounded-xl border px-3 py-2 text-sm font-semibold
               transition duration-200 ease-out disabled:cursor-not-allowed
               disabled:border-ink/10 disabled:bg-paper-dim disabled:text-ink-muted/50
               disabled:line-through"
        :class="value === size.name ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-paper text-ink hover:border-ink/40'"
        :disabled="!isAvailable(size.name)"
        :aria-pressed="String(value === size.name)"
        @click="$emit('input', size.name)"
      >
        {{ size.name }}
      </button>
    </div>
  </fieldset>
</template>
