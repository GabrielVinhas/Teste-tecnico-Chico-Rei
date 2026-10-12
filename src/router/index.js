import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

// listagem entra no bundle inicial; as outras telas carregam sob demanda
import CatalogView from '@/views/CatalogView.vue';

const routes = [
  {
    path: '/',
    name: 'catalog',
    component: CatalogView,
  },
  {
    path: '/produto/:id(\\d+)',
    name: 'product',
    component: () => import('@/views/ProductView.vue'),
    props: true,
  },
  {
    path: '*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export default new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition; // voltar preserva onde o usuário estava

    // trocar de página ou filtro leva ao topo da grade, não ao topo absoluto:
    // a barra de filtros continua à vista
    if (to.name === 'catalog' && from.name === 'catalog') {
      return { selector: '#grade', offset: { x: 0, y: 96 } };
    }

    return { x: 0, y: 0 };
  },
});
