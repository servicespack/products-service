# @servicespack/products-service

[![CI](https://github.com/servicespack/products-service/actions/workflows/ci.yml/badge.svg)](https://github.com/servicespack/products-service/actions/workflows/ci.yml)
[![CD](https://github.com/servicespack/products-service/actions/workflows/cd.yml/badge.svg)](https://github.com/servicespack/products-service/actions/workflows/cd.yml)

Microsserviço de gerenciamento de produtos e controle de estoque do ecossistema `@servicespack`, estruturado sob os princípios da **Clean Architecture** (Robert C. Martin) em TypeScript com Node.js, Express e MongoDB (Mongoose).

---

## ✨ Funcionalidades

### 📦 Gestão de Catálogo de Produtos
* **Cadastro com Validação Estrita**: Criação de produtos via Zod validando nome, descrição, preço, SKU único, estoque inicial, categorias, tags e status ativo.
* **Busca e Filtragem Avançada**: Listagem com paginação (`page`, `pageSize`) e suporte a múltiplos filtros simultâneos:
  * Busca textual em nome e descrição.
  * Filtros exatos por SKU, categoria e tag.
  * Filtro por faixa de preço (`minPrice` e `maxPrice`).
  * Filtro por status (`active=true/false`).
  * Consulta a itens excluídos (`includeDeleted=true` ou `onlyDeleted=true`).
* **Consulta Detalhada**: Busca por ID com suporte a produtos arquivados.
* **Atualização Parcial e Completa**: Atualização via `PUT` ou `PATCH` preservando integridade e trilha de estoque.
* **Soft Delete e Restauração**: Exclusão lógica (`deletedAt`) e endpoint dedicado para restauração de produtos removidos.

### 📊 Controle e Movimentação de Estoque
* **Incremento de Estoque**: Adição atômica de saldo com registro obrigatório de motivo para auditoria.
* **Decremento de Estoque**: Redução atômica com trava contra saldo insuficiente (retorna `409 Conflict`).
* **Reserva e Liberação**: Casos de uso dedicados para reserva de estoque em pedidos e cancelamento de reservas.
* **Histórico e Trilha de Auditoria**: Registro imutável de movimentações (`INCREMENT` e `DECREASE`) contendo saldo anterior, saldo atual, quantidade movimentada, motivo e timestamp.

### 🤖 Integração com Model Context Protocol (MCP)
Servidor MCP integrado para comunicação com agentes de IA via Server-Sent Events (SSE):
* **Ferramentas (Tools)**:
  * `search_products`: Busca e filtragem flexível no catálogo.
  * `get_product_details`: Consulta detalhada de produto por ID ou SKU.
  * `reserve_product`: Reserva de produtos com baixa atômica em estoque.
  * `cancel_reservation`: Cancelamento de reserva com devolução dos itens ao estoque.
  * `get_stock_history`: Consulta ao histórico de movimentações de um item.
* **Recursos (Resources)**:
  * `products://catalog/summary`: Resumo consolidado do catálogo (total de produtos, distribuição por categoria e preços mín/máx/médio).
  * `products://stock/low-stock`: Monitoramento em tempo real de produtos com estoque baixo (<= 5).
  * `products://{id}`: Leitura direta dos dados de um produto por URI.
* **Prompts**:
  * `recommend_products`: Template guiado para recomendações personalizadas com base em preferências, categoria e orçamento.

### 🔒 Segurança e Autenticação
* **Autenticação via JWT**: Proteção das rotas HTTP e streams SSE validando tokens via header `Authorization: Bearer <token>` ou query param `token`.

---

## 🏛️ Arquitetura

O projeto é organizado em camadas desacopladas seguindo o padrão de dependência unidirecional:

```
src/
├── domain/                      # 1. Regras de Negócio Corporativas (Enterprise Business Rules)
│   ├── entities/                # Entidades puras (Product, StockMovement) com invariantes
│   ├── errors/                  # Erros semânticos de domínio
│   └── repositories/            # Contratos/Portas de repositórios (IProductRepository, IStockMovementRepository)
├── application/                 # 2. Regras de Negócio da Aplicação (Application Business Rules)
│   ├── dtos/                    # Modelos de entrada/saída de casos de uso
│   └── use-cases/products/      # Casos de uso isolados (Create, List, GetById, Update, Delete, Restore, Stock)
├── adapters/                    # 3. Adaptadores de Interface
│   ├── controllers/             # Express controllers desacoplados
│   ├── dtos/                    # Schemas de validação de requisição (Zod)
│   └── helpers/                 # Tradutor de erros de domínio para respostas HTTP
└── infrastructure/              # 4. Frameworks & Drivers (Camada externa)
    ├── database/mongoose/       # Modelos, schemas e repositórios Mongoose
    └── http/                    # Rotas, configuração do Express e tratamento global de erros
```

---

## 🚀 Como Executar

### Pré-requisitos
* Node.js >= 22.0.0
* npm >= 10.0.0
* Docker e Docker Compose (para execução do MongoDB)

### Instalação
```bash
npm install
```

### Configuração de Ambiente
Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `DATABASE_URI` | URI de conexão com o MongoDB | `mongodb://localhost:27017/products-service` |
| `SERVER_PORT` / `HTTP_SERVER_PORT` | Porta do servidor HTTP | `3000` |
| `JWT_SECRET` | Chave secreta para assinatura e validação de tokens JWT | `secret` |
| `NODE_ENV` | Ambiente de execução (`development`, `production`, `test`) | `development` |

### Executando com Docker Compose (Banco de Dados)
```bash
docker compose up -d
```

### Desenvolvimento
```bash
npm run start:dev
```

### Build e Produção
```bash
npm run build
npm start
```

---

## 🧪 Testes e Qualidade de Código

* **Executar todos os testes:** `npm test`
* **Testes com cobertura:** `npm run test:cov`
* **Checagem de tipos (TypeScript):** `npm run build:check`
* **Linter (ESLint):** `npm run lint`
* **Correção automática do linter:** `npm run lint:fix`
* **Pipeline de validação completa:** `npm run build:check && npm run lint && npm run build && npm test`

---

## 📡 Referência da API (Endpoints)

> **Autenticação**: Todas as requisições exigem token JWT válido, fornecido via header `Authorization: Bearer <token>` ou parâmetro de consulta `?token=<token>`.

### 1. Criar Produto
* **POST** `/products`
* **Body:**
  ```json
  {
    "name": "Notebook Dell Inspiron",
    "description": "Intel Core i7, 16GB RAM, 512GB SSD",
    "price": 4500.00,
    "sku": "DELL-INSP-01",
    "stock": 10,
    "category": "Eletrônicos",
    "tags": ["notebook", "dell", "computadores"],
    "active": true
  }
  ```
* **Retorno:** `201 Created`

### 2. Listar Produtos
* **GET** `/products`
* **Query Params (opcionais):**
  * `search`: Busca por texto no nome ou descrição
  * `sku`: Filtro exato por SKU
  * `category`: Filtro por categoria
  * `tag`: Filtro por tag
  * `minPrice` / `maxPrice`: Filtro por faixa de preço
  * `active`: `true` ou `false`
  * `includeDeleted`: `true` (inclui produtos com soft delete)
  * `onlyDeleted`: `true` (retorna apenas produtos excluídos)
  * `page`: Número da página (padrão `1`)
  * `pageSize` ou `size`: Quantidade por página (padrão `20`)
* **Retorno:** `200 OK`
  ```json
  {
    "data": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Notebook Dell Inspiron",
        "description": "Intel Core i7, 16GB RAM, 512GB SSD",
        "price": 4500,
        "sku": "DELL-INSP-01",
        "stock": 10,
        "category": "Eletrônicos",
        "tags": ["notebook", "dell", "computadores"],
        "active": true,
        "createdAt": "2026-09-09T16:00:00.000Z",
        "updatedAt": "2026-09-09T16:00:00.000Z"
      }
    ]
  }
  ```

### 3. Obter Produto por ID
* **GET** `/products/:id`
* **Query Params (opcionais):** `includeDeleted=true`
* **Retorno:** `200 OK`

### 4. Atualizar Produto
* **PUT** ou **PATCH** `/products/:id`
* **Body (campos opcionais):**
  ```json
  {
    "name": "Notebook Dell Inspiron Plus",
    "price": 4800.00,
    "active": true
  }
  ```
* **Retorno:** `200 OK`

### 5. Remover Produto (Soft Delete)
* **DELETE** `/products/:id`
* **Retorno:** `204 No Content`

### 6. Restaurar Produto Removido
* **POST** `/products/:id/restore`
* **Retorno:** `200 OK`

### 7. Incrementar Estoque
* **POST** `/products/:id/increase-stock` (ou `/products/:id/stock/increase`)
* **Body:**
  ```json
  {
    "quantity": 5,
    "reason": "Reposição de estoque"
  }
  ```
* **Retorno:** `200 OK` (retorna o produto com estoque atualizado)

### 8. Decrementar Estoque
* **POST** `/products/:id/decrease-stock` (ou `/products/:id/stock/decrease`)
* **Body:**
  ```json
  {
    "quantity": 2,
    "reason": "Venda realizada"
  }
  ```
* **Retorno:** `200 OK` (retorna o produto com estoque atualizado)
* **Erros:** Retorna `409 Conflict` se a quantidade solicitada for superior ao saldo disponível em estoque.

### 9. Listar Histórico de Movimentações de Estoque
* **GET** `/products/:id/stock-movements` (ou `/products/:id/movements`)
* **Query Params (opcionais):** `page`, `pageSize`
* **Retorno:** `200 OK`
  ```json
  {
    "data": [
      {
        "id": "60d0fe4f5311236168a109cb",
        "productId": "60d0fe4f5311236168a109ca",
        "type": "DECREASE",
        "quantity": 2,
        "previousStock": 10,
        "newStock": 8,
        "reason": "Venda realizada",
        "createdAt": "2026-09-09T16:10:00.000Z"
      }
    ]
  }
  ```

### 10. Endpoints MCP (Model Context Protocol)
* **GET** `/sse` (ou `/mcp/sse`)
  * Inicia a conexão SSE com o servidor MCP. Retorna o endpoint para envio de mensagens com `sessionId`.
  * **Headers:** `Accept: text/event-stream`, `Authorization: Bearer <token>` (ou `?token=<token>`).
* **POST** `/messages?sessionId=<sessionId>` (ou `/mcp/messages?sessionId=<sessionId>`)
  * Envia mensagens JSON-RPC 2.0 para execução de ferramentas, leitura de recursos ou obtenção de prompts.
  * **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`.
