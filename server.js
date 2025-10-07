require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;

// test API
app.get("/", (req, res) => {
  res.send("اهلا يا شهد يا رخمه!!!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
