const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const checkApiKey = require("../middleware/checkApiKey");
router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

// Creating local DB for use of transaction within POST route only
const mysql = require('mysql2/promise');
const localDb = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'acad_progression_new'
});

const phonePattern = /^[\d\s()+-]+$/;

module.exports = function (db) {

    //Format validation function for shared fields between adding and updating student
    //isUpdate check is needed as means if it is a PUT request it only checks for the fields that are being updated and not all fields
    function validateStudentFields(data, { isUpdate = false } = {}) {

        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
        const shouldCheck = (field) => !isUpdate || field in data;

        if (shouldCheck('first_name')) {
            const val = data.first_name;
            if (!val || val.trim() === "") {
                errors.push("First name cannot be empty.");
            } else {
                if (!isNaN(val)) {
                    errors.push("First name must not be numeric.");
                }
                if (val.length < 2) {
                    errors.push("First name must be at least 2 characters.");
                }
                if (val.length > 50) {
                    errors.push("First name must be less than 50 characters.");
                }
            }
        }

        if (shouldCheck('last_name')) {
            const val = data.last_name;
            if (!val || val.trim() === "") {
                errors.push("Last name cannot be empty.");
            } else {
                if (!isNaN(val)) {
                    errors.push("Last name must not be numeric.");
                }
                if (val.length < 2) {
                    errors.push("Last name must be at least 2 characters.");
                }
                if (val.length > 50) {
                    errors.push("Last name must be less than 50 characters.");
                }
            }
        }

        if (shouldCheck('study_status_id')) {
            const val = data.study_status_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Study status cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Study status ID must be a positive whole number.");
            }
        }

        if (shouldCheck('current_level_id')) {
            const val = data.current_level_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Current level cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Current level ID must be a positive whole number.");
            }
        }

        if (shouldCheck('entry_level_id')) {
            const val = data.entry_level_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Entry level cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Entry level ID must be a positive whole number.");
            }
        }

        if (shouldCheck('pathway_id')) {
            const val = data.pathway_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Pathway cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Pathway ID must be a positive whole number.");
            }
        }

        if (shouldCheck('enrollment_year')) {
            const val = data.enrollment_year;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Enrollment year cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Enrollment year must be a valid year (between 2000 - 2099).");
            } else if (parseInt(val) < 2000 || parseInt(val) > 2099) {
                errors.push("Enrollment year must be a valid year (between 2000 - 2099).");
            }
        } // could adjust year range in future if app were to be used beyond this. Just didn't want to confuse between 2022 and 2122 for example.

        if (shouldCheck('address')) {
            const val = data.address;
            if (val && val.trim() !== "") {
                if (!isNaN(val)) {
                    errors.push("Address must not be purely numeric.");
                }
            }
        }

        if (shouldCheck('primary_email')) {
            const val = data.primary_email;
            if (val && val.trim() !== "") {
                if (!isNaN(val)) {
                    errors.push("Primary email must not be purely numeric.");
                }
            }
        }

        if (shouldCheck('secondary_email')) {
            const val = data.secondary_email;
            if (val && val.trim() !== "") {
                if (!isNaN(val)) {
                    errors.push("Secondary email must not be purely numeric.");
                }
            }
        }

        if (shouldCheck('primary_phone')) {
            const val = data.primary_phone;
            if (val && val.trim() !== "") {
                if (!phonePattern.test(val)) {
                    errors.push("Primary phone must be a valid phone number (digits, spaces, +, -, () only).");
                }
                if (val.length < 7) {
                    errors.push("Primary phone number must be at least 7 digits long.");
                }
                if (val.length > 20) {
                    errors.push("Primary phone number must be less than 20 characters long.");
                }
            }
        }

        return errors;

    }

    // GET all students - /student
    router.get("/", async (req, res) => {
        const allStudentsSQL = `SELECT * FROM student`;

        try {
            const [rows] = await db.promise().query(allStudentsSQL);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'No students found' });
            } else {
                res.json(rows);
            }
        } catch (err) {
            res.status(500).json({ error: 'Failed to connect to database' });
        }

    });

    // Get All Students with Related foreign key data(JOIN Query)
    router.get("/details", async (req, res) => {
        const allStudentsDetailsSQL = `
            SELECT 
                s.*,
                p.name AS pathway_name,
                ss.name AS study_status,
                entry_level.name AS entry_level,
                current_level.name AS current_level
            FROM student s
            INNER JOIN pathway p ON s.pathway_id = p.id
            INNER JOIN study_status ss ON s.study_status_id = ss.id
            INNER JOIN level entry_level ON s.entry_level_id = entry_level.id
            INNER JOIN level current_level ON s.current_level_id = current_level.id`;

        try {
            const [rows] = await db.promise().query(allStudentsDetailsSQL);
            res.json(rows);
        } catch (err) {
            console.error("Database error", err);
            res.status(500).json({ error: "Failed to fetch student details" });
        }
    });

    // GET student by ID - /student/:id
    // This route should return a single student by ID
    router.get("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        const studentByIdSQL = `SELECT * FROM student WHERE id = ?`;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(studentByIdSQL, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Student not found' })
            } else {
                res.json(rows[0]);
            }
        } catch (err) {
            console.error("Database error", err);
            res.status(500).json({ error: "Failed to fetch student details" });
        }

    });

    // GET student details by ID
    router.get("/details/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        const allStudentsDetailsSQL = `
            SELECT 
                s.*,
                p.name AS pathway_name,
                ss.name AS study_status,
                entry_level.name AS entry_level,
                current_level.name AS current_level
            FROM student s
            INNER JOIN pathway p ON s.pathway_id = p.id
            INNER JOIN study_status ss ON s.study_status_id = ss.id
            INNER JOIN level entry_level ON s.entry_level_id = entry_level.id
            INNER JOIN level current_level ON s.current_level_id = current_level.id
            WHERE s.id = ?
            `;

        try {
            const [rows] = await db.promise().query(allStudentsDetailsSQL, [id]);
            res.json(rows[0]);
        } catch (err) {
            console.error("Database error", err);
            res.status(500).json({ error: "Failed to fetch student details" });
        }
    });

    // POST a new student - /student
    router.post("/", async (req, res) => {

        const { pathway_id, first_name, last_name, study_status_id, current_level_id, entry_level_id, enrollment_year,
            address, primary_email, secondary_email, primary_phone
        } = req.body;

        // const parsedUserId = user_id && user_id.trim() !== '' ? parseInt(user_id) : null; // Check if user_id is provided and set to null if empty (also checks for whitespace entries using .trim)

        // Validation function to validate input data - mirrors client-side validation for extra layer of security
        const validationErrors = validateStudentFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        // Wrapping the multiple SQL inserts in a transaction - ensures if one part of insert fails, the whole block rolls back - so no case of a student but no corresponding user (or vice versa)
        const connection = await localDb.getConnection();

        try {

            await connection.beginTransaction();

            const insertStudentSQL = `INSERT INTO student (student_number, pathway_id, first_name, last_name, study_status_id, current_level_id, entry_level_id, enrollment_year,
            address, primary_email, secondary_email, primary_phone) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            //Insert into student with placeholder student_number before updating after concatenation to get student_number
            const placeholderNumber = 'PENDING';
            const [result] = await connection.query(insertStudentSQL, [
                placeholderNumber,
                parseInt(pathway_id),
                first_name.trim(),
                last_name.trim(),
                parseInt(study_status_id),
                parseInt(current_level_id),
                parseInt(entry_level_id),
                parseInt(enrollment_year),
                address?.trim() || null,
                primary_email?.trim() || null,
                secondary_email?.trim() || null,
                primary_phone?.trim() || null
            ]);

            // Get pathway code
            const [pathwayRows] = await connection.query(`SELECT code FROM pathway WHERE id = ?`, [pathway_id]);
            if (pathwayRows.length === 0) {
                return res.status(400).json({ error: "Invalid pathway ID" });
            }
            const pathwayCode = pathwayRows[0].code;

            // Get students auto incremented ID as the number at end of studnet_number
            const studentId = result.insertId;
            const paddedSequence = String(studentId).padStart(7, "0");
            const yearNum = String(enrollment_year).slice(-2);

            const studentNumber = `${yearNum}-${pathwayCode}-${paddedSequence}`;


            // Ensure student number is unique
            const [existingStudentNumber] = await connection.query(`SELECT * FROM student WHERE student_number = ?`, [studentNumber]
            );

            if (existingStudentNumber.length > 0) {
                return res.status(409).json({ error: 'Student Number already exists' });
            }

            // Update student number using new concatenated student_number
            await connection.query(
                `UPDATE student SET student_number = ? WHERE id = ?`,
                [studentNumber, studentId]
            );

            // Generate student username from last digits of student number
            const username = paddedSequence;

            // Hash a raw password
            const rawPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            // Insert user record
            await connection.query(`
            INSERT INTO user (username, password, student_id, role)
            VALUES (?, ?, ?, 'student')`,
                [username, hashedPassword, studentId]);

            await connection.commit();

            return res.status(200).json({
                message: "Student and user created successfully",
                studentId,
                studentNumber,
                username,
                password: rawPassword, // show raw password in response so we know what it is before hashing
                first_name,
                last_name,
                pathway_id,
                study_status_id,
                entry_level_id,
                enrollment_year,
                address,
                primary_email,
                secondary_email,
                primary_phone
            });

        } catch (err) {
            await connection.rollback();
            console.error("Error during student POST", err);
            return res.status(500).json({ error: 'Server error: ', details: err.message });
        } finally {
            connection.release();
        }
    });

    // PUT (Update) a student by ID - /student/:id
    router.put("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        const { pathway_id, enrollment_year } = req.body;

        const validationErrors = validateStudentFields(req.body, { isUpdate: true });
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {

            const [rows] = await db.promise().query(`SELECT * FROM student WHERE id = ?`, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Student not found." });
            }

            const existingStudent = rows[0];

            const { getUpdatedFields } = require("../utils/comparisonHelpers");

            const fieldsToCheck = [
                "student_number", "pathway_id", "first_name", "last_name", "study_status_id", "current_level_id", "entry_level_id", "enrollment_year",
                "address", "primary_email", "secondary_email", "primary_phone"
            ];

            const { updateFields, updateValues } = getUpdatedFields(req.body, existingStudent, fieldsToCheck);

            let newStudentNumber = existingStudent.student_number;
            const isPathwayOrYearChanged = updateFields.includes("pathway_id = ?") || updateFields.includes("enrollment_year = ?");

            if (isPathwayOrYearChanged) {
                const pathwayId = pathway_id ? parseInt(pathway_id) : existingStudent.pathway_id;
                const year = enrollment_year ? String(enrollment_year) : String(existingStudent.enrollment_year);
                const yearPart = year.slice(-2);

                const [pathwayRows] = await db.promise().query(`SELECT code FROM pathway WHERE id = ?`, [pathwayId]);
                if (pathwayRows.length === 0) {
                    return res.status(400).json({ error: "Invalid pathway ID" });
                }
                const pathwayCode = pathwayRows[0].code;

                // Reuse the existing sequence part from current student number
                const sequencePart = existingStudent.student_number.split("-")[2];
                const generatedStudentNumber = `${yearPart}-${pathwayCode}-${sequencePart}`;

                if (generatedStudentNumber !== existingStudent.student_number) {
                    // Check for uniqueness
                    const [conflicts] = await db.promise().query(
                        `SELECT id FROM student WHERE student_number = ? AND id != ?`,
                        [generatedStudentNumber, id]
                    );
                    if (conflicts.length > 0) {
                        return res.status(409).json({ error: "Another student with the same student number already exists." });
                    }

                    newStudentNumber = generatedStudentNumber;
                    updateFields.push("student_number = ?");
                    updateValues.push(newStudentNumber);
                }
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No changes detected. Student data is identical' });
            }

            updateValues.push(id); // for WHERE clause

            if (updateFields.length > 0) {
                const updateSQL = `UPDATE student SET ${updateFields.join(", ")} WHERE id = ?`;
                await db.promise().query(updateSQL, updateValues);
            }

            res.status(200).json({ message: "Student updated successfully." });


        } catch (err) {
            console.error("Error updating student:", err);
            res.status(500).json({ error: "Server error", details: err.message });
        }

    });


    // DELETE a student by ID - /student/:id
    // This route should delete a student based on their ID
    router.delete("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        const connection = await localDb.getConnection();

        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(`DELETE FROM user WHERE student_id = ?`, [id]);

            const [studentResult] = await connection.query(`DELETE FROM student WHERE id = ?`, [id]);

            if (studentResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Student not found' });
            }

            await connection.commit();

            return res.status(200).json({
                message: "Student and associated user deleted successfully",
                studentId: id
            });

        } catch (err) {
            console.error("Failed to delete student", err);
            return res.status(500).json({ error: 'Failed to delete student', details: err.message });
        } finally {
            connection.release();

        }
    });

    // GETs a student details based on their user id - used primarily for populating student-side views once a student user logs in - user their id from the session
    router.get("/by-user/:user_id", async (req, res) => {
        const userId = parseInt(req.params.user_id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        try {
            const [rows] = await db.promise().query(`
                SELECT 
                s.*, 
                p.name AS pathway_name, 
                ss.name AS study_status, 
                entry_level.name AS entry_level,
                current_level.name AS current_level
            FROM user u
            JOIN student s ON u.student_id = s.id
            JOIN pathway p ON s.pathway_id = p.id
            JOIN study_status ss ON s.study_status_id = ss.id
            JOIN level entry_level ON s.entry_level_id = entry_level.id
            JOIN level current_level ON s.current_level_id = current_level.id
            WHERE u.id = ?
              `, [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Student not found for this user' });
            }

            res.json(rows[0]);

        } catch (err) {
            console.error("Database error", err);
            res.status(500).json({ error: "Failed to fetch student by user ID" });
        }
    });

    // GET available modules for a student based on pathway and level
    router.get('/:id/available-modules', async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }

        try {
            // Get the students pathway and current level
            const [studentRows] = await db.promise().query(`
            SELECT 
                s.id,
                s.student_number,
                s.first_name,
                s.last_name,
                s.pathway_id,
                p.name AS pathway_name,
                s.current_level_id,
                l.name AS current_level_name
            FROM student s
            JOIN pathway p ON s.pathway_id = p.id
            JOIN level l ON s.current_level_id = l.id
            WHERE s.id = ?
                `, [id]);

            if (studentRows.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const { pathway_id, current_level_id } = studentRows[0];

            // Get core and non-core modules for that pathway and level
            const [moduleRows] = await db.promise().query(`
                    SELECT 
                        m.id, m.module_code, m.title, m.credits, m.semester_id AS semester_id,
                        s.name AS semester_name, pm.core, pm.optional_core, pm.optional_amount
                    FROM module m
                    INNER JOIN pathway_module pm ON m.id = pm.module_id
                    INNER JOIN semester s ON m.semester_id = s.id
                    WHERE pm.pathway_id = ? AND pm.pathway_level = ?
                    ORDER BY pm.core DESC, m.semester_id ASC, m.title ASC
                `, [pathway_id, current_level_id]);

            // Organise results by core modules (including EITHER OR) and non-core modules
            const coreModules = [];
            const optionalCoreGroups = {};
            const nonCoreModules = [];

            for (const module of moduleRows) {
                if (module.core === 1) {
                    if (module.optional_core === 1) {
                        // Group by optional_amount - ok for now as we only have 1 EITHER OR scenario - but consider grouping these modules better, e.g. 'A', 'B' - to identify EITHER OR modules in same group
                        const groupKey = `group_${module.optional_amount || '1'}`;
                        if (!optionalCoreGroups[groupKey]) {
                            optionalCoreGroups[groupKey] = [];
                        }
                        optionalCoreGroups[groupKey].push(module);
                    } else {
                        coreModules.push(module);
                    }
                } else {
                    nonCoreModules.push(module);
                }
            }

            return res.status(200).json({
                studentId: id,
                ...studentRows[0],
                pathway_id,
                current_level_id,
                coreModules,
                optionalCoreGroups,
                availableModules: nonCoreModules
            });

        } catch (err) {
            console.error("Failed to fetch available modules", err);
            res.status(500).json({ error: "Failed to fetch available modules" });
        }
    });


    // POST route for enrolling a student in modules - insert into the student_module join table in DB
    router.post("/:id/enroll", async (req, res) => {
        const studentId = parseInt(req.params.id);
        const { modules, acad_yr_id } = req.body;

        if (!Array.isArray(modules) || modules.length === 0) {
            return res.status(400).json({ error: "No modules provided." });
        }

        try {

            // VALUES ? - used once to represent multiple row inserts 
            const insertSQL = `
                INSERT INTO student_module (student_id, module_id, is_repeat, academic_year_id)
                VALUES ?
            `;
            const values = modules.map(mod => [studentId, mod.module_id, 0, acad_yr_id]);

            const moduleIds = modules.map(mod => mod.module_id);
            const placeholders = moduleIds.map(() => '?').join(',');

            const [existing] = await db.promise().query(`
                            SELECT sm.module_id, m.module_code, m.title
                            FROM student_module sm
                            JOIN module m ON sm.module_id = m.id
                            WHERE sm.student_id = ? AND sm.academic_year_id = ? AND sm.module_id IN (${placeholders})
                            `, [studentId, acad_yr_id, ...moduleIds]);

            if (existing.length > 0) {
                const duplicateModules = existing.map(row => `• ${row.module_code} - ${row.title}`).join('\n');
                return res.status(409).json({
                    error: `This student is already enrolled in the following module(s) for that academic year:\n${duplicateModules}`
                });
            }

            const [enrolledModules] = await db.promise().query(insertSQL, [values]);

            return res.status(200).json({
                message: "Modules enrolled successfully.",
                enrolled_modules: enrolledModules,
            });
        } catch (err) {
            console.error("Database error during enrollment:", err);
            return res.status(500).json({ error: "Failed to enroll modules." });
        }
    });


    return router;
};