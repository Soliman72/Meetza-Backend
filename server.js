require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// DB Connection
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// connection.connect((err) => {
//   if (err) {
//     console.error("Error connecting to the database:", err.stack);
//     return;
//   }
//   console.log("Connected to the database.");
// });

// test API
app.get("/", (req, res) => {
  res.send("اهلا يا شهد يا رخمه!!!");
});

app.get("/love", (req, res) => {
  res.send("اهلا يا سليمان يا رخم!!!");
});

// app.get("/data", (req, res) => {
//   connection.query("SELECT * FROM test_table", (err, results) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//     } else {
//       res.json(results);
//     }
//   });
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
