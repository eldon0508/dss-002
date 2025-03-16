const express = require("express");
const app = express();

const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;
const saltRounds = 20;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
