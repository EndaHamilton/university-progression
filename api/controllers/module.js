const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {
    // Route to GET all modules - including related FK data
    router.get('/', (req, res) => {

        console.log('GET /module called');

        db.query(`
            SELECT
            module.*,
            semester.name AS semester_name
            FROM module
            INNER JOIN semester ON module.semester_id = semester.id
            `, // SQL query to join module and semester tables
            (err, rows) => {
                if (err) {
                    console.error('Error fetching modules:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(rows);
            });
    });

    // GET module by ID - /module/:id
    // This route should return a single module by ID
    router.get("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        const studentByIdSQL = `SELECT * FROM module WHERE id = ?`;

        if (isNaN(id)) {
           return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(studentByIdSQL, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Module not found' })
            } else {
                res.json(rows[0]);
            }
        } catch (err) {
            console.error("Database error", err);
            res.status(500).json({ error: "Failed to fetch module details" });
        }

    });


    // POST a new module - /module
    // This route should create a new module in the database



    return router;
}