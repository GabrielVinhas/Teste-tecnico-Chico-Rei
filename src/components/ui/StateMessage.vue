<script setup>
defineProps({
  icon: { type: String, default: '🤔' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
});

defineEmits(['action']);
</script>

<template>
  <div
    class="flex animate-fade-up flex-col items-center justify-center gap-3
           rounded-2xl border border-dashed border-ink/15 px-6 py-16 text-center"
    role="status"
  >
    <span class="text-4xl" aria-hidden="true">{{ icon }}</span>
    <h2 class="font-display text-xl font-bold">{{ title }}</h2>
    <p v-if="description" class="max-w-md text-sm leading-relaxed text-ink-muted">
      {{ description }}
    </p>

    <button
      v-if="actionLabel"
      type="button"
      class="btn-primary mt-2"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>

    <slot />
  </div>
</template>
