<script setup>
import { computed } from 'vue';

import SiteHeader from '@/components/SiteHeader.vue';
import CartDrawer from '@/components/cart/CartDrawer.vue';
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
// trava a rolagem do fundo enquanto a gaveta está aberta
const bodyClass = computed(() => (cart.isOpen ? 'overflow-hidden' : ''));
</script>

<template>
  <div :class="['min-h-screen flex flex-col bg-paper', bodyClass]">
    <SiteHeader />

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-ink/10 py-8 mt-16">
      <div
        class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row
               items-center justify-between gap-3 text-sm text-ink-muted"
      >
        <p>
          Vitrine de demonstração construída sobre dados públicos de
          <a
            href="https://umapenca.com/loja"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-ink underline underline-offset-4 hover:text-banana-dark"
          >
            umapenca.com/loja </a
          >.
        </p>
        <p>Teste técnico front-end</p>
      </div>
    </footer>

    <CartDrawer />
  </div>
</template>
