const express = require("express");
const app = express();
const db = require("./database");
require("dotenv").config();

const helper = require("./helper");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const axios = require("axios");

const passport = require("passport");
const bcrypt = require("bcrypt");
const zxcvbn = require("zxcvbn");

const PORT = process.env.PORT || 3000;
const saltRounds = 12;

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

function isAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

app.get("/signup", async (req, res) => {
  const crypto = require("crypto");

  // Generate a secure key and IV
  const key = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(16); // 128-bit IV

  // Example of how to store the key and iv.
  // Note: Storing keys and ivs securely is very important.
  // This example just shows how to convert them to strings.
  const keyString = key.toString("hex");
  const ivString = iv.toString("hex");

  console.log("Key (hex):", keyString);
  console.log("IV (hex):", ivString);

  // Example of how to retrieve the key and iv.
  const retrievedKey = Buffer.from(keyString, "hex");
  const retrievedIv = Buffer.from(ivString, "hex");

  console.log("RKey (hex):", retrievedKey);
  console.log("RIV (hex):", retrievedIv);

  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.sendFile(__dirname + "/public/html/signup.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const repassword = req.body.repassword;
  const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

  // Minimum password length check
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
  }
  // Password match check
  if (password !== repassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  // Vulnerable password check using zxcvbn
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return res.status(400).json({ success: false, message: "Password is too weak. Please choose a stronger password" });
  }

  const checkQuery = `SELECT * FROM users WHERE username = $1`;
  const data = await db.query(checkQuery, [req.body.username]);

  // Duplicate username check
  if (data.length >= 1) {
    return res.status(400).json({ success: false, message: "Account creation failed" });
  }

  try {
    const captchaCheck = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
    );

    if (captchaCheck.data.success) {
      const insertQuery = `INSERT INTO users (username, password, created_at) VALUES ($1, $2, $3)`;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      const r = await db.query(insertQuery, [username, hashedPassword, dt]);
      return res.status(201).json({ success: true, redirect: "/login" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/login", async (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.sendFile(__dirname + "/public/html/login.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.post("/login", async (req, res, next) => {
  try {
    const captchaCheck = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
    );

    if (captchaCheck.data.success) {
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
    } else {
      return res.status(401).json({
        success: false,
        message: "Verification failed. Please complete the reCAPTCHA and try again.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/logout", isAuth, (req, res) => {
  req.logout(function (err) {
    if (err) return next(err);

    return res.redirect("/login");
  });
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
    return res.status(200).json({ success: true, user: req.user, posts: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/makepost", isAuth, async (req, res) => {
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

app.delete("/deletePost", isAuth, async (req, res) => {
  try {
    const q = "DELETE FROM posts WHERE id = $1";
    await db.query(q, [req.body.postId]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/payment", isAuth, (req, res) => {
  return res.sendFile(__dirname + "/public/html/payment.html", (err) => {
    if (err) {
      console.log(err);
    }
  });
});

app.get("/loadMyPayment", isAuth, async (req, res) => {
  try {
    const q = `SELECT * FROM payments WHERE user_id = $1`;
    const result = await db.query(q, [req.user.id]);

    if (result.length > 0) {
      const cnn = helper.decryptData(
        result.cnn,
        Buffer.from(process.env.CRYPTO_KEY, "hex"),
        Buffer.from(process.env.CRYPTO_IV, "hex")
      );
      const edate = helper.decryptData(
        result.edate,
        Buffer.from(process.env.CRYPTO_KEY, "hex"),
        Buffer.from(process.env.CRYPTO_IV, "hex")
      );

      console.log(cnn, edate, "najksdf\n", result);
      return res.status(200).json({
        user: req.user,
        payment: payment,
      });
    } else {
      return res.status(200).json({ user: req.user, payment: null });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/payment-update", isAuth, async (req, res) => {
  const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

  try {
    const checkQuery = `SELECT * FROM payments WHERE user_id = $1`;
    const payment = await db.query(checkQuery, [req.user.id]);

    let query = "";
    if (payment.length > 0) {
      query = `UPDATE payments SET cnn = $1, edate = $2 WHERE user_id = $3`;
      await db.query(query, [
        helper.encryptData(req.body.cnn, process.env.CRYPTO_KEY, process.env.CRYPTO_IV),
        helper.encryptData(req.body.eDate, process.env.CRYPTO_KEY, process.env.CRYPTO_IV),
        req.user.id,
      ]);
      res.status(200);
    } else {
      query = `INSERT INTO payments (user_id, cnn, edate, created_at) VALUES ($1, $2, $3, $4)`;
      await db.query(query, [
        req.user.id,
        helper.encryptData(req.body.cnn, process.env.CRYPTO_KEY, process.env.CRYPTO_IV),
        helper.encryptData(req.body.eDate, process.env.CRYPTO_KEY, process.env.CRYPTO_IV),
        dt,
      ]);
      res.status(201);
    }

    return res.json({ success: true, redirect: "/payment" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
