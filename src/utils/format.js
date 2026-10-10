// Intl.NumberFormat é caro e isso roda uma vez por card, a cada render
const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatPrice = (value) => BRL.format(Number(value) || 0);

export const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
