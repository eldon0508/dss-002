const crypto = require("crypto");

// https://github.com/dropbox/zxcvbn
const zxcvbn = require("zxcvbn");

// AES-256 Encryption
function encryptData(text, iv) {
  const cipher = crypto.createCipheriv(
    process.env.CRYPTO_ALGORITHM,
    Buffer.from(process.env.CRYPTO_KEY, "hex"),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// AES-256 Decryption
function decryptData(encryptedText, iv) {
  const decipher = crypto.createDecipheriv(
    process.env.CRYPTO_ALGORITHM,
    Buffer.from(process.env.CRYPTO_KEY, "hex"),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Generate OTP helper
function generateOTP() {
  return crypto.randomInt(100000, 999999);
}

// Implements a delay to protect against timing attacks.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Password validation function in sign up
function validateSignupPassword(password, repassword) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (password !== repassword) {
    return { valid: false, message: "Passwords do not match." };
  }
  const passwordStrength = zxcvbn(password);
  if (passwordStrength.score < 3) {
    return { valid: false, message: "Password is too weak. Please choose a stronger password." };
  }
  return { valid: true };
}

module.exports = { encryptData, decryptData, generateOTP, delay, validateSignupPassword };
