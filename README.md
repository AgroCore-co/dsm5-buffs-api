# 🐃 BUFFS API - Sistema de Gerenciamento de Búfalos

API REST para gerenciamento completo de rebanhos de búfalos, desenvolvida com NestJS e Supabase.

## 🚀 Tecnologias

- **Framework:** NestJS 11
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth (JWT)
- **Documentação:** Swagger/OpenAPI
- **Validação:** class-validator
- **Linguagem:** TypeScript

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd dsm5-buffs-api
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

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
- Crie as tabelas necessárias no Supabase
- Configure as políticas de segurança (RLS)
- Configure as funções e triggers necessárias

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:
- **Swagger UI:** http://localhost:3000/api
- **Health Check:** http://localhost:3000

## 🏗️ Estrutura do Projeto

```
src/
├── core/
│   └── supabase/          # Configuração do Supabase
├── modules/
│   ├── auth/              # Autenticação JWT
│   ├── usuario/           # Gerenciamento de usuários
│   ├── rebanho/           # Gerenciamento de búfalos
│   └── gestao-propriedade/ # Gestão de propriedades
│       ├── endereco/      # Endereços
│       ├── lote/          # Lotes/Piquetes
│       └── propriedade/   # Propriedades
└── main.ts               # Configuração da aplicação
```

## 🔐 Autenticação

A API utiliza autenticação JWT através do Supabase:

1. **Cadastro:** Realizado no frontend via Supabase Auth
2. **Login:** Gera token JWT válido
3. **Requisições:** Incluir header `Authorization: Bearer <token>`

## 📊 Módulos Principais

### 👥 Usuários
- CRUD completo de perfis de usuários
- Vinculação com autenticação Supabase
- Validação de dados

### 🐃 Rebanho
- Gerenciamento de búfalos individuais
- Controle de genealogia (pai/mãe)
- Status ativo/inativo

### 🏡 Gestão de Propriedade
- **Endereços:** Localização geográfica
- **Propriedades:** Fazendas/estabelecimentos
- **Lotes:** Piquetes com geometria GeoJSON

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📝 Scripts Disponíveis

- `npm run start:dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run start:prod` - Executar build de produção
- `npm run lint` - Linting do código
- `npm run format` - Formatação com Prettier

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através dos canais oficiais do projeto.
