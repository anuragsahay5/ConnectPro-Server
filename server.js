const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

const register = require("./routes/api/register");
const login = require("./routes/api/Login");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

//Connect DB
require("./connect/dbConnect");

// Init Middleware
app.use(cors());
app.use(express.json());

// Define Routes
app.use("/api/users", register);
app.use("/api/auth", login);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

app.get("/", (req, res) => {
  res.send("Hello Dunia!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
