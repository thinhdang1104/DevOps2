const mysql = require("mysql2/promise");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
