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
    meta: { title: 'Loja' },
  },
  {
    path: '/produto/:id(\\d+)',
    name: 'product',
    component: () => import('@/views/ProductView.vue'),
    props: true,
    meta: { title: 'Produto' },
  },
  {
    path: '*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Página não encontrada' },
  },
];

const router = new VueRouter({
  mode: 'history',
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition; // voltar preserva onde o usuário estava

    if (to.name === 'catalog' && from.name === 'catalog') {
      return { selector: '#grade', offset: { x: 0, y: 96 } };
    }

    return { x: 0, y: 0 };
  },
});

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Loja'} — Uma Penca`;
});

export default router;
