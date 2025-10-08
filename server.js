require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/db");
const authRouter = require("./router/authRouter");

const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

// test API
app.get("/", (req, res) => {
  res.send("اهلا يا شهد يا رخمه!!!");
});

app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}...`);
});
