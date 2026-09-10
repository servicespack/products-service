# Stage 1: Base
FROM node:24-alpine AS base

WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies

COPY package.json package-lock.json ./

RUN npm ci

# Stage 3: Builder
FROM base AS builder

COPY package.json package-lock.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 4: Production dependencies
FROM base AS prod-dependencies

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Stage 5: Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
