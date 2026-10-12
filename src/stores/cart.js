import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

const STORAGE_KEY = 'teste-chico-rei:cart:v1';
const MAX_QUANTITY = 99;

// a linha do carrinho é a variação, não o produto: Preto/M e Preto/G são separados
const lineKey = (productId, colorId, size) => `${productId}::${colorId}::${size}`;

function readStoredItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

    // descarta linha quebrada de versão antiga em vez de derrubar a loja na abertura
    return Array.isArray(stored)
      ? stored.filter((item) => item?.key && Number(item.quantity) > 0)
      : [];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(readStoredItems());
  const isOpen = ref(false);

  const count = computed(() =>
    items.value.reduce((total, item) => total + item.quantity, 0),
  );

  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.price * item.quantity, 0),
  );

  const isEmpty = computed(() => items.value.length === 0);

  function add(product, { color, size, quantity = 1 }) {
    const key = lineKey(product.id, color.id, size);
    const existing = items.value.find((item) => item.key === key);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
    } else {
      items.value.push({
        key,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        typeName: product.type.name,
        storeName: product.store.name,
        image: product.imagesByColor?.[color.id] ?? product.image,
        colorId: color.id,
        colorName: color.name,
        colorHex: color.hex,
        size,
        quantity: Math.min(quantity, MAX_QUANTITY),
      });
    }

    isOpen.value = true;
  }

  function setQuantity(key, quantity) {
    const item = items.value.find((entry) => entry.key === key);
    if (!item) return;

    const next = Math.floor(Number(quantity));
    if (!Number.isFinite(next) || next < 1) return remove(key);

    item.quantity = Math.min(next, MAX_QUANTITY);
  }

  const increment = (key) => {
    const item = items.value.find((entry) => entry.key === key);
    if (item) setQuantity(key, item.quantity + 1);
  };

  const decrement = (key) => {
    const item = items.value.find((entry) => entry.key === key);
    if (item) setQuantity(key, item.quantity - 1);
  };

  function remove(key) {
    items.value = items.value.filter((item) => item.key !== key);
  }

  const clear = () => {
    items.value = [];
  };

  const open = () => {
    isOpen.value = true;
  };
  const close = () => {
    isOpen.value = false;
  };
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  watch(
    items,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // aba anônima ou storage bloqueado: segue só em memória
      }
    },
    { deep: true },
  );

  return {
    items,
    isOpen,
    count,
    subtotal,
    isEmpty,
    add,
    remove,
    setQuantity,
    increment,
    decrement,
    clear,
    open,
    close,
    toggle,
  };
});
