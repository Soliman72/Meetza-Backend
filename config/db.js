const mysql = require("mysql2");

// Pool: keep limits modest; huge limits stress the DB and do not fix disconnects.
// enableKeepAlive reduces idle TCP drops (firewalls, cloud LB, ECONNRESET on stale sockets).
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "meetza",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 20,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

db.on("connection", (connection) => {
  connection.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.warn("[db] connection dropped:", err.code, err.message);
    } else {
      console.error("[db] connection error:", err.code, err.message);
    }
  });
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  connection.release();
  console.log("Connected to MySQL database successfully!");
});

module.exports = db;
