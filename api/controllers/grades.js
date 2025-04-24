const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

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
                    ay.name AS academic_year,
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
            if (!val || valStr.trim() === "") {
                errors.push("First grade cannot be empty.");
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
            entry_level_id,
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

    // GET: Accurate grade summary (credits + average) for a student
    router.get('/summary/:studentId', async (req, res) => {
        const studentId = parseInt(req.params.studentId);
        if (isNaN(studentId)) {
            return res.status(400).json({ error: 'Invalid student ID. Must be a number' });
        }

        try {

            const calculateGradeAndCATSQuery = `
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
            WHERE sm.student_id = ?;
            `
            const [rows] = await db.promise().query(calculateGradeAndCATSQuery,[studentId]);

            return res.status(200).json(rows[0]);
        } catch (err) {
            console.error("Error calculating student grade summary:", err);
            return res.status(500).json({ error: "Failed to calculate student grade summary" });
        }
    });


    return router;
}