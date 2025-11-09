# Deployment Guide for Linux VPS

This guide explains how to deploy the CV Filter Tool on a Linux VPS using Docker Compose.

## Prerequisites

- Linux VPS with Docker and Docker Compose installed
- Docker Hub account with images pushed (via GitHub Actions)
- Domain name (optional, for production)

## Installation Steps

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone or Download Project Files

```bash
# Clone your repository (or download docker-compose.yml and .env files)
git clone <your-repo-url>
cd cv-filter-tool

# Or create the directory and download files manually
mkdir cv-filter-tool
cd cv-filter-tool
```

### 3. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your values
nano .env
```

Required variables:
- `DOCKER_USERNAME`: Your Docker Hub username
- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXT_PUBLIC_API_URL`: Backend URL (use `http://your-vps-ip:8000` or your domain)

### 4. Pull and Run Containers

```bash
# Pull the latest images from Docker Hub
docker-compose pull

# Start the services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Access the Application

- **Frontend**: http://your-vps-ip:3000
- **Backend API**: http://your-vps-ip:8000
- **API Docs**: http://your-vps-ip:8000/docs

## Production Deployment with Domain

### Using Nginx Reverse Proxy (Recommended)

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/cv-filter-tool
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cv-filter-tool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Update `.env` file:
```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

5. Restart containers:
```bash
docker-compose down
docker-compose up -d
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Useful Commands

```bash
# Stop services
docker-compose down

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend

# Update to latest images
docker-compose pull
docker-compose up -d

# Remove everything (including volumes)
docker-compose down -v

# Check resource usage
docker stats
```

## Troubleshooting

### Check if containers are running
```bash
docker-compose ps
```

### Check logs for errors
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Restart services
```bash
docker-compose restart
```

### If images fail to pull
```bash
# Make sure DOCKER_USERNAME is set correctly in .env
# Verify images exist on Docker Hub
docker pull ${DOCKER_USERNAME}/cv-filter-tool-backend:latest
docker pull ${DOCKER_USERNAME}/cv-filter-tool-frontend:latest
```

### Port conflicts
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port
```

## Updating the Application

When new images are pushed to Docker Hub:

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Or force recreate
docker-compose up -d --force-recreate
```

## Backup

To backup uploaded files:
```bash
docker run --rm -v cv-filter-tool_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
docker run --rm -v cv-filter-tool_backend_storage:/data -v $(pwd):/backup alpine tar czf /backup/storage-backup.tar.gz /data
```

