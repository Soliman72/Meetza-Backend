# Network Setup Guide - Accessing Server from Other Devices

This guide explains how to make your Meetza backend server accessible from other devices on your local network.

## Quick Setup

### 1. Start the Server

When you start the server, it will automatically display your network IP address:

```bash
npm run dev
# or
node server.js
```

You'll see output like:
```
============================================================
✅ Server is running!
============================================================
📱 Local access:    http://localhost:4000
🌐 Network access:  http://192.168.1.100:4000
🔌 Socket.IO URL:   http://192.168.1.100:4000
============================================================
```

### 2. Get Your Server IP Address

You can also run this helper script to get your IP address:

```bash
node scripts/get-server-ip.js
```

### 3. Configure Your Client Application

In your frontend/client application, replace `localhost` with your server's IP address:

```javascript
// ❌ WRONG - Only works on the same machine
const socket = io("http://localhost:4000", {
  auth: { token: jwtToken }
});

// ✅ CORRECT - Works from other devices on the network
const socket = io("http://192.168.1.100:4000", {
  auth: { token: jwtToken }
});
```

## Windows Firewall Configuration

If connections from other devices fail, you may need to allow the port through Windows Firewall:

### Option 1: Using PowerShell (Recommended - Run as Administrator)

```powershell
New-NetFirewallRule -DisplayName "Meetza Backend Server" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

### Option 2: Using Windows Firewall GUI

1. Open **Windows Defender Firewall** (search in Start menu)
2. Click **Advanced settings** on the left
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP** and enter port `4000` → **Next**
6. Select **Allow the connection** → **Next**
7. Check all profiles (Domain, Private, Public) → **Next**
8. Name it "Meetza Backend Server" → **Finish**

### Option 3: Quick Test (Temporary - Not Recommended for Production)

```powershell
# Temporarily disable firewall (NOT recommended for security)
# Only use for testing, then re-enable it
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

## Troubleshooting

### Connection Refused

- ✅ Check that the server is running and listening on `0.0.0.0`
- ✅ Verify both devices are on the same Wi-Fi network
- ✅ Check Windows Firewall settings (see above)
- ✅ Make sure the port number matches (check your `.env` file for `PORT`)

### Socket.IO Connection Fails

- ✅ Verify CORS is enabled (already configured with `origin: "*"`)
- ✅ Make sure you're using the correct IP address (not `localhost`)
- ✅ Check that both HTTP and WebSocket connections use the same base URL
- ✅ Try using the IP address directly in your browser first: `http://YOUR_IP:PORT`

### Can't Find IP Address

- ✅ Make sure you're connected to Wi-Fi or Ethernet
- ✅ Try running `ipconfig` (Windows) or `ifconfig` (Linux/Mac) in terminal
- ✅ Look for the IPv4 address under your active network adapter

## Testing the Connection

### Test HTTP Connection

From another device, open in browser:
```
http://YOUR_SERVER_IP:4000
```

You should see: `اهلا يا شهد يا رخمهههه!!!`

### Test Socket.IO Connection

Use the test script:
```bash
# Edit scripts/test-socket.js and set:
# SERVER_URL = "http://YOUR_SERVER_IP:4000"
node scripts/test-socket.js
```

## Important Notes

⚠️ **Security Warning:**
- The server is configured with `cors: { origin: "*" }` which allows connections from any origin
- This is fine for development but consider restricting origins in production
- Always use proper authentication (JWT tokens) as configured

🌐 **Network Requirements:**
- Both devices must be on the same local network (same Wi-Fi/router)
- VPN connections might interfere with local network access
- Some corporate/public networks block device-to-device communication

## 🌍 Accessing from Different Networks (Internet Access)

If you want to access your server from devices on **different networks** (anywhere on the internet), see [PUBLIC_ACCESS.md](./PUBLIC_ACCESS.md) for:
- Using ngrok (easiest for development)
- Port forwarding setup (permanent solution)
- Cloud deployment options (production)

## Production Deployment

For production, consider:
- Using a domain name with SSL (HTTPS/WSS)
- Configuring CORS to specific origins
- Using a reverse proxy (nginx, Apache)
- Setting up proper firewall rules
- Using environment variables for server URLs

