# Manicure Studio Lite - Backend Server

Backend Node.js + Fastify + Prisma + PostgreSQL para deploy em VPS Ubuntu.

## 📋 Estrutura

```
/server
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js
│   ├── config/
│   │   └── env.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── services.js
│   │   ├── products.js
│   │   ├── appointments.js
│   │   ├── push.js
│   │   ├── settings.js
│   │   └── reports.js
│   ├── services/
│   │   └── cron.service.js
│   └── utils/
│       └── jwt.js
├── package.json
└── .env
```

## 🚀 Deploy no VPS Ubuntu 24.04

### 1. Instalar Node.js via NVM

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
npm i -g pm2
```

### 2. Instalar PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar database e usuário
sudo -u postgres psql -c "CREATE USER mslite WITH PASSWORD 'SENHA_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE mslite OWNER mslite;"
```

### 3. Clonar projeto e configurar

```bash
sudo mkdir -p /var/www/mslite
cd /var/www/mslite
sudo git clone SEU_REPO .
sudo chown -R $USER:$USER /var/www/mslite

# Instalar dependências do servidor
cd server
npm install

# Configurar .env
cp .env.example .env
nano .env  # Editar variáveis
```

### 4. Gerar chaves VAPID (Push Notifications)

```bash
npm i -g web-push
web-push generate-vapid-keys
# Copiar chaves para .env
```

### 5. Executar migrations

```bash
npm run migrate
```

### 6. Build do frontend

```bash
cd /var/www/mslite
mkdir -p web/dist
# Fazer build do frontend React e colocar em web/dist
```

### 7. Iniciar com PM2

```bash
cd /var/www/mslite
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Executar comando sugerido
```

### 8. Configurar OpenLiteSpeed (Reverse Proxy)

Instalar:
```bash
wget -O - https://repo.litespeed.sh | sudo bash
sudo apt install openlitespeed
sudo systemctl start lsws
sudo systemctl enable lsws
```

No painel admin (https://SEU_IP:7080):
1. Virtual Host → Add
   - Name: `mslite`
   - Root: `/var/www/mslite/web/dist`
   - Domain: `app.seudominio.com`

2. Context → Add Proxy
   - URI: `/`
   - Address: `http://127.0.0.1:3000`

3. SSL → Configurar Let's Encrypt
   ```bash
   sudo apt install certbot
   sudo certbot certonly --webroot -w /var/www/mslite/web/dist -d app.seudominio.com
   ```

4. Listeners
   - Port 80: Redirect to HTTPS
   - Port 443: SSL + Virtual Host mslite

## 📡 Endpoints da API

### Auth
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Dados do usuário

### Clients
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Services
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `PUT /api/services/:id` - Atualizar serviço
- `DELETE /api/services/:id` - Deletar serviço

### Products
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/:id/adjust` - Ajustar estoque
- `GET /api/products/:id/history` - Histórico de movimentações

### Appointments
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `PATCH /api/appointments/:id/status` - Atualizar status
- `DELETE /api/appointments/:id` - Deletar agendamento

### Push Notifications
- `POST /api/push/subscribe` - Inscrever notificações
- `POST /api/push/unsubscribe` - Desinscrever
- `GET /api/push/vapid-key` - Obter chave pública VAPID

### Settings
- `GET /api/settings/me` - Obter configurações
- `PUT /api/settings/me` - Atualizar configurações

### Reports
- `GET /api/reports/revenue` - Relatório de faturamento
- `GET /api/reports/top-services` - Serviços mais vendidos
- `GET /api/reports/top-clients` - Clientes mais frequentes
- `GET /api/reports/low-stock` - Produtos com estoque baixo

### Health
- `GET /api/health` - Status do servidor

## 🔄 Atualizar aplicação

```bash
cd /var/www/mslite
git pull origin main
cd server
npm install
npm run migrate
pm2 restart mslite
```

## 🐛 Logs e debug

```bash
# Logs PM2
pm2 logs mslite
pm2 logs mslite --lines 100

# Status
pm2 status
pm2 monit

# PostgreSQL
psql -U mslite -d mslite -h 127.0.0.1 -W
```

## 🔒 Segurança

- Firewall: UFW com portas 22, 80, 443
- PostgreSQL: Não expor porta 5432 externamente
- Secrets: JWT_SECRET e JWT_REFRESH_SECRET únicos e fortes
- CORS: Configure WEB_ORIGIN corretamente
- Rate limiting: Adicione se necessário

## 📧 Suporte

Email: manicurestudiolite@gmail.com
