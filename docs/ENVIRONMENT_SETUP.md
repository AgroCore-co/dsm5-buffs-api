# 🔧 Configuração de Ambiente - BUFFS API

## 📋 Visão Geral

Este documento explica como configurar as variáveis de ambiente para diferentes cenários de deploy da BUFFS API.

## 🏠 Desenvolvimento Local

### 1. Configuração Inicial

```bash
# 1. Copiar o arquivo de exemplo
cp env.example .env

# 2. Editar o arquivo .env com suas credenciais reais
nano .env  # ou code .env
```

### 2. Variáveis Essenciais para Desenvolvimento

```env
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_KEY="sua-chave-anon"
SUPABASE_JWT_SECRET="seu-jwt-secret"
GEMINI_API_KEY="sua-chave-gemini"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

## ☁️ Deploy AWS App Runner

### 1. Configuração via Console AWS

No AWS App Runner, configure estas variáveis no painel:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` | URL do projeto Supabase |
| `SUPABASE_KEY` | `eyJhbGci...` | Chave anon do Supabase |
| `SUPABASE_JWT_SECRET` | `sua-jwt-secret` | Segredo JWT do Supabase |
| `GEMINI_API_KEY` | `AIzaSy...` | Chave da API Google Gemini |
| `NODE_ENV` | `production` | Ambiente de produção |
| `CORS_ORIGIN` | `https://app.seudominio.com` | Domínio do seu frontend |
| `LOG_LEVEL` | `error` | Nível de logs (opcional) |

### 2. Otimizações para Free Tier

```env
NODE_OPTIONS="--max-old-space-size=1024"
UV_THREADPOOL_SIZE=4
```

## 🔐 Segurança

### ⚠️ Variáveis Sensíveis

**NUNCA** exponha estas variáveis:

- `SUPABASE_JWT_SECRET`
- `GEMINI_API_KEY`
- Qualquer chave de API

### 🛡️ Boas Práticas

1. **Desenvolvimento**: Use arquivo `.env` (já está no `.gitignore`)
2. **Produção**: Use variáveis de ambiente do serviço cloud
3. **CORS**: Sempre especifique domínios exatos, nunca use `*`
4. **Logs**: Em produção, use apenas `error` ou `warn`

## 🧪 Validação da Configuração

### Teste de Conexão Supabase

```bash
# Verificar se as credenciais estão corretas
curl -H "apikey: SUA_SUPABASE_KEY" \
     -H "Authorization: Bearer SUA_SUPABASE_KEY" \
     "https://seu-projeto.supabase.co/rest/v1/"
```

### Teste da API Local

```bash
# Iniciar em modo desenvolvimento
npm run start:dev

# Testar health check
curl http://localhost:3001/health

# Verificar Swagger
open http://localhost:3001/api
```

## 🚨 Troubleshooting

### Problemas Comuns

| Erro | Solução |
|------|---------|
| `CORS Error` | Verifique se `CORS_ORIGIN` inclui o domínio do frontend |
| `JWT Invalid` | Confirme se `SUPABASE_JWT_SECRET` está correto |
| `Supabase Connection Failed` | Verifique `SUPABASE_URL` e `SUPABASE_KEY` |
| `Gemini API Error` | Confirme se `GEMINI_API_KEY` é válida |

### Debug de Variáveis

```bash
# Verificar se as variáveis foram carregadas
node -e "console.log(process.env.SUPABASE_URL)"
```

## 📞 Suporte

- **Supabase**: <https://supabase.com/docs>
- **AWS App Runner**: <https://docs.aws.amazon.com/apprunner/>
- **NestJS Config**: <https://docs.nestjs.com/techniques/configuration>
