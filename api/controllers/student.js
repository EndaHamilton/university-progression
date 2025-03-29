const express = require('express');
const router = express.Router();

module.exports = function (db) {

    // Test route to confirm it's working
    router.get('/test', (req, res) => {
        res.send("Student route is working!");
    });

    // GET all students - /student
    // This route should return all students in the database
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

    // Get All Students with Related Data foreign key data(JOIN Query)
    // - student/details
    router.get("/details", async (req, res) => {
        const allStudentsDetailsSQL = `
            SELECT 
                s.*, 
                p.name AS pathway_name, 
                ss.name AS study_status, 
                el.name AS entry_level
            FROM student s
            INNER JOIN pathway p ON s.pathway_id = p.id
            INNER JOIN study_status ss ON s.study_status_id = ss.id
            INNER JOIN entry_level el ON s.entry_level_id = el.id`;

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
            res.status(400).json({ error: 'Invalid ID. Must be a number' });
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

    // POST a new student - /student
    // This route should add a new student to the database
    router.post("/", (req, res) => {
        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;


        // Validate required fields
        if (!student_number || !pathway_id || !first_name || !last_name || !study_status_id || !entry_level_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate that student_number is unique
        const checkStudentNumberSQL = `SELECT * FROM student WHERE student_number = ?`;
        db.query(checkStudentNumberSQL, [student_number], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
            }
            if (rows.length > 0) {
                return res.status(409).json({ error: 'Student Number already exists' });
            }
        });

        // Validate data types
        if ( !isNaN(first_name) || !isNaN(last_name) ) {
            return res.status(400).json({ error: 'Invalid data types: name entries cannot be numeric' });
        }
        if (isNaN(pathway_id) || isNaN(study_status_id) || isNaN(entry_level_id) || (user_id && isNaN(user_id))) { // Check if user_id is provided and numeric
            return res.status(400).json({ error: 'Invalid data types: must be numeric' });
        }
        



        const insertStudentSQL = `INSERT INTO student (student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertStudentSQL, [student_number, user_id || null, parseInt(pathway_id), first_name, last_name, parseInt(study_status_id), parseInt(entry_level_id)], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Student Number already exists' });
                }
                else {
                    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
                }
            } else {
                res.status(201).json({ message: "Student created successfully", studentId: result.insertId, student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id });
            }
        });
    });

    // PUT (Update) a student by ID - /student/:id
    // This route should update a student's details based on their ID
    router.put("/:id", (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;

        // Validate that at least one field is being updated
        if (!student_number && !user_id && !pathway_id && !first_name && !last_name && !study_status_id && !entry_level_id) {
            return res.status(400).json({ error: 'No data provided for update' });
        }

        // First, retrieve the current data for comparison
        const selectSQL = `SELECT * FROM student WHERE id = ?`;
        db.query(selectSQL, [id], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch existing student data', details: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const existingStudent = rows[0];

            // Check if the data being updated is the same as existing data
            if (
                existingStudent.student_number === student_number &&
                existingStudent.user_id === user_id &&
                existingStudent.pathway_id === pathway_id &&
                existingStudent.first_name === first_name &&
                existingStudent.last_name === last_name &&
                existingStudent.study_status_id === study_status_id &&
                existingStudent.entry_level_id === entry_level_id
            ) {
                return res.status(400).json({ error: 'No changes detected. Student data is identical.' });
            }

            // Prepare the update query
            const updateFields = [];
            const updateValues = [];

            if (student_number) {
                updateFields.push("student_number = ?");
                updateValues.push(student_number);
            }
            if (user_id) {
                updateFields.push("user_id = ?");
                updateValues.push(user_id);
            }
            if (pathway_id) {
                updateFields.push("pathway_id = ?");
                updateValues.push(pathway_id);
            }
            if (first_name) {
                updateFields.push("first_name = ?");
                updateValues.push(first_name);
            }
            if (last_name) {
                updateFields.push("last_name = ?");
                updateValues.push(last_name);
            }
            if (study_status_id) {
                updateFields.push("study_status_id = ?");
                updateValues.push(study_status_id);
            }
            if (entry_level_id) {
                updateFields.push("entry_level_id = ?");
                updateValues.push(entry_level_id);
            }

            // Add the student ID to the end of the updateValues array
            updateValues.push(id);

            const updateSQL = `UPDATE student SET ${updateFields.join(", ")} WHERE id = ?`;

            db.query(updateSQL, updateValues, (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Student Number already exists' });
                    }
                    return res.status(500).json({ error: 'Failed to update student data', details: err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Student not found' });
                }

                res.status(201).json({
                    message: "Student updated successfully",
                    studentId: id
                });
            });
        });
    });

    // DELETE a student by ID - /student/:id
    // This route should delete a student based on their ID
    router.delete("/:id", (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        const deleteSQL = `DELETE FROM student WHERE id = ?`;

        db.query(deleteSQL, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete student', details: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            res.status(200).json({
                message: "Student deleted successfully",
                studentId: id
            });
        });
    });

    return router;
};