const DEFAULT_PARAMS = {
  auto: 'compress,format',
  cs: 'origin',
  fit: 'crop',
  q: 65,
};

export function imageUrl(src, { width, height } = {}) {
  if (!src) return '';

  try {
    const url = new URL(src);
    for (const [key, value] of Object.entries(DEFAULT_PARAMS)) {
      url.searchParams.set(key, value);
    }
    if (width) url.searchParams.set('w', String(width));
    if (height) url.searchParams.set('h', String(height));
    return url.toString();
  } catch {
    return src; // URL fora do padrão: devolve como veio em vez de quebrar a imagem
  }
}

export function imageSrcSet(src, { width, height }) {
  if (!src) return '';

  return [1, 2]
    .map((factor) => {
      const url = imageUrl(src, {
        width: width * factor,
        height: height ? height * factor : undefined,
      });
      return `${url} ${factor}x`;
    })
    .join(', ');
}
