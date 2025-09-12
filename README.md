# 🐃 BUFFS API - Sistema de Gestão de Rebanhos Bufalinos

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)

API REST completa para gerenciamento de rebanhos bufalinos, desenvolvida com **NestJS** e **Supabase**.

Um sistema abrangente que oferece controle integral desde o cadastro genealógico até o manejo produtivo, reprodutivo, sanitário e nutricional dos animais, voltado especialmente para produtores de búfalos leiteiros e de corte.

---

## ✨ Funcionalidades Principais

### 🏡 **Gestão de Propriedades**
- Cadastro completo de fazendas e propriedades rurais
- Sistema de endereçamento detalhado
- Divisão em lotes/piquetes com georreferenciamento
- Controle de movimentação de animais entre lotes

### 🐃 **Controle de Rebanho**
- Registro individual de búfalos com genealogia completa
- Cadastro de raças e características específicas
- Agrupamento por categorias (bezerros, novilhas, vacas, touros)
- Sistema de identificação por brincos e microchips
- Controle de categoria ABCB automático

### 🥛 **Produção Leiteira**
- Controle detalhado de lactação e ciclos produtivos
- Registro de coletas diárias de leite
- Gestão de estoque e qualidade do leite
- Integração com indústrias e cooperativas
- Relatórios de produtividade por animal

### 🧬 **Reprodução**
- Controle de coberturas e inseminação artificial
- Gestão de material genético e touros reprodutores
- Árvore genealógica completa com múltiplas gerações
- Simulações de cruzamentos
- Acompanhamento de prenhez e partos

### ❤️ **Saúde e Zootecnia**
- Cadastro de medicamentos e protocolos sanitários
- Histórico completo de vacinações
- Dados zootécnicos (peso, altura, escore corporal)
- Controle de tratamentos e medicações
- Alertas automáticos de saúde com IA

### 🌾 **Alimentação**
- Definição de tipos de alimentação e rações
- Registro detalhado de fornecimento nutricional
- Controle de consumo por animal ou grupo
- Planejamento nutricional

### 🚨 **Sistema de Alertas Inteligente**
- Alertas automáticos para saúde, reprodução e manejo
- Classificação de prioridade com inteligência artificial
- Notificações personalizadas por tipo de evento
- Sistema de rastreamento de alertas visualizados

### 👥 **Multi-usuário e Segurança**
- Sistema robusto de autenticação JWT via Supabase
- Controle de acesso por usuário
- Políticas de segurança a nível de linha (RLS)
- Auditoria completa de operações

---

## 🚀 Tecnologias

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Framework** | NestJS | 11.x |
| **Linguagem** | TypeScript | 5.x |
| **Banco de Dados** | Supabase (PostgreSQL) | Latest |
| **Autenticação** | Supabase Auth + JWT | Latest |
| **Documentação** | Swagger/OpenAPI | 3.0 |
| **Validação** | class-validator & class-transformer | Latest |
| **IA** | Google Gemini | 1.5 |
| **Segurança** | Helmet | Latest |
| **Containerização** | Docker | Latest |
| **Arquitetura** | Modular/Domain-Driven Design | - |
| **Logs** | Winston | Latest |

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/)
- Chave de API do [Google Gemini](https://ai.google.dev/) (opcional, para classificação de alertas)
- [Docker](https://www.docker.com/) (opcional, para containerização)
- Git

---

## 🛠️ Instalação e Configuração

### 1. Clone e Instale

```bash
# Clone o repositório
git clone <repository-url>
cd dsm5-buffs-api

# Instale as dependências
npm install

# Instale o Helmet para segurança
npm install helmet
```

### 2. Configure o Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# JWT Configuration
JWT_SECRET=sua_chave_super_secreta_pelo_menos_32_caracteres
JWT_EXPIRES_IN=7d

# Google Gemini AI (opcional)
GEMINI_API_KEY=sua_chave_api_gemini

# Application Configuration
NODE_ENV=development
PORT=3001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=debug
```

### 3. Configure o Banco de Dados

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com/)
2. Execute os scripts SQL necessários para criar as tabelas
3. Configure as políticas RLS (Row Level Security)
4. Ative a autenticação JWT

### 4. Execute o Projeto

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build && npm run start:prod

# Com Docker
docker build -t buffs-api .
docker run -p 3001:3001 buffs-api
```

---

## 🐳 Containerização com Docker

### Build e Execução

```bash
# Construir a imagem
docker build -t buffs-api .

# Executar o container
docker run -p 3001:3001 --env-file .env buffs-api

# Verificar saúde do container
docker ps  # Veja a coluna STATUS para "healthy"
```

### Características do Docker

- **🔒 Segurança:** Execução com usuário não-root
- **⚡ Performance:** Multi-stage build para imagem otimizada
- **🩺 Health Check:** Monitoramento automático da saúde da API
- **🔄 Graceful Shutdown:** Parada elegante com dumb-init
- **📦 Tamanho:** Imagem Alpine (~200MB)

---

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **📖 Swagger UI (Documentação Completa):** [http://localhost:3001/api](http://localhost:3001/api)
- **💚 Health Check Básico:** [http://localhost:3001/health](http://localhost:3001/health)
- **🩺 Health Check Detalhado:** [http://localhost:3001/health/detailed](http://localhost:3001/health/detailed)

### Autenticação

Todas as rotas são protegidas por JWT. Para acessar os endpoints, inclua o token no header:

```http
Authorization: Bearer <seu-token-jwt>
```

**Fluxo de Autenticação:**

1. O usuário se registra/loga via Supabase Auth no frontend
2. O frontend obtém o JWT token
3. O token é enviado nas requisições para a API
4. A API valida o token e autoriza o acesso

---

## 🛡️ Segurança Implementada

### Headers de Segurança (Helmet)
- **X-Content-Type-Options:** Previne MIME sniffing
- **X-Frame-Options:** Proteção contra clickjacking
- **X-XSS-Protection:** Proteção contra XSS
- **Strict-Transport-Security:** Força uso de HTTPS
- **Content-Security-Policy:** Controla recursos carregados

### CORS Configurado
- Origens permitidas configuráveis via ambiente
- Suporte a credenciais
- Headers específicos permitidos
- Métodos HTTP controlados

### Validação Robusta
- Whitelist de propriedades permitidas
- Rejeição de propriedades não permitidas
- Transformação automática de tipos
- Mensagens de erro estruturadas

---

## 🩺 Monitoramento e Health Checks

### Health Check Básico
```http
GET /health
```
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "port": 3001
}
```

### Health Check Detalhado
```http
GET /health/detailed
```
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "ok",
      "responseTime": "45ms"
    },
    "gemini": {
      "status": "configured"
    }
  },
  "system": {
    "uptime": 3600,
    "memory": {
      "rss": 52428800,
      "heapTotal": 29360128,
      "heapUsed": 20000000
    },
    "nodeVersion": "v18.19.0"
  }
}
```

---

### Padrões Arquiteturais

- **Domain-Driven Design (DDD)**: Organização por domínios de negócio
- **Module Pattern**: Cada funcionalidade é um módulo independente
- **Repository Pattern**: Abstração da camada de dados via Supabase
- **Guard Pattern**: Proteção de rotas com autenticação JWT
- **DTO Pattern**: Validação e transformação de dados
- **Dependency Injection**: Inversão de controle via NestJS

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com watch mode
npm run test:watch

# Testes end-to-end
npm run test:e2e

# Cobertura de testes
npm run test:cov

# Testar health checks
curl http://localhost:3001/health
curl http://localhost:3001/health/detailed
```

Os testes incluem:

- Testes E2E para todos os módulos principais
- Validação de autenticação e autorização
- Testes de integração com Supabase
- Validação de DTOs e regras de negócio
- Testes de health checks e monitoramento

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run build` | Build para produção |
| `npm run start:prod` | Execução em produção |
| `npm run lint` | Análise estática do código |
| `npm run format` | Formatação com Prettier |
| `npm run test` | Execução dos testes unitários |
| `npm run test:e2e` | Execução dos testes end-to-end |
| `npm run test:cov` | Relatório de cobertura de testes |

---

## 🚀 Deploy e Produção

### ☁️ Deploy AWS App Runner (Recomendado)

A API está otimizada para rodar no **AWS App Runner Free Tier**:
- **1 vCPU, 2GB RAM** (adequado para a aplicação)
- **720 horas/mês grátis** (~24 dias de execução contínua)
- **Auto-scaling** e **health checks** inclusos

#### Configuração Rápida

1. **Pré-requisitos**:
   - Conta AWS criada
   - Código no GitHub
   - Credenciais Supabase válidas

2. **Variáveis de Ambiente no AWS Console**:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=seu-jwt-secret
GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
CORS_ORIGIN=https://app.seudominio.com
```

3. **Otimizações para Free Tier** (opcional):
```env
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=4
LOG_LEVEL=error
```

### 🐳 Deploy com Docker Local

```bash
# Build para produção
docker build -t buffs-api:latest .

# Deploy com variáveis de ambiente
docker run -d \
  --name buffs-api \
  -p 3001:3001 \
  --env-file .env.production \
  --restart unless-stopped \
  buffs-api:latest

# Verificar logs
docker logs buffs-api

# Verificar saúde
docker exec buffs-api node healthcheck.js
```

### ✅ Checklist Pós-Deploy

- [ ] Health check respondendo (`/health`)
- [ ] Swagger acessível (`/api`)
- [ ] CORS funcionando (teste do frontend)
- [ ] Autenticação Supabase funcionando
- [ ] Logs sem erros críticos

> 📚 **Para configuração detalhada e troubleshooting**, consulte: [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)

## 📊 Endpoints da API

Para visualizar todos os endpoints disponíveis, acesse a **documentação completa no Swagger**:

🔗 **[http://localhost:3001/api](http://localhost:3001/api)**

A documentação inclui:

- Todos os endpoints organizados por módulos
- Exemplos de requisições e respostas
- Esquemas de validação detalhados
- Interface para testar os endpoints
- Modelos de dados com descrições

---

## 🔄 Fluxo de Desenvolvimento

1. **Clone** o repositório e instale as dependências
2. **Configure** as variáveis de ambiente (.env)
3. **Configure** o banco de dados no Supabase
4. **Execute** em modo desenvolvimento
5. **Acesse** a documentação Swagger para explorar a API
6. **Teste** os health checks para verificar funcionamento
7. **Teste** os endpoints com dados reais
8. **Desenvolva** novas funcionalidades seguindo os padrões
9. **Execute** os testes antes de fazer commit
10. **Documente** alterações importantes

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.