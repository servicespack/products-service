FROM node:22-alpine AS builder

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos de dependências
COPY package.json package-lock.json ./

# Instale as dependências de desenvolvimento
RUN npm install

# Copie o restante do código
COPY . .

# Compile o TypeScript para JavaScript
RUN npm run build

# Etapa 2: Execução
FROM node:22-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie as dependências necessárias (apenas runtime)
COPY package.json package-lock.json ./

# Instale apenas as dependências de produção
RUN npm install --only=production

# Copie o código compilado da etapa anterior
COPY --from=builder /app/dist ./dist

# Exponha a porta da API
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "dist/index.js"]
