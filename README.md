# BUFFS API - Sistema de Gestão de Rebanhos Bufalinos

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

API REST completa e moderna para gerenciamento inteligente de rebanhos bufalinos.

Sistema abrangente desenvolvido com **NestJS** e **Supabase** que oferece controle integral desde o cadastro genealógico até o manejo produtivo, reprodutivo, sanitário e nutricional dos animais. Voltado especialmente para produtores de búfalos leiteiros e de corte, com sistema de alertas inteligentes potencializado por IA.

---

## Índice

- [Funcionalidades Principais](#funcionalidades-principais)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Documentação da API](#documentação-da-api)
- [Segurança](#segurança-implementada)
- [Monitoramento](#monitoramento-e-health-checks)
- [Testes](#testes)
- [Deploy](#deploy-e-produção)
- [Módulos e Endpoints](#módulos-e-endpoints)

---

## Funcionalidades Principais

### Gestão de Propriedades

- Cadastro completo de fazendas e propriedades rurais
- Sistema de endereçamento detalhado
- Divisão em lotes/piquetes com georreferenciamento
- Controle de movimentação de animais entre lotes

### Controle de Rebanho

- Registro individual de búfalos com genealogia completa
- Cadastro de raças e características específicas
- Agrupamento por categorias (bezerros, novilhas, vacas, touros)
- Sistema de identificação por brincos e microchips
- Controle de categoria ABCB automático

### Produção Leiteira

- Controle detalhado de lactação e ciclos produtivos
- Registro de coletas diárias de leite
- Gestão de estoque e qualidade do leite
- Integração com indústrias e cooperativas
- Relatórios de produtividade por animal

### Reprodução

- Controle de coberturas e inseminação artificial
- Gestão de material genético e touros reprodutores
- Árvore genealógica completa com múltiplas gerações
- Simulações de cruzamentos
- Acompanhamento de prenhez e partos

### Saúde e Zootecnia

- Cadastro de medicamentos e protocolos sanitários
- Histórico completo de vacinações
- Dados zootécnicos (peso, altura, escore corporal)
- Controle de tratamentos e medicações
- Alertas automáticos de saúde com IA

### Alimentação

- Definição de tipos de alimentação e rações
- Registro detalhado de fornecimento nutricional
- Controle de consumo por animal ou grupo
- Planejamento nutricional

### Sistema de Alertas Inteligente

- Alertas automáticos para saúde, reprodução e manejo
- Classificação de prioridade com inteligência artificial
- Notificações personalizadas por tipo de evento
- Sistema de rastreamento de alertas visualizados

### Multi-usuário e Segurança

- Sistema robusto de autenticação JWT via Supabase
- Controle de acesso por usuário
- Políticas de segurança a nível de linha (RLS)
- Auditoria completa de operações

---

## Tecnologias

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Framework** | NestJS | 11.x |
| **Linguagem** | TypeScript | 5.x |
| **Runtime** | Node.js | 18+ |
| **Banco de Dados** | Supabase (PostgreSQL) | Latest |
| **Autenticação** | Supabase Auth + JWT + Passport | Latest |
| **Documentação** | Swagger/OpenAPI | 7.x |
| **Validação** | class-validator & class-transformer | Latest |
| **IA** | Google Gemini | 1.5 Flash |
| **Cache** | Cache Manager | 5.x |
| **Segurança** | Helmet | Latest |
| **CORS** | @nestjs/common | Built-in |
| **Logs** | Winston | Latest |
| **Agendamento** | @nestjs/schedule | Latest |
| **HTTP Client** | Axios | Latest |

---

## Arquitetura

### Estrutura Modular

O projeto segue uma arquitetura **modular e escalável**, organizada por domínios de negócio:

```
src/
├── core/                    # Módulos compartilhados
│   ├── cache/              # Sistema de cache
│   ├── decorators/         # Decoradores customizados
│   ├── gemini/             # Integração com IA
│   ├── logger/             # Sistema de logs
│   ├── supabase/           # Cliente Supabase
│   └── utils/              # Utilitários compartilhados
│
├── modules/                 # Módulos de domínio
│   ├── alerta/             # Sistema de alertas inteligentes
│   ├── alimentacao/        # Controle nutricional
│   ├── auth/               # Autenticação e autorização
│   ├── dashboard/          # Métricas e indicadores
│   ├── gestao-propriedade/ # Fazendas, lotes e endereços
│   ├── producao/           # Gestão de produção leiteira
│   ├── rebanho/            # Gestão de animais
│   ├── reproducao/         # Controle reprodutivo
│   ├── saude-zootecnia/    # Saúde e dados zootécnicos
│   └── usuario/            # Gestão de usuários
│
├── health/                  # Health checks
└── app.module.ts           # Módulo raiz
```

### Padrões Arquiteturais

- **Domain-Driven Design (DDD)**: Organização por domínios de negócio
- **Module Pattern**: Cada funcionalidade é um módulo independente e reutilizável
- **Repository Pattern**: Abstração da camada de dados via Supabase
- **Guard Pattern**: Proteção de rotas com autenticação JWT
- **DTO Pattern**: Validação e transformação de dados com class-validator
- **Dependency Injection**: Inversão de controle via NestJS
- **Service Layer**: Lógica de negócio isolada dos controllers
- **Strategy Pattern**: Implementações específicas para cada domínio

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **[Node.js](https://nodejs.org/)** versão 18 ou superior
- **[npm](https://www.npmjs.com/)** ou **[yarn](https://yarnpkg.com/)**
- **[Git](https://git-scm.com/)**
- Conta no **[Supabase](https://supabase.com/)** (gratuita)
- Chave de API do **[Google Gemini](https://ai.google.dev/)** (opcional, para classificação inteligente de alertas)

---

## Instalação e Configuração

### 1. Clone o Repositório

```bash
# Clone o repositório
git clone https://github.com/AgroCore-co/dsm5-buffs-api.git
cd dsm5-buffs-api

# Instale as dependências
npm install
```

### 2. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
SUPABASE_JWT_SECRET=sua_jwt_secret_do_supabase

# Google Gemini AI (opcional - para classificação inteligente de alertas)
GEMINI_API_KEY=sua_chave_api_gemini

# Application Configuration
NODE_ENV=development
PORT=3001

# CORS Configuration (adicione os domínios do seu frontend)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=debug
```

> 💡 **Dica**: Veja o arquivo `env.example` para mais detalhes sobre cada variável.

### 3. Configure o Banco de Dados Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Crie um novo projeto (se ainda não tiver)
3. Execute os scripts SQL necessários para criar as tabelas (consulte a documentação do banco)
4. Configure as políticas RLS (Row Level Security) para proteger seus dados
5. Copie as credenciais (URL, Anon Key, Service Role Key e JWT Secret) para o arquivo `.env`

### 4. Execute o Projeto

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Build para produção
npm run build

# Produção
npm run start:prod
```

A API estará disponível em `http://localhost:3001`

---

## Documentação da API

Após iniciar o servidor, acesse:

| Endpoint | Descrição |
|----------|-----------|
| **[http://localhost:3001/api](http://localhost:3001/api)** | Swagger UI - Documentação interativa completa |
| **[http://localhost:3001/health](http://localhost:3001/health)** | Health check básico |
| **[http://localhost:3001/health/detailed](http://localhost:3001/health/detailed)** | Health check detalhado |

### Autenticação

Todas as rotas (exceto `/health` e `/api`) são protegidas por **JWT**. Para acessar os endpoints:

1. **Registre/Faça login** via Supabase Auth no frontend
2. **Obtenha o JWT token** retornado pelo Supabase
3. **Inclua o token** no header das requisições:

```http
Authorization: Bearer <seu-token-jwt>
```

**Exemplo com cURL:**

```bash
curl -X GET http://localhost:3001/rebanho/bufalo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Segurança Implementada

### Headers de Segurança (Helmet)

- **X-Content-Type-Options**: Previne MIME sniffing
- **X-Frame-Options**: Proteção contra clickjacking
- **X-XSS-Protection**: Proteção contra XSS
- **Strict-Transport-Security**: Força uso de HTTPS (produção)
- **Content-Security-Policy**: Controla recursos carregados

### CORS Configurado

- Origens permitidas configuráveis via ambiente
- Suporte a credenciais
- Headers específicos permitidos
- Métodos HTTP controlados

### Validação Robusta

- Whitelist de propriedades permitidas
- Rejeição de propriedades não permitidas
- Transformação automática de tipos
- Mensagens de erro estruturadas e detalhadas

### Row Level Security (RLS)

- Políticas de segurança a nível de linha no Supabase
- Isolamento automático de dados por propriedade
- Controle de acesso granular

---

## Monitoramento e Health Checks

### Health Check Básico

```http
GET /health
```

```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:30:00.000Z",
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
  "timestamp": "2025-11-13T10:30:00.000Z",
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

## Testes

```bash
# Testes unitários
npm run test

# Testes com watch mode
npm run test:watch

# Testes end-to-end
npm run test:e2e

# Cobertura de testes
npm run test:cov

# Testar health checks manualmente
curl http://localhost:3001/health
curl http://localhost:3001/health/detailed
```

**Testes Implementados:**

- Testes E2E para todos os módulos principais
- Validação de autenticação e autorização
- Testes de integração com Supabase
- Validação de DTOs e regras de negócio
- Testes de health checks e monitoramento
- Testes de segurança (CORS, Headers, etc.)

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run start` | Inicia a aplicação |
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run start:debug` | Desenvolvimento com debug |
| `npm run start:prod` | Execução em produção |
| `npm run build` | Build para produção |
| `npm run lint` | Análise estática do código (ESLint) |
| `npm run format` | Formatação automática (Prettier) |
| `npm run test` | Execução dos testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:cov` | Relatório de cobertura de testes |
| `npm run test:debug` | Testes em modo debug |
| `npm run test:e2e` | Testes end-to-end |

---

## Deploy e Produção

### Preparação para Deploy

Antes de fazer deploy, verifique:

- Todas as variáveis de ambiente configuradas
- Testes passando (`npm run test:e2e`)
- Build funcionando (`npm run build`)
- Health checks respondendo corretamente
- Logs configurados para produção

**2. Variáveis de Ambiente no AWS Console:**

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=seu-jwt-secret
GEMINI_API_KEY=AIzaSy...
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app.seudominio.com
LOG_LEVEL=error
```

**3. Otimizações para Free Tier** (opcional):

```env
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=4
```

### Checklist Pós-Deploy

- Health check básico respondendo (`/health`)
- Health check detalhado respondendo (`/health/detailed`)
- Swagger acessível e funcional (`/api`)
- CORS funcionando (teste do frontend)
- Autenticação JWT funcionando
- Conexão com Supabase estabelecida
- Logs sendo gerados corretamente
- Alertas inteligentes funcionando (se Gemini configurado)

> Para configuração detalhada e troubleshooting, consulte: [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)

---

## Módulos e Endpoints

### Principais Módulos

| Módulo | Descrição | Endpoints Base |
|--------|-----------|----------------|
| **Gestão de Propriedades** | Fazendas, lotes e endereços | `/gestao-propriedade/*` |
| **Rebanho** | Búfalos, grupos, raças | `/rebanho/*` |
| **Produção** | Controle leiteiro, ciclos, coletas | `/producao/*` |
| **Reprodução** | Coberturas, genealogia, simulações | `/reproducao/*` |
| **Saúde e Zootecnia** | Dados sanitários, medicamentos, vacinação | `/saude-zootecnia/*` |
| **Alimentação** | Definições e registros nutricionais | `/alimentacao/*` |
| **Alertas** | Sistema inteligente de alertas | `/alerta/*` |
| **Dashboard** | Métricas e indicadores | `/dashboard/*` |
| **Usuários** | Gestão de usuários e funcionários | `/usuario/*` |
| **Autenticação** | Login, registro, refresh token | `/auth/*` |

### Documentação Completa

Para visualizar todos os endpoints disponíveis, acesse a **documentação interativa no Swagger**:

**[http://localhost:3001/api](http://localhost:3001/api)**

A documentação inclui:

- Todos os endpoints organizados por módulos
- Exemplos de requisições e respostas
- Esquemas de validação detalhados
- Interface para testar os endpoints
- Modelos de dados com descrições
- Códigos de status HTTP
- Requisitos de autenticação

---

## Suporte e Contato

- **Email**: <buffsapp@gmail.com>
- **Issues**: [GitHub Issues](https://github.com/AgroCore-co/dsm5-buffs-api/issues)
- **Documentação**: [Swagger API Docs](http://localhost:3001/api)

---

**Desenvolvido por [AgroCore](https://github.com/AgroCore-co)**
