#!/bin/bash

# Script de configuração inicial para Amazon Linux EC2
echo "🚀 Configurando EC2 para BUFFS API..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo dnf update -y

# Instalar Node.js 18
echo "🟢 Instalando Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verificar instalação
echo "✅ Versões instaladas:"
node --version
npm --version

# Instalar PM2 globalmente
echo "⚡ Instalando PM2..."
sudo npm install -g pm2

# Instalar Git (se não estiver instalado)
echo "📁 Instalando Git..."
sudo dnf install -y git

# Criar diretório da aplicação
echo "📂 Preparando diretório da aplicação..."
cd /home/ec2-user
git clone https://github.com/AgroCore-co/dsm5-buffs-api.git || echo "Repositório já existe"
cd dsm5-buffs-api

# Criar arquivo .env
echo "⚙️ Configurando variáveis de ambiente..."
cat > .env << EOL
SUPABASE_URL="https://snvnrhebdsrgoknsmrnp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudm5yaGViZHNyZ29rbnNtcm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDUxMjAsImV4cCI6MjA3MDE4MTEyMH0.RQoWORwLRRSmsbszWYr38d7aRsbHG-u2mHwc5iIIkug"
GEMINI_API_KEY="AIzaSyD4C-HfLaBNsIXABKaaMXXvcne-Dg58BYE"
SUPABASE_JWT_SECRET="to8NqN6DDQjRv89+ywK4hP8114D3qqQpKkZ59CnM4jlToxLPAIAg/zdkKzRPYK3l4SuM466ioR9MFKzIFhKahw=="
IA_API_URL="http://localhost:5001"
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://seu-frontend.com,https://www.buffs.com,http://localhost:3000"
EOL

# Instalar dependências (TODAS - incluindo dev para build)
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔨 Building aplicação..."
npm run build

# Iniciar aplicação com PM2
echo "🚀 Iniciando aplicação..."
pm2 start dist/main.js --name "dsm5-buffs-api"
pm2 save

# Configurar PM2 para iniciar no boot
echo "⚙️ Configurando PM2 startup..."
pm2 startup
echo ""
echo "⚠️ IMPORTANTE: Execute o comando mostrado acima!"

echo ""
echo "✅ Configuração inicial concluída!"
echo ""
echo "📋 Checklist:"
echo "   ✅ Node.js $(node --version) instalado"
echo "   ✅ PM2 instalado e configurado"
echo "   ✅ Aplicação clonada e configurada"
echo "   ✅ Variáveis de ambiente configuradas"
echo "   ✅ PM2 iniciado"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Execute o comando de startup do PM2 que apareceu acima"
echo "   2. Configure o Security Group para permitir tráfego na porta 3001"
echo "   3. Verifique se os secrets do GitHub estão configurados:"
echo "      - EC2_HOST: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'SEU_IP_EC2')"
echo "      - EC2_USER: ec2-user"
echo "      - EC2_SSH_KEY: conteúdo da sua chave .pem"
echo ""
echo "🔎 Testando aplicação..."
curl -f http://localhost:3001/health && echo "✅ API funcionando!" || echo "❌ API não respondeu"
echo ""
echo "🌐 Teste manual: curl http://localhost:3001/health"
echo "📊 PM2 status: pm2 status"
echo "📊 PM2 logs: pm2 logs dsm5-buffs-api"