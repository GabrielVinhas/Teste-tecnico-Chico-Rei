import { computed, getCurrentInstance } from 'vue';

// vue-router 3 não tem useRoute/useRouter (só a v4, do Vue 3). Como aqui tudo é
// Composition API, estes atalhos evitam this.$router espalhado pelos componentes.

export function useRouter() {
  const instance = getCurrentInstance();
  if (!instance) throw new Error('useRouter precisa ser chamado dentro de setup()');
  return instance.proxy.$router;
}

export function useRoute() {
  const instance = getCurrentInstance();
  if (!instance) throw new Error('useRoute precisa ser chamado dentro de setup()');
  // $route já é reativo; o computed só repassa com a ergonomia da v4
  return computed(() => instance.proxy.$route);
}
