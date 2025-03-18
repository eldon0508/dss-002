const express = require("express");
const app = express();
const db = require("./database");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const axios = require("axios");

const passport = require("passport");
const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;
const saltRounds = 10;

// support parsing of application/json type post data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(express.static(__dirname + "/public"));

require("dotenv").config();

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
  const captchaCheck = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
  );

  // if (captchaCheck.data.success) {
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
  // } else {
  //   return res.status(401).json({
  //     success: false,
  //     message: "Verification failed. Please complete the reCAPTCHA and try again.",
  //   });
  // }
});

app.get("/", isAuth, (req, res) => {
  return res.sendFile(__dirname + "/public/html/index.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/index", isAuth, async (req, res) => {
  const q = `SELECT p.id, p.title, p.content, p.created_at, u.username
      FROM posts p
      INNER JOIN users u
      ON u.id = p.user_id
      ORDER BY created_at ASC`;
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
  const q = `SELECT p.id, p.title, p.content, p.created_at, u.username
      FROM posts p
      INNER JOIN users u
      ON u.id = p.user_id
      ORDER BY created_at ASC`;
  const data = await db.query(q);
  return res.status(200).json({ user: req.user, posts: data });
});

app.get("/my-posts", isAuth, (req, res) => {
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
      WHERE user_id = $1
      ORDER BY created_at ASC`;
    const data = await db.query(q, [req.user.id]);
    return res.status(200).json({ user: req.user, posts: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/makepost", async (req, res) => {
  try {
    const captchaCheck = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
    );

    const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

    if (captchaCheck.data.success) {
      if (req.body.postId !== "") {
        const q = `UPDATE posts SET title = $1, content = $2, created_at = $3 WHERE id = $4`;
        await db.query(q, [req.body.title, req.body.content, dt, req.body.postId]);
        res.status(200);
      } else {
        const q = `INSERT INTO posts (user_id, title, content, created_at) VALUES ($1, $2, $3, $4)`;
        await db.query(q, [req.user.id, req.body.title, req.body.content, dt]);
        res.status(201);
      }
      return res.json({ success: true, redirect: "/my-posts" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Verification failed. Please complete the reCAPTCHA and try again." });
    }
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

app.get("/my-payment", (req, res) => {
  return res.sendFile(__dirname + "/public/html/my_payment.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/loadMyPayment", async (req, res) => {
  try {
    const q = `SELECT * FROM payments WHERE user_id = $1`;
    const result = db.query(q, [req.user.id]);

    if (result.length > 0) {
      return res.status(200).json({ success: true, payment: result[0] });
    } else {
      return res.status(200).json({ success: true, payment: null });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/payment-update", async (req, res) => {
  const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

  try {
    const checkQuery = `SELECT * FROM payments WHERE user_id = $1`;
    const payment = await db.query(checkQuery, [req.user.id]);

    let query = "";
    if (payment.length > 0) {
      query = `UPDATE payments SET card_number = $1, expiry_date = $2, cvv = $3 WHERE user_id = $4`;
      await db.query(query, [req.body.cardNum, req.body.expDate, req.body.cvv, req.user.id]);
      res.status(200);
    } else {
      query = `INSERT INTO payments (user_id, card_number, expiry_date, cvv, created_at) VALUES ($1, $2, $3, $4, $5)`;
      await db.query(query, [req.user.id, req.body.cardNum, req.body.expDate, req.body.cvv, dt]);
      res.status(201);
    }

    return res.json({ success: true, redirect: "/my_payment" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
