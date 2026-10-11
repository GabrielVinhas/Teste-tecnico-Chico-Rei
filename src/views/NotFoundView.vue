<script setup>
import StateMessage from '@/components/ui/StateMessage.vue';
import { useRouter } from '@/composables/useRouter';

const router = useRouter();
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
    <StateMessage
      icon="🍌"
      title="Essa página não existe"
      description="O endereço que você abriu não corresponde a nenhuma tela da loja."
      action-label="Ir para a vitrine"
      @action="router.push({ name: 'catalog' })"
    />
  </div>
</template>
