# Fase de build
FROM node:20-slim AS build

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Fase de produção
FROM node:20-slim AS production

WORKDIR /app

# Instalar ffmpeg para conversão de vídeos
RUN apt-get update \
    && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar build da fase anterior
COPY --from=build /app/dist ./dist

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4001

# Expor porta
EXPOSE 4001

# Health check (opcional mas recomendado)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de execução
CMD ["node", "dist/main.js"]