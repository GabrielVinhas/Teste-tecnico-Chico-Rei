<script setup>
import { computed } from 'vue';

import { formatPrice } from '@/utils/format';
import { imageSrcSet, imageUrl } from '@/utils/image';

const props = defineProps({
  product: { type: Object, required: true },
  // os primeiros cards estão acima da dobra: carregam sem lazy
  eager: { type: Boolean, default: false },
});

const CARD_IMAGE = { width: 320, height: 420 };

const cover = computed(() => imageUrl(props.product.image, CARD_IMAGE));
const coverSrcSet = computed(() => imageSrcSet(props.product.image, CARD_IMAGE));

const MAX_SWATCHES = 5;
const swatches = computed(() => props.product.colors.slice(0, MAX_SWATCHES));
const extraColors = computed(() =>
  Math.max(props.product.colors.length - MAX_SWATCHES, 0),
);
</script>

<template>
  <article class="group relative">
    <RouterLink
      :to="{ name: 'product', params: { id: product.id } }"
      class="block focus-visible:outline-none"
    >
      <span class="absolute inset-0 z-10 rounded-2xl" aria-hidden="true" />

      <div class="relative overflow-hidden rounded-2xl bg-paper-deep shadow-card transition-shadow duration-300 ease-out group-hover:shadow-lift">
        <img
          :src="cover"
          :srcset="coverSrcSet"
          :alt="product.name"
          :width="CARD_IMAGE.width"
          :height="CARD_IMAGE.height"
          :loading="eager ? 'eager' : 'lazy'"
          :fetchpriority="eager ? 'high' : 'auto'"
          decoding="async"
          class="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        <span v-if="product.isNew"class="absolute left-3 top-3 rounded-full bg-banana px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
          Nova
        </span>

        <span class="absolute bottom-3 left-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold text-ink-soft backdrop-blur-sm">
          {{ product.type.name }}
        </span>
      </div>

      <div class="mt-3 space-y-1">
        <p class="text-xs font-medium text-ink-muted">@{{ product.store.name }}</p>

        <h3
          class="line-clamp-2 font-display text-[15px] font-bold leading-snug transition-colors duration-200 group-hover:text-banana-dark">
          {{ product.name }}
        </h3>
        
        <p class="font-display text-lg font-extrabold tabular-nums">
          {{ formatPrice(product.price) }}
        </p>
      </div>
    </RouterLink>

    <div v-if="product.colors.length" class="mt-2 flex items-center gap-1.5">
      <span
        v-for="color in swatches"
        :key="color.id"
        class="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-ink/20"
        :style="{ backgroundColor: color.hex }"
        :title="color.name"
      />
      <span v-if="extraColors" class="text-[11px] font-medium text-ink-muted">
        +{{ extraColors }}
      </span>
      <span class="sr-only">
        Cores disponíveis: {{ product.colors.map((c) => c.name).join(', ') }}
      </span>
    </div>
  </article>
</template>
