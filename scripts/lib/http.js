// O robots.txt do site pede Crawl-delay: 5. O teste exigia 1s, mas quando o site
// pede mais quem manda é o site, então o padrão aqui é 5s.

export const DEFAULT_DELAY_MS = 5000;

const USER_AGENT =
  'uma-penca-store-scraper/1.0 (teste tecnico front-end; contato via GitHub)';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Enfileira tudo: como todo o scraping passa por aqui, nenhuma chamada esquecida
// fura a fila e bombardeia o servidor.
export class PoliteClient {
  constructor({ delayMs = DEFAULT_DELAY_MS, retries = 3, timeoutMs = 30000 } = {}) {
    this.delayMs = delayMs;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
    this.lastRequestAt = 0;
    this.requestCount = 0;
    this.queue = Promise.resolve();
  }

  // enfileira pra duas requisições nunca correrem em paralelo
  get(url) {
    const result = this.queue.then(() => this.#fetchWithRetry(url));
    // A fila não pode quebrar quando uma requisição falha.
    this.queue = result.catch(() => {});
    return result;
  }

  async #waitForSlot() {
    const elapsed = Date.now() - this.lastRequestAt;
    if (this.lastRequestAt && elapsed < this.delayMs) {
      await sleep(this.delayMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async #fetchWithRetry(url) {
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      await this.#waitForSlot();

      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} em ${url}`);
        }

        this.requestCount++;
        return await response.text();
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          // Backoff exponencial sobre o delay base: 2x, 4x...
          await sleep(this.delayMs * 2 ** attempt);
        }
      }
    }

    throw lastError;
  }
}
