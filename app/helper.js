const crypto = require("crypto");

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

module.exports = { encryptData, decryptData };
