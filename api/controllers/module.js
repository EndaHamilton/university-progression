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
            `,
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

        const moduleByIdSQL = `SELECT 
            module.*, 
            subject.code AS subject_code,
            semester.name AS semester_name,
            GROUP_CONCAT(pathway.name SEPARATOR ', ') AS pathway_names
            FROM module
            INNER JOIN subject ON module.subject_id = subject.id
            INNER JOIN semester ON module.semester_id = semester.id
            LEFT JOIN pathway_module ON module.id = pathway_module.module_id
            LEFT JOIN pathway ON pathway_module.pathway_id = pathway.id
            WHERE module.id = ?;
            `;

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

        // if (shouldCheck('subject_code')) {
        //     const val = data.subject_code;
        //     const valStr = String(val);
        //     if (!val || valStr.trim() === "") {
        //         errors.push("Subject code cannot be empty.");
        //     } else if (!isNaN(valStr)) {
        //         errors.push("Subject code must not be numeric.");
        //     } else if (valStr.length !== 4) {
        //         errors.push("Subject code must be 4 characters exactly.");
        //     }
        // }

        if (shouldCheck("subject_id")) {
            const val = data.subject_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Subject ID cannot be empty.");
            }
            else if (!isPositiveInteger(val)) {
                errors.push("Subject ID must be a whole positive number");
            }
        }

        if (shouldCheck("default_program_level")) {
            const val = data.default_program_level;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Default Program Level cannot be empty.");
            } else if (![1, 2].includes(Number(val))) {
                errors.push("Default Program Level must be either 1 or 2"); // would be extended to further levels - but our system only deals with 1 and 2 currently
            }
        }


        // if (shouldCheck('subject_code')) {
        //     const val = data.subject_code;
        //     const valStr = String(val);
        //     if (!val || valStr.trim() === "") {
        //         errors.push("Subject code cannot be empty.");
        //     } else if (!isNaN(valStr)) {
        //         errors.push("Subject code must not be numeric.");
        //     } else if (valStr.length !== 4) {
        //         errors.push("Subject code must be 4 characters exactly.");
        //     }
        // }


        // if (shouldCheck('catalogue_code')) {
        //     const val = data.catalogue_code;
        //     const valStr = String(val);
        //     if (!val || valStr.trim() === "") {
        //         errors.push("Catalogue code cannot be empty.");
        //     } else if (valStr.length !== 3) {
        //         errors.push("Catalogue code must be 3 characters exactly.");
        //     }
        // }

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

        // if (shouldCheck('pathway_ids')) {
        //     const raw = data.pathway_ids;

        //     const parsedPathways = Array.isArray(raw)
        //         ? raw
        //         : raw
        //             ? [raw]
        //             : [];

        //     const allowedPathwayIds = [1, 2];

        //     if (!parsedPathways || parsedPathways.length === 0) {
        //         errors.push("Pathway ID(s) cannot be empty")
        //     } else if (!parsedPathways.every(id => allowedPathwayIds.includes(Number(id)))) {
        //         errors.push("Each selected pathway must be either 1 (Information Systems) or 2 (Business Data Analysis).");
        //     }

        // }



        return errors;
    }


    // POST a new module - /module
    // This route should create a new module in the database
    router.post("/", async (req, res) => {

        const { subject_id, default_program_level, title, credits, semester_id, pathway_ids } = req.body;

        // Validate the request body
        const validationErrors = validateModuleFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        // Get subject code from subject table
        const subjectId = parseInt(subject_id);
        const [subjectRows] = await db.promise().query(`SELECT code FROM subject WHERE id = ?`, [subjectId]);
        if (subjectRows.length === 0) {
            return res.status(400).json({ error: "Invalid subject ID" });
        }
        const subjectCode = subjectRows[0].code;

        // Get and create the sequence num
        const level = String(default_program_level).trim();
        const [seqRows] = await db.promise().query(
            `SELECT last_used_number FROM subject_level_seq WHERE subject_id = ? AND level = ?`,
            [subjectId, level]
        );

        let nextNumber;
        if (seqRows.length > 0) {
            nextNumber = seqRows[0].last_used_number + 1;

            await db.promise().query(
                `UPDATE subject_level_seq SET last_used_number = ? WHERE subject_id = ? AND level = ?`,
                [nextNumber, subjectId, level]
            );
        } else {
            nextNumber = 1;

            await db.promise().query(
                `INSERT INTO subject_level_seq (subject_id, level, last_used_number) VALUES (?, ?, ?)`,
                [subjectId, level, nextNumber]
            );
        }

        // Generate module code
        const paddedSequence = String(nextNumber).padStart(2, "0");
        const subjectModuleNumber = `${level}${paddedSequence}`;
        const moduleCode = `${subjectCode}${subjectModuleNumber}`;

        // // Parse pathway_ids
        // const parsedPathways = Array.isArray(pathway_ids)
        //     ? pathway_ids.map(id => parseInt(id))
        //     : pathway_ids
        //         ? [parseInt(pathway_ids)]
        //         : [];



        try {
            // // Check if module with same subject_code, catalogue_code, and title already exists - UQ in DB
            // const [existing] = await db.promise().query(
            //     `SELECT * FROM module WHERE subject_code = ? AND catalogue_code = ? AND title = ?`,
            //     [subject_code.trim(), catalogue_code, title.trim()]
            // );

            // Check if module with same module code and title (e.g. IFSY211 - Computing Practice) already exists - the UQ in DB
            const [existing] = await db.promise().query(
                `SELECT * FROM module WHERE module_code = ? AND title = ?`,
                [moduleCode.trim(), title.trim()]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: `A module with the same module code and title (Same subject, subject module number and title) already exists. 
                                                    Suggest modifying the title to be unique.` });
            }

            // Insert new module (module_code will be generated automatically by the DB)
            const insertSQL = `
                    INSERT INTO module (subject_id, default_program_level, title, subject_module_number, credits, semester_id, module_code)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

            const [result] = await db.promise().query(insertSQL, [
                parseInt(subjectId),
                level.trim(),
                title.trim(),
                subjectModuleNumber,
                parseInt(credits),
                parseInt(semester_id),
                moduleCode
            ]);

            // Fetch the newly inserted module (to return full object incl. module_code)
            // const [newModule] = await db.promise().query(
            //     `SELECT * FROM module WHERE id = ?`,
            //     [result.insertId]
            // );

            const newModuleId = result.insertId;


            // Commenting out pathway_module insert as this will now be done at pathway level

            // // Insert into pathway_module
            // if (parsedPathways.length > 0) {
            //     const insertPathways = parsedPathways.map(pathwayId => [pathwayId, newModuleId]);
            //     await db.promise().query(
            //         `INSERT INTO pathway_module (pathway_id, module_id) VALUES ?`,
            //         [insertPathways]
            //     );
            // }

            res.status(200).json({
                message: "Module created successfully!",
                module: newModuleId,
                module_code: moduleCode
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

        const { subject_id, default_program_level, title, credits, semester_id } = req.body;

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

            // Commenting out pathway related checks as these will happen at pathway level now

            // // Check if the data being updated is the same as existing data
            // // Checks only for fields which are being passed in - doesn't check undefined fields that aren't being toucehd
            // // Fetch existing pathways from DB
            // const [existingPathwayRows] = await db.promise().query(
            //     `SELECT pathway_id FROM pathway_module WHERE module_id = ?`,
            //     [id]
            // );
            // const existingPathwayIds = existingPathwayRows.map(r => r.pathway_id).sort((a, b) => a - b);

            // // Get new pathway IDs from request and parse
            // const newPathwayIds = Array.isArray(req.body.pathway_ids)
            //     ? req.body.pathway_ids.map(Number).sort((a, b) => a - b)
            //     : req.body.pathway_ids
            //         ? [parseInt(req.body.pathway_ids)]
            //         : [];

            // // // Compare pathway IDs (unordered)
            // const pathwaysUnchanged = JSON.stringify(existingPathwayIds) === JSON.stringify(newPathwayIds);

            // // Unique constraint check: only if user is updating all 3 relevant fields
            // if (subject_code && catalogue_code && title) {
            //     const [conflicts] = await db.promise().query(
            //         `SELECT * FROM module 
            //          WHERE subject_code = ? AND catalogue_code = ? AND title = ? AND id != ?`,
            //         [subject_code.trim(), parseInt(catalogue_code), title.trim(), id]
            //     );

            //     if (conflicts.length > 0) {
            //         return res.status(409).json({ error: "Another module with the same subject code, catalogue code, and title already exists." });
            //     }
            // } 

            const { getUpdatedFields } = require("../utils/comparisonHelpers");

            const fieldsToCheck = [
                "subject_id", "default_program_level", "title", "credits",
                "semester_id",
            ];

            const { updateFields, updateValues } = getUpdatedFields(req.body, existingModule, fieldsToCheck);

            // Handling update to subject_module_number and module_code differently as these are system generated based on updated fields above
            let newSubjectModuleNumber = existingModule.subject_module_number;
            let newModuleCode = existingModule.module_code;

            // Checks if either subject id or level were detected as changed from comparison function
            const updatingSubjectOrLevel = updateFields.includes("subject_id = ?") || updateFields.includes("default_program_level = ?");


            if (updatingSubjectOrLevel) {
                const subjectId = req.body.subject_id
                    ? parseInt(req.body.subject_id)
                    : existingModule.subject_id;
                const level = req.body.default_program_level
                    ? String(req.body.default_program_level).trim()
                    : existingModule.default_program_level;

                // Lookup subject code
                const [subjectRows] = await db.promise().query(
                    `SELECT code FROM subject WHERE id = ?`,
                    [subjectId]
                );
                if (subjectRows.length === 0) {
                    return res.status(400).json({ error: "Invalid subject ID" });
                }
                const subjectCode = subjectRows[0].code;

                // Handle subject_level sequencing
                const [seqRows] = await db.promise().query(
                    `SELECT last_used_number FROM subject_level_seq WHERE subject_id = ? AND level = ?`,
                    [subjectId, level]
                );

                let nextNumber;
                if (seqRows.length > 0) {
                    nextNumber = seqRows[0].last_used_number + 1;
                } else {
                    nextNumber = 1;
                }

                const paddedSequence = String(nextNumber).padStart(2, "0");
                const generatedSubjectModuleNumber = `${level}${paddedSequence}`;
                const generatedModuleCode = `${subjectCode}${generatedSubjectModuleNumber}`;

                /* Only perform changes to subj module num and module code if new values or different 
                - this also includes the insertion into the subject_level_seq table in DB - only want num incremented if a change */
                const isModuleCodeChanged = (
                    generatedSubjectModuleNumber !== existingModule.subject_module_number || generatedModuleCode !== existingModule.module_code
                );

                if (isModuleCodeChanged) {
                    // Ensure the new module code is unique
                    const [conflicts] = await db.promise().query(
                        `SELECT * FROM module WHERE module_code = ? AND id != ?`,
                        [newModuleCode, id]
                    );
                    if (conflicts.length > 0) {
                        return res
                            .status(409)
                            .json({ error: "Another module with the same module code already exists." });
                    }

                    newSubjectModuleNumber = generatedSubjectModuleNumber;
                    newModuleCode = generatedModuleCode;

                    updateFields.push("subject_module_number = ?", "module_code = ?");
                    updateValues.push(newSubjectModuleNumber, newModuleCode);

                    // Only performing increment in subject level seq table if values have changed
                    if (seqRows.length > 0) {
                        await db.promise().query(
                            `UPDATE subject_level_seq SET last_used_number = ? WHERE subject_id = ? AND level = ?`,
                            [nextNumber, subjectId, level]
                        );
                    } else {
                        await db.promise().query(
                            `INSERT INTO subject_level_seq (subject_id, level, last_used_number) VALUES (?, ?, ?)`,
                            [subjectId, level, nextNumber]
                        );
                    }
                }

            }


            updateValues.push(id);

            // Commenting out pathway related checks as these will happen at pathway level now
            // if (updateFields.length === 0 && pathwaysUnchanged) {
            //     return res.status(400).json({ error: "No changes detected. Module data is identical" });
            // }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: "No changes detected. Module data is identical" });
            }


            if (updateFields.length > 0) {
                const updateSQL = `UPDATE module SET ${updateFields.join(", ")} WHERE id = ?`;
                await db.promise().query(updateSQL, updateValues);
            }

            // Commenting out pathway related checks as these will happen at pathway level now

            // // Also update pathway_module junction table
            // if ('pathway_ids' in req.body) {
            //     const parsedPathways = Array.isArray(req.body.pathway_ids)
            //         ? req.body.pathway_ids.map(id => parseInt(id))
            //         : req.body.pathway_ids
            //             ? [parseInt(req.body.pathway_ids)]
            //             : [];

            //     // Delete old mappings
            //     await db.promise().query(`DELETE FROM pathway_module WHERE module_id = ?`, [id]);


            //     // Insert new ones
            //     if (parsedPathways.length > 0) {
            //         const insertPathways = parsedPathways.map(pid => [pid, id]);
            //         await db.promise().query(
            //             `INSERT INTO pathway_module (pathway_id, module_id) VALUES ?`,
            //             [insertPathways]
            //         );
            //     }
            // }

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