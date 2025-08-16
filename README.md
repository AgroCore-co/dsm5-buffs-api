# 🐃 BUFFS API - Sistema de Gerenciamento de Búfalos

API REST para gerenciamento completo de rebanhos de búfalos, desenvolvida com **NestJS** e **Supabase**.  
Este sistema cobre todos os ciclos de vida do animal, desde o cadastro e genealogia até o controle de saúde, reprodução e produção.

---

## 🚀 Tecnologias

- **Framework:** NestJS 11  
- **Linguagem:** TypeScript  
- **Banco de Dados:** Supabase (PostgreSQL)  
- **Autenticação:** Supabase Auth (JWT)  
- **Documentação:** Swagger/OpenAPI  
- **Validação:** class-validator & class-transformer  

---

## 📋 Pré-requisitos

- Node.js 18+  
- npm ou yarn  
- Conta no Supabase  

---

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd dsm5-buffs-api
````

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, utilizando o `env.example` como base:

```env
# Supabase Configuration
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_anon_do_supabase
SUPABASE_JWT_SECRET=sua_chave_jwt_secret_do_supabase

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 4. Configure o banco de dados

* Acesse seu projeto no Supabase e utilize o editor de tabelas ou scripts SQL para criar o esquema do banco de dados conforme a estrutura dos módulos da API.
* Configure as **Políticas de Segurança (RLS - Row Level Security)** para proteger o acesso aos dados.

---

## 🏃‍♂️ Executando o Projeto

### Modo de Desenvolvimento

```bash
npm run start:dev
```

### Modo de Produção

```bash
npm run build
npm run start:prod
```

---

## 📚 Documentação da API

Após iniciar o servidor, a documentação completa e interativa da API estará disponível através do Swagger:

* **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)
* **Health Check:** [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Estrutura do Projeto

A API é organizada em uma arquitetura modular, onde cada módulo representa um domínio de negócio específico.

```
src/
├── core/
│   ├── logger/              # Serviço de logs
│   └── supabase/            # Cliente e configuração do Supabase
├── modules/
│   ├── auth/                # Autenticação e estratégias JWT
│   ├── usuario/             # Gerenciamento de usuários
│   ├── gestao-propriedade/  # Módulo agregador
│   │   ├── propriedade/     # Cadastro de fazendas
│   │   ├── endereco/        # Endereços das propriedades
│   │   └── lote/            # Lotes e piquetes
│   ├── rebanho/             # Módulo agregador
│   │   ├── bufalo/          # Cadastro e controle de animais
│   │   ├── raca/            # Cadastro de raças
│   │   └── grupo/           # Agrupamento de animais
│   ├── saude-zootecnia/     # Módulo agregador
│   │   ├── medicamentos/    # Cadastro de medicamentos
│   │   ├── vacinacao/       # Registro de vacinações
│   │   └── dados-zootecnicos/ # Pesagem, medições, etc.
│   ├── reproducao/          # Módulo agregador
│   │   └── cobertura/       # Registro de coberturas e inseminações
│   ├── producao/            # Módulo agregador
│   │   └── controle-leiteiro/ # Registro da produção de leite
│   └── alimentacao/         # Módulo agregador
│       └── alimentacao-def/ # Definição de tipos de alimentos
└── main.ts                  # Ponto de entrada da aplicação
```

---

## 🔐 Autenticação

A API utiliza autenticação **JWT** gerenciada pelo Supabase. Todas as rotas, exceto as de autenticação, são protegidas.

* **Cadastro & Login:** realizados através do cliente Supabase no frontend, que retorna um token JWT.
* **Requisições Protegidas:** inclua o token no header da requisição:

```http
Authorization: Bearer <seu-token-jwt>
```

---

## 📊 Módulos Principais

### 👥 Usuários

* Gerenciamento de perfis de usuários, vinculados à autenticação do Supabase.

### 🏡 Gestão de Propriedade

* **Propriedades:** cadastro e gerenciamento de fazendas.
* **Endereços:** controle de localização das propriedades.
* **Lotes:** divisão das propriedades em lotes/piquetes para melhor organização do rebanho.

### 🐃 Rebanho

* **Búfalos:** CRUD completo para animais (nome, brinco, nascimento, sexo, genealogia).
* **Raças e Grupos:** classificação e organização dos animais.

### ❤️ Saúde e Zootecnia

* **Medicamentos:** catálogo de medicamentos e insumos.
* **Vacinação:** registro detalhado de vacinas e medicamentos aplicados.
* **Dados Zootécnicos:** acompanhamento de métricas (peso, altura, ECC).

### 🧬 Reprodução

* **Cobertura:** controle do ciclo reprodutivo (monta natural ou inseminação) e diagnóstico de gestação.

### 🥛 Produção

* **Controle Leiteiro:** registro diário da produção de leite por animal.

### 🌾 Alimentação

* **Definição de Alimentos:** cadastro de rações, pastagens e outros alimentos.

---

## 🧪 Testes

Execute os testes para garantir a integridade e funcionamento da aplicação:

```bash
# Testes unitários
npm run test

# Testes end-to-end (E2E)
npm run test:e2e

# Relatório de cobertura de testes
npm run test:cov
```

---

## 📝 Scripts Disponíveis

* `npm run start:dev` → inicia o servidor em desenvolvimento com hot-reload.
* `npm run build` → compila TypeScript para JavaScript.
* `npm run start:prod` → inicia em produção.
* `npm run lint` → análise estática do código.
* `npm run format` → formata o código com Prettier.

---

## 📄 Licença

Este projeto está sob a licença **MIT**.
Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
