# Teste Técnico Chico Rei — mini loja virtual

Vitrine em Vue.js 2.7 inspirada em [umapenca.com/loja](https://umapenca.com/loja):
listagem com filtros combináveis, página de produto com seleção de variações e
carrinho lateral. Os produtos são reais — vêm de um scraping do site, servidos
por uma API própria.

Teste técnico de front-end.

---

## Índice

- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como o scraping foi feito](#como-o-scraping-foi-feito)
- [Regra de enriquecimento dos dados](#regra-de-enriquecimento-dos-dados)
- [A API](#a-api)
- [Arquitetura do front](#arquitetura-do-front)
- [Decisões técnicas e trade-offs](#decisões-técnicas-e-trade-offs)
- [O que ficou de fora](#o-que-ficou-de-fora)
- [Checklist do teste](#checklist-do-teste)

---

## Stack

| Camada | Escolha | Versão |
| --- | --- | --- |
| Runtime | Node.js | 18.20.5 (mínimo 18.17) |
| Framework | Vue.js | 2.7.16 — Composition API nativa, com `<script setup>` |
| Build | Vite + `@vitejs/plugin-vue2` | 5.4.11 / 2.3.1 |
| Rotas | vue-router | 3.6.5 |
| Estado | Pinia | 2.1.7 |
| CSS | Tailwind CSS | 3.4.15 |
| API | json-server | 0.17.4 |

Todas as versões estão fixadas (sem `^`) no `package.json`, para que uma
instalação limpa hoje produza exatamente o mesmo resultado desta entrega.

---

## Como rodar

Pré-requisito: Node 18.17 ou superior.

```bash
npm install
```

**1. Colete os dados** (o repositório já inclui o seed; este passo só é
necessário para regerá-lo):

```bash
npm run scrape
```

A coleta respeita o `Crawl-delay: 5` do site e leva cerca de 15 minutos na
primeira execução. As respostas ficam em `.cache/`, então rodar de novo é
praticamente instantâneo. Veja [opções do scraper](#opções-do-scraper).

**2. Suba a API e o front juntos:**

```bash
npm run dev
```

- Loja: <http://localhost:5173>
- API: <http://localhost:3333/api>

Os dois processos sobem com um comando só (`concurrently`). Para rodá-los
separadamente, use `npm run api` e `npx vite`.

**3. Build de produção:**

```bash
npm run build
npm run api      # em outro terminal — o preview serve só o front
npm run preview
```

> O front usa rotas em modo `history`. `npm run preview` já serve o fallback de
> SPA; ao publicar em outro servidor, aponte todas as rotas para `index.html`,
> senão abrir `/produto/123` direto devolve 404.

---

## Variáveis de ambiente

Nenhuma. O projeto roda com `npm install` e `npm run dev`, sem configuração.

As portas (`5173` para o front, `3333` para a API) estão no `vite.config.js` e
no script `api` do `package.json`. Se alguma estiver ocupada na sua máquina,
troque nesses dois lugares.

Em desenvolvimento o front chama caminhos relativos (`/api/...`) e o Vite faz o
proxy para o json-server — não há URL de API no código nem CORS no caminho.

---

## Como o scraping foi feito

### O problema

`umapenca.com/loja` é uma SPA. O HTML que o servidor devolve **não contém** a
grade de produtos — quem a monta é o bundle Vue no navegador. Procurar por
`li.product-list-item` no HTML cru devolve zero resultados.

### A solução

O que o servidor manda, e é o que lemos, é o **estado de hidratação** da SPA,
embutido no próprio documento:

| Página | Global | Conteúdo |
| --- | --- | --- |
| `/loja/?page=N` | `window.vueInitialData` | `products.hits[]` — id, nome, preço, imagens, tipo, cores, loja |
| Página do produto | `window.initialScope.ELASTIC_PRODUCT` | `variations[]` com cor e tamanho reais, `info` (descrição) |

Ler esse estado é mais estável do que raspar marcação — não quebra quando o time
deles troca uma classe de CSS — e dispensa subir um navegador headless. A coleta
inteira é `fetch` + `JSON.parse`.

### O fluxo

```
listagem (5 páginas)  ->  página de cada produto  ->  adapter  ->  api/seed.json
```

- **`scripts/lib/http.js`** — cliente que serializa as requisições e garante o
  intervalo mínimo entre elas, com retry e backoff exponencial.
- **`scripts/lib/umapenca.js`** — recorta e converte o estado de hidratação.
- **`scripts/lib/adapter.js`** — normaliza e enriquece.
- **`scripts/scrape.js`** — orquestra e grava o seed.

### Boas maneiras

O enunciado pedia no mínimo 1 segundo entre requisições. O `robots.txt` do site
pede mais:

```
User-agent: *
Crawl-delay: 5
```

Quando o site pede mais do que o mínimo, quem manda é o site — **o padrão do
scraper é 5 segundos**. Também respeitamos o teto de 5 páginas de listagem, e
as páginas coletadas não estão sob nenhum `Disallow`.

### Opções do scraper

```bash
node scripts/scrape.js [--pages=5] [--delay=5000] [--limit=N] [--no-details] [--refresh]
```

| Opção | Padrão | Efeito |
| --- | --- | --- |
| `--pages` | `5` | Páginas de listagem (limitado a 5 por código) |
| `--delay` | `5000` | Intervalo entre requisições, em ms |
| `--limit` | sem limite | Corta o número de produtos — útil para testar |
| `--no-details` | desligado | Pula as páginas de produto (rápido, mas sem tamanhos reais) |
| `--refresh` | desligado | Ignora o cache e busca tudo de novo |

### O que fica de fora do catálogo

Os itens marcados como `is_customizable` são a porta de entrada do
personalizador da Uma Penca, não peças de vitrine: não têm loja, nem variações
fixas, e a URL deles abre o editor de estampa em vez de uma página de produto.
São descartados na coleta e contados em `meta.skippedCustomizable`.

---

## Regra de enriquecimento dos dados

O enunciado previa que a listagem pudesse não trazer cor ou tamanho. Na prática,
**a fonte entrega os dois para todo produto cuja página de detalhe foi
coletada** — inclusive os que não são roupa, com tamanhos como `325 ml`,
`A4 - Pautado` ou `Único (45x40 cm)`. Por isso as regras abaixo são um
*fallback* para quando o detalhe falha ou vem sem variações, e não a fonte
principal dos dados.

Elas são determinísticas: não dependem de sorteio nem da posição do produto na
lista, então o mesmo insumo produz sempre a mesma saída.

| Campo | Regra |
| --- | --- |
| **Cor** | Usa `product_color`/`color` declarado no próprio produto. Sem isso, `Multicolorido`. |
| **Tamanho** | Roupa adulta: `PP P M G GG 2GG 3GG 4GG` · Roupa infantil: `2 4 6 8 10 12 14` · Demais tipos: `Único`. O recorte adulto/infantil vem de `is_clothing` e do slug do tipo. |
| **Descrição** | Frase montada a partir do tipo e da loja, declarando que a loja parceira não publicou texto próprio. A interface mostra esse aviso ao usuário. |

Cada produto carrega a origem de cada campo:

```json
"enrichment": { "colors": "scraped", "sizes": "scraped", "description": "derived" }
```

Assim dá para auditar o seed sem adivinhar o que é dado coletado e o que é dado
derivado. O resumo fica em `meta.derived`.

---

## A API

É o `json-server` servindo `api/seed.json`, sem uma linha de código de servidor.
Cada chave do topo do seed vira uma rota:

| Rota | O que devolve |
| --- | --- |
| `GET /api/products` | lista, com filtro e paginação |
| `GET /api/products/:id` | um produto |
| `GET /api/filters` | tipos e cores, com contagem |

Parâmetros usados pelo front:

| Parâmetro | Exemplo | Observação |
| --- | --- | --- |
| `typeSlug` | `?typeSlug=camiseta&typeSlug=caneca` | chave repetida vale OU |
| `colorNames_like` | `?colorNames_like=preto` | `_like` em vez de `=`, veja abaixo |
| `_page` / `_limit` | `?_page=2&_limit=12` | total vem no cabeçalho `X-Total-Count` |

**Filtros são combináveis:** dentro de uma dimensão vale OU (preto **ou** azul),
entre dimensões vale E (camiseta **e** preta).

### Os dois campos achatados

O json-server só filtra por igualdade num campo raso. Como `type` é um objeto e
`colors` é um array de objetos, nenhum dos dois é filtrável — e, pior, o
json-server não dá erro: ele ignora o parâmetro e devolve o catálogo inteiro.

Por isso o adapter repete os dois num formato simples:

```json
"typeSlug": "camiseta",
"colorNames": ["Preto", "Branco", "Azul"]
```

E a cor usa `_like` em vez de `=`: com igualdade o json-server compara o array
inteiro, então `?colorNames=Preto` só casaria com produtos de uma cor só. O
`_like` é regex e insensível a maiúsculas, o que também deixa a URL usar o slug
(`?color=preto`). O risco conhecido é que nenhuma cor da paleta pode ser pedaço
de outra — hoje não é o caso.

---

## Arquitetura do front

```
src/
├── components/
│   ├── catalog/      FilterBar, ProductCard, PaginationNav, ProductGridSkeleton
│   ├── product/      ColorPicker, SizePicker
│   ├── cart/         CartDrawer, CartLine
│   ├── ui/           StateMessage, QuantityStepper
│   └── SiteHeader.vue
├── composables/      useRouter (atalho p/ vue-router 3), useCatalogQuery
├── services/         api.js — único ponto que conhece HTTP
├── stores/           catalog, product, cart
├── utils/            format, image
└── views/            CatalogView, ProductView, NotFoundView
```

A separação que guiou o desenho: **UI** (componentes burros, que recebem props e
emitem eventos), **estado** (stores do Pinia) e **acesso a dados**
(`services/api.js`). Nenhum componente chama `fetch` diretamente.

### Os filtros vivem na URL

A seleção de filtros **não** é estado local — ela é a query string:

```
/?type=camiseta&color=preto&color=azul&page=2
```

A view observa a rota e dispara a busca; a store guarda só o resultado. Isso faz
a busca filtrada ser compartilhável, faz o recarregamento reproduzir exatamente
a mesma vitrine, e entrega o histórico do navegador de graça — voltar desfaz um
filtro. Também elimina a classe de bug em que dois estados da mesma coisa
divergem.

### O carrinho identifica variações, não produtos

A chave de uma linha é `produto + cor + tamanho`. A mesma camiseta em Preto/M e
em Preto/G ocupa duas linhas independentes, cada uma com sua quantidade — como
pede o enunciado.

---

## Decisões técnicas e trade-offs

**Ler o estado de hidratação em vez de usar Puppeteer.** Um navegador headless
resolveria o problema da SPA, mas custa ~300 MB de dependência, alguns segundos
por página e uma fonte extra de instabilidade em CI. Ler o JSON que já vem no
HTML é mais rápido e mais estável. *Trade-off:* se a Uma Penca trocar o nome da
global, o scraper quebra — mas quebra de forma barulhenta e fácil de corrigir,
em vez de silenciosamente devolver dados pela metade.

**Coletar a página de cada produto.** Multiplica o tempo da coleta por 36, mas é
o que traz cor, tamanho e descrição reais. A alternativa seria inventar quase
tudo no adapter. O cache em disco paga esse custo uma vez só.

**json-server em vez de um servidor próprio.** O enunciado permitia, e a API
aqui só precisa ler um arquivo e devolver fatias filtradas — escrever um Express
para isso seria código a mais sem ganho. O custo é aceitar a convenção de query
dele (`_page`, `_limit`, `_like`) e achatar dois campos no adapter, porque o
json-server não filtra dentro de objeto nem de array de objetos.

**Pinia em vez de Vuex.** API mais enxuta, sem `mutations`, e stores em formato
de função que combinam com a Composition API da 2.7.

**Tailwind em vez de Bootstrap ou Vuetify.** O critério de criatividade pedia
identidade própria. Bibliotecas de componentes entregam telas prontas, mas com
cara de biblioteca — e, no caso do Vuetify 2, um bundle bem maior. Com Tailwind,
a paleta e os componentes são do projeto. *Trade-off:* drawer, stepper e
paginação foram escritos à mão, e isso levou mais tempo.

**Nenhuma variação vem pré-selecionada**, nem quando o produto tem uma única cor
ou um único tamanho. É um clique a mais nesses casos, mas deixa o requisito do
botão bloqueado inequívoco — e evita que o usuário compre uma variação que ele
nunca escolheu conscientemente.

**Imagens pedidas no tamanho exibido.** As fotos vêm do imgix, que redimensiona
e converte formato pela URL. Pedir `w=320&h=420&auto=compress,format` em vez do
original é a diferença entre uma grade que baixa megabytes e uma que baixa
dezenas de KB — com `srcset` 1x/2x para telas retina.

---

## O que ficou de fora

Priorizei os requisitos obrigatórios e os diferenciais de maior retorno, como o
enunciado sugere. Ficaram de fora, conscientemente:

- **Testes automatizados.** É o que eu faria primeiro com mais tempo: a store do
  carrinho (chave de variação, subtotal, limites de quantidade) e o
  `adapter.js` (regras de enriquecimento) são lógica pura, fáceis de testar e o
  lugar onde um bug silencioso dói mais. Jest + Vue Test Utils.
- **Deploy público.** A aplicação precisa de dois processos (front e API) e a
  publicação dependeria de contas minhas em serviços externos. O projeto roda
  localmente com um comando.
- **Scroll infinito.** Optei por paginação numerada porque ela conversa melhor
  com a decisão de refletir o estado na URL: `?page=3` é compartilhável e
  recarregável; uma lista infinita não é.

Com mais tempo eu também: carregaria a galeria completa de fotos na página de
produto (o scraping já traz todas), trocaria a busca por tipo/cor por facetas
que mostram a contagem **do resultado atual**, e adicionaria um `Cache-Control`
na API para a listagem.

---

## Checklist do teste

**Requisitos não negociáveis**

- [x] Vue.js 2.7 — Composition API nativa, com `<script setup>`
- [x] Dados de scraping de `umapenca.com/loja`, servidos por API própria
- [x] Biblioteca CSS — Tailwind CSS
- [x] Tela com estilos próprios — a listagem inteira (abertura, barra de
      filtros, cards, esqueleto de carregamento)
- [x] Repositório público com histórico de commits

**Listagem**

- [x] Grade com imagem, nome e preço
- [x] Filtro por tipo de produto
- [x] Filtro por cor
- [x] Filtros combináveis entre si
- [x] Clique leva à página do produto
- [x] Estados de carregamento, lista vazia e erro da API

**Página do produto**

- [x] Rota própria (`/produto/:id`), acessível por URL direta e recarregável
- [x] Imagem, nome, preço e descrição
- [x] Seleção de cor e tamanho disponíveis
- [x] Botão de adicionar bloqueado até as variações serem escolhidas

**Carrinho lateral**

- [x] Drawer que abre na listagem e na página do produto
- [x] Itens com variação, quantidade e preço
- [x] Alterar quantidade e remover item
- [x] Subtotal atualizado em tempo real
- [x] Mesmo produto com variações diferentes vira itens separados

- [x] Funciona em desktop e mobile

**Diferenciais**

- [x] Filtros refletidos na URL
- [x] Carrinho persistido em `localStorage`
- [x] Paginação e lazy loading de imagens
- [x] Commits semânticos
- [ ] Testes unitários
- [ ] Deploy público
