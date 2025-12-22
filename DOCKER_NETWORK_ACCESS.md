# Docker Network Access - Access from Any Network

This guide explains how to access your Dockerized Meetza backend from computers on different networks (anywhere on the internet).

## 🎯 The Problem

When running in Docker, the server sees the container's internal IP (like `172.29.0.2`) instead of your host machine's IP. For access from different networks, you need a tunnel service like ngrok.

## ✅ Solution Options

### Option 1: ngrok with Docker Compose (Recommended)

This sets up ngrok as a Docker service that automatically creates a public tunnel.

#### Step 1: Get ngrok Authtoken

1. Sign up at https://dashboard.ngrok.com/signup (free)
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy the authtoken

#### Step 2: Create ngrok.yml Configuration

```bash
# Copy the example file
copy ngrok.yml.example ngrok.yml

# Edit ngrok.yml and replace YOUR_NGROK_AUTHTOKEN_HERE with your actual token
```

Or create `ngrok.yml` manually:

```yaml
version: "2"
authtoken: YOUR_ACTUAL_NGROK_TOKEN_HERE

tunnels:
  backend:
    addr: backend:4000
    proto: http
    inspect: true
```

#### Step 3: Start with ngrok

```bash
# Start both backend and ngrok
docker-compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d

# View logs to see the public URL
docker-compose logs -f ngrok
```

#### Step 4: Get Your Public URL

Check the ngrok logs:
```bash
docker-compose logs ngrok
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://backend:4000
```

Use this `https://` URL in your client:
```javascript
const socket = io("https://abc123.ngrok.io", {
  auth: { token: jwtToken }
});
```

#### Step 5: Access ngrok Web Interface

Open http://localhost:4040 in your browser to:
- See incoming requests
- Inspect traffic
- Get the public URL

---

### Option 2: ngrok on Host Machine (Alternative)

Run ngrok on your host machine (outside Docker) pointing to localhost:4000.

#### Step 1: Install ngrok on Host

**Windows:**
- Download from https://ngrok.com/download
- Or: `choco install ngrok`

**Or use npm:**
```bash
npm install -g ngrok
```

#### Step 2: Start Docker Backend

```bash
docker-compose up -d
```

#### Step 3: Start ngrok on Host

```bash
# In a separate terminal
ngrok http 4000
```

#### Step 4: Use the Public URL

ngrok will show:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:4000
```

Use the `https://` URL in your client application.

---

### Option 3: Port Forwarding (Permanent but Complex)

For a permanent solution without ngrok, set up port forwarding on your router.

#### Requirements

1. Access to your router's admin panel
2. Static IP or dynamic DNS service
3. Your public IP address

#### Steps

1. **Find your router's IP:**
   ```bash
   ipconfig
   # Look for "Default Gateway"
   ```

2. **Access router admin** (usually http://192.168.1.1)

3. **Set up port forwarding:**
   - External Port: 4000 (or any port you want)
   - Internal IP: Your laptop's IP (use `npm run get-ip`)
   - Internal Port: 4000
   - Protocol: TCP

4. **Find your public IP:**
   Visit https://whatismyipaddress.com/

5. **Use in client:**
   ```javascript
   const socket = io("http://YOUR_PUBLIC_IP:4000", {
     auth: { token: jwtToken }
   });
   ```

⚠️ **Security Warning:** Exposing directly to the internet requires proper security setup (HTTPS, firewalls, etc.)

---

## 📊 Quick Comparison

| Method | Setup | Cost | URL Stability | Best For |
|--------|-------|------|---------------|----------|
| **ngrok (Docker)** | ⭐⭐ Easy | Free | Changes on restart | Development |
| **ngrok (Host)** | ⭐ Easy | Free | Changes on restart | Quick testing |
| **Port Forwarding** | ⭐⭐⭐ Complex | Free | Static (with DDNS) | Home server |
| **Cloud Deployment** | ⭐⭐⭐ Complex | Paid | Static | Production |

---

## 🚀 Quick Start (ngrok with Docker)

```bash
# 1. Get authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

# 2. Create ngrok.yml with your token
echo "version: \"2\"
authtoken: YOUR_TOKEN_HERE
tunnels:
  backend:
    addr: backend:4000
    proto: http
    inspect: true" > ngrok.yml

# 3. Start everything
docker-compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d

# 4. Check ngrok logs for public URL
docker-compose logs ngrok

# 5. Use the https:// URL in your client app
```

---

## 🔧 Troubleshooting

### ngrok container won't start

- ✅ Check that `ngrok.yml` exists and has valid authtoken
- ✅ Verify authtoken at https://dashboard.ngrok.com/get-started/your-authtoken
- ✅ Check logs: `docker-compose logs ngrok`

### Can't access ngrok web interface

- ✅ Make sure ngrok container is running: `docker ps`
- ✅ Access at http://localhost:4040
- ✅ Check if port 4040 is in use

### Public URL not working

- ✅ Verify backend container is running: `docker ps`
- ✅ Check backend logs: `docker-compose logs backend`
- ✅ Ensure ngrok shows "Online" status in web interface
- ✅ Try restarting: `docker-compose restart ngrok`

### URL changes every restart

This is normal for free ngrok. Options:
- Use ngrok reserved domains (paid feature)
- Use port forwarding for static URL
- Use environment variables to update client URL automatically

---

## 📝 Notes

- **Free ngrok URLs change** each time you restart ngrok
- **ngrok web interface** at http://localhost:4040 is very useful
- **HTTPS is included** with ngrok (no SSL setup needed)
- **Rate limits** apply on free tier (but usually sufficient for development)

---

## 🔗 Related Documentation

- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - General Docker setup
- [PUBLIC_ACCESS.md](./PUBLIC_ACCESS.md) - Public access without Docker
- [NETWORK_SETUP.md](./NETWORK_SETUP.md) - Same network access

