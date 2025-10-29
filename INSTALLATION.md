# Guia de Instalação - Manicure Studio Lite PWA

## 📋 Pré-requisitos

Antes de iniciar a instalação, certifique-se de ter:

- **Node.js** versão 18+ instalado
- **PostgreSQL** versão 14+ instalado e rodando
- **npm** ou **yarn** para gerenciamento de pacotes
- Acesso SSH ao servidor (se for deploy em produção)
- Domínio configurado (opcional, mas recomendado para PWA completo)

## 🚀 Instalação Passo a Passo

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd manicure-studio-lite
```

### 2. Configuração do Backend

#### 2.1. Instale as Dependências do Servidor

```bash
cd server
npm install
```

#### 2.2. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e edite com suas configurações:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com os seguintes valores:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/manicure_studio"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui-min-32-caracteres"
JWT_REFRESH_SECRET="outra-chave-secreta-diferente-para-refresh-min-32-chars"

# Server
PORT=3000
NODE_ENV=production
WEB_ORIGIN=https://seu-dominio.com

# VAPID Keys (para Push Notifications)
# Gere com: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="sua-chave-publica-vapid"
VAPID_PRIVATE_KEY="sua-chave-privada-vapid"
VAPID_EMAIL="mailto:seu-email@dominio.com"
```

#### 2.3. Gere as Chaves VAPID para Push Notifications

```bash
npx web-push generate-vapid-keys
```

Copie as chaves geradas e cole no arquivo `.env`.

#### 2.4. Configure o Banco de Dados

Execute as migrations do Prisma:

```bash
npx prisma generate
npx prisma migrate deploy
```

Para popular o banco com dados de exemplo (opcional):

```bash
npx prisma db seed
```

### 3. Configuração do Frontend

#### 3.1. Volte para a Raiz e Instale as Dependências

```bash
cd ..
npm install
```

#### 3.2. Configure a URL da API (se necessário)

Se estiver em produção com domínio próprio, edite `src/lib/api.ts`:

```typescript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://seu-dominio.com/api'
  : '/api';
```

#### 3.3. Build do Frontend

```bash
npm run build
```

#### 3.4. Copie os Arquivos Buildados para o Servidor

```bash
mkdir -p server/web/dist
cp -r dist/* server/web/dist/
```

### 4. Configuração do Service Worker (PWA)

O Service Worker já está configurado em `public/sw.js`. Certifique-se de que:

1. Os ícones do PWA estão em `public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `icon-192-maskable.png`
   - `icon-512-maskable.png`

2. O `manifest.webmanifest` está configurado corretamente em `public/manifest.webmanifest`

### 5. Executando o Servidor

#### 5.1. Modo de Desenvolvimento

```bash
cd server
npm run dev
```

#### 5.2. Modo de Produção

```bash
cd server
npm start
```

#### 5.3. Usando PM2 (Recomendado para Produção)

Instale o PM2 globalmente:

```bash
npm install -g pm2
```

Inicie o servidor:

```bash
cd server
pm2 start ecosystem.config.js
```

Salve a configuração para reiniciar automaticamente:

```bash
pm2 save
pm2 startup
```

Para monitorar:

```bash
pm2 monit
```

Para ver logs:

```bash
pm2 logs manicure-studio
```

### 6. Configuração do Servidor Web (Nginx - Recomendado)

#### 6.1. Instale o Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 6.2. Configure o Nginx

Crie o arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/manicure-studio
```

Cole a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # Certificados SSL (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Service Worker e Manifest
    location ~ ^/(sw\.js|manifest\.webmanifest)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Não cachear o Service Worker
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6.3. Ative o Site

```bash
sudo ln -s /etc/nginx/sites-available/manicure-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6.4. Configure SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 7. Firewall (UFW)

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔔 Configuração de Push Notifications

### Pré-requisitos para Push Notifications Funcionarem:

1. **HTTPS Obrigatório**: Push notifications só funcionam com HTTPS (exceto em localhost)
2. **Chaves VAPID configuradas** no `.env`
3. **Service Worker registrado** (já está configurado)
4. **Permissões do navegador** concedidas pelo usuário

### Como Testar:

1. Acesse o app via HTTPS
2. Faça login
3. Vá em Configurações
4. Clique em "Ativar Notificações"
5. Aceite a permissão no navegador
6. Configure os lembretes desejados (24h, 3h, 1h antes)
7. Crie um agendamento para daqui a algumas horas
8. O sistema enviará notificações automaticamente via cron job

## 📱 Instalação do PWA

### No Desktop (Chrome/Edge):

1. Acesse o site via HTTPS
2. Clique no ícone de instalação na barra de endereços (ou)
3. Menu > Instalar [Nome do App]

### No Mobile (Android):

1. Acesse o site via Chrome
2. Menu (⋮) > "Adicionar à tela inicial" ou "Instalar app"

### No Mobile (iOS/Safari):

1. Acesse o site via Safari
2. Botão de compartilhar (□↑)
3. "Adicionar à Tela de Início"

**Nota**: No iOS, as push notifications têm suporte limitado. Elas funcionam apenas em iOS 16.4+ e apenas quando o app está na tela inicial.

## ✅ Verificação de Funcionamento

### 1. Testar o Backend

```bash
curl http://localhost:3000/api/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Testar Autenticação

Registre um usuário:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"senha123"}'
```

### 3. Verificar Service Worker

1. Abra o navegador
2. Acesse o site
3. F12 > Application > Service Workers
4. Deve aparecer "sw.js" ativo

### 4. Verificar Manifest

1. F12 > Application > Manifest
2. Deve mostrar os dados do app corretamente

## 🔧 Manutenção e Monitoramento

### Logs do Servidor

```bash
# Com PM2
pm2 logs manicure-studio

# Ou direto no Node
cd server
npm start
```

### Logs do Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup do Banco de Dados

```bash
pg_dump -U usuario manicure_studio > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup

```bash
psql -U usuario manicure_studio < backup_20240101.sql
```

### Atualizar a Aplicação

```bash
git pull
npm install
npm run build
cp -r dist/* server/web/dist/
cd server
npm install
pm2 restart manicure-studio
```

## 🐛 Troubleshooting

### Service Worker não está registrando

- Verifique se está usando HTTPS ou localhost
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Desregistre service workers antigos em F12 > Application > Service Workers

### Push Notifications não funcionam

- Certifique-se que HTTPS está ativo
- Verifique se as chaves VAPID estão corretas no `.env`
- Confirme que o usuário concedeu permissão no navegador
- Verifique os logs do servidor: `pm2 logs`

### Erro de CORS

- Verifique se `WEB_ORIGIN` no `.env` está correto
- Certifique-se de que o domínio frontend coincide com o configurado

### Banco de dados não conecta

```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Teste a conexão
psql -U usuario -d manicure_studio -h localhost
```

### App não instala no celular

- Verifique se HTTPS está ativo
- Confirme que `manifest.webmanifest` está acessível
- Verifique se todos os ícones estão presentes em `public/`
- Teste no Chrome DevTools > Mobile Simulation

## 📊 Funcionalidades Verificadas

✅ **Agenda**
- Criar agendamentos
- Editar agendamentos
- Mudar status (Pendente/Concluído/Antecipado)
- Excluir agendamentos
- Visualização semanal

✅ **Clientes**
- Criar clientes
- Editar informações
- Excluir clientes
- Busca por nome/telefone
- Link direto para WhatsApp

✅ **Produtos**
- Criar produtos
- Editar produtos
- Ajuste rápido de estoque (+/-)
- Alerta de estoque baixo
- Histórico de movimentações

✅ **Serviços**
- Criar serviços
- Editar serviços com cor e duração
- Excluir serviços
- Visualização com preço formatado

✅ **Relatórios**
- Receita por período
- Top serviços mais lucrativos
- Top clientes que mais gastaram
- Produtos com estoque baixo

✅ **Configurações**
- Tema (Claro/Escuro/Sistema)
- Ativação de notificações push
- Lembretes configuráveis (24h/3h/1h)
- Instalação do PWA
- Logout

✅ **PWA**
- Service Worker ativo
- Cache de assets
- Funciona offline (parcialmente)
- Instalável em todos os dispositivos
- Ícones e manifest configurados

✅ **Push Notifications**
- Subscrição via browser
- Envio automático via cron jobs
- Lembretes personalizáveis
- Suporte a todos os navegadores modernos

## 🎯 Próximos Passos (Opcional)

- Configurar backup automático do banco
- Implementar analytics (Google Analytics ou similar)
- Adicionar testes automatizados
- Configurar CI/CD com GitHub Actions
- Implementar rate limiting na API
- Adicionar logs estruturados (Winston/Pino)

## 📞 Suporte

Para dúvidas ou problemas:
- Email: manicurestudiolite@gmail.com

---

**Desenvolvido com ❤️ para profissionais de manicure**
