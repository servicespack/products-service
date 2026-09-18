# @servicespack/products-service

[![CI](https://github.com/servicespack/products-service/actions/workflows/ci.yml/badge.svg)](https://github.com/servicespack/products-service/actions/workflows/ci.yml)
[![CD](https://github.com/servicespack/products-service/actions/workflows/cd.yml/badge.svg)](https://github.com/servicespack/products-service/actions/workflows/cd.yml)

Product management and stock control microservice for the `@servicespack` ecosystem, structured under the principles of **Clean Architecture** (Robert C. Martin) in TypeScript with Node.js, Express, and MongoDB (Mongoose).

---

## ✨ Features

### 📦 Product Catalog Management
* **Strict Validation Registration**: Product creation via Zod validating name, description, price, unique SKU, initial stock, categories, tags, and active status.
* **Advanced Search and Filtering**: Listing with pagination (`page`, `pageSize`) and support for multiple simultaneous filters:
  * Textual search in name and description.
  * Exact filters by SKU, category, and tag.
  * Price range filter (`minPrice` and `maxPrice`).
  * Status filter (`active=true/false`).
  * Query deleted items (`includeDeleted=true` or `onlyDeleted=true`).
* **Detailed Query**: Retrieve by ID with support for archived products.
* **Partial and Full Update**: Updates via `PUT` or `PATCH` preserving integrity and stock audit trail.
* **Soft Delete and Restoration**: Logical deletion (`deletedAt`) and a dedicated endpoint for restoring removed products.

### 📊 Stock Control and Movements
* **Stock Increment**: Atomic balance addition with mandatory reason recording for auditing.
* **Stock Decrement**: Atomic reduction with safeguard against insufficient stock (returns `409 Conflict`).
* **Reservation and Release**: Dedicated use cases for order stock reservation and reservation cancellation.
* **Audit Trail and History**: Immutable movement log (`INCREMENT` and `DECREASE`) containing previous stock, current stock, moved quantity, reason, and timestamp.

### 🤖 Model Context Protocol (MCP) Integration
Integrated MCP server for communication with AI agents via Server-Sent Events (SSE):
* **Tools**:
  * `search_products`: Flexible search and filtering across the catalog.
  * `get_product_details`: Detailed product query by ID or SKU.
  * `reserve_product`: Product reservation with atomic stock decrement.
  * `cancel_reservation`: Reservation cancellation with item return to stock.
  * `get_stock_history`: Retrieve movement history of an item.
* **Resources**:
  * `products://catalog/summary`: Consolidated catalog summary (total products, distribution by category, and min/max/average prices).
  * `products://stock/low-stock`: Real-time monitoring of products with low stock (<= 5).
  * `products://{id}`: Direct reading of product data via URI.
* **Prompts**:
  * `recommend_products`: Guided template for personalized recommendations based on preferences, category, and budget.

### 🔒 Security and Authentication
* **JWT Authentication**: Protection of HTTP routes and SSE streams validating tokens via the `Authorization: Bearer <token>` header or `token` query param.

---

## 🏛️ Architecture

The project is organized into decoupled layers following the unidirectional dependency rule:

```
src/
├── domain/                      # 1. Enterprise Business Rules
│   ├── entities/                # Pure entities (Product, StockMovement) with invariants
│   ├── errors/                  # Domain semantic errors
│   └── repositories/            # Repository contracts/ports (IProductRepository, IStockMovementRepository)
├── application/                 # 2. Application Business Rules
│   ├── dtos/                    # Use case input/output models
│   └── use-cases/products/      # Isolated use cases (Create, List, GetById, Update, Delete, Restore, Stock)
├── adapters/                    # 3. Interface Adapters
│   ├── controllers/             # Decoupled Express controllers
│   ├── dtos/                    # Request validation schemas (Zod)
│   └── helpers/                 # Translator of domain errors to HTTP responses
└── infrastructure/              # 4. Frameworks & Drivers (External layer)
    ├── database/mongoose/       # Mongoose models, schemas, and repositories
    └── http/                    # Routes, Express configuration, and global error handling
```

---

## 🚀 How to Run

### Prerequisites
* Node.js >= 22.0.0
* npm >= 10.0.0
* Docker and Docker Compose (to run MongoDB)

### Installation
```bash
npm install
```

### Environment Configuration
Copy the example environment variables file:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URI` | MongoDB connection URI | `mongodb://localhost:27017/products-service` |
| `SERVER_PORT` / `HTTP_SERVER_PORT` | HTTP server port | `3000` |
| `JWT_SECRET` | Secret key for signing and validating JWT tokens | `secret` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |

### Running with Docker Compose (Database)
```bash
docker compose up -d
```

### Development
```bash
npm run start:dev
```

### Build and Production
```bash
npm run build
npm start
```

---

## 🧪 Testing and Code Quality

* **Run all tests:** `npm test`
* **Test coverage:** `npm run test:cov`
* **Mutation tests:** `npm run test:mutation`
* **Type check (TypeScript):** `npm run build:check`
* **Linter (ESLint):** `npm run lint`
* **Linter auto-fix:** `npm run lint:fix`
* **Full validation pipeline:** `npm run build:check && npm run lint && npm run build && npm test`

---

## 📡 API Reference (Endpoints)

> **Authentication**: All requests require a valid JWT token, provided via the `Authorization: Bearer <token>` header or `?token=<token>` query parameter.

### 1. Create Product
* **POST** `/products`
* **Body:**
  ```json
  {
    "name": "Dell Inspiron Laptop",
    "description": "Intel Core i7, 16GB RAM, 512GB SSD",
    "price": 4500.00,
    "sku": "DELL-INSP-01",
    "stock": 10,
    "category": "Electronics",
    "tags": ["laptop", "dell", "computers"],
    "active": true
  }
  ```
* **Response:** `201 Created`

### 2. List Products
* **GET** `/products`
* **Query Params (optional):**
  * `search`: Text search in name or description
  * `sku`: Exact SKU filter
  * `category`: Category filter
  * `tag`: Tag filter
  * `minPrice` / `maxPrice`: Price range filter
  * `active`: `true` or `false`
  * `includeDeleted`: `true` (includes soft-deleted products)
  * `onlyDeleted`: `true` (returns only deleted products)
  * `page`: Page number (default `1`)
  * `pageSize` or `size`: Items per page (default `20`)
* **Response:** `200 OK`
  ```json
  {
    "data": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "Dell Inspiron Laptop",
        "description": "Intel Core i7, 16GB RAM, 512GB SSD",
        "price": 4500,
        "sku": "DELL-INSP-01",
        "stock": 10,
        "category": "Electronics",
        "tags": ["laptop", "dell", "computers"],
        "active": true,
        "createdAt": "2026-09-09T16:00:00.000Z",
        "updatedAt": "2026-09-09T16:00:00.000Z"
      }
    ]
  }
  ```

### 3. Get Product by ID
* **GET** `/products/:id`
* **Query Params (optional):** `includeDeleted=true`
* **Response:** `200 OK`

### 4. Update Product
* **PUT** or **PATCH** `/products/:id`
* **Body (optional fields):**
  ```json
  {
    "name": "Dell Inspiron Plus Laptop",
    "price": 4800.00,
    "active": true
  }
  ```
* **Response:** `200 OK`

### 5. Remove Product (Soft Delete)
* **DELETE** `/products/:id`
* **Response:** `204 No Content`

### 6. Restore Removed Product
* **POST** `/products/:id/restore`
* **Response:** `200 OK`

### 7. Increase Stock
* **POST** `/products/:id/increase-stock` (or `/products/:id/stock/increase`)
* **Body:**
  ```json
  {
    "quantity": 5,
    "reason": "Restock"
  }
  ```
* **Response:** `200 OK` (returns the product with updated stock)

### 8. Decrease Stock
* **POST** `/products/:id/decrease-stock` (or `/products/:id/stock/decrease`)
* **Body:**
  ```json
  {
    "quantity": 2,
    "reason": "Sale completed"
  }
  ```
* **Response:** `200 OK` (returns the product with updated stock)
* **Errors:** Returns `409 Conflict` if the requested quantity exceeds the available stock balance.

### 9. List Stock Movement History
* **GET** `/products/:id/stock-movements` (or `/products/:id/movements`)
* **Query Params (optional):** `page`, `pageSize`
* **Response:** `200 OK`
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
        "reason": "Sale completed",
        "createdAt": "2026-09-09T16:10:00.000Z"
      }
    ]
  }
  ```

### 10. MCP (Model Context Protocol) Endpoints
* **GET** `/sse` (or `/mcp/sse`)
  * Starts the SSE connection with the MCP server. Returns the endpoint for sending messages with `sessionId`.
  * **Headers:** `Accept: text/event-stream`, `Authorization: Bearer <token>` (or `?token=<token>`).
* **POST** `/messages?sessionId=<sessionId>` (or `/mcp/messages?sessionId=<sessionId>`)
  * Sends JSON-RPC 2.0 messages for tool execution, resource reading, or prompt retrieval.
  * **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`.
