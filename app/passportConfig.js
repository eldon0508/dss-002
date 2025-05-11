const db = require("./database");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;

// Passport local initialisation, using IStrategyOptionsWithRequest
module.exports = async function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "password", passReqToCallback: true },
      async (req, username, password, done) => {
        const query = "SELECT * FROM users WHERE username = $1";
        const data = await db.query(query, [username]);
        const otpQuery =
          "SELECT * FROM otps WHERE username = $1 AND code = $2 AND expiry_datetime > NOW() - INTERVAL '15 minutes' ORDER BY expiry_datetime DESC LIMIT 1";
        const otpData = await db.query(otpQuery, [username, req.body.otp]);

        if (data.length <= 0 || otpData <= 0) {
          console.log(data, otpData);
          console.log("User not found");
          return done(null, false);
        }

        bcrypt.compare(password, data[0].password, (err, result) => {
          if (err) throw err;
          if (!result) {
            console.log("Wrong password");
            // Found, but incorrect password
            return done(null, false);
          } else {
            console.log("Login success", data[0]);
            return done(null, data[0]);
          }
        });
      }
    )
  );

  passport.serializeUser(function (user, done) {
    process.nextTick(function () {
      done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      });
    });
  });

  passport.deserializeUser(function (user, done) {
    process.nextTick(function () {
      done(null, user);
    });
  });
};
