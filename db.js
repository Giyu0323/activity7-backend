require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is missing. Add it to your .env file.");
}

// Local databases do not use SSL. Hosted databases (Neon, Render) do.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString || "");

const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Stops an idle-connection error from crashing the whole server
pool.on("error", (error) => {
    console.error("Unexpected database error:", error.message);
});

module.exports = pool;
