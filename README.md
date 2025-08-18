# 🐃 BUFFS API - Sistema de Gestão de Rebanhos Bufalinos

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)

API REST robusta para gerenciamento completo de rebanhos de búfalos, desenvolvida com **NestJS** e **Supabase**. 

Este sistema oferece controle integral desde o cadastro genealógico até o manejo produtivo, reprodutivo e sanitário dos animais, com foco em produtores de búfalos leiteiros e de corte.

## ✨ Funcionalidades Principais

🏡 **Gestão de Propriedades** - Cadastro de fazendas, endereços e divisão em lotes georreferenciados  
🐃 **Controle de Rebanho** - Genealogia, raças, grupos e movimentações  
🥛 **Produção Leiteira** - Controle leiteiro, estoque e coletas  
🧬 **Reprodução** - Coberturas, inseminação e material genético  
❤️ **Saúde Animal** - Medicamentos, vacinação e dados zootécnicos  
🌾 **Alimentação** - Registro e controle nutricional  
👥 **Multi-usuário** - Sistema completo de autenticação e autorização

---

## 🚀 Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Framework** | NestJS 11 |
| **Linguagem** | TypeScript |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth + JWT |
| **Documentação** | Swagger/OpenAPI |
| **Validação** | class-validator & class-transformer |
| **Arquitetura** | Modular/Domain-Driven |

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ 
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/)
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

# Application Configuration
PORT=3000
NODE_ENV=development

# Optional: Logging Level
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

- **📖 Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)
- **💚 Health Check:** [http://localhost:3000](http://localhost:3000)

### Autenticação
Todas as rotas são protegidas por JWT. Inclua o token no header:

```http
Authorization: Bearer <seu-token-jwt>
```

---

## 🏗️ Arquitetura do Projeto

```
src/
├── 🔧 core/                      # Serviços fundamentais
│   ├── logger/                   # Sistema de logs
│   └── supabase/                 # Cliente e configuração Supabase
│
├── 📱 common/                    # Interfaces compartilhadas
│   └── interfaces/
│
└── 🎯 modules/                   # Módulos de domínio
    ├── 🔐 auth/                  # Autenticação JWT + Guards
    ├── 👤 usuario/               # Gestão de usuários
    │
    ├── 🏡 gestao-propriedade/    # Gestão de Propriedades
    │   ├── propriedade/          # CRUD de fazendas
    │   ├── endereco/             # Endereços das propriedades
    │   └── lote/                 # Lotes/piquetes georreferenciados
    │
    ├── 🐃 rebanho/               # Controle de Rebanho
    │   ├── bufalo/               # CRUD de animais
    │   ├── raca/                 # Cadastro de raças
    │   ├── grupo/                # Agrupamentos de animais
    │   └── mov-lote/             # Movimentações entre lotes
    │
    ├── ❤️ saude-zootecnia/       # Saúde e Zootecnia
    │   ├── medicamentos/         # Dados sanitários e medicamentos
    │   ├── vacinacao/            # Controle de vacinas
    │   └── dados-zootecnicos/    # Pesagem, medições, ECC
    │
    ├── 🧬 reproducao/            # Reprodução
    │   ├── cobertura/            # Dados reprodutivos
    │   └── material-genetico/    # Material genético
    │
    ├── 🥛 producao/              # Produção
    │   ├── controle-leiteiro/    # Dados de lactação
    │   ├── coleta/               # Coletas de leite
    │   ├── estoque-leite/        # Controle de estoque
    │   └── industria/            # Cadastro de indústrias
    │
    └── 🌾 alimentacao/           # Alimentação
        ├── alimentacao-def/      # Definições de alimentos
        └── registros/            # Registros de alimentação
```

---

## 📊 Principais Endpoints

### 🔐 Autenticação
```
POST /auth/login          # Login de usuário
POST /auth/register       # Registro de usuário
GET  /auth/profile        # Perfil do usuário logado
```

### 🐃 Rebanho
```
GET    /bufalos           # Listar búfalos
POST   /bufalos           # Cadastrar búfalo
GET    /bufalos/:id       # Buscar búfalo específico
PATCH  /bufalos/:id       # Atualizar búfalo
DELETE /bufalos/:id       # Remover búfalo

GET    /racas             # Listar raças
GET    /grupos            # Listar grupos
```

### 🥛 Produção
```
GET  /lactacao            # Dados de lactação
POST /lactacao            # Registrar ordenha
GET  /coletas             # Coletas de leite
GET  /estoque-leite       # Controle de estoque
```

### 🏡 Propriedades
```
GET    /propriedades      # Propriedades do usuário
POST   /propriedades      # Cadastrar propriedade
GET    /lotes             # Listar lotes
POST   /enderecos         # Cadastrar endereço
```

*Para documentação completa, acesse o Swagger UI*

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

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run build` | Build para produção |
| `npm run start:prod` | Execução em produção |
| `npm run lint` | Análise estática do código |
| `npm run format` | Formatação com Prettier |
| `npm run test` | Execução dos testes |

---

## 🔄 Fluxo de Desenvolvimento

1. **Clone** o repositório
2. **Configure** as variáveis de ambiente
3. **Execute** em modo desenvolvimento
4. **Acesse** a documentação Swagger
5. **Teste** os endpoints com dados reais
6. **Faça** suas alterações seguindo os padrões
7. **Execute** os testes
8. **Commit** suas mudanças

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.