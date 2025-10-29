# 📦 Deployment - Manicure Studio Lite no VPS Ubuntu 24.04

Este guia detalha o processo completo de deployment do **Manicure Studio Lite** em um VPS Ubuntu 24.04 com OpenLiteSpeed como reverse proxy.

## 🎯 Visão Geral da Arquitetura

```
Cliente (Browser/PWA)
    ↓
OpenLiteSpeed (Port 443 - HTTPS)
    ↓
Node.js Backend (Port 3000)
    ↓
PostgreSQL (Port 5432)
```

## 📋 Pré-requisitos

- VPS Ubuntu 24.04 com acesso root
- Domínio apontado para o IP do VPS
- Pelo menos 2GB RAM e 20GB disco

## 🔧 Passo 1: Preparação do Sistema

### 1.1 Atualizar sistema e instalar dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt -y upgrade

# Instalar dependências básicas
sudo apt -y install git curl ufw build-essential

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 1.2 Instalar Node.js via NVM

```bash
# Instalar NVM
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarregar shell
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts

# Instalar PM2 globalmente
npm i -g pm2

# Verificar instalação
node --version
npm --version
pm2 --version
```

### 1.3 Instalar e configurar PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt -y install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e database
sudo -u postgres psql -c "CREATE USER mslite WITH PASSWORD 'TROCAR_SENHA_AQUI';"
sudo -u postgres psql -c "CREATE DATABASE mslite OWNER mslite;"

# Testar conexão
psql -U mslite -d mslite -h 127.0.0.1 -W
```

## 🚀 Passo 2: Deploy da Aplicação

### 2.1 Clonar e configurar projeto

```bash
# Criar diretório e clonar
sudo mkdir -p /var/www/mslite
cd /var/www/mslite
sudo git clone SEU_REPOSITORIO_GIT .

# Ajustar permissões
sudo chown -R $USER:$USER /var/www/mslite
```

### 2.2 Configurar variáveis de ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com nano ou vim
nano .env
```

Conteúdo do `.env`:

```env
# Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://mslite:TROCAR_SENHA_AQUI@127.0.0.1:5432/mslite

# JWT Secrets (use strings aleatórias fortes)
JWT_SECRET=gere_um_secret_aleatorio_forte_aqui
JWT_REFRESH_SECRET=gere_outro_secret_aleatorio_forte_aqui

# Web Origin
WEB_ORIGIN=https://app.seudominio.com

# VAPID Keys (gerar no próximo passo)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Support
SUPPORT_EMAIL=manicurestudiolite@gmail.com
```

### 2.3 Gerar chaves VAPID para Push Notifications

```bash
# Instalar web-push globalmente
npm i -g web-push

# Gerar chaves
web-push generate-vapid-keys

# Copiar e colar as chaves no .env
# VAPID_PUBLIC_KEY=BKq... (chave pública)
# VAPID_PRIVATE_KEY=abc... (chave privada)
```

### 2.4 Instalar dependências e build

```bash
# Instalar dependências
npm install

# Build do projeto (frontend + backend)
npm run build

# Executar migrations do Prisma
npm --prefix server run migrate
```

## 🔐 Passo 3: Configurar PM2

### 3.1 Criar ecosystem.config.js

Crie o arquivo `ecosystem.config.js` na raiz do projeto:

```javascript
module.exports = {
  apps: [{
    name: 'mslite',
    script: './server/dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### 3.2 Iniciar aplicação com PM2

```bash
# Criar diretório de logs
mkdir -p logs

# Iniciar app
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando sugerido pelo PM2

# Verificar status
pm2 status
pm2 logs mslite
```

## 🌐 Passo 4: Configurar OpenLiteSpeed

### 4.1 Instalar OpenLiteSpeed

```bash
# Adicionar repositório
wget -O - https://repo.litespeed.sh | sudo bash

# Instalar
sudo apt install openlitespeed

# Iniciar serviço
sudo systemctl start lsws
sudo systemctl enable lsws

# Mudar senha admin (acesso: https://SEU_IP:7080)
sudo /usr/local/lsws/admin/misc/admpass.sh
```

### 4.2 Configurar Virtual Host

1. **Acessar painel admin**: `https://SEU_IP:7080`

2. **Criar Virtual Host**:
   - Virtual Hosts → Add
   - Name: `mslite`
   - Root: `/var/www/mslite/web/dist`
   - Domain: `app.seudominio.com`

3. **Configurar Context (Proxy para API)**:
   - Em Virtual Host → Context → Add
   - Type: `Proxy`
   - URI: `/api/`
   - Web Server Address: `http://127.0.0.1:3000`

**OU configurar para servir SPA pelo Node (recomendado):**

- Context Type: `Proxy`
- URI: `/`
- Web Server Address: `http://127.0.0.1:3000`
- Root: Deixar vazio (Node servirá o SPA)

### 4.3 Configurar HTTPS (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install certbot

# Obter certificado
sudo certbot certonly --webroot -w /var/www/mslite/web/dist -d app.seudominio.com
```

No painel OpenLiteSpeed:
- Virtual Host → SSL → SSL Private Key & Certificate
- Private Key File: `/etc/letsencrypt/live/app.seudominio.com/privkey.pem`
- Certificate File: `/etc/letsencrypt/live/app.seudominio.com/fullchain.pem`
- Chained Certificate: Yes

### 4.4 Listeners

Configurar listeners:
- **HTTP Listener (Port 80)**:
  - Redirect to HTTPS: Yes
  
- **HTTPS Listener (Port 443)**:
  - Virtual Host Mappings: `mslite`
  - SSL Certificate configurado

**Restart OpenLiteSpeed:**
```bash
sudo systemctl restart lsws
```

## ✅ Passo 5: Testes Finais

### 5.1 Testar Backend

```bash
# Verificar se Node está rodando
pm2 status

# Testar endpoint
curl http://localhost:3000/api/health

# Ver logs
pm2 logs mslite
```

### 5.2 Testar Frontend

1. Acessar `https://app.seudominio.com`
2. Verificar se carrega a tela de login
3. Criar conta e fazer login
4. Testar todas as páginas (Dashboard, Agenda, Clientes, etc.)

### 5.3 Testar PWA

1. No mobile ou desktop Chrome:
   - Menu → "Instalar app" ou "Add to Home Screen"
2. Verificar ícones corretos
3. Testar funcionamento offline (básico)

### 5.4 Testar Push Notifications

Criar endpoint de teste no backend (`/push/test`):

```bash
curl -X POST https://app.seudominio.com/api/push/test \
  -H "Content-Type: application/json" \
  -H "Cookie: sua_sessao_aqui"
```

Verificar se notificação aparece no navegador.

## 🔄 Atualizações Futuras

```bash
# No VPS
cd /var/www/mslite

# Pull das atualizações
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Rebuild
npm run build

# Migrar database (se houver alterações)
npm --prefix server run migrate

# Restart PM2
pm2 restart mslite

# Limpar cache do OpenLiteSpeed (se necessário)
sudo rm -rf /tmp/lshttpd/*
sudo systemctl restart lsws
```

## 🐛 Troubleshooting

### App não inicia
```bash
pm2 logs mslite --lines 50
```

### Erro de database
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -U mslite -d mslite -h 127.0.0.1 -W
```

### Push notifications não funcionam
- Verificar se VAPID keys estão corretas no `.env`
- Testar se service worker está registrado (DevTools → Application → Service Workers)
- Verificar permissões do navegador para notificações

### HTTPS não funciona
```bash
# Renovar certificado
sudo certbot renew

# Verificar logs OpenLiteSpeed
sudo tail -f /usr/local/lsws/logs/error.log
```

## 📊 Monitoramento

```bash
# Status PM2
pm2 monit

# Logs em tempo real
pm2 logs mslite --lines 100

# Métricas
pm2 describe mslite

# PostgreSQL queries lentas
sudo -u postgres psql -d mslite -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## 🔒 Segurança

1. **Firewall**: Certifique-se de que apenas portas 22, 80 e 443 estão abertas
2. **PostgreSQL**: Não exponha a porta 5432 externamente
3. **Secrets**: Use senhas fortes e únicas para JWT_SECRET e database
4. **CORS**: Configure corretamente WEB_ORIGIN no `.env`
5. **Rate Limiting**: Implemente no backend para rotas sensíveis
6. **Backups**: Configure backups automáticos do PostgreSQL

```bash
# Exemplo de backup PostgreSQL
sudo -u postgres pg_dump mslite > backup_$(date +%Y%m%d).sql
```

## 📞 Suporte

Para dúvidas ou problemas:
- Email: manicurestudiolite@gmail.com
- Logs do sistema: `/var/log/syslog`
- Logs do app: `pm2 logs mslite`
- Logs OpenLiteSpeed: `/usr/local/lsws/logs/`
