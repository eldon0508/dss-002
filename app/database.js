const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // default Postgres port
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Function to execute a query
async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (err) {
    console.error("Error executing query", err);
    throw err; // Re-throw the error so it can be handled where the function is called
  }
}

module.exports = { query };
