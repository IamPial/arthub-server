const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv").config();
const port = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Server Running On!!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
