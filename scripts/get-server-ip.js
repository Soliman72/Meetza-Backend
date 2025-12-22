// Helper script to get the server's IP address for network connections
const os = require("os");

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push({
          interface: name,
          ip: iface.address,
          netmask: iface.netmask,
        });
      }
    }
  }

  return ips;
};

console.log("\n🌐 Server IP Addresses (for network access):\n");
const ips = getLocalIP();

if (ips.length === 0) {
  console.log("❌ No network interfaces found.");
  console.log("   Make sure you're connected to a network.\n");
} else {
  ips.forEach((item, index) => {
    console.log(`${index + 1}. ${item.ip} (${item.interface})`);
  });
  console.log(`\n💡 Use any of these IPs to connect from other devices:`);
  console.log(`   Example: http://${ips[0].ip}:4000\n`);
}
