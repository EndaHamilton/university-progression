const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");
const { ALLOWED_CREDIT_VALUES } = require('../utils/constants');

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {
    // Route to GET all modules - including related FK data
    router.get('/', (req, res) => {

        db.query(`
            SELECT 
            module.*, 
            subject.code AS subject_code,
            semester.name AS semester_name,
            GROUP_CONCAT(pathway.name SEPARATOR ', ') AS pathway_names
            FROM module
            INNER JOIN subject ON module.subject_id = subject.id
            INNER JOIN semester ON module.semester_id = semester.id
            LEFT JOIN pathway_module ON module.id = pathway_module.module_id
            LEFT JOIN pathway ON pathway_module.pathway_id = pathway.id
            GROUP BY module.id;
            `, // SQL query to get details from join tables module, semester and pathway_module
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
        const moduleByIdSQL = `SELECT * FROM module WHERE id = ?`;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        try {
            const [moduleRows] = await db.promise().query(moduleByIdSQL, [id]);
            if (moduleRows.length === 0) {
                return res.status(404).json({ error: 'Module not found' })
            }

            const module = moduleRows[0];

            const [pathwayRows] = await db.promise().query(
                `SELECT pathway_id FROM pathway_module WHERE module_id = ?`,
                [id]
            );
            // Extract just the pathway_id values into an array
            const pathway_ids = pathwayRows.map(row => row.pathway_id);

            // Attach to module object
            module.pathway_ids = pathway_ids;

            res.json(module);

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


        // Ensure all cases of trim, values are converted to String

        if (shouldCheck('subject_code')) {
            const val = data.subject_code;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Subject code cannot be empty.");
            } else if (!isNaN(valStr)) {
                errors.push("Subject code must not be numeric.");
            } else if (valStr.length !== 4) {
                errors.push("Subject code must be 4 characters exactly.");
            }
        }

        if (shouldCheck('catalogue_code')) {
            const val = data.catalogue_code;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Catalogue code cannot be empty.");
            } else if (valStr.length !== 3) {
                errors.push("Catalogue code must be 3 characters exactly.");
            }
        }

        if (shouldCheck('title')) {
            const val = data.title;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Title cannot be empty.");
            } else if (valStr.length > 50 || valStr.length < 3) {
                errors.push("Title must be between 3 and 50 characters.");
            }
        }

        if (shouldCheck('credits')) {
            const val = data.credits;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Credits cannot be empty.");
            } else if (!ALLOWED_CREDIT_VALUES.includes(parseInt(val))) {
                errors.push("Credits must be one of the following values: " + ALLOWED_CREDIT_VALUES.join(", ") + ".");
            }
        }

        if (shouldCheck("semester_id")) {
            const val = data.semester_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Semster ID cannot be empty.");
            }
            else if (!isPositiveInteger(val)) {
                errors.push("Semester ID must be 1 (AUT), 2 (SPR), or 3 (FYR).");
            } else if (![1, 2, 3].includes(Number(val))) {
                errors.push("Semester ID must be 1 (AUT), 2 (SPR), or 3 (FYR).");
            }
        }

        if (shouldCheck('pathway_ids')) {
            const raw = data.pathway_ids;

            const parsedPathways = Array.isArray(raw)
                ? raw
                : raw
                    ? [raw]
                    : [];

            const allowedPathwayIds = [1, 2];

            if (!parsedPathways || parsedPathways.length === 0) {
                errors.push("Pathway ID(s) cannot be empty")
            } else if (!parsedPathways.every(id => allowedPathwayIds.includes(Number(id)))) {
                errors.push("Each selected pathway must be either 1 (Information Systems) or 2 (Business Data Analysis).");
            }

        }



        return errors;
    }


    // POST a new module - /module
    // This route should create a new module in the database
    router.post("/", async (req, res) => {
        const { subject_code, catalogue_code, title, credits, semester_id, pathway_ids } = req.body;

        // Validate the request body
        const validationErrors = validateModuleFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        // Parse pathway_ids
        const parsedPathways = Array.isArray(pathway_ids)
            ? pathway_ids.map(id => parseInt(id))
            : pathway_ids
                ? [parseInt(pathway_ids)]
                : [];



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
            // const [newModule] = await db.promise().query(
            //     `SELECT * FROM module WHERE id = ?`,
            //     [result.insertId]
            // );

            const newModuleId = result.insertId;

            // Insert into pathway_module
            if (parsedPathways.length > 0) {
                const insertPathways = parsedPathways.map(pathwayId => [pathwayId, newModuleId]);
                await db.promise().query(
                    `INSERT INTO pathway_module (pathway_id, module_id) VALUES ?`,
                    [insertPathways]
                );
            }

            res.status(201).json({
                message: "Module created successfully!",
                module: newModuleId
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
            // Fetch existing pathways from DB
            const [existingPathwayRows] = await db.promise().query(
                `SELECT pathway_id FROM pathway_module WHERE module_id = ?`,
                [id]
            );
            const existingPathwayIds = existingPathwayRows.map(r => r.pathway_id).sort((a, b) => a - b);

            // Get new pathway IDs from request and parse
            const newPathwayIds = Array.isArray(req.body.pathway_ids)
                ? req.body.pathway_ids.map(Number).sort((a, b) => a - b)
                : req.body.pathway_ids
                    ? [parseInt(req.body.pathway_ids)]
                    : [];

            // // Compare fields in module table
            // const moduleFieldsUnchanged = Object.keys(req.body).every((key) => {
            //     const newVal = req.body[key];
            //     const existingVal = existingModule[key];

            //     if (["catalogue_code", "credits", "semester_id"].includes(key)) {
            //         return parseInt(newVal) === existingVal;
            //     }

            //     const normalizedNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim();
            //     const normalizedExisting = (existingVal === null || existingVal === undefined) ? "" : String(existingVal).trim();

            //     return normalizedNew === normalizedExisting;
            // });

            // console.log("Existing pathway IDs from DB:", existingPathwayIds);
            // console.log("New pathway IDs from req.body:", req.body.pathway_ids);
            // console.log("Parsed newPathwayIds:", newPathwayIds);

            // console.log("moduleFieldsUnchanged:", moduleFieldsUnchanged);
            // console.log("pathwaysUnchanged:", pathwaysUnchanged);


            // if (moduleFieldsUnchanged && pathwaysUnchanged) {
            //     return res.status(400).json({ error: "No changes detected. Module data is identical." });
            // }

            // // Compare pathway IDs (unordered)
            const pathwaysUnchanged = JSON.stringify(existingPathwayIds) === JSON.stringify(newPathwayIds);

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

            // //Helper function to normalize for comparison
            // function normalize(val) {
            //     if (val === undefined || val === "" || val === null) return null;
            //     if (!isNaN(val)) return parseInt(val);
            //     return String(val).trim().toLowerCase();
            // }

            // const fieldsToCheck = [
            //     "subject_code", "catalogue_code", "title", "credits",
            //     "semester_id",
            // ];

            // // Build update statement only with changed fields
            // const updateFields = [];
            // const updateValues = [];

            // //Loop through fields in an easier way
            // fieldsToCheck.forEach(key => {
            //     if (key in req.body) {
            //         const newVal = (req.body[key]);
            //         const existingVal = (existingModule[key]);

            //         const normalizedNew = normalize(newVal);
            //         const normalizedExisting = normalize(existingVal);

            //         console.log(`[COMPARE] ${key}: new=${normalizedNew}, existing=${normalizedExisting}`);
            //         if (normalizedNew !== normalizedExisting) {
            //             updateFields.push(`${key} = ?`);
            //             updateValues.push(newVal);
            //         }
            //     }
            // });

            const { getUpdatedFields } = require("../utils/comparisonHelpers");

            const fieldsToCheck = [
                "subject_code", "catalogue_code", "title", "credits",
                "semester_id",
            ];

            const { updateFields, updateValues } = getUpdatedFields(req.body, existingModule, fieldsToCheck);

            updateValues.push(id);

            if (updateFields.length === 0 && pathwaysUnchanged) {
                return res.status(400).json({ error: "No changes detected. Module data is identical" });
            }


            if (updateFields.length > 0) {
                const updateSQL = `UPDATE module SET ${updateFields.join(", ")} WHERE id = ?`;
                await db.promise().query(updateSQL, updateValues);
            }



            // updateValues.push(id);
            // const updateSQL = `UPDATE module SET ${updateFields.join(", ")} WHERE id = ?`;

            // await db.promise().query(updateSQL, updateValues);

            // Also update pathway_module junction table
            if ('pathway_ids' in req.body) {
                const parsedPathways = Array.isArray(req.body.pathway_ids)
                    ? req.body.pathway_ids.map(id => parseInt(id))
                    : req.body.pathway_ids
                        ? [parseInt(req.body.pathway_ids)]
                        : [];

                // Delete old mappings
                await db.promise().query(`DELETE FROM pathway_module WHERE module_id = ?`, [id]);



                // Insert new ones
                if (parsedPathways.length > 0) {
                    const insertPathways = parsedPathways.map(pid => [pid, id]);
                    await db.promise().query(
                        `INSERT INTO pathway_module (pathway_id, module_id) VALUES ?`,
                        [insertPathways]
                    );
                }
            }

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