const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    // Test route to confirm it's working
    router.get('/test', (req, res) => {
        res.send("Student route is working!");
    });


    //Format validation function for shared fields between adding and updating student
    //isUpdate check is needed as means if it is a PUT request it only checks for the fields that are being updated and not all fields
    //An optional nice to have on this later possibly is to implement helper functions to validate field types (e.g. names, numbers)
    function validateStudentFields(data, { isUpdate = false } = {}) {

        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;
        const shouldCheck = (field) => !isUpdate || field in data;

        if (shouldCheck('student_number')) {
            const val = data.student_number;
            const valStr = String(val);
            if (!val || valStr.trim() === "") {
                errors.push("Student number cannot be empty.");
            } else if (valStr.length < 5 || valStr.length > 15) {
                errors.push("Student number must be between 5 to 15 characters.");
            }
        }

        if ('user_id' in data && data.user_id !== null && data.user_id !== "") {
            if (!isPositiveInteger(data.user_id)) {
                errors.push("User ID must be a positive whole number.");
            }
        }

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
        return errors;

    }

    // //Format validation function for presence checks for required fields when adding a new student
    // function validateNewStudent(data) {
    //     const presenceErrors = [];

    //     if (!data.student_number) {
    //         presenceErrors.push("Student number is required.");
    //     }
    //     if (!data.first_name) {
    //         presenceErrors.push("First name is required.");
    //     }
    //     if (!data.last_name) {
    //         presenceErrors.push("Last name is required.");
    //     }
    //     if (!data.pathway_id) {
    //         presenceErrors.push("Pathway is required.");
    //     }
    //     if (!data.study_status_id) {
    //         presenceErrors.push("Study status is required.");
    //     }
    //     if (!data.entry_level_id) {
    //         presenceErrors.push("Entry level is required.");
    //     }

    //     return presenceErrors.concat(validateSharedFields(data));
    // }

    // //Format validation function for format checks when updating a student
    // function validateUpdateStudent(data) {
    //     return validateSharedFields(data, { isUpdate: true });
    // }

    // //Format validation function for updating student
    // function validateUpdateStudent(data) {
    //     const errors = [];

    //     const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

    //     // Conditionally validate only if the field is included in request body
    //     if ('student_number' in data) {
    //         if (!data.student_number || data.first_name.trim() === "") {
    //             errors.push("Student number cannot be empty.");
    //         } else if (data.student_number.length < 5 || data.student_number.length > 15) {
    //             errors.push("Student number must be numeric and between 5 to 15 characters.");
    //         }
    //     }

    //     if ('user_id' in data && data.user_id !== null && data.user_id !== "") {
    //         if (!isPositiveInteger(data.user_id)) {
    //             errors.push("User ID must be a positive whole number.");
    //         }
    //     }

    //     if ('first_name' in data) {
    //         if (!data.first_name || data.first_name.trim() === "") {
    //             errors.push("First name cannot be empty.");
    //         } else {
    //             if ((!isNaN(data.first_name))) {
    //                 errors.push("First name must not be numeric.");
    //             }
    //             if (data.first_name.length < 2) {
    //                 errors.push("First name must be at least 2 characters.");
    //             }
    //             if (data.first_name.length > 50) {
    //                 errors.push("First name must be less than 50 characters.");
    //             }
    //         }
    //     }

    //     if ('last_name' in data) {
    //         if (!data.last_name) {
    //             errors.push("Last name cannot be empty.");
    //         } else {
    //             if ((!isNaN(data.last_name))) {
    //                 errors.push("Last name must not be numeric.");
    //             }
    //             if (data.last_name.length < 2) {
    //                 errors.push("Last name must be at least 2 characters.");
    //             }
    //             if (data.last_name.length > 50) {
    //                 errors.push("Last name must be less than 50 characters.");
    //             }
    //         }
    //     }

    //     if ('study_status_id' in data && !isPositiveInteger(data.study_status_id)) {
    //         errors.push("Study status ID must be a positive whole number.");
    //     }

    //     if ('entry_level_id' in data && !isPositiveInteger(data.entry_level_id)) {
    //         errors.push("Entry level ID must be a positive whole number.");
    //     }

    //     if ('pathway_id' in data && !isPositiveInteger(data.pathway_id)) {
    //         errors.push("Pathway ID must be a positive whole number.");
    //     }

    //     return errors;



    // }



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

    // Get All Students with Related foreign key data(JOIN Query)
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
    // This route should return a single student and all FK details by ID
    // Get All Students with Related foreign key data(JOIN Query)
    // - student/details
    router.get("/details/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        const allStudentsDetailsSQL = `
            SELECT 
                s.*, 
                p.name AS pathway_name, 
                ss.name AS study_status, 
                el.name AS entry_level
            FROM student s
            INNER JOIN pathway p ON s.pathway_id = p.id
            INNER JOIN study_status ss ON s.study_status_id = ss.id
            INNER JOIN entry_level el ON s.entry_level_id = el.id
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
    // This route should add a new student to the database

    //adding callback function to handle separate error handling for duplicate student number

    router.post("/", async (req, res) => {
        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;

        const parsedUserId = user_id && user_id.trim() !== '' ? parseInt(user_id) : null; // Check if user_id is provided and set to null if empty (also checks for whitespace entries using .trim)

        // Validation function to validate input data - mirrors client-side validation for extra layer of security
        const validationErrors = validateStudentFields(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        // Validate that student_number is unique if all other validaton passes above

        try {
            const [existingStudentNumber] = await db.promise().query(`SELECT * FROM student WHERE student_number = ?`, [student_number]

            );
            if (existingStudentNumber.length > 0) {
                return res.status(409).json({ error: 'Student Number already exists' });
            }

            const insertStudentSQL = `INSERT INTO student (student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.query(insertStudentSQL, [student_number, parsedUserId, parseInt(pathway_id), first_name, last_name, parseInt(study_status_id), parseInt(entry_level_id)], (err, result) => {
                if (err) {

                    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });

                } else {
                    res.status(200).json({ message: "Student created successfully", studentId: result.insertId, student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id });
                }
            });

        } catch (err) {
            console.error("Error during student POST", err);
            res.status(500).json({ error: 'Server error: ', details: err.message });
        }


    });

    // PUT (Update) a student by ID - /student/:id
    // This route should update a student's details based on their ID
    router.put("/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID. Must be a number' });
        }

        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;

        // Validate that at least one field is being updated
        if (!student_number && !user_id && !pathway_id && !first_name && !last_name && !study_status_id && !entry_level_id) {
            return res.status(400).json({ error: 'No data provided for update' });
        }

        // Validation function to validate input data - mirrors client-side validation for extra layer of security
        const validationErrors = validateStudentFields(req.body, { isUpdate: true });
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        try {
            // Get the existing student by ID
            const [rows] = await db.promise().query(`SELECT * FROM student WHERE id = ?`, [id]);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Student not found." });
            }

            const existingStudent = rows[0];

            // Check if student with same student number already exists
            if ('student_number' in req.body) {
                if (student_number !== existingStudent.student_number) {
                    const [conflicts] = await db.promise().query(
                        `SELECT id FROM student WHERE student_number = ? AND id != ?`,
                        [student_number, id]
                    );

                    if (conflicts.length > 0) {
                        return res.status(409).json({ error: 'Student Number already exists' });
                    }
                }
            };

            const { getUpdatedFields } = require("../utils/comparisonHelpers");

            const fieldsToCheck = [
                "student_number", "user_id", "pathway_id", "first_name", "last_name", "study_status_id", "entry_level_id"
            ];

            const { updateFields, updateValues } = getUpdatedFields(req.body, existingStudent, fieldsToCheck);

            updateValues.push(id); // for WHERE clause

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No changes detected. Student data is identical' });
            }

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

        try {
            const [result] = await db.promise().query(`DELETE FROM student WHERE id = ?`, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            res.status(200).json({
                message: "Student deleted successfully",
                studentId: id
            });

        } catch (err) {
            console.error("Failed to delete student", err);
            res.status(500).json({ error: 'Failed to delete student', details: err.message });
        }
    });

    router.get("/by-user/:user_id", async (req, res) => {
        const userId = parseInt(req.params.user_id);
      
        if (isNaN(userId)) {
          return res.status(400).json({ error: 'Invalid user ID' });
        }
      
        try {
          const [rows] = await db.promise().query(`SELECT * FROM student WHERE user_id = ?`, [userId]);
      
          if (rows.length === 0) {
            return res.status(404).json({ error: 'Student not found for this user' });
          }
      
          res.json(rows[0]);
      
        } catch (err) {
          console.error("Database error", err);
          res.status(500).json({ error: "Failed to fetch student by user ID" });
        }
      });

    return router;
};