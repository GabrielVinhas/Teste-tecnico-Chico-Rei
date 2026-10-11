<script setup>
import { computed } from 'vue';

import QuantityStepper from '@/components/ui/QuantityStepper.vue';
import { useCartStore } from '@/stores/cart';
import { formatPrice } from '@/utils/format';
import { imageUrl } from '@/utils/image';

const props = defineProps({
  item: { type: Object, required: true },
});

const cart = useCartStore();

const thumb = computed(() => imageUrl(props.item.image, { width: 160, height: 200 }));
const lineTotal = computed(() => props.item.price * props.item.quantity);
</script>

<template>
  <li class="flex gap-4 py-4">
    <RouterLink
      :to="{ name: 'product', params: { id: item.productId } }"
      class="shrink-0 overflow-hidden rounded-lg bg-paper-deep"
      @click.native="cart.close()"
    >
      <img
        :src="thumb"
        :alt="item.name"
        width="80"
        height="100"
        loading="lazy"
        decoding="async"
        class="h-[100px] w-20 object-cover"
      />
    </RouterLink>

    <div class="flex min-w-0 flex-1 flex-col">
      <RouterLink
        :to="{ name: 'product', params: { id: item.productId } }"
        class="line-clamp-2 text-sm font-semibold leading-snug hover:text-banana-dark"
        @click.native="cart.close()"
      >
        {{ item.name }}
      </RouterLink>

      <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        <span class="inline-flex items-center gap-1.5">
          <span
            class="h-3 w-3 rounded-full ring-1 ring-inset ring-ink/20"
            :style="{ backgroundColor: item.colorHex }"
            aria-hidden="true"
          />
          {{ item.colorName }}
        </span>
        <span aria-hidden="true">·</span>
        <span>Tam. {{ item.size }}</span>
      </p>

      <div class="mt-auto flex items-end justify-between gap-2 pt-2">
        <QuantityStepper
          :value="item.quantity"
          :label="`Quantidade de ${item.name}, ${item.colorName}, tamanho ${item.size}`"
          @increment="cart.increment(item.key)"
          @decrement="cart.decrement(item.key)"
          @input="cart.setQuantity(item.key, $event)"
        />

        <div class="text-right">
          <strong class="block text-sm font-bold tabular-nums">
            {{ formatPrice(lineTotal) }}
          </strong>
          <span v-if="item.quantity > 1" class="text-[11px] text-ink-muted tabular-nums">
            {{ formatPrice(item.price) }} cada
          </span>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="h-8 w-8 shrink-0 self-start rounded-full text-ink-muted transition hover:bg-clay/10 hover:text-clay"
      :aria-label="`Remover ${item.name}, ${item.colorName}, tamanho ${item.size}`"
      @click="cart.remove(item.key)"
    >
      <svg
        class="mx-auto h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
      </svg>
    </button>
  </li>
</template>
