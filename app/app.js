const express = require("express");
const app = express();
require("dotenv").config();

// Import libraries
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const axios = require("axios");

const passport = require("passport");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const csurf = require("tiny-csrf");

const db = require("./database");
const helper = require("./helper");

const saltRounds = 12;

// support parsing of application/json type post data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ credentials: true }));
app.use(express.static(__dirname + "/public"));

// express-session configuration, defend session hijacking
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET));
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secures session ID cookies against forgery
    saveUninitialized: false, // Prevents sessions for non-logged-in users
    resave: false, // Prevents unnecessary session saving
    cookie: {
      secure: process.env.NODE_ENV === "production", // Ensure cookies are only transmit over HTTPS in production
      httpOnly: true, // Prevent client-side JavaScript access
      sameSite: "lax", // Mitigate CSRF
      maxAge: 1000 * 60 * 60 * 2, // Sets session cookie expiration to 2 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

// Node mailer configuration for OTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(
  csurf(
    process.env.CSRF_SECRET, // secret -- must be 32 bits or chars in length
    ["POST"], // the request methods we want CSRF protection for
    ["/logout"]
  )
);

function isAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

app.get("/csrf-token", async (req, res) => {
  const csrfToken = req.csrfToken();
  return res.json({ csrfToken: csrfToken });
});

app.get("/signup", async (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.sendFile(__dirname + "/public/html/signup.html", (err) => {
    if (err) console.error(err);
  });
});

app.post("/signup", async (req, res) => {
  const { username, email, password, repassword, captcha } = req.body;
  const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

  const validationResult = helper.validateSignupPassword(password, repassword);
  if (!validationResult.valid) {
    await helper.delay(1000);
    return res.status(400).json({ success: false, message: validationResult.message });
  }

  try {
    const checkQuery = `SELECT * FROM users WHERE username = $1 OR email = $2`;
    const data = await db.query(checkQuery, [username, email]);

    if (data.length > 0) {
      await helper.delay(1000);
      return res.status(400).json({ success: false, message: "Account creation failed." });
    }

    const captchaCheck = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`
    );

    if (captchaCheck.data.success) {
      const insertQuery = `INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, $4)`;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      await db.query(insertQuery, [username, hashedPassword, email, dt]);
      await helper.delay(1000);
      return res.status(201).json({ success: true, redirect: "/login" });
    } else {
      await helper.delay(1000);
      return res.status(400).json({ success: false, message: "Captcha verification failed. Please try again." });
    }
  } catch (err) {
    console.error("Signup error:", err);
    await helper.delay(1000);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/login", async (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.sendFile(__dirname + "/public/html/login.html", (err) => {
    if (err) console.error(err);
  });
});

app.get("/generate-otp/:username", async (req, res) => {
  try {
    const selectQuery = `SELECT email FROM users WHERE username = $1`;
    const result = await db.query(selectQuery, [req.params.username]);

    if (result.length > 0) {
      const otp = helper.generateOTP();
      const createQuery =
        "INSERT INTO otps (username, code, expiry_datetime) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')";
      await db.query(createQuery, [req.params.username, otp]);

      // Prepare the email message options.
      const mailOptions = {
        from: "wick98520@gmail.com",
        to: `${result[0].email}`,
        subject: "Login OTP",
        text: `Your OTP is ${otp}`,
      };

      try {
        // Send email and log the response.
        await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully.");
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError);
      }
    }
    return res.status(200).json({ success: true, message: "OTP generated and sent to email if any user found." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Account Enumeration (Generic error message return)
app.post("/login", async (req, res, next) => {
  try {
    const captchaCheck = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
    );

    if (captchaCheck.data.success) {
      await passport.authenticate("local", (err, user) => {
        if (err) {
          console.error("Passport authentication error:", err);
          helper.delay(1000);
          return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
        }

        if (user) {
          req.login(user, (err) => {
            if (err) {
              console.error("Session login error:", err);
              helper.delay(1000); // Delay helper to protect against timing attacks with account enumeration.
              return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
            }

            helper.delay(1000);
            return res.status(200).json({
              success: true,
              message: "Login successful.",
              redirect: "/",
            });
          });
        } else {
          helper.delay(1000);
          return res.status(401).json({
            success: false,
            message: "Invalid username, password, or OTP. Please try again.", // Generec error message in response to tackle account enumeration
          });
        }
      })(req, res, next);
    } else {
      helper.delay(1000);
      return res.status(401).json({
        success: false,
        message: "Verification failed. Please complete the reCAPTCHA and try again.",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    helper.delay(1000);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/logout", isAuth, (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error logging out" });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error(destroyErr);
        return res.status(500).json({ error: "Error destroying session" });
      }
      return res.redirect("/login");
    });
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
    let msg;

    if (captchaCheck.data.success) {
      if (req.body.postId !== "") {
        // Server side authorization checks to prevent IDOR
        const qCheck = "SELECT user_id FROM posts WHERE id = $1";
        const post = await db.query(qCheck, [req.body.postId]);

        if (post.length === 0) {
          // Post not found
          return res.status(404).json({ success: false, message: "Post not found." });
        }
        if (post[0].user_id !== req.user.id) {
          // User is not authorized to edit this post
          return res.status(403).json({ success: false, message: "Unauthorized to edit this post." });
        }

        const q = "UPDATE posts SET title = $1, content = $2, created_at = NOW() WHERE id = $3";
        await db.query(q, [req.body.title, req.body.content, req.body.postId]);
        res.status(200);
        msg = "Update post successfully!";
      } else {
        const q = "INSERT INTO posts (user_id, title, content, created_at) VALUES ($1, $2, $3, NOW())";
        await db.query(q, [req.user.id, req.body.title, req.body.content]);
        res.status(201);
        msg = "Create post successfully!";
      }
      return res.json({ success: true, redirect: "/my-posts", message: msg });
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
    return res.status(200).json({ success: true, message: "Delete post successfully!" });
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

    // Calling helper to decrypt the credit card details to return in client side
    if (result.length > 0) {
      const cnn = helper.decryptData(result[0].cnn, Buffer.from(result[0].iv, "hex"));
      const edate = helper.decryptData(result[0].edate, Buffer.from(result[0].iv, "hex"));

      return res.status(200).json({
        user: req.user,
        payment: { cnn: cnn, edate: edate }, // added payment object.
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
  const captchaCheck = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.captcha}`
  );

  const dt = new Date().toISOString().replace("T", " ").substring(0, 19);

  try {
    if (captchaCheck.data.success) {
      const checkQuery = `SELECT * FROM payments WHERE user_id = $1`;
      const payment = await db.query(checkQuery, [req.user.id]);

      const iv = crypto.randomBytes(16).toString("hex"); // Generate a new IV for each encryption

      // Calling helper to encrypt card number and expiry date of credit cards
      let query = "";
      if (payment.length > 0) {
        query = `UPDATE payments SET cnn = $1, edate = $2, iv = $4 WHERE user_id = $3`; // Include IV in update
        await db.query(query, [
          helper.encryptData(req.body.cnn, iv),
          helper.encryptData(req.body.eDate, iv),
          req.user.id,
          iv,
        ]);
        res.status(200);
      } else {
        query = `INSERT INTO payments (user_id, cnn, edate, created_at, iv) VALUES ($1, $2, $3, $4, $5)`; // Include IV in insert
        await db.query(query, [
          req.user.id,
          helper.encryptData(req.body.cnn, iv),
          helper.encryptData(req.body.eDate, iv),
          dt,
          iv,
        ]);
        res.status(201);
      }
      return res.json({ success: true, redirect: "/payment" });
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
