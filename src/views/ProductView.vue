<script setup>
import { computed, ref, watch } from 'vue';

import ColorPicker from '@/components/product/ColorPicker.vue';
import SizePicker from '@/components/product/SizePicker.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import { useRouter } from '@/composables/useRouter';
import { useCartStore } from '@/stores/cart';
import { useProductStore } from '@/stores/product';
import { formatPrice } from '@/utils/format';
import { imageSrcSet, imageUrl } from '@/utils/image';

const props = defineProps({
  id: { type: [String, Number], required: true },
});

const store = useProductStore();
const cart = useCartStore();
const router = useRouter();

const selectedColor = ref(null);
const selectedSize = ref('');
const justAdded = ref(false);

// abrir direto, recarregar ou trocar de produto passa tudo por aqui
watch(
  () => props.id,
  (id) => {
    selectedColor.value = null;
    selectedSize.value = '';
    store.load(id);
  },
  { immediate: true },
);

const product = computed(() => store.current);

const HERO_IMAGE = { width: 720, height: 960 };

// a foto segue a cor escolhida; sem cor, mostra a capa
const heroSource = computed(() => {
  if (!product.value) return '';
  const byColor = selectedColor.value
    ? product.value.imagesByColor?.[selectedColor.value.id]
    : null;
  return byColor ?? product.value.image;
});

const hero = computed(() => imageUrl(heroSource.value, HERO_IMAGE));
const heroSrcSet = computed(() => imageSrcSet(heroSource.value, HERO_IMAGE));

// tamanhos que existem na cor escolhida
const availableSizes = computed(() => {
  if (!product.value || !selectedColor.value) return [];
  return product.value.sizesByColor?.[selectedColor.value.id] ?? [];
});

// trocar a cor pode invalidar o tamanho já marcado
watch(selectedColor, () => {
  if (selectedSize.value && !availableSizes.value.includes(selectedSize.value)) {
    selectedSize.value = '';
  }
});

const canAddToCart = computed(() => Boolean(selectedColor.value && selectedSize.value));

// dizer o que falta é melhor que só apagar o botão
const missingSelection = computed(() => {
  const missing = [];
  if (!selectedColor.value) missing.push('a cor');
  if (!selectedSize.value) missing.push('o tamanho');
  return missing.join(' e ');
});

const descriptionLines = computed(() =>
  (product.value?.description ?? '').split('\n').filter(Boolean),
);

let feedbackTimer;
function addToCart() {
  if (!canAddToCart.value) return;

  cart.add(product.value, { color: selectedColor.value, size: selectedSize.value });

  justAdded.value = true;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    justAdded.value = false;
  }, 2200);
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <!-- Carregando -->
    <div v-if="store.isLoading" class="grid gap-10 lg:grid-cols-2">
      <div class="skeleton aspect-[3/4] w-full rounded-3xl" />
      <div class="space-y-4 pt-4">
        <div class="skeleton h-4 w-28 rounded" />
        <div class="skeleton h-9 w-4/5 rounded" />
        <div class="skeleton h-7 w-32 rounded" />
        <div class="skeleton h-24 w-full rounded-xl" />
        <div class="skeleton h-12 w-full rounded-full" />
      </div>
    </div>

    <StateMessage
      v-else-if="store.notFound"
      icon="🫥"
      title="Produto não encontrado"
      description="Esse produto não está no catálogo coletado. Ele pode ter saído da vitrine desde a última coleta."
      action-label="Ver a vitrine"
      @action="router.push({ name: 'catalog' })"
    />

    <StateMessage
      v-else-if="store.hasError"
      icon="📡"
      title="Não conseguimos carregar este produto"
      :description="store.error && store.error.message"
      action-label="Tentar de novo"
      @action="store.load(id)"
    />

    <template v-else-if="product">
      <nav class="mb-6 text-sm text-ink-muted" aria-label="Você está em">
        <RouterLink :to="{ name: 'catalog' }" class="hover:text-ink">Loja</RouterLink>
        <span class="mx-1.5" aria-hidden="true">/</span>
        <RouterLink
          :to="{ name: 'catalog', query: { type: product.type.slug } }"
          class="hover:text-ink"
          >{{ product.type.name }}</RouterLink
        >
        <span class="mx-1.5" aria-hidden="true">/</span>
        <span class="text-ink-soft">{{ product.name }}</span>
      </nav>

      <div class="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div class="lg:sticky lg:top-24 lg:self-start">
          <div class="overflow-hidden rounded-3xl bg-paper-deep shadow-card">
            <img
              :key="heroSource"
              :src="hero"
              :srcset="heroSrcSet"
              :alt="`${product.name}${selectedColor ? ` na cor ${selectedColor.name}` : ''}`"
              :width="HERO_IMAGE.width"
              :height="HERO_IMAGE.height"
              fetchpriority="high"
              decoding="async"
              class="aspect-[3/4] w-full animate-fade-up object-cover"
            />
          </div>
        </div>

        <div class="flex flex-col">
          <p class="text-sm font-medium text-ink-muted">
            {{ product.type.name }} · @{{ product.store.name }}
          </p>

          <h1 class="mt-1 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {{ product.name }}
          </h1>

          <p class="mt-3 font-display text-3xl font-extrabold tabular-nums">
            {{ formatPrice(product.price) }}
          </p>

          <div class="mt-8 space-y-6">
            <ColorPicker
              :colors="product.colors"
              :value="selectedColor"
              @input="selectedColor = $event"
            />

            <SizePicker
              :sizes="product.sizes"
              :value="selectedSize"
              :available="availableSizes"
              @input="selectedSize = $event"
            />
          </div>

          <div class="mt-8">
            <button
              type="button"
              class="btn-primary w-full py-3.5 text-base"
              :disabled="!canAddToCart"
              @click="addToCart"
            >
              <span v-if="justAdded">Adicionado ✓</span>
              <span v-else>Adicionar ao carrinho</span>
            </button>

            <p
              class="mt-2 min-h-[1.25rem] text-center text-sm text-ink-muted"
              aria-live="polite"
            >
              <span v-if="!canAddToCart">Escolha {{ missingSelection }} para continuar.</span>
              <span v-else-if="justAdded" class="font-medium text-leaf">
                Item adicionado ao carrinho.
              </span>
            </p>
          </div>

          <section v-if="descriptionLines.length" class="mt-8 border-t border-ink/10 pt-6">
            <h2 class="font-display text-lg font-bold">Sobre o produto</h2>
            <div class="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
              <p v-for="(line, index) in descriptionLines" :key="index">{{ line }}</p>
            </div>

            <!-- se a descrição não veio da loja parceira, avisamos em vez de fingir -->
            <p
              v-if="product.enrichment.description === 'derived'"
              class="mt-3 text-xs italic text-ink-muted"
            >
              Descrição gerada a partir do tipo de produto — a loja parceira não
              publicou um texto próprio.
            </p>
          </section>

          <p class="mt-6 text-xs text-ink-muted">
            <a
              :href="product.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-4 hover:text-ink"
            >
              Ver este produto na Uma Penca
            </a>
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
