const express = require("express");
const app = express();
const db = require("./database");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");

const passport = require("passport");
const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;
const saltRounds = 10;

// support parsing of application/json type post data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(express.static(__dirname + "/public"));

app.use(cookieParser("secret"));
app.use(
  session({
    secret: "dss-secret-002",
    saveUninitialized: false,
    resave: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

// Middleware to check the authentication of users
// function isAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.status(401).json({ success: false });
// }

function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

app.get("/login", async (req, res) => {
  /// send the static file
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.sendFile(__dirname + "/public/html/login.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.post("/logout", isAuth, (req, res) => {
  req.logout(function (err) {
    if (err) return next(err);

    return res.redirect("/login");
  });
});

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
    }

    if (user) {
      req.login(user, (err) => {
        if (err) console.error(err);

        return res.status(200).json({
          success: true,
          message: "Successfully login.",
          redirect: "/",
        });
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Username and/or password is incorrect. Please try again.",
      });
    }
  })(req, res, next);
});

app.get("/", isAuth, (req, res) => {
  return res.sendFile(__dirname + "/public/html/index.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/index", isAuth, async (req, res) => {
  const q = `SELECT * FROM posts`;
  const data = await db.query(q);
  return res.status(200).json({ user: req.user, posts: data });
});

app.get("/posts", isAuth, (req, res) => {
  return res.sendFile(__dirname + "/public/html/posts.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/latestPosts", isAuth, async (req, res) => {
  const q = `SELECT * FROM posts`;
  const data = await db.query(q);
  return res.status(200).json({ user: req.user, posts: data });
});

app.get("/my_posts", isAuth, (req, res) => {
  return res.sendFile(__dirname + "/public/html/my_posts.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/loadMyPosts", isAuth, async (req, res) => {
  try {
    const q = `SELECT p.id, p.title, p.content, p.created_at, u.username FROM posts p
      INNER JOIN users u
      ON u.id = p.user_id
      WHERE user_id = $1`;
    const data = await db.query(q, [req.user.id]);
    return res.status(200).json({ user: req.user, posts: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/makepost", async (req, res) => {
  try {
    if (req.body.postId) {
      const q = `UPDATE posts SET title = $1, content = $2 WHERE id = $3`;
      await db.query(q, [req.body.title, req.body.content, req.body.postId]);
    } else {
      const q = `INSERT INTO posts (title, content) VALUES ($1, $2)`;
      await db.query(q, [req.body.title, req.body.content]);
    }

    return res.redirect("/my_posts");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/deletePost", async (req, res) => {
  try {
    const q = "DELETE FROM posts WHERE id = $1";
    await db.query(q, [req.body.postId]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
