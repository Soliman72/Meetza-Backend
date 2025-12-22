# Quick Start - Access Docker Server from Any Network

## 🚀 Simplest Solution: ngrok on Host Machine

This is the easiest way to access your Docker server from computers on different networks.

### Step 1: Install ngrok

**Windows:**
- Download from: https://ngrok.com/download
- Extract `ngrok.exe` anywhere (or add to PATH)

**Or using npm:**
```bash
npm install -g ngrok
```

### Step 2: Start Your Docker Server

```bash
docker-compose up -d
```

Wait for it to start, then verify:
```bash
docker-compose logs backend
```

### Step 3: Start ngrok (in a new terminal)

```bash
ngrok http 4000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:4000
```

### Step 4: Use the Public URL

Copy the `https://` URL (e.g., `https://abc123.ngrok.io`) and use it in your client:

```javascript
const socket = io("https://abc123.ngrok.io", {
  auth: { token: jwtToken }
});
```

### Step 5: View Requests (Optional)

Open http://localhost:4040 to see all incoming requests in ngrok's web interface.

---

## 🔄 Alternative: ngrok in Docker

If you prefer ngrok to run inside Docker:

### Step 1: Get ngrok Authtoken

1. Sign up at https://dashboard.ngrok.com/signup
2. Get authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2: Create ngrok.yml

```bash
# Copy the example
copy ngrok.yml.example ngrok.yml
```

Edit `ngrok.yml` and replace `YOUR_NGROK_AUTHTOKEN_HERE` with your actual token.

### Step 3: Start with ngrok

```bash
npm run docker:ngrok
# Or: docker-compose -f docker-compose.yml -f docker-compose.ngrok.yml up -d
```

### Step 4: Get Public URL

```bash
npm run docker:ngrok:logs
# Or: docker-compose logs ngrok
```

Look for the `https://` URL in the output.

---

## 📝 Notes

- **Free ngrok URLs change** each time you restart ngrok
- The **ngrok web interface** (http://localhost:4040) is very useful for debugging
- **HTTPS is included** - no SSL certificate needed
- Both methods work the same way, choose based on your preference

---

## ❓ Which Method to Choose?

| Method | Pros | Cons |
|--------|------|------|
| **ngrok on Host** | ✅ Simpler setup<br>✅ No config file needed | ⚠️ Must run separately |
| **ngrok in Docker** | ✅ Everything in Docker<br>✅ Starts automatically | ⚠️ Requires authtoken config |

**Recommendation:** Start with ngrok on host (simpler), use Docker version if you want everything containerized.

---

## 🔗 More Information

- [DOCKER_NETWORK_ACCESS.md](./DOCKER_NETWORK_ACCESS.md) - Detailed guide
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - General Docker setup
- [PUBLIC_ACCESS.md](./PUBLIC_ACCESS.md) - Public access without Docker

