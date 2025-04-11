const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {
    // Route to GET all modules - including related FK data
    router.get('/', (req, res) => {

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

    // Validation function for adding a new module
    function validateModuleFields(data, { isUpdate = false } = {}) {

        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
        const shouldCheck = (field) => !isUpdate || field in data;


        if (shouldCheck('subject_code')) {
            const val = data.subject_code;
            if (!val || val.trim() === "") {
                errors.push("Subject code cannot be empty.");
            } else if (val.length !== 4) {
                errors.push("Subject code must be 4 characters exactly.");
            }
        }

        if (shouldCheck('catalogue_code')) {
            const val = data.catalogue_code;
            if (!val || val.trim() === "") {
                errors.push("Catalogue code cannot be empty.");
            } else if (val.length !== 3) {
                errors.push("Catalogue code must be 3 characters exactly.");
            }
        }

        if (shouldCheck('title')) {
            const val = data.title;
            if (!val || val.trim() === "") {
                errors.push("Title  cannot be empty.");
            } else if (val.length > 50 || val.length < 3) {
                errors.push("Title must be between 3 and 50 characters.");
            }
        }

        if (shouldCheck('credits')) {
            const val = data.credits;
            if (!val || val.trim() === "") {
                errors.push("Credits cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Credits must be a positive whole number.");
            }
            else if (parseInt(val) < 0 || parseInt(val) > 120) {
                errors.push("Credits must be between 0 and 120.");
            }
        }

        if (shouldCheck("semester_id")) {
            if (!isPositiveInteger(data.semester_id)) {
                errors.push("Semester ID must be 1 (AUT), 2 (SPR), or 3 (FYR).");
            } else if (![1, 2, 3].includes(Number(data.semester_id))) {
                errors.push("Semester ID must be 1 (AUT), 2 (SPR), or 3 (FYR).");
            }
        }

        return errors;
    }


    // POST a new module - /module
    // This route should create a new module in the database
    router.post("/", async (req, res) => {
        const { subject_code, catalogue_code, title, credits, semester_id } = req.body;

        // Validate the request body
        const validationErrors = validateModuleFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {
            // Check if module with same subject_code, catalogue_code, and title already exists - UQ in DB
            const [existing] = await db.promise().query(
                `SELECT * FROM module WHERE subject_code = ? AND catalogue_code = ? AND title = ?`,
                [subject_code.trim(), catalogue_code, title.trim()]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: "A module with the same subject code, catalogue code, and title already exists." });
            }

            // Insert new module (module_code will be generated automatically by the DB)
            const insertSQL = `
                    INSERT INTO module (subject_code, catalogue_code, title, credits, semester_id)
                    VALUES (?, ?, ?, ?, ?)
                `;

            const [result] = await db.promise().query(insertSQL, [
                subject_code.trim(),
                parseInt(catalogue_code),
                title.trim(),
                parseInt(credits),
                parseInt(semester_id)
            ]);

            // Fetch the newly inserted module (to return full object incl. module_code)
            const [newModule] = await db.promise().query(
                `SELECT * FROM module WHERE id = ?`,
                [result.insertId]
            );

            res.status(201).json({
                message: "Module created successfully!",
                module: newModule[0]
            });

        } catch (err) {
            console.error("Error creating module:", err);
            res.status(500).json({ error: "Server error", details: err.message });
        }
    });



    ;



    return router;
}