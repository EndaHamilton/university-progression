const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    // GET: All grades grouped by student
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
        SELECT 
        sm.id AS student_module_id,
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

    router.get('/by-module', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
            SELECT 
                sm.id AS student_module_id,
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

    function validateGradeFields(data, { isUpdate = false } = {}) {
        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
        const shouldCheck = (field) => !isUpdate || field in data;
        const isValidResult = (val) => ['pass', 'fail', 'pass capped', 'excused', 'absent'].includes((val || '').toLowerCase());


        if (shouldCheck('student_id')) {
            const val = data.student_id;
            if (!val || val.trim() === "") {
                errors.push("Student ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Student ID must be a whole positive number.");
            }
        }

        if (shouldCheck('module_id')) {
            const val = data.module_id;
            if (!val || val.trim() === "") {
                errors.push("Module ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Module ID must be a whole positive number.");
            }
        }

        if (shouldCheck('academic_year_id')) {
            const val = data.academic_year_id;
            if (!val || val.trim() === "") {
                errors.push("Academic Year ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Academic Year ID must be a whole positive number.");
            }
        }

        if (shouldCheck('entry_level_id')) {
            const val = data.entry_level_id;
            if (!val || val.trim() === "") {
                errors.push("Entry Level ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Entry Level ID must be a whole positive number.");
            }
        }

        if (shouldCheck('study_status_id')) {
            const val = data.study_status_id;
            if (!val || val.trim() === "") {
                errors.push("Study Status ID cannot be empty.");
            } else if (!isPositiveInteger(val)) {
                errors.push("Study Status ID must be a whole positive number.");
            }
        }

        if (shouldCheck('first_grade')) {
            const val = data.first_grade;
            if (!val || val.trim() === "") {
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
            entry_level_id,
            study_status_id,
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
                checkIfExists(db, 'entry_level', entry_level_id),
                checkIfExists(db, 'study_status', study_status_id),
            ]);

            const [studentExists, moduleExists, yearExists, levelExists, statusExists] = checks;

            if (!studentExists) return res.status(400).json({ error: "Student does not exist." });
            if (!moduleExists) return res.status(400).json({ error: "Module does not exist." });
            if (!yearExists) return res.status(400).json({ error: "Academic year does not exist." });
            if (!levelExists) return res.status(400).json({ error: "Entry level does not exist." });
            if (!statusExists) return res.status(400).json({ error: "Study status does not exist." });

            // Check for duplicate: same student + module + academic year
            const [existing] = await db.promise().query(`
                SELECT * FROM student_module 
                WHERE student_id = ? AND module_id = ? AND academic_year_id = ?
            `, [student_id, module_id, academic_year_id]);

            if (existing.length > 0) {
                return res.status(409).json({ error: "This student already has a grade for that module and academic year." });
            }

            // Insert into student_module
            const [result] = await db.promise().query(`
                INSERT INTO student_module (
                    student_id, module_id, academic_year_id,
                    first_grade, grade_result,
                    resit_grade, resit_result,
                    entry_level_id, study_status_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                parseInt(student_id),
                parseInt(module_id),
                parseInt(academic_year_id),
                parseInt(first_grade),
                grade_result.toLowerCase(),
                resit_grade ? parseInt(resit_grade) : null,
                resit_result ? resit_result.toLowerCase() : null,
                parseInt(entry_level_id),
                parseInt(study_status_id)
            ]);

            res.status(201).json({ message: "Grade added successfully!", insertId: result.insertId });

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

            // //Normalising null int values before comparison
            // function parseIntOrNull(val) {
            //     if (val === null || val === undefined || val === "") return null;
            //     return parseInt(val);
            // }
            
            // //Check if existing fields are unchanged
            // // Compare fields in module table
            // const gradeFieldsUnchanged = Object.keys(req.body).every((key) => {
            //     const newVal = req.body[key];
            //     const existingVal = existing[key];

            //     console.log(`[COMPARE] ${key}: new=${newVal}, existing=${existingVal}`);

            //     if (["student_id", "module_id", "academic_year_id", "entry_level_id", "study_status_id", "first_grade", "resit_grade"].includes(key)) {
            //         return parseIntOrNull(newVal) === parseIntOrNull(existingVal);
            //     }

            //     const normalizedNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim().toLowerCase();
            //     const normalizedExisting = (existingVal === null || existingVal === undefined) ? "" : String(existingVal).trim().toLowerCase();

            //     return normalizedNew === normalizedExisting;
            // })

            // if (gradeFieldsUnchanged) {
            //     return res.status(400).json({ error: "No changes detected. Student grade data is identical." });
            // }

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

            //Helper function to normalize for comparison
            function normalize(val) {
                if (val === undefined || val === "" || val === null) return null;
                if (!isNaN(val)) return parseInt(val);
                return String(val).trim().toLowerCase();
            }

            const fieldsToCheck = [
                "student_id", "module_id", "academic_year_id", "entry_level_id",
                "study_status_id", "first_grade", "grade_result", "resit_grade", "resit_result"
            ];

            // Build update query only with changed fields
            const updateFields = [];
            const updateValues = [];

            //Loop through fields in an easier way
            fieldsToCheck.forEach(key => {
                if (key in req.body) {
                    const newVal = normalize(req.body[key]);
                    const existingVal = normalize(existing[key]);
                    console.log(`[COMPARE] ${key}: new=${newVal}, existing=${existingVal}`);
                    if (newVal !== existingVal) {
                        updateFields.push(`${key} = ?`);
                        updateValues.push(newVal);
                    }
                }
            });

            if (updateFields.length === 0) {
                return res.status(400).json({ error: "No changes detected. Student grade data is identical." });
            }



            // if (student_id && parseInt(student_id) !== existing.student_id) {
            //     updateFields.push("student_id = ?");
            //     updateValues.push(parseInt(student_id));
            // }
            // if (module_id && parseInt(module_id) !== existing.module_id) {
            //     updateFields.push("module_id = ?");
            //     updateValues.push(parseInt(module_id));
            // }
            // if (academic_year_id && parseInt(academic_year_id) !== existing.academic_year) {
            //     updateFields.push("academic_year_id = ?");
            //     updateValues.push(parseInt(academic_year_id));
            // }
            // if (entry_level_id && parseInt(entry_level_id) !== existing.entry_level_id) {
            //     updateFields.push("entry_level_id = ?");
            //     updateValues.push(parseInt(entry_level_id));
            // }
            // if (study_status_id && parseInt(study_status_id) !== existing.study_status_id) {
            //     updateFields.push("study_status_id = ?");
            //     updateValues.push(parseInt(study_status_id));
            // }
            // if (first_grade && parseInt(first_grade) !== existing.first_grade) {
            //     updateFields.push("first_grade = ?");
            //     updateValues.push(parseInt(first_grade));
            // }

            // if (grade_result && grade_result.trim().toLowerCase() !== existing.grade_result) {
            //     updateFields.push("grade_result = ?");
            //     updateValues.push(grade_result.trim().toLowerCase());
            // }

            // // Separate check for non-required fields
            // if ('resit_grade' in req.body) {
            //     const newVal = parseInt(resit_grade);
            //     const existingVal = parseInt(existing.resit_grade);
            //     if (newVal !== existingVal) {
            //         updateFields.push("resit_grade = ?");
            //         updateValues.push(newVal);
            //     }
            // }
            // if ('resit_result' in req.body) {
            //     const newVal = resit_result?.trim().toLowerCase() || null;
            //     const existingVal = existing.resit_result?.toLowerCase() || null;
            //     if (newVal !== existingVal) {
            //         updateFields.push("resit_result = ?");
            //         updateValues.push(newVal);
            //     }
            // }



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


    return router;
}