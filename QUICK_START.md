# 🚀 Quick Start - Manicure Studio Lite

## Instalação Rápida (Desenvolvimento Local)

### 1. Instale as Dependências

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure o Banco de Dados

```bash
# Crie um banco PostgreSQL
createdb manicure_studio

# Configure o .env no server/
cd server
cp .env.example .env

# Edite o .env com suas credenciais do PostgreSQL
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/manicure_studio"
```

### 3. Execute as Migrations

```bash
# Ainda dentro de server/
npx prisma generate
npx prisma migrate dev
```

### 4. Gere as Chaves VAPID (Push Notifications)

```bash
npx web-push generate-vapid-keys

# Cole as chaves no .env:
# VAPID_PUBLIC_KEY="..."
# VAPID_PRIVATE_KEY="..."
# VAPID_EMAIL="mailto:seu@email.com"
```

### 5. Inicie o Backend

```bash
# Terminal 1 - Backend
cd server
npm run dev
```

### 6. Inicie o Frontend

```bash
# Terminal 2 - Frontend (na raiz)
npm run dev
```

## 🎉 Pronto!

Acesse: http://localhost:5173

### Primeiro Acesso

1. Clique em "Registrar"
2. Crie sua conta
3. Faça login
4. Configure seus serviços em "Serviços"
5. Adicione clientes em "Clientes"
6. Comece a agendar! 🎨

## 📱 Testar PWA

1. Acesse via HTTPS ou localhost
2. Vá em Configurações
3. Clique em "Instalar Aplicativo"
4. Ative as notificações

## 🆘 Problemas?

### Backend não inicia
- Verifique se PostgreSQL está rodando: `sudo systemctl status postgresql`
- Confira as credenciais do banco no `.env`

### Frontend não conecta
- Certifique-se que o backend está rodando na porta 3000
- Verifique CORS no `server/src/index.js`

### Service Worker não registra
- Use HTTPS ou localhost
- Limpe o cache: Ctrl+Shift+Delete
- Verifique F12 > Console para erros

Para instalação completa em produção, veja [INSTALLATION.md](./INSTALLATION.md)
