<script setup>
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
    <div class="mx-auto flex justify-between h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
      <RouterLink
        :to="{ name: 'catalog' }"
        class="group flex items-center gap-2.5 rounded-full py-1 pr-2"
        aria-label="Uma Penca, ir para a listagem"
      >
        <span
          class="grid h-9 w-9 place-items-center rounded-full bg-banana text-lg transition-transform duration-300 ease-out group-hover:-rotate-12"
          aria-hidden="true"
        >
          🍌
        </span>

        <span class="font-display text-lg font-extrabold leading-none tracking-tight">
          Uma Penca
        </span>
      </RouterLink>

      <button
        type="button"
        class="btn-ghost relative ml-auto sm:ml-0"
        :aria-label="`Abrir carrinho, ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}`"
        @click="cart.open()"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span class="hidden sm:inline">Carrinho</span>

        <span
          v-if="cart.count"
          class="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center
                 rounded-full bg-clay px-1 text-[11px] font-bold text-paper"
          >{{ cart.count }}</span
        >
      </button>
    </div>
  </header>
</template>
