FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dumb-init para graceful shutdown
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copiar node_modules do builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nestjs:nodejs . .

# Build da aplicação
RUN npm run build

# Remover dependências de desenvolvimento após build
RUN npm prune --production

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando de inicialização com dumb-init para graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
