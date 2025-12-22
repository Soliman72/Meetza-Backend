# Docker Setup Guide - Running Meetza Backend with Docker

This guide explains how to run your Meetza backend server using Docker, making it accessible from any network.

## 🐳 Prerequisites

- **Docker Desktop** installed on your machine
  - Download from: https://www.docker.com/products/docker-desktop
  - Make sure Docker is running before proceeding

## 📋 Quick Start

### 1. Create/Update `.env` file

Make sure you have a `.env` file in the root directory with all required variables:

```env
# Server Configuration
PORT=4000

# Database Configuration (use host.docker.internal if DB is on host machine)
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=meetza

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Add all other required environment variables...
```

**Important:** If your MySQL database is running on your host machine (not in Docker), use `host.docker.internal` as `DB_HOST` instead of `localhost`.

### 2. Build and Start the Container

```bash
# Build and start the container
docker-compose up -d

# Or to see logs in real-time
docker-compose up
```

### 3. Check if it's Running

```bash
# Check container status
docker ps

# View logs
docker-compose logs -f backend
```

### 4. Access Your Server

Once running, your server is accessible at:
- **Local:** `http://localhost:4000`
- **Network (same Wi-Fi):** `http://YOUR_IP:4000` (use `npm run get-ip` to find your IP)
- **Internet (with ngrok):** See PUBLIC_ACCESS.md for ngrok setup

## 🔧 Common Docker Commands

### Start the container
```bash
docker-compose up -d
```

### Stop the container
```bash
docker-compose down
```

### View logs
```bash
# Follow logs in real-time
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Restart the container
```bash
docker-compose restart backend
```

### Rebuild after code changes
```bash
# Stop, rebuild, and start
docker-compose down
docker-compose up -d --build
```

### Access container shell
```bash
docker exec -it meetza-backend sh
```

### Remove everything (containers, volumes, networks)
```bash
docker-compose down -v
```

## 🌐 Network Access Configuration

The Docker configuration is set up to expose port 4000 on **all network interfaces** (`0.0.0.0`), making it accessible from:

✅ **Same machine:** `http://localhost:4000`  
✅ **Same network:** `http://YOUR_LOCAL_IP:4000`  
✅ **Different networks:** Use ngrok (see PUBLIC_ACCESS.md) or port forwarding

### Find Your IP Address

```bash
# Using the script
npm run get-ip

# Or manually (Windows)
ipconfig

# Look for your Wi-Fi adapter's IPv4 address
```

### Windows Firewall

If accessing from another device on the same network fails, you may need to allow port 4000 through Windows Firewall:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Meetza Backend Server" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

## 🗄️ Database Configuration

### Option 1: Database on Host Machine (Recommended for Development)

If MySQL is running directly on your Windows machine:

```env
DB_HOST=host.docker.internal
DB_PORT=3306
```

### Option 2: Database in Docker Container

If you want to run MySQL in Docker too, add this to `docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: meetza-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - meetza-network

  backend:
    # ... existing config ...
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql  # Use service name
    networks:
      - meetza-network

volumes:
  mysql_data:

networks:
  meetza-network:
    driver: bridge
```

## 🔒 Security Considerations

### For Production Use:

1. **Use HTTPS/WSS** - Set up SSL certificate
2. **Restrict CORS** - Change from `origin: "*"` to specific domains
3. **Use Environment Variables** - Never hardcode secrets
4. **Keep Images Updated** - Regularly update base images
5. **Use Docker Secrets** - For sensitive data in production
6. **Network Isolation** - Use Docker networks for service isolation

### Current Configuration:

The server currently allows connections from any origin (`cors: { origin: "*" }`). This is fine for development but should be restricted in production.

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker-compose logs backend

# Check if port is already in use
netstat -ano | findstr :4000
```

### Database connection fails

- Verify `DB_HOST=host.docker.internal` if DB is on host
- Check if MySQL is running and accessible
- Verify database credentials in `.env`
- Ensure MySQL allows connections from Docker containers

### Can't access from other devices

1. ✅ Verify container is running: `docker ps`
2. ✅ Check port mapping: `docker port meetza-backend`
3. ✅ Verify Windows Firewall allows port 4000
4. ✅ Ensure both devices are on same network (for local access)
5. ✅ Check server logs: `docker-compose logs backend`

### Port already in use

If port 4000 is already in use:

1. Stop the other service using port 4000, OR
2. Change the port in `.env` and `docker-compose.yml`:

```yaml
# docker-compose.yml
ports:
  - "0.0.0.0:5000:4000"  # Use port 5000 on host, 4000 in container
```

### Rebuild after code changes

```bash
# Stop and remove old container
docker-compose down

# Rebuild with no cache (if needed)
docker-compose build --no-cache

# Start again
docker-compose up -d
```

## 📊 Docker vs Native Run

| Feature | Docker | Native (npm run dev) |
|---------|--------|---------------------|
| Setup | ⭐⭐ More steps | ⭐ Easier |
| Isolation | ✅ Complete | ❌ None |
| Portability | ✅ Excellent | ⭐ Good |
| Resource Usage | ⭐⭐ More | ⭐ Less |
| Development Speed | ⭐ Slower rebuilds | ✅ Fast |
| Production Ready | ✅ Yes | ⭐ Needs work |
| Network Access | ✅ Same | ✅ Same |

**Recommendation:**
- **Development:** Use `npm run dev` for faster iteration
- **Testing/Production:** Use Docker for consistency and isolation

## 🚀 Next Steps

1. **For Local Network Access:** See [NETWORK_SETUP.md](./NETWORK_SETUP.md)
2. **For Internet Access:** See [PUBLIC_ACCESS.md](./PUBLIC_ACCESS.md)
3. **For Production Deployment:** Consider cloud platforms (AWS, DigitalOcean, Railway, etc.)

## 📝 Example: Complete Docker Workflow

```bash
# 1. Make sure .env file exists with all variables
# 2. Build and start
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f backend

# 4. Find your IP
npm run get-ip

# 5. Test from browser
# Local: http://localhost:4000
# Network: http://YOUR_IP:4000

# 6. When done, stop
docker-compose down
```

Your server is now running in Docker and accessible from any network! 🎉

