<script setup>
defineProps({
  value: { type: Number, required: true },
  label: { type: String, default: 'Quantidade' },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
});

const emit = defineEmits(['increment', 'decrement', 'input']);

const onInput = (event) => {
  const parsed = Number(event.target.value);
  if (Number.isFinite(parsed)) emit('input', parsed);
};
</script>

<template>
  <div
    class="inline-flex items-center rounded-full border border-ink/15 bg-paper"
    role="group"
    :aria-label="label"
  >
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-full text-ink-soft
             transition hover:bg-paper-deep hover:text-ink disabled:opacity-30"
      :disabled="value <= min"
      aria-label="Diminuir quantidade"
      @click="emit('decrement')"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </button>

    <input
      :value="value"
      type="number"
      inputmode="numeric"
      :min="min"
      :max="max"
      :aria-label="label"
      class="w-9 border-0 bg-transparent p-0 text-center text-sm font-semibold
             tabular-nums focus:ring-0 [appearance:textfield]
             [&::-webkit-inner-spin-button]:appearance-none
             [&::-webkit-outer-spin-button]:appearance-none"
      @input="onInput"
    />

    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-full text-ink-soft
             transition hover:bg-paper-deep hover:text-ink disabled:opacity-30"
      :disabled="value >= max"
      aria-label="Aumentar quantidade"
      @click="emit('increment')"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
