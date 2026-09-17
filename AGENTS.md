# AGENTS.md

## Environment Variables

Whenever a new environment variable is introduced in the code (e.g., in `src/config/configuration.ts`), you **MUST**:
1. Add it to the `.env.example` file with a clear comment explaining its purpose.
2. Update this section of `AGENTS.md` to document the variable.

### Current Variables:
- `DATABASE_URI`: MongoDB connection string.
- `SERVER_PORT`: Port for the HTTP Express server.
- `JWT_SECRET`: Secret key used for JSON Web Token signature and verification across the HTTP and MCP APIs.

## Maintenance Rule

- **Always Keep AGENTS.md Updated**: Whenever files, directories, DTOs, use cases, configurations, scripts, or dependencies are added, modified, moved, or deleted, `AGENTS.md` (specifically the file tree, layer descriptions, and commands) MUST be updated immediately to reflect the current state of the codebase.

## Development Commands

- **Build**: `npm run build` (uses `tsdown` via `tsdown.config.mts`, outputs bundle to `dist/index.js`)
- **Type Check**: `npm run build:check` (`tsc --noEmit`)
- **Lint**: `npm run lint` (runs `eslint .` with `@antfu/eslint-config`)
- **Lint auto-fix**: `npm run lint:fix`
- **Run dev**: `npm run start:dev` (runs `tsx watch --env-file=.env src/index.ts | pino-pretty`)
- **Start production**: `npm start` (runs `node dist/index.js`)
- **Run all tests**: `npm test` (Vitest run)
- **Run single test file**: `npx vitest run <path/to/file.spec.ts>`
- **Test coverage**: `npm run test:cov`
- **Standard verification pipeline**: `npm run build:check && npm run lint && npm run build && npm test`

## Architecture & Layers

The codebase follows the Clean Architecture standards established across ServicesPack microservices:
- `src/domain/`: Enterprise business rules with zero external framework/ORM dependencies:
  - `entities/`: Pure domain entities (`Product`, `StockMovement`) encapsulating invariants, getters, and serialization.
  - `errors/`: Domain errors (`DomainError`, `ProductNotFoundError`, `InsufficientStockError`, `InvalidStockQuantityError`).
  - `repositories/`: Pure repository port contracts (`IProductRepository`, `IStockMovementRepository`).
- `src/application/`: Application business rules:
  - `dtos/`: Boundary request models (`CreateProductRequest`, `ListProductsRequest`, `DecreaseStockRequest`, `IncreaseStockRequest`, `ReserveProductRequest`, `CancelReservationRequest`, `UpdateProductRequest`, `ListStockMovementsRequest`).
  - `use-cases/products/`: Single-responsibility use cases (`CreateProductUseCase`, `ListProductsUseCase`, `GetProductByIdUseCase`, `UpdateProductUseCase`, `DeleteProductUseCase`, `RestoreProductUseCase`, `DecreaseStockUseCase`, `IncreaseStockUseCase`, `ReserveProductUseCase`, `CancelReservationUseCase`, `ListStockMovementsUseCase`).
- `src/adapters/`: Interface adapters translating between delivery mechanisms and application layer:
  - `controllers/`: Express controllers (`ProductsController` consuming `ProductsControllerDependencies`).
  - `mcp/`: MCP controllers (`ProductsMcpController` consuming `ProductsMcpControllerDependencies`).
  - `middlewares/`: Express middlewares (`authMiddleware` validating JWT from headers and query parameters).
  - `dtos/`: Presentation layer validation schemas (`CreateProductDto`, `UpdateProductDto`, `ChangeStockDto`).
  - `helpers/`: `handleHttpError` translating domain errors to appropriate HTTP responses (`404` for not found, `409` for insufficient stock, `400` for validation/domain errors).
- `src/infrastructure/`: Frameworks, drivers, and persistence adapters:
  - `database/mongoose/`:
    - `models/`: Mongoose schemas and models (`ProductModel`, `StockMovementModel`, `productValidationRules`, `stockMovementValidationRules`).
    - `mappers/`: `ProductMapper`, `StockMovementMapper` mapping between Mongoose documents and pure domain instances.
    - `repositories/`: `MongooseProductRepository` implementing `IProductRepository`, `MongooseStockMovementRepository` implementing `IStockMovementRepository`.
  - `http/`:
    - `router.ts`: Composition root wiring repositories, use cases, controller, MCP router, and Express routes.
    - `server.ts`: Express application setup, global error handling, and server export.
  - `mcp/`:
    - `mcp.server.ts`: `createProductsMcpServer` configuring MCP server, tools (`search_products`, `get_product_details`, `reserve_product`, `cancel_reservation`, `get_stock_history`), resources (`catalog_summary`, `low_stock`, `product_by_id`), and prompts (`recommend_products`).
    - `mcp.router.ts`: `createMcpRouter` exposing SSE endpoints (`GET /sse`, `POST /messages`, `/mcp/sse`, `/mcp/messages`) via `SSEServerTransport`.
- `src/config/`: Configuration for environment (`configuration.ts`), database connection (`database.ts`), graceful shutdown (`cooldown.ts`), logger (`logger.ts`), and barrel export (`index.ts`).
- `src/index.ts`: Application bootstrap entrypoint.
- `tests/`: Root-level test suites (`tests/e2e/products.spec.ts`, `tests/e2e/mcp.spec.ts`, `tests/server.spec.ts`, `tests/integration/mongoose-product.repository.integration.spec.ts`, `tests/configuration.spec.ts`, `tests/setup.ts`).

## File Structure

```tree
.
├── src/
│   ├── adapters/
│   │   ├── controllers/
│   │   │   ├── products.controller.spec.ts
│   │   │   └── products.controller.ts
│   │   ├── dtos/
│   │   │   ├── change-stock.dto.ts
│   │   │   ├── create-product.dto.ts
│   │   │   └── update-product.dto.ts
│   │   ├── helpers/
│   │   │   └── http-error.helper.ts
│   │   ├── mcp/
│   │   │   ├── index.ts
│   │   │   ├── products.mcp-controller.spec.ts
│   │   │   └── products.mcp-controller.ts
│   │   └── middlewares/
│   │       ├── auth.middleware.spec.ts
│   │       └── auth.middleware.ts
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── cancel-reservation.model.ts
│   │   │   ├── create-product.model.ts
│   │   │   ├── decrease-stock.model.ts
│   │   │   ├── increase-stock.model.ts
│   │   │   ├── list-products.model.ts
│   │   │   ├── list-stock-movements.model.ts
│   │   │   ├── reserve-product.model.ts
│   │   │   └── update-product.model.ts
│   │   └── use-cases/
│   │       └── products/
│   │           ├── cancel-reservation.use-case.spec.ts
│   │           ├── cancel-reservation.use-case.ts
│   │           ├── create-product.use-case.spec.ts
│   │           ├── create-product.use-case.ts
│   │           ├── decrease-stock.use-case.spec.ts
│   │           ├── decrease-stock.use-case.ts
│   │           ├── delete-product.use-case.spec.ts
│   │           ├── delete-product.use-case.ts
│   │           ├── get-product-by-id.use-case.spec.ts
│   │           ├── get-product-by-id.use-case.ts
│   │           ├── increase-stock.use-case.spec.ts
│   │           ├── increase-stock.use-case.ts
│   │           ├── list-products.use-case.spec.ts
│   │           ├── list-products.use-case.ts
│   │           ├── list-stock-movements.use-case.spec.ts
│   │           ├── list-stock-movements.use-case.ts
│   │           ├── reserve-product.use-case.spec.ts
│   │           ├── reserve-product.use-case.ts
│   │           ├── restore-product.use-case.spec.ts
│   │           ├── restore-product.use-case.ts
│   │           ├── update-product.use-case.spec.ts
│   │           └── update-product.use-case.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── cooldown.spec.ts
│   │   ├── cooldown.ts
│   │   ├── database.spec.ts
│   │   ├── database.ts
│   │   ├── index.ts
│   │   └── logger.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── product.entity.spec.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── stock-movement.entity.spec.ts
│   │   │   └── stock-movement.entity.ts
│   │   ├── errors/
│   │   │   ├── domain.error.ts
│   │   │   ├── index.ts
│   │   │   ├── insufficient-stock.error.ts
│   │   │   ├── invalid-stock-quantity.error.ts
│   │   │   └── product-not-found.error.ts
│   │   └── repositories/
│   │       ├── product.repository.interface.ts
│   │       └── stock-movement.repository.interface.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── mongoose/
│   │   │       ├── mappers/
│   │   │       │   ├── product.mapper.ts
│   │   │       │   └── stock-movement.mapper.ts
│   │   │       ├── models/
│   │   │       │   ├── product.model.spec.ts
│   │   │       │   ├── product.model.ts
│   │   │       │   ├── stock-movement.model.spec.ts
│   │   │       │   └── stock-movement.model.ts
│   │   │       └── repositories/
│   │   │           ├── mongoose-product.repository.spec.ts
│   │   │           ├── mongoose-product.repository.ts
│   │   │           ├── mongoose-stock-movement.repository.spec.ts
│   │   │           └── mongoose-stock-movement.repository.ts
│   │   ├── http/
│   │   │   ├── router.ts
│   │   │   └── server.ts
│   │   └── mcp/
│   │       ├── index.ts
│   │       ├── mcp.router.spec.ts
│   │       ├── mcp.router.ts
│   │       ├── mcp.server.spec.ts
│   │       └── mcp.server.ts
│   └── index.ts
└── tests/
    ├── configuration.spec.ts
    ├── e2e/
    │   ├── mcp.spec.ts
    │   └── products.spec.ts
    ├── helpers/
    │   └── auth.helper.ts
    ├── integration/
    │   └── mongoose-product.repository.integration.spec.ts
    ├── server.spec.ts
    └── setup.ts
```

## Toolchain & Runtime Quirks

- **ODM & Database**: Uses `mongoose` with MongoDB. Database connection and schema validator synchronization are managed in `src/config/database.ts`.
- **In-Memory Testing**: Tests run against `mongodb-memory-server` configured in `tests/setup.ts` via `vite.config.mts`.
- **ESLint**: Uses `@antfu/eslint-config` (ESLint 9 flat config). Runs on the entire project (`eslint .`).
- **Build Artifacts**: `tsdown` generates `dist/index.js` as specified in `tsdown.config.mts` (matching `package.json` `"main": "dist/index.js"` and `Dockerfile` `CMD ["node", "dist/index.js"]`).
