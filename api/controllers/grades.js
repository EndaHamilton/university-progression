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

module.exports = function (db) {

    //GET all grades for a specific student
    router.get('/student/:studentId', async (req, res) => {
        const studentId = parseInt(req.params.studentId);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(`
                SELECT 
                    sm.id,
                    m.title AS module_title,
                    m.module_code,
                    m.credits,
                    ay.name AS academic_year,
                    sm.academic_year_id,
                    sm.first_grade,
                    sm.grade_result,
                    sm.resit_grade,
                    sm.resit_result,
                    s.id AS semester_id,
                    s.name AS semester_name
                FROM student_module sm
                JOIN module m ON sm.module_id = m.id
                JOIN acad_year ay ON sm.academic_year_id = ay.id
                JOIN semester s ON m.semester_id = s.id
                WHERE sm.student_id = ?
                ORDER BY ay.name DESC, s.id ASC, m.module_code ASC
            `, [studentId]);

            // Group by academic_year
            const groupedByYear = {};
            rows.forEach(row => {
                if (!groupedByYear[row.academic_year]) {
                    groupedByYear[row.academic_year] = [];
                }
                groupedByYear[row.academic_year].push(row);
            });

            return res.status(200).json(groupedByYear);
        } catch (err) {
            console.error("Error fetching grades for student:", err);
            return res.status(500).json({ error: "Failed to fetch student grades" });
        }
    });

    //GET all grades for a specific module
    router.get('/module/:moduleId', async (req, res) => {
        const moduleId = parseInt(req.params.moduleId);
        if (isNaN(moduleId)) {
            return res.status(400).json({ error: 'Invalid module ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(`
                    SELECT 
                        sm.id,
                s.first_name,
                s.last_name,
                s.student_number,
                ay.name AS academic_year,
                sm.first_grade,
                sm.grade_result,
                sm.resit_grade,
                sm.resit_result
            FROM student_module sm
            JOIN student s ON sm.student_id = s.id
            JOIN acad_year ay ON sm.academic_year_id = ay.id
            WHERE sm.module_id = ?
            ORDER BY ay.name DESC, s.last_name
                `, [moduleId]);

            // Group by academic_year
            const groupedByYear = {};
            rows.forEach(row => {
                if (!groupedByYear[row.academic_year]) {
                    groupedByYear[row.academic_year] = [];
                }
                groupedByYear[row.academic_year].push(row);
            });

            return res.status(200).json(groupedByYear);
        } catch (err) {
            console.error("Error fetching grades for module:", err);
            return res.status(500).json({ error: "Failed to fetch module grades" });
        }
    });

    // GET: All grades grouped by student
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
        SELECT 
        sm.id AS id,
        s.id AS student_id,
        s.student_number,
        s.first_name,
        s.last_name,
        m.title AS module_title,
        ay.name AS academic_year,
        sm.first_grade,
        sm.grade_result,
        sm.resit_grade,
        sm.resit_result
      FROM student_module sm
      JOIN student s ON sm.student_id = s.id
      JOIN module m ON sm.module_id = m.id
      JOIN acad_year ay ON sm.academic_year_id = ay.id
      ORDER BY s.last_name, ay.name
      `);

            // Group results by student
            const grouped = {};
            rows.forEach(row => {
                if (!grouped[row.student_id]) {
                    grouped[row.student_id] = {
                        student_id: row.student_id,
                        student_number: row.student_number,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        grades: []
                    };
                }
                grouped[row.student_id].grades.push({
                    id: row.id,
                    module_title: row.module_title,
                    academic_year: row.academic_year,
                    first_grade: row.first_grade,
                    grade_result: row.grade_result,
                    resit_grade: row.resit_grade,
                    resit_result: row.resit_result
                });
            });

            res.json(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching grades:', error);
            res.status(500).json({ message: 'Failed to retrieve grades' });
        }
    });

    // GET: All grades grouped by module
    router.get('/by-module', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
            SELECT 
                sm.id AS id,
                m.id AS module_id,
                m.title AS module_title,
                m.module_code,
                s.id AS student_id,
                s.student_number,
                s.first_name,
                s.last_name,
                ay.name AS academic_year,
                sm.first_grade,
                sm.grade_result,
                sm.resit_grade,
                sm.resit_result
            FROM student_module sm
            JOIN module m ON sm.module_id = m.id
            JOIN student s ON sm.student_id = s.id
            JOIN acad_year ay ON sm.academic_year_id = ay.id
            ORDER BY m.id, ay.name;
             `);

            // Group by module_id
            const grouped = {};

            rows.forEach(row => {
                if (!grouped[row.module_id]) {
                    grouped[row.module_id] = {
                        module_id: row.module_id,
                        module_title: row.module_title,
                        module_code: row.module_code,
                        students: []
                    };
                }

                grouped[row.module_id].students.push({
                    id: row.id,
                    student_id: row.student_id,
                    student_number: row.student_number,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    academic_year: row.academic_year,
                    first_grade: row.first_grade,
                    grade_result: row.grade_result,
                    resit_grade: row.resit_grade,
                    resit_result: row.resit_result
                });
            });

            res.json(Object.values(grouped));
        } catch (error) {
            console.error("Error fetching grades by module: ", error);
            res.status(500).json({ message: 'Failed to retrieve grades' });
        }

    });

    // GET a single grade by ID - /grades/:id
    router.get("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ID. Must be a number." });
        }

        try {
            const [rows] = await db.promise().query(
                `SELECT * FROM student_module WHERE id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Grade not found." });
            }

            res.status(200).json(rows[0]);
        } catch (err) {
            console.error("Error fetching grade by ID:", err);
            res.status(500).json({ error: "Failed to fetch grade", details: err.message });
        }
    });

    function validateGradeFields(data, { isUpdate = false } = {}) {
        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
        const shouldCheck = (field) => !isUpdate || field in data;
        const isValidResult = (val) => ['pass', 'fail', 'pass capped', 'excused', 'absent'].includes((val || '').toLowerCase());


        if (shouldCheck('student_id')) {
            const val = data.student_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Student ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Student ID must be a whole positive number.");
            }
        }

        if (shouldCheck('module_id')) {
            const val = data.module_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Module ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Module ID must be a whole positive number.");
            }
        }

        if (shouldCheck('academic_year_id')) {
            const val = data.academic_year_id;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Academic Year ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Academic Year ID must be a whole positive number.");
            }
        }

        // if (shouldCheck('entry_level_id')) {
        //     const val = data.entry_level_id;
        //     const valStr = String(val);
        //     if (!val || valStr.trim() === "") {
        //         errors.push("Entry Level ID cannot be empty.");
        //     } else if (!isPositiveInteger(val)) {
        //         errors.push("Entry Level ID must be a whole positive number.");
        //     }
        // }

        // if (shouldCheck('study_status_id')) {
        //     const val = data.study_status_id;
        //     const valStr = String(val);
        //     if (!val || valStr.trim() === "") {
        //         errors.push("Study Status ID cannot be empty.");
        //     } else if (!isPositiveInteger(val)) {
        //         errors.push("Study Status ID must be a whole positive number.");
        //     }
        // }

        if (shouldCheck('first_grade')) {
            const val = data.first_grade;
            const valStr = String(val);
            const result = (data.grade_result || "").trim().toLowerCase();
            if ((!val || valStr.trim() === "") && result !== "excused") {
                errors.push("First grade cannot be empty unless result is 'excused'.");
            } else if (val < 0 || val > 100) {
                errors.push("First grade must be must be a whole positive number between 0 - 100.");
            }
        }

        if (shouldCheck('grade_result')) {
            const val = data.grade_result;
            if (!val || val.trim() === "") {
                errors.push("First grade result cannot be empty.");
            } else if (!isValidResult(val)) {
                errors.push("Invalid first grade result.")
            }
        }

        if (shouldCheck('resit_grade')) {
            const val = data.resit_grade;
            if (val < 0 || val > 100) {
                errors.push("Resit grade must be must be a whole positive number between 0 - 100.");
            }
        }

        if (shouldCheck('resit_result')) {
            const val = data.resit_result;
            if (val && !isValidResult(val)) {
                errors.push("Invalid resit grade result.")
            }
        }

        return errors;


    }

    // Utility function to check if an ID exists in a table
    async function checkIfExists(db, table, id) {
        const [rows] = await db.promise().query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
        return rows.length > 0;
    }


    //POST a new Student Grade - /grades
    router.post("/", async (req, res) => {
        const {
            student_id,
            module_id,
            academic_year_id,
            first_grade,
            grade_result,
            resit_grade,
            resit_result
        } = req.body;

        // Validate the request body
        const validationErrors = validateGradeFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {

            // Foreign key existence checks
            const checks = await Promise.all([
                checkIfExists(db, 'student', student_id),
                checkIfExists(db, 'module', module_id),
                checkIfExists(db, 'acad_year', academic_year_id),
            ]);

            const [studentExists, moduleExists, yearExists] = checks;

            if (!studentExists) return res.status(400).json({ error: "Student does not exist." });
            if (!moduleExists) return res.status(400).json({ error: "Module does not exist." });
            if (!yearExists) return res.status(400).json({ error: "Academic year does not exist." });


            // Check for duplicate: same student + module + academic year
            const [existing] = await db.promise().query(`
                SELECT * FROM student_module 
                WHERE student_id = ? AND module_id = ? AND academic_year_id = ?
            `, [student_id, module_id, academic_year_id]);

            if (existing.length > 0) {
                return res.status(409).json({ error: "This student already has a grade for that module during that academic year." });
            }

            // Insert into student_module
            const [result] = await db.promise().query(`
                INSERT INTO student_module (
                    student_id, module_id, academic_year_id,
                    first_grade, grade_result,
                    resit_grade, resit_result
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                parseInt(student_id),
                parseInt(module_id),
                parseInt(academic_year_id),
                parseInt(first_grade),
                grade_result.toLowerCase(),
                resit_grade ? parseInt(resit_grade) : null,
                resit_result ? resit_result.toLowerCase() : null,
            ]);

            res.status(200).json({ message: "Grade added successfully!", insertId: result.insertId });

        } catch (err) {
            console.error("Error adding grade:", err);
            res.status(500).json({ error: "Server error", details: err.message });
        }

    });

    // PUT - Update a grade - /grades/:id
    router.put("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ID. Must be a number." });
        }

        const {
            student_id,
            module_id,
            academic_year_id,
            current_level_id,
            study_status_id,
            first_grade,
            grade_result,
            resit_grade,
            resit_result
        } = req.body;

        // Validate fields
        const validationErrors = validateGradeFields(req.body, { isUpdate: true });
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {
            // Check if grade record exists
            const [existingRows] = await db.promise().query(`SELECT * FROM student_module WHERE id = ?`, [id]);
            if (existingRows.length === 0) {
                return res.status(404).json({ error: "Grade record not found." });
            }

            const existing = existingRows[0];


            // Check for duplicates if student/module/year combo is being updated
            if (
                student_id && module_id && academic_year_id &&
                (
                    parseInt(existing.student_id) !== parseInt(student_id) ||
                    parseInt(existing.module_id) !== parseInt(module_id) ||
                    parseInt(existing.academic_year_id) !== parseInt(academic_year_id)
                )
            ) {
                const [conflicts] = await db.promise().query(`
                SELECT * FROM student_module 
                WHERE student_id = ? AND module_id = ? AND academic_year_id = ? AND id != ?
            `, [student_id, module_id, academic_year_id, id]);

                if (conflicts.length > 0) {
                    return res.status(409).json({ error: "Another grade entry exists for that student, module, and academic year." });
                }
            }

            const { getUpdatedFields } = require("../utils/comparisonHelpers");

            const fieldsToCheck = [
                "student_id", "module_id", "academic_year_id", "first_grade", "grade_result", "resit_grade", "resit_result"
            ];

            const { updateFields, updateValues } = getUpdatedFields(req.body, existing, fieldsToCheck);

            if (updateFields.length === 0) {
                return res.status(400).json({ error: "No changes detected. Student grade data is identical." });
            }

            updateValues.push(id); // for WHERE clause

            if (updateFields.length > 0) {
                const updateSQL = `UPDATE student_module SET ${updateFields.join(", ")} WHERE id = ?`;
                await db.promise().query(updateSQL, updateValues);
            }

            res.status(200).json({ message: "Grade updated successfully!" });

        } catch (err) {
            console.error("Error updating grade:", err);
            res.status(500).json({ error: "Server error", details: err.message });
        }
    });

    // DELETE - Delete a student grade - /grades/:id
    // This route should delete a grade from the database based on student_module id
    router.delete("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ID. Must be a number." });
        }

        try {
            const [result] = await db.promise().query(`DELETE FROM student_module WHERE id = ?`, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Grade not found." });
            }

            res.status(200).json({ message: "Grade deleted successfully.", moduleId: id });
        } catch (err) {
            console.error("Error deleting grade:", err);
            res.status(500).json({ error: "Failed to delete grade.", details: err.message });
        }
    });

    // Helper function - used across diff routes
    async function calculateAverageGrade(studentId, acadYearId) {
        const [rows] = await db.promise().query(`
        SELECT 
              ROUND(AVG(
                CASE 
                  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'excused' THEN NULL
    			  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'pass' THEN sm.resit_grade
    			  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'pass capped' THEN 40
                  WHEN sm.grade_result = 'pass' THEN sm.first_grade
                  WHEN sm.resit_result = 'pass' THEN sm.resit_grade
                  WHEN sm.resit_result = 'pass capped' THEN 40
                  WHEN sm.grade_result = 'fail' AND sm.resit_result = 'fail' AND sm.resit_grade > sm.first_grade THEN sm.resit_grade
                  WHEN sm.grade_result = 'fail' AND sm.resit_result = 'fail' AND sm.first_grade > sm.resit_grade THEN sm.first_grade
                  WHEN sm.grade_result = 'absent' THEN 0
                  ELSE
                    CASE 
                      WHEN sm.resit_grade IS NOT NULL THEN sm.resit_grade
                      ELSE sm.first_grade
                    END
                END
              ), 2) AS average_grade
            FROM student_module sm
            JOIN module m ON sm.module_id = m.id
            WHERE sm.student_id = ? AND sm.academic_year_id = ?
        `, [studentId, acadYearId]);

        return rows[0]?.average_grade || 0;
    }


    // GET: Accurate grade summary (credits + average) for a student
    router.get('/summary/:studentId', async (req, res) => {
        const studentId = parseInt(req.params.studentId);
        const acadYearId = parseInt(req.query.academic_year_id);

        if (isNaN(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }
        if (isNaN(acadYearId)) {
            return res.status(400).json({ error: 'Invalid academic year ID. Must be a number' });
        }



        try {

            let calculationQuery = `
            SELECT 
              SUM(
                CASE 
                  WHEN sm.grade_result = 'pass' THEN m.credits
                  WHEN sm.grade_result != 'pass' 
                       AND sm.resit_result IN ('pass', 'pass capped') THEN m.credits
                  ELSE 0
                END
              ) AS total_credits_achieved,

              ROUND(AVG(
                CASE 
                  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'excused' THEN NULL
    			  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'pass' THEN sm.resit_grade
    			  WHEN sm.grade_result = 'excused' AND sm.resit_result = 'pass capped' THEN 40
                  WHEN sm.grade_result = 'pass' THEN sm.first_grade
                  WHEN sm.resit_result = 'pass' THEN sm.resit_grade
                  WHEN sm.resit_result = 'pass capped' THEN 40
                  WHEN sm.grade_result = 'fail' AND sm.resit_result = 'fail' AND sm.resit_grade > sm.first_grade THEN sm.resit_grade
                  WHEN sm.grade_result = 'fail' AND sm.resit_result = 'fail' AND sm.first_grade > sm.resit_grade THEN sm.first_grade
                  WHEN sm.grade_result = 'absent' THEN 0
                  ELSE
                    CASE 
                      WHEN sm.resit_grade IS NOT NULL THEN sm.resit_grade
                      ELSE sm.first_grade
                    END
                END
              ), 2) AS average_grade
            FROM student_module sm
            JOIN module m ON sm.module_id = m.id
            WHERE sm.student_id = ?
            `;

            const queryParams = [studentId]

            calculationQuery += ` AND sm.academic_year_id = ?`;
            queryParams.push(acadYearId);

            const [rows] = await db.promise().query(calculationQuery, queryParams);

            return res.status(200).json(rows[0]);
        } catch (err) {
            console.error("Error calculating student grade summary:", err);
            return res.status(500).json({ error: "Failed to calculate student grade summary" });
        }
    });

    // GET: Calculate automatic progression outcome for a student
    router.get('/progression/:studentId/:acadYearId', async (req, res) => {
        const studentId = parseInt(req.params.studentId);
        const acadYearId = parseInt(req.params.acadYearId);

        if (isNaN(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }
        if (isNaN(acadYearId)) {
            return res.status(400).json({ error: 'Invalid academic year ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(`
            SELECT 
                sm.first_grade,
                sm.grade_result,
                sm.resit_grade,
                sm.resit_result,
                sm.academic_year_id,
                m.credits,
                m.module_code,
                m.title,
                pm.pathway_level,
                pm.core,
                current_level.name AS current_level,
                s.entry_level_id
            FROM student_module sm
            JOIN module m ON sm.module_id = m.id
            JOIN student s ON sm.student_id = s.id
            JOIN level current_level ON s.current_level_id = current_level.id
            JOIN pathway_module pm ON pm.module_id = m.id AND pm.pathway_id = s.pathway_id
            WHERE sm.student_id = ?
            `, [studentId]);

            if (rows.length === 0) {
                return res.status(404).json({ error: "No module records found for this student." });
            }

            // Get student's current level
            const currentLevel = parseInt(rows[0].current_level);
            const entryLevel = parseInt(rows[0].entry_level_id);

            let level1CreditsPassed = 0;
            let level2CreditsPassed = 0;

            let level1CreditsAttempted = 0;
            let level2CreditsAttempted = 0;



            let failedCoreModules = [];
            let outstandingFails = [];
            let modulesNeedingResit = [];
            let modulesNeedingReenrollment = [];

            // let totalCreditsAttempted = 0;
            // let totalCreditsPassed = 0;

            // let level1CreditsPassed = 0;

            // let level2CreditsPassed = 0;

            // let failedCoreModules = [];
            // let outstandingFails = [];

            // let modulesNeedingResit = [];
            // let modulesNeedingReenrollment = [];

            for (const module of rows) {
                const isCurrentYear = module.academic_year_id === acadYearId;
                const moduleLevel = module.pathway_level;

                // Always count total attempted credits when enrolled
                if (moduleLevel === 1) {
                    level1CreditsAttempted += module.credits;
                } else if (isCurrentYear && moduleLevel === 2) {
                    level2CreditsAttempted += module.credits;
                }

                // totalCreditsAttempted += module.credits;

                // Skip any modules that haven't been attempted yet
                const hasAttempted = module.grade_result !== null || module.resit_result !== null;
                if (!hasAttempted) continue;

                let passed = false;
                if (module.grade_result === 'pass') {
                    passed = true;
                } else if (module.resit_result === 'pass' || module.resit_result === 'pass capped') {
                    passed = true;
                }

                if (passed) {
                    // totalCreditsPassed += module.credits;

                    if (moduleLevel === 1) {
                        // level1CreditsAttempted += module.credits;
                        level1CreditsPassed += module.credits;
                    } else if (isCurrentYear && moduleLevel === 2) {
                        // level2CreditsAttempted += module.credits;
                        level2CreditsPassed += module.credits;
                    }
                } else {
                    if (isCurrentYear) {
                        if (moduleLevel.core) {
                            failedCoreModules.push(module);
                        } else {
                            outstandingFails.push(module);
                        }

                        if (!module.resit_result) {
                            modulesNeedingResit.push(module);
                        } else if (!['pass', 'pass capped'].includes(module.resit_result)) {
                            modulesNeedingReenrollment.push(module);
                        }
                    }
                }

                // else {
                //     if (moduleLevel === 1) {
                //         level1CreditsAttempted += module.credits;
                //     } else if (moduleLevel === 2) {
                //         level2CreditsAttempted += module.credits;
                //     }

                //     if (module.core) {
                //         failedCoreModules.push(module);
                //     } else {
                //         outstandingFails.push(module);
                //     }

                //     if (!module.resit_result) {
                //         modulesNeedingResit.push(module);
                //     } else if (!['pass', 'pass capped'].includes(module.resit_result)) {
                //         modulesNeedingReenrollment.push(module);
                //     }
                // }
            }

            let canProgress = false;
            let decisionReasons = [];

            if (currentLevel === 1) {
                if (level1CreditsPassed >= 100 && failedCoreModules.length === 0) {
                    canProgress = true;
                    decisionReasons.push("Enough level 1 credits and no failed core modules.");
                } else {
                    if (level1CreditsPassed < 100) {
                        decisionReasons.push("Insufficient level 1 credits.");
                    }
                    if (failedCoreModules.length > 0) {
                        decisionReasons.push("Failed core module(s).");
                    }
                }
            } else if (currentLevel === 2) {
                const meetsLevel1Requirement = (entryLevel === 2) || (level1CreditsPassed >= 120); // ignores level 1 req for entry level 2 students
                if (
                    meetsLevel1Requirement &&
                    level2CreditsPassed >= 120 &&
                    failedCoreModules.length === 0 &&
                    outstandingFails.length === 0
                ) {
                    canProgress = true;
                    decisionReasons.push("All required modules passed.");
                } else {
                    if (entryLevel === 1 && level1CreditsPassed <= 120) {
                        decisionReasons.push("Unresolved Level 1 module failures.");
                    }
                    if (level2CreditsPassed < 120) {
                        decisionReasons.push("Insufficient level 2 credits.");
                    }
                    if (failedCoreModules.length > 0) {
                        decisionReasons.push("Failed core module(s).");
                    }
                    if (outstandingFails.length > 0) {
                        decisionReasons.push("Outstanding failed modules.");
                    }
                }

                // if (level1CreditsPassed >= 120 && level2CreditsPassed >= 120 && failedCoreModules.length === 0 && outstandingFails.length === 0) {
                //     canProgress = true;
                //     decisionReasons.push("All modules from Level 1 and level 2 passed.");
                // } else {
                //     if (level1CreditsPassed < 120) {
                //         decisionReasons.push("Unresolved Level 1 module failures.");
                //     }
                //     if (level2CreditsPassed < 120) {
                //         decisionReasons.push("Insufficient level 2 credits.");
                //     }
                //     if (failedCoreModules.length > 0) {
                //         decisionReasons.push("Failed core module(s).");
                //     }
                //     if (outstandingFails.length > 0) {
                //         decisionReasons.push("Outstanding failed modules.");
                //     }
                // }
            }

            return res.status(200).json({
                student_id: studentId,
                acad_year_id: acadYearId,
                current_level: currentLevel,
                entry_level: entryLevel,
                // total_credits_attempted: totalCreditsAttempted,
                // total_credits_passed: totalCreditsPassed,
                level1_credits_attempted: level1CreditsAttempted,
                level1_credits_passed: level1CreditsPassed,
                level2_credits_attempted: level2CreditsAttempted,
                level2_credits_passed: level2CreditsPassed,
                failed_core_modules: failedCoreModules,
                modules_needing_resit: modulesNeedingResit,
                modules_needing_reenrollment: modulesNeedingReenrollment,
                outstanding_fails: outstandingFails,
                can_progress: canProgress,
                reason: decisionReasons
            });

        } catch (err) {
            console.error("Error calculating progression:", err);
            return res.status(500).json({ error: "Failed to calculate progression." });
        }
    });

    const validateProgressionPayload = require('../utils/validateProgressionPayload');

    // POST: Finalise progression for a student for an academic year
    router.post('/finalise-progression', validateProgressionPayload, async (req, res) => {
        const { student_id, academic_year_id, progression_result, mitigating_circumstances } = req.body;

        if (!student_id) {
            return res.status(400).json({ error: "Student ID required." });
        }
        if (!academic_year_id) {
            return res.status(400).json({ error: "Academic Year ID required." });
        }
        if (!progression_result) {
            return res.status(400).json({ error: "Progression result required." });
        }

        if (progression_result.trim().toLowerCase().includes('mitigating circumstances') && !mitigating_circumstances) {
            return res.status(400).json({ error: "Mitigating circumstances required for this progression" });
        }

        try {
            // Fetch required student info
            const [studentRows] = await db.promise().query(`
            SELECT pathway_id, current_level_id, entry_level_id, study_status_id
            FROM student
            WHERE id = ?
            `, [student_id]);

            if (studentRows.length === 0) {
                return res.status(404).json({ error: "Student not found." });
            }

            const student = studentRows[0];

            const overallGrade = await calculateAverageGrade(student_id, academic_year_id);

            // Check if a record already exists for that student and year
            const [historyRows] = await db.promise().query(`
            SELECT id FROM student_history
            WHERE student_id = ? AND acad_year_id = ?
            `, [student_id, academic_year_id]);

            if (historyRows.length > 0) {
                // Update existing record
                await db.promise().query(`
                UPDATE student_history
                SET progression_result = ?, mitigating_circumstances = ?
                WHERE id = ?
                `, [progression_result, mitigating_circumstances || null, historyRows[0].id]);

                return res.status(200).json({ message: "Progression record updated successfully." });
            } else {
                // Insert new record
                await db.promise().query(`
                INSERT INTO student_history
                    (student_id, acad_year_id, pathway_id, entry_level_id, study_status_id, current_level_id, overall_grade, progression_result, mitigating_circumstances)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    student_id,
                    academic_year_id,
                    student.pathway_id,
                    student.entry_level_id,
                    student.study_status_id,
                    student.current_level_id,
                    overallGrade,
                    progression_result,
                    mitigating_circumstances || null
                ]);

                // If student is progressing normally, update their current_level_id
                /* Not including progression with mitigation as there may be some manual review required
                or some checks by advisor of studies for example - dont want automatic adjustment */
                if (progression_result.trim().toLowerCase() === "progress to next level") {
                    await db.promise().query(`
                    UPDATE student
                    SET current_level_id = current_level_id + 1
                    WHERE id = ?
                    `, [student_id]);
                }


                return res.status(200).json({ message: "Progression record created successfully." });
            }


        } catch (error) {
            console.error("Error finalising progression:", error);
            return res.status(500).json({ error: "Failed to finalise progression." });
        }
    });

    // GET: Progression result for a student and academic year
    router.get('/progression-result/:studentId/:acadYearId', async (req, res) => {
        const studentId = parseInt(req.params.studentId);
        const acadYearId = parseInt(req.params.acadYearId);

        if (isNaN(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }
        if (isNaN(acadYearId)) {
            return res.status(400).json({ error: 'Invalid academic year ID. Must be a number' });
        }

        try {
            const [rows] = await db.promise().query(`
            SELECT progression_result 
            FROM student_history 
            WHERE student_id = ? AND acad_year_id = ?
            LIMIT 1
        `, [studentId, acadYearId]);

            if (rows.length === 0) {
                return res.status(200).json({ progression_result: null });
            }

            return res.status(200).json(rows[0]);
        } catch (err) {
            console.error("Error fetching progression result:", err);
            return res.status(500).json({ error: "Failed to fetch progression result" });
        }
    });

    // Helper function for parsing 0s and nulls from csv import for grade columns
    const parseNullableInt = val =>
        val !== '' && val !== null && val !== undefined ? parseInt(val) : null;


    //POST - import a csv of student grades
    router.post("/upload-csv", async (req, res) => {
        const rows = req.body;
        const insertedStudents = [];
        const skippedStudents = [];
        const insertedModules = [];
        const skippedModules = [];
        const insertedGrades = [];
        const skippedGrades = [];



        // console.log(rows);

        // Breaking up the file to save on db requests.

        // Create a students array and make it distinct.
        const students = rows.map(row => ({
            firstName: row.firstName,
            lastName: row.lastName,
            sId: row.sId,
            statusStudy: row.statusStudy,
            entryLevel: row.entryLevel
        }));

        const seenStudents = new Set();
        const uniqueStudents = students.filter(student => {
            const key = `${student.sId}`.toLowerCase();
            if (seenStudents.has(key)) return false;
            seenStudents.add(key);
            return true;
        });

        console.log('Students: ', uniqueStudents);

        // Create a modules array and make it distinct.
        const modules = rows.map(row => ({
            subjCode: String(row.subjCode).trim(),
            subjCatalog: String(row.subjCatalog).trim(),
            moduleTitle: String(row.moduleTitle).trim(),
            creditCount: parseInt(row.creditCount),
            semModule: String(row.semModule).trim()
        }));
        const seenModules = new Set();
        const uniqueModules = modules.filter(module => {
            const key = `${module.subjCode}|${module.subjCatalog}|${module.moduleTitle}`.toLowerCase();
            if (seenModules.has(key)) return false;
            seenModules.add(key);
            return true;
        });

        // Create a grades array and make it distinct.
        const grades = rows.map(row => ({
            sId: String(row.sId).trim(),
            acadYear: String(row.acad_Yr).trim().slice(-5),
            subjCode: String(row.subjCode).trim(),
            subjCatalog: String(row.subjCatalog).trim(),
            firstGrade: parseNullableInt(row.firstGrade),
            gradeResult: String(row.gradeResult).trim().toLowerCase() || null,
            resitGrade: parseNullableInt(row.resitGrade),
            resitResult: String(row.resitResult).trim().toLowerCase() || null,
            moduleTitle: String(row.moduleTitle).trim(),
        }));

        const seenGrades = new Set();
        const uniqueGrades = grades.filter(grade => {
            const key = `${grade.sId}|${grade.subjCode}|${grade.subjCatalog}|${grade.acadYear}|${grade.moduleTitle}`.toLowerCase();
            if (seenGrades.has(key)) return false;
            seenGrades.add(key);
            return true;
        });

        const conn = await localDb.getConnection();

        try {
            await conn.beginTransaction();

            // Create students & users if they do not exist.

            // Determine current level for each student based on subjCatalog
            const studentCurrentLevels = {};

            rows.forEach(row => {
                const sId = row.sId;
                const subjCatalog = String(row.subjCatalog).trim();

                if (!studentCurrentLevels[sId]) {
                    studentCurrentLevels[sId] = 'L1'; // Default
                }

                if (subjCatalog.startsWith('2')) {
                    studentCurrentLevels[sId] = 'L2'; // Change to L2 if any catalog starts with '2'
                }
            });


            for (const student of uniqueStudents) {
                // Check to see if student exists already
                const [existingStudents] = await conn.query('SELECT id FROM student WHERE student_number = ?', [student.sId]);


                // const parsedStudentNumber = student.sId.split('-');
                // const studentNumber = parsedStudentNumber[2];
                // console.log('Student Number: ', String(studentNumber).trim(), studentNumber.length);

                console.log('Checking for student number: ', student.sId);
                // If student does not exist then we must create.
                if (existingStudents.length === 0) {
                    const parsedStudentId = student.sId.split('-');

                    const enrollYear = parsedStudentId[0];
                    const pathway = parsedStudentId[1];



                    // Check if pathway exists and if not create. Then grab relevant id.
                    const [existingPathway] = await conn.query('SELECT id FROM pathway WHERE code = ?', [pathway]);
                    let pathwayId = 0;

                    if (existingPathway.length === 0) {
                        const [pathwayResult] = await conn.query(`INSERT INTO pathway (code) VALUES (?)`, [pathway]);
                        pathwayId = pathwayResult.insertId;
                    } else {
                        pathwayId = existingPathway[0].id;
                    }

                    // Check if studey status exists and if not create. Then grab relevant id.
                    // Can validate this also.
                    const [existingStudyStatus] = await conn.query('SELECT id FROM study_status WHERE name = ?', [student.statusStudy]);

                    const studyStatusId = existingStudyStatus[0].id;

                    // Parsing entry level
                    const entryLevelNumber = student.entryLevel.split('L')[1];
                    const entryLevel = '0' + entryLevelNumber;

                    // Should probably validate this also
                    const [existingEntryLevel] = await conn.query('SELECT id FROM level WHERE name = ?', [entryLevel]);
                    const entryLevelId = existingEntryLevel[0].id;

                    // Get current level string (L1 or L2) from earlier map
                    const currentLevel = studentCurrentLevels[student.sId] || 'L1'; // fallback
                    const currentLevelFormatted = '0' + currentLevel.split('L')[1];

                    // Lookup ID for current level
                    const [existingCurrentLevel] = await conn.query('SELECT id FROM level WHERE name = ?', [currentLevelFormatted]);
                    const currentLevelId = existingCurrentLevel[0].id;

                    // Concat enrollment year.
                    const enrollmentYear = `20` + enrollYear;

                    const [studentResult] = await conn.query(
                        `INSERT INTO student (student_number, pathway_id, first_name, last_name, study_status_id, entry_level_id, current_level_id, enrollment_year) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [student.sId.trim(), parseInt(pathwayId), student.firstName.trim(), student.lastName.trim(), parseInt(studyStatusId), parseInt(entryLevelId), parseInt(currentLevelId), enrollmentYear.trim()
                        ]);

                    const studentId = studentResult.insertId;

                    // Check if a user already exists for this student_id
                    const [existingUser] = await conn.query(
                        `SELECT id FROM user WHERE student_id = ?`,
                        [studentId]
                    );

                    if (existingUser.length === 0) {
                        const studentNumberUsername = String(parsedStudentId[2]).trim();

                        // Check if username already exists 
                        const [existingUsername] = await conn.query(
                            `SELECT id FROM user WHERE username = ?`,
                            [studentNumberUsername]
                        );

                        if (existingUsername.length === 0) {
                            // Generate and hash password
                            const rawPassword = Math.random().toString(36).slice(-8);
                            const hashedPassword = await bcrypt.hash(rawPassword, 10);

                            await conn.query(`
                                INSERT INTO user (username, password, student_id, role)
                                VALUES (?, ?, ?, 'student')`,
                                [studentNumberUsername, hashedPassword, studentId]
                            );

                            insertedStudents.push({
                                ...student,
                                student_Id: studentId,
                                username: studentNumberUsername,
                                password: rawPassword
                            });

                        } else if (existingUsername.length > 0) {
                            console.error(`Username ${studentNumberUsername} already exists, skipping user creation for studentId ${studentId}`)

                        }

                    } else if (existingUser.length > 0) {
                        console.error(`User already exists for studentId ${studentId}, skipping user creation.`);
                    }

                } else {
                    skippedStudents.push(student);
                    console.error(`Student ${student.sId} already exists, skipping.`);
                }
            }

            for (const module of uniqueModules) {

                const concatModuleCode = `${module.subjCode}${module.subjCatalog}`;

                //Check if module exists already (same module code and title)
                const [existingModules] = await conn.query('SELECT * FROM module WHERE module_code = ? AND title = ?',
                    [concatModuleCode, module.moduleTitle]);

                if (existingModules.length === 0) {

                    // Check if subject exists and if not create. Then grab relevant id.
                    const [existingSubject] = await conn.query('SELECT id FROM subject WHERE code = ?', [module.subjCode]);
                    let subjectId = 0;

                    if (existingSubject.length === 0) {
                        const [subjectResult] = await conn.query(`INSERT INTO subject (code) VALUES (?)`, [module.subjCode]);
                        subjectId = subjectResult.insertId;
                    } else {
                        subjectId = existingSubject[0].id;
                    }

                    // Check if semester exists and if not create. Then grab relevant id.
                    const [existingSemester] = await conn.query('SELECT id FROM semester WHERE name = ?', [module.semModule]);
                    let semesterId = 0;

                    if (existingSemester.length === 0) {
                        const [semesterResult] = await conn.query(`INSERT INTO semester (name) VALUES (?)`, [module.semModule]);
                        semesterId = semesterResult.insertId;
                    } else {
                        semesterId = existingSemester[0].id;
                    }

                    // Get default program / pathway level and subject module number
                    const defaultProgramLevel = module.subjCatalog[0];
                    const subjectModuleNumber = module.subjCatalog;

                    const [moduleResult] = await conn.query(`
                    INSERT INTO module(subject_id, default_program_level, title, subject_module_number, credits, semester_id, module_code)
                    VALUES(?, ?, ?, ?, ?, ?, ?)`,
                        [parseInt(subjectId), defaultProgramLevel.trim(), module.moduleTitle.trim(), subjectModuleNumber.trim(), parseInt(module.creditCount), parseInt(semesterId), concatModuleCode.trim()
                        ]);

                    insertedModules.push(module);


                } else {
                    skippedModules.push(module);
                    console.error(`Module ${concatModuleCode} ${module.moduleTitle} already exists, skipping.`);
                }
            }

            for (const grade of uniqueGrades) {

                // Check if student exists - not creating here as we will already have done so
                const [studentExists] = await conn.query('SELECT id FROM student WHERE student_number = ?', [grade.sId]);
                if (studentExists.length === 0) {
                    console.error(`Student ${grade.sId} does not exist, skipping grade.`);
                    continue;
                }
                const studentId = studentExists[0].id;

                // Check if module exists - not creating here as we will already have done so
                const concatModuleCode = `${grade.subjCode}${grade.subjCatalog}`;
                const [moduleExists] = await conn.query('SELECT id FROM module WHERE module_code = ? AND title = ?', [concatModuleCode, grade.moduleTitle]);
                if (moduleExists.length === 0) {
                    console.error(`Module ${concatModuleCode} ${grade.moduleTitle} does not exist, skipping grade.`);
                    continue;
                }
                const moduleId = moduleExists[0].id;

                const acadYearFormatted = `AY20${grade.acadYear}`;

                // Check if academic year exists - if it doesnt, create it.
                let academicYearId = 0;
                const [academicYearExists] = await conn.query('SELECT id FROM acad_year WHERE name = ?', [acadYearFormatted]);
                if (academicYearExists.length === 0) {
                    const [academicYearResult] = await conn.query(`INSERT INTO acad_year (name) VALUES (?)`, [acadYearFormatted]);
                    academicYearId = academicYearResult.insertId;
                } else {
                    academicYearId = academicYearExists[0].id;
                }

                // Check if student_module record exists
                const [existingGrades] = await conn.query(`
                    SELECT * FROM student_module 
                    WHERE student_id = ? AND module_id = ? AND academic_year_id = ?`,
                    [parseInt(studentId), parseInt(moduleId), parseInt(academicYearId)]);


                // If it doesn't exist, insert the new record
                if (existingGrades.length === 0) {
                    const [gradeResult] = await conn.query(`
                        INSERT INTO student_module 
                        (student_id, module_id, academic_year_id, first_grade, grade_result, resit_grade, resit_result) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            parseInt(studentId),
                            parseInt(moduleId),
                            parseInt(academicYearId),
                            parseNullableInt(grade.firstGrade),
                            grade.gradeResult ? grade.gradeResult.trim().toLowerCase() : null,
                            parseNullableInt(grade.resitGrade),
                            grade.resitResult ? grade.resitResult.trim().toLowerCase() : null
                        ]);

                    insertedGrades.push(grade);

                } else if (existingGrades.length > 0) {
                    console.error(`Student ${grade.sId} already has a grade for ${concatModuleCode} ${grade.moduleTitle} in ${acadYearFormatted}, skipping.`);
                    skippedGrades.push(grade);
                }

            }


            await conn.commit();
            res.json({
                success: true,
                insertedStudents: insertedStudents.length,
                skippedStudents: skippedStudents.length,
                insertedModules: insertedModules.length,
                skippedModules: skippedModules.length,
                insertedGrades: insertedGrades.length,
                skippedGrades: skippedGrades.length,
                skippedStudents,
                insertedStudents,
                insertedModules,
                skippedModules,
                insertedGrades,
                skippedGrades
            });

        } catch (err) {
            await conn.rollback();
            console.error('Transaction failed:', err);
            res.status(500).json({ success: false, error: 'Transaction failed.' });
        } finally {
            conn.release();
        }

    });

    return router;
}