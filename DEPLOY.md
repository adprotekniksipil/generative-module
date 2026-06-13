# Deployment Guide — VPS 1 Core / 2 GB RAM

## Opsi A: Deploy dengan Docker (Recommended)

### 1. Setup VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y
```

### 2. Clone & Configure

```bash
cd /home/deploy
git clone https://github.com/NeoCode29/modul-teknik-sipil.git
cd modul-teknik-sipil/frontend

# Copy dan isi environment variables
cp .env.example .env
nano .env
```

Isi `.env`:
```
DATABASE_URL="file:/app/data/prod.db"
JWT_SECRET=<generate: openssl rand -base64 32>
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>
MODELHUNTER_API_KEY=<optional>
```

### 3. Build & Run

```bash
# Build image
docker compose build

# Jalankan
docker compose up -d

# Cek status
docker compose ps
docker compose logs -f app

# Init database (pertama kali)
docker compose exec app npx prisma db push
```

### 4. Setup Nginx + SSL

```bash
# Install Nginx & Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Copy nginx config (ganti yourdomain.com)
sudo cp nginx.conf /etc/nginx/sites-available/modul-teknik-sipil
sudo ln -s /etc/nginx/sites-available/modul-teknik-sipil /etc/nginx/sites-enabled/

# Dapatkan SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Maintenance

```bash
# Update app
cd /home/deploy/modul-teknik-sipil
git pull
cd frontend
docker compose build
docker compose up -d

# Backup database
docker compose exec app cp /app/data/prod.db /app/data/backup-$(date +%Y%m%d).db

# Lihat logs
docker compose logs -f --tail=100 app
```

---

## Opsi B: Deploy dengan PM2 (Tanpa Docker)

### 1. Setup VPS

```bash
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install build tools (untuk better-sqlite3)
sudo apt install -y python3 make g++
```

### 2. Clone & Configure

```bash
mkdir -p /home/deploy/logs
cd /home/deploy
git clone https://github.com/NeoCode29/modul-teknik-sipil.git
cd modul-teknik-sipil/frontend

cp .env.example .env
nano .env
```

Isi `.env`:
```
NODE_ENV=production
DATABASE_URL="file:./prod.db"
JWT_SECRET=<generate: openssl rand -base64 32>
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>
MODELHUNTER_API_KEY=<optional>
```

### 3. Build & Run

```bash
npm ci
npx prisma generate
npx prisma db push

# Build (limit memory untuk VPS 2GB)
NODE_OPTIONS="--max-old-space-size=1024" npm run build

# Jalankan dengan PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # auto-start on reboot
```

### 4. Setup Nginx + SSL

Sama seperti Opsi A langkah 4.

### 5. Maintenance

```bash
# Update app
cd /home/deploy/modul-teknik-sipil
git pull
cd frontend
npm ci
NODE_OPTIONS="--max-old-space-size=1024" npm run build
pm2 restart modul-teknik-sipil

# Monitoring
pm2 monit
pm2 logs modul-teknik-sipil

# Backup database
cp prod.db backup-$(date +%Y%m%d).db
```

---

## Monitoring

```bash
# Health check
curl http://localhost:3000/api/health

# PM2 status
pm2 status

# Docker status
docker compose ps

# Memory usage
free -h
```

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Build OOM (out of memory) | `NODE_OPTIONS="--max-old-space-size=1024"` |
| App crash loop | `pm2 logs` atau `docker compose logs` |
| Database locked | Restart app, pastikan 1 instance saja |
| SSL expired | `sudo certbot renew` |
| Port 3000 already in use | `lsof -i :3000` lalu kill |
