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
            } else if (parseInt(val) < 0 || parseInt(val) > 120) {
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



    // PUT - Update a module - /module/:id
    // This route should update an existing module in the database based on module id
    router.put("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ID. Must be a number." });
        }

        const { subject_code, catalogue_code, title, credits, semester_id } = req.body;

        const validationErrors = validateModuleFields(req.body, { isUpdate: true });
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {
            // Get the existing module by ID
            const [existingModules] = await db.promise().query(`SELECT * FROM module WHERE id = ?`, [id]);
            if (existingModules.length === 0) {
                return res.status(404).json({ error: "Module not found." });
            }

            const existingModule = existingModules[0];

            // Check if the data being updated is the same as existing data
            // Checks only for fields which are being passed in - doesn't check undefined fields that aren't being toucehd
            const isIdentical = Object.keys(req.body).every((key) => {
                const newVal = req.body[key];
                const existingVal = existingModule[key];

                if (["catalogue_code", "credits", "semester_id"].includes(key)) {
                    return parseInt(newVal) === existingVal;
                }

                const normalizedNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim();
                const normalizedExisting = (existingVal === null || existingVal === undefined) ? "" : String(existingVal).trim();

                return normalizedNew === normalizedExisting;
            });

            if (isIdentical) {
                return res.status(400).json({ error: "No changes detected. Module data is identical." });
            }

            // Unique constraint check: only if user is updating all 3 relevant fields
            if (subject_code && catalogue_code && title) {
                const [conflicts] = await db.promise().query(
                    `SELECT * FROM module 
                     WHERE subject_code = ? AND catalogue_code = ? AND title = ? AND id != ?`,
                    [subject_code.trim(), parseInt(catalogue_code), title.trim(), id]
                );

                if (conflicts.length > 0) {
                    return res.status(409).json({ error: "Another module with the same subject code, catalogue code, and title already exists." });
                }
            }

            // Build update statement only with changed fields
            const updateFields = [];
            const updateValues = [];

            if (subject_code && subject_code.trim() !== existingModule.subject_code) {
                updateFields.push("subject_code = ?");
                updateValues.push(subject_code.trim());
            }
            if (catalogue_code && parseInt(catalogue_code) !== existingModule.catalogue_code) {
                updateFields.push("catalogue_code = ?");
                updateValues.push(parseInt(catalogue_code));
            }
            if (title && title.trim() !== existingModule.title) {
                updateFields.push("title = ?");
                updateValues.push(title.trim());
            }
            if (credits && parseInt(credits) !== existingModule.credits) {
                updateFields.push("credits = ?");
                updateValues.push(parseInt(credits));
            }
            if (semester_id && parseInt(semester_id) !== existingModule.semester_id) {
                updateFields.push("semester_id = ?");
                updateValues.push(parseInt(semester_id));
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: "No changes detected." });
            }

            updateValues.push(id);
            const updateSQL = `UPDATE module SET ${updateFields.join(", ")} WHERE id = ?`;

            await db.promise().query(updateSQL, updateValues);

            res.status(200).json({ message: "Module updated successfully." });

        } catch (err) {
            console.error("Error updating module:", err);
            res.status(500).json({ error: "Server error", details: err.message });
        }
    });

    // DELETE - Delete a module - /module/:id
    // This route should delete a module from the database based on module id
    router.delete("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ID. Must be a number." });
        }
    
        try {
            const [result] = await db.promise().query(`DELETE FROM module WHERE id = ?`, [id]);
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Module not found." });
            }
    
            res.status(200).json({ message: "Module deleted successfully.", moduleId: id });
        } catch (err) {
            console.error("Error deleting module:", err);
            res.status(500).json({ error: "Failed to delete module.", details: err.message });
        }
    });





    return router;
}