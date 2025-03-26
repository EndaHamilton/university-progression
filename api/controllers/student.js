const express = require('express');
const router = express.Router();

module.exports = function (db) {

    // Test route to confirm it's working
    router.get('/test', (req, res) => {
        res.send("Student route is working!");
    });

    // GET all students - /students
    // This route should return all students in the database
    router.get("/", (req, res) => {
        db.query('SELECT * FROM student', (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Failed to connect to database' });
            } else if (rows.length === 0) {
                res.status(404).json({ error: 'No students found' });
            }
            else {
                res.json(rows);
            }
        });
    });

    // GET student by ID - /students/:id
    // This route should return a single student by ID
    router.get("/:id", (req, res) => {
        const id = parseInt(req.params.id);
        db.query('SELECT * FROM student WHERE id = ?', [id], (err, rows) => {
            if (isNaN(id)) {
                res.status(400).json({ error: 'Invalid ID. Must be a number' });
            } else if (err) {
                res.status(500).json({ error: 'Failed to connect to database' });
            } else if (rows.length === 0) {
                res.status(404).json({ error: 'Student not found' });
            }
            else {
                res.json(rows[0]);
            }
        });
    });

    // POST a new student - /students
    // This route should add a new student to the database
    router.post("/", (req, res) => {
        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;
        const insertStudentSQL = `INSERT INTO student (student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertStudentSQL, [student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Student Number already exists' });
                }
                else {
                    return res.status(500).json({ error: 'Failed to connect to database', details : errmessage });
                }
            } else {
                res.status(201).json({ message: "Student created successfully", studentId: result.insertId, student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id });
            }
        });
    });

    // PUT (Update) a student by ID - /students/:id
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

    return router;
};