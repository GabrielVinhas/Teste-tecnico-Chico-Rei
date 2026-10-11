<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import CartLine from '@/components/cart/CartLine.vue';
import { useCartStore } from '@/stores/cart';
import { formatPrice, pluralize } from '@/utils/format';

const cart = useCartStore();
const closeButton = ref(null);

const onKeydown = (event) => {
  if (event.key === 'Escape' && cart.isOpen) cart.close();
};

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

// joga o foco pra dentro da gaveta; sem isso o teclado continua navegando o fundo
watch(
  () => cart.isOpen,
  async (open) => {
    if (!open) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    closeButton.value?.focus();
  },
);
</script>

<template>
  <div>
    <transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-class="opacity-0"
      leave-active-class="transition-opacity duration-200 ease-out"
      leave-to-class="opacity-0"
    >
      <div
        v-if="cart.isOpen"
        class="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]"
        @click="cart.close()"
      />
    </transition>

    <transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-class="translate-x-full"
      leave-active-class="transition-transform duration-200 ease-out"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="cart.isOpen"
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col
               bg-paper shadow-drawer sm:max-w-sm md:max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-carrinho"
      >
        <header class="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          <h2 id="titulo-carrinho" class="font-display text-lg font-bold">
            Seu carrinho
          </h2>
          <span v-if="cart.count" class="text-sm text-ink-muted">
            {{ pluralize(cart.count, 'item', 'itens') }}
          </span>

          <button
            ref="closeButton"
            type="button"
            class="ml-auto grid h-9 w-9 place-items-center rounded-full
                   text-ink-soft transition hover:bg-paper-deep hover:text-ink"
            aria-label="Fechar carrinho"
            @click="cart.close()"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <!-- Vazio -->
        <div
          v-if="cart.isEmpty"
          class="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center"
        >
          <span class="text-4xl" aria-hidden="true">🧺</span>
          <p class="font-display text-lg font-bold">Ainda não tem nada aqui</p>
          <p class="text-sm text-ink-muted">
            Escolha uma peça na vitrine, defina cor e tamanho, e ela aparece neste espaço.
          </p>
          <button type="button" class="btn-ghost mt-2" @click="cart.close()">
            Voltar à vitrine
          </button>
        </div>

        <template v-else>
          <ul class="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
            <CartLine v-for="item in cart.items" :key="item.key" :item="item" />
          </ul>

          <footer class="border-t border-ink/10 bg-paper-dim px-5 py-4">
            <div class="flex items-baseline justify-between">
              <span class="text-sm font-medium text-ink-soft">Subtotal</span>
              <strong class="font-display text-2xl font-extrabold tabular-nums">
                {{ formatPrice(cart.subtotal) }}
              </strong>
            </div>
            <p class="mt-1 text-xs text-ink-muted">
              Frete e descontos são calculados na finalização.
            </p>

            <button type="button" class="btn-primary mt-4 w-full" disabled>
              Finalizar compra
            </button>
            <button
              type="button"
              class="mt-2 w-full py-1 text-xs font-medium text-ink-muted
                     underline underline-offset-4 hover:text-clay"
              @click="cart.clear()"
            >
              Esvaziar carrinho
            </button>
          </footer>
        </template>
      </aside>
    </transition>
  </div>
</template>
