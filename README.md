# 🐃 BUFFS API - Sistema de Gestão de Rebanhos Bufalinos

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
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
| **Arquitetura** | Modular/Domain-Driven Design | - |
| **Logs** | Winston | Latest |

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/)
- Chave de API do [Google Gemini](https://ai.google.dev/) (opcional, para classificação de alertas)
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
```

### 2. Configure o Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_do_supabase
SUPABASE_JWT_SECRET=sua_chave_jwt_secret_do_supabase

# Google Gemini AI (opcional)
GEMINI_API_KEY=sua_chave_api_gemini

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (opcional)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging Level
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
```

---

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **📖 Swagger UI (Documentação Completa):** [http://localhost:3000/api](http://localhost:3000/api)
- **💚 Health Check:** [http://localhost:3000](http://localhost:3000)

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

## 🏗️ Arquitetura do Projeto

```text
src/
├── 🔧 core/                      # Serviços fundamentais
│   ├── logger/                   # Sistema de logs customizado
│   ├── supabase/                 # Cliente e configuração Supabase
│   └── gemini/                   # Integração com Google Gemini AI
│
├── 📱 modules/                   # Módulos de domínio (Domain-Driven)
│   ├── 🔐 auth/                  # Autenticação JWT + Guards + Decorators
│   ├── 👤 usuario/               # Gestão de perfis de usuários
│   │
│   ├── 🏡 gestao-propriedade/    # Gestão de Propriedades
│   │   ├── propriedade/          # CRUD de fazendas
│   │   ├── endereco/             # Endereços das propriedades
│   │   └── lote/                 # Lotes/piquetes georreferenciados
│   │
│   ├── 🐃 rebanho/               # Controle de Rebanho
│   │   ├── bufalo/               # CRUD de animais individuais
│   │   ├── raca/                 # Cadastro de raças bufalinas
│   │   ├── grupo/                # Agrupamentos e categorias
│   │   └── mov-lote/             # Movimentações entre lotes
│   │
│   ├── ❤️ saude-zootecnia/       # Saúde e Zootecnia
│   │   ├── medicamentos/         # Cadastro de medicamentos
│   │   ├── dados-sanitarios/     # Registros sanitários e tratamentos
│   │   ├── dados-zootecnicos/    # Pesagem, medições, ECC
│   │   └── vacinacao/            # Controle de vacinas (planejado)
│   │
│   ├── 🧬 reproducao/            # Reprodução
│   │   ├── cobertura/            # Registros de cobertura/IA
│   │   ├── genealogia/           # Árvore genealógica
│   │   ├── material-genetico/    # Touros e material genético
│   │   └── simulacao/            # Simulações de cruzamento (planejado)
│   │
│   ├── 🥛 producao/              # Produção Leiteira
│   │   ├── ciclo-lactacao/       # Controle de lactação
│   │   ├── coleta/               # Coletas diárias de leite
│   │   ├── controle-leiteiro/    # Dados de produção (planejado)
│   │   ├── estoque-leite/        # Controle de estoque (planejado)
│   │   └── industria/            # Cadastro de indústrias
│   │
│   ├── 🌾 alimentacao/           # Alimentação
│   │   ├── alimentacao-def/      # Definições de tipos de alimento
│   │   └── registros/            # Registros de alimentação
│   │
│   └── � alerta/                # Sistema de Alertas Inteligente
│       ├── alerta.controller.ts  # CRUD e gestão de alertas
│       ├── alerta.service.ts     # Lógica de negócio
│       └── alerta.scheduler.ts   # Agendamento automático
```

### Padrões Arquiteturais

- **Domain-Driven Design (DDD)**: Organização por domínios de negócio
- **Module Pattern**: Cada funcionalidade é um módulo independente
- **Repository Pattern**: Abstração da camada de dados via Supabase
- **Guard Pattern**: Proteção de rotas com autenticação JWT
- **DTO Pattern**: Validação e transformação de dados
- **Dependency Injection**: Inversão de controle via NestJS

---

## 🎯 Principais Funcionalidades por Módulo

### 🔐 Autenticação e Usuários

- Sistema de autenticação JWT via Supabase
- Gestão de perfis de usuários com dados personalizados
- Guards customizados para proteção de rotas
- Decorators para extração de dados do usuário

### 🐃 Gestão de Rebanho

- Cadastro completo de búfalos com validações específicas
- Sistema de genealogia com pais e mães
- Controle automático de categorias ABCB
- Agrupamento por maturidade e características

### 🚨 Sistema de Alertas com IA

- Criação automática de alertas baseada em eventos
- Classificação de prioridade usando Google Gemini
- Filtros avançados por tipo, prioridade e status
- Sistema de notificações e rastreamento

### 🥛 Produção Inteligente

- Ciclos de lactação com controle temporal
- Coletas de leite com validações de qualidade
- Integração com indústrias para comercialização
- Relatórios de produtividade

### ❤️ Saúde Monitorada

- Histórico completo de tratamentos
- Dados zootécnicos com evolução temporal
- Controle de medicamentos e posologia
- Alertas automáticos de saúde

---

## 📊 Endpoints da API

Para visualizar todos os endpoints disponíveis, acesse a **documentação completa no Swagger**:

🔗 **[http://localhost:3000/api](http://localhost:3000/api)**

A documentação inclui:

- Todos os endpoints organizados por módulos
- Exemplos de requisições e respostas
- Esquemas de validação detalhados
- Interface para testar os endpoints
- Modelos de dados com descrições

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
```

Os testes incluem:

- Testes E2E para todos os módulos principais
- Validação de autenticação e autorização
- Testes de integração com Supabase
- Validação de DTOs e regras de negócio

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

## 🔄 Fluxo de Desenvolvimento

1. **Clone** o repositório e instale as dependências
2. **Configure** as variáveis de ambiente (.env)
3. **Configure** o banco de dados no Supabase
4. **Execute** em modo desenvolvimento
5. **Acesse** a documentação Swagger para explorar a API
6. **Teste** os endpoints com dados reais
7. **Desenvolva** novas funcionalidades seguindo os padrões
8. **Execute** os testes antes de fazer commit
9. **Documente** alterações importantes

---

## 🚀 Deploy e Produção

### Configurações de Produção

```env
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=https://seu-frontend.com
```

### Considerações para Deploy

- Configure variáveis de ambiente no seu provedor
- Ative políticas RLS adequadas no Supabase
- Configure logs de produção
- Implemente monitoramento de performance
- Configure backup automático do banco

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.