<script setup>
defineProps({
  count: { type: Number, default: 12 },
});
</script>

<template>
  <div
    class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
    aria-hidden="true"
  >
    <div v-for="n in count" :key="n">
      <div class="skeleton aspect-[3/4] w-full rounded-2xl" />
      <div class="mt-3 space-y-2">
        <div class="skeleton h-3 w-20 rounded" />
        <div class="skeleton h-4 w-4/5 rounded" />
        <div class="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  </div>
</template>
