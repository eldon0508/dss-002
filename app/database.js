const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432, // default Postgres port
  database: "dss-blog",
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
