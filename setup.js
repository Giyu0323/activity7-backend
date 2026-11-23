// Creates the table and adds the starting records. Run with: npm run db:setup
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function run() {
    try {
        for (const file of ["schema.sql", "seed.sql"]) {
            const sql = fs.readFileSync(path.join(__dirname, file), "utf8");
            await pool.query(sql);
            console.log(`Ran ${file}`);
        }

        const result = await pool.query("SELECT COUNT(*) AS total FROM records");
        console.log(`Records in the table: ${result.rows[0].total}`);
    } catch (error) {
        console.error("Setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
