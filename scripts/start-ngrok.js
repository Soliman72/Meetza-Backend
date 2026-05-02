// Script to start ngrok tunnel for public access
const { exec } = require("child_process");
const readline = require("readline");

const PORT = process.env.PORT || 4000;

console.log("\n" + "=".repeat(60));
console.log("Starting ngrok tunnel...");
console.log("=".repeat(60));
console.log(`Local server: http://localhost:${PORT}`);
console.log(`Public URL will be displayed below\n`);

// Check if ngrok is installed
exec("ngrok version", (error) => {
  if (error) {
    console.error("ngrok is not installed!");
    console.log("\nTo install ngrok:");
    console.log("   1. Download from: https://ngrok.com/download");
    console.log("   2. Or use chocolatey: choco install ngrok");
    console.log("   3. Or use npm: npm install -g ngrok");
    console.log("\n   After installation, run this script again.\n");
    process.exit(1);
  }

  // Start ngrok
  const ngrok = exec(`ngrok http ${PORT}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
  });

  // Display ngrok output
  ngrok.stdout.on("data", (data) => {
    process.stdout.write(data);
    
    // Try to extract the public URL from ngrok output
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.includes("Forwarding") && line.includes("https://")) {
        const urlMatch = line.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          const publicUrl = urlMatch[0];
          console.log("\n" + "=".repeat(60));
          console.log("ngrok tunnel is active!");
          console.log("=".repeat(60));
          console.log(`Public URL: ${publicUrl}`);
          console.log(`Socket.IO URL: ${publicUrl}`);
          console.log("=".repeat(60));
          console.log(`\nUse this URL in your client application:`);
          console.log(`   const socket = io("${publicUrl}", {`);
          console.log(`     auth: { token: jwtToken }`);
          console.log(`   });\n`);
        }
      }
    }
  });

  ngrok.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  // Handle cleanup on exit
  process.on("SIGINT", () => {
    console.log("\n\nStopping ngrok tunnel...");
    ngrok.kill();
    process.exit(0);
  });
});

