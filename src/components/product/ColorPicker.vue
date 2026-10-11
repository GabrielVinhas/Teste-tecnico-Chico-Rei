<script setup>
defineProps({
  colors: { type: Array, required: true },
  value: { type: Object, default: null },
});

defineEmits(['input']);
</script>

<template>
  <fieldset>
    <legend class="mb-2 flex items-baseline gap-2 text-sm font-semibold">
      Cor
      <span v-if="value" class="font-normal text-ink-muted">{{ value.name }}</span>
      <span v-else class="font-normal text-clay">escolha uma</span>
    </legend>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="color in colors"
        :key="color.id"
        type="button"
        class="group relative grid h-11 w-11 place-items-center rounded-full
               transition duration-200 ease-out hover:scale-105"
        :aria-pressed="String(value && value.id === color.id)"
        :title="color.name"
        @click="$emit('input', color)"
      >
        <span
          class="h-8 w-8 rounded-full ring-1 ring-inset ring-ink/20"
          :style="{ backgroundColor: color.hex }"
        />
        <span
          v-if="value && value.id === color.id"
          class="absolute inset-0 rounded-full ring-2 ring-ink ring-offset-2 ring-offset-paper"
        />
        <span class="sr-only">{{ color.name }}</span>
      </button>
    </div>
  </fieldset>
</template>
