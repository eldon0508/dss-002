const db = require("./database");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;

// Passport local initialisation, using IStrategyOptionsWithRequest
module.exports = async function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
      const query = `SELECT * FROM users WHERE username = $1`;
      const data = await db.query(query, [username]);

      if (data.length <= 0) {
        return done(null, false);
      }
      bcrypt.compare(password, data[0].password, (err, result) => {
        if (err) throw err;
        if (!result) {
          // Found, but incorrect password
          return done(null, false);
        } else {
          return done(null, data[0]);
        }
      });
    })
  );

  passport.serializeUser(function (user, done) {
    process.nextTick(function () {
      done(null, {
        id: user.id,
        username: user.username,
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
