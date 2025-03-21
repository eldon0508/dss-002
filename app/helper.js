const crypto = require("crypto");

function encryptData(text, key, iv) {
  const cipher = crypto.createCipheriv(process.env.CRYPTO_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decryptData(encryptedText, key, iv) {
  const decipher = crypto.createDecipheriv(process.env.CRYPTO_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encryptData, decryptData };
