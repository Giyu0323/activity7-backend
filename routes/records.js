const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const MAX_ID = 2147483647; // largest value of a Postgres integer
const COLUMNS = "id, title, category, description, status";

const RULES = {
    title: { label: "Title", min: 3, max: 80 },
    category: { label: "Category", min: 2, max: 40 },
    description: { label: "Description", min: 5, max: 300 }
};

/* ---------- Helpers ---------- */

// Returns a valid id, or sends the error response itself and returns null.
function readId(req, res) {
    const raw = req.params.id;

    if (!/^[1-9]\d*$/.test(raw)) {
        res.status(400).json({ message: "Id must be a positive whole number." });
        return null;
    }

    const id = Number(raw);

    // A valid whole number too large to exist in the table
    if (!Number.isSafeInteger(id) || id > MAX_ID) {
        res.status(404).json({ message: "Record not found." });
        return null;
    }

    return id;
}

// Checks the four editable fields. Any client-supplied id is ignored.
function validateRecord(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { message: "Request body must be a JSON object." };
    }

    const clean = {};

    for (const [name, rule] of Object.entries(RULES)) {
        const value = body[name];

        if (typeof value !== "string") {
            return { message: `${rule.label} is required and must be text.` };
        }

        const trimmed = value.trim();

        if (trimmed.length < rule.min || trimmed.length > rule.max) {
            return { message: `${rule.label} must have ${rule.min} to ${rule.max} characters.` };
        }

        clean[name] = trimmed;
    }

    if (typeof body.status !== "string") {
        return { message: "Status is required and must be text." };
    }

    const status = body.status.trim();

    if (!STATUSES.includes(status)) {
        return { message: "Status must be Pending, In progress or Completed." };
    }

    clean.status = status;
    return { value: clean };
}

/* ---------- GET all ---------- */
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ${COLUMNS} FROM records ORDER BY id`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

/* ---------- GET one ---------- */
router.get("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const result = await pool.query(
            `SELECT ${COLUMNS} FROM records WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/* ---------- POST (create) ---------- */
router.post("/", async (req, res, next) => {
    try {
        const checked = validateRecord(req.body);
        if (checked.message) {
            return res.status(400).json({ message: checked.message });
        }

        const { title, category, description, status } = checked.value;

        const result = await pool.query(
            `INSERT INTO records (title, category, description, status)
             VALUES ($1, $2, $3, $4)
             RETURNING ${COLUMNS}`,
            [title, category, description, status]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/* ---------- PUT (replace the four editable fields) ---------- */
router.put("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const checked = validateRecord(req.body);
        if (checked.message) {
            return res.status(400).json({ message: checked.message });
        }

        const { title, category, description, status } = checked.value;

        const result = await pool.query(
            `UPDATE records
             SET title = $1, category = $2, description = $3, status = $4
             WHERE id = $5
             RETURNING ${COLUMNS}`,
            [title, category, description, status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

/* ---------- DELETE ---------- */
router.delete("/:id", async (req, res, next) => {
    try {
        const id = readId(req, res);
        if (id === null) return;

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json({ message: "Record deleted." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
