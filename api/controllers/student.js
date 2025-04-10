const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    // Test route to confirm it's working
    router.get('/test', (req, res) => {
        res.send("Student route is working!");
    });

    // //Format validation function for adding student
    // function validateNewStudent(data) {
    //     const errors = [];

    //     const {
    //         student_number,
    //         user_id,
    //         pathway_id,
    //         first_name,
    //         last_name,
    //         study_status_id,
    //         entry_level_id
    //     } = data;

    //     //1. Presence check for required fields
    //     if (!student_number) {
    //         errors.push("Student number is required.");
    //     }

    //     if (!first_name) {
    //         errors.push("First name is required.");
    //     }

    //     if (!last_name) {
    //         errors.push("Last name is required.");
    //     }

    //     if (!pathway_id) {
    //         errors.push("Pathway is required.");
    //     }

    //     if (!study_status_id) {
    //         errors.push("Study status is required.");
    //     }

    //     if (!entry_level_id) {
    //         errors.push("Entry level is required.");
    //     }

    //     return errors.concat(validateSharedFields(data));


    // }

    //Format validation function for shared fields between adding and updating student
    function validateSharedFields(data, { isUpdate = false } = {}) {

        const errors = [];
        const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

        if ('student_number' in data || !isUpdate) {
            const val = data.student_number;
            if (!val || val.trim() === "") {
                errors.push("Student number cannot be empty.");
            } else if (val.length < 5 || val.length > 15) {
                errors.push("Student number must be between 5 to 15 characters.");
            }
        }

        if ('user_id' in data && data.user_id !== null && data.user_id !== "") {
            if (!isPositiveInteger(data.user_id)) {
                errors.push("User ID must be a positive whole number.");
            }
        }

        if ('first_name' in data || !isUpdate) {
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

        if ('last_name' in data || !isUpdate) {
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

        if ('study_status_id' in data || !isUpdate) {
            if (!data.study_status_id || data.study_status_id.trim() === "") {
                errors.push("Study status cannot be empty.");
            } else if (!isPositiveInteger(data.study_status_id)) {
                errors.push("Study status ID must be a positive whole number.");
            }
        }
        if ('entry_level_id' in data || !isUpdate) {
            if (!data.entry_level_id || data.entry_level_id.trim() === "") {
                errors.push("Entry level cannot be empty.");
            } else if (!isPositiveInteger(data.entry_level_id)) {
                errors.push("Entry level ID must be a positive whole number.");
            }
        }
        if ('pathway_id' in data || !isUpdate) {
            if (!data.pathway_id || data.pathway_id.trim() === "") {
                errors.push("Pathway cannot be empty.");
            } else if (!isPositiveInteger(data.pathway_id)) {
                errors.push("Pathway ID must be a positive whole number.");
            }
        }
        return errors;

    }

    //Format validation function for presence checks for required fields when adding a new student
    function validateNewStudent(data) {
        const presenceErrors = [];

        if (!data.student_number) {
            presenceErrors.push("Student number is required.");
        }
        if (!data.first_name) {
            presenceErrors.push("First name is required.");
        }
        if (!data.last_name) {
            presenceErrors.push("Last name is required.");
        }
        if (!data.pathway_id) {
            presenceErrors.push("Pathway is required.");
        }
        if (!data.study_status_id) {
            presenceErrors.push("Study status is required.");
        }
        if (!data.entry_level_id) {
            presenceErrors.push("Entry level is required.");
        }

        return presenceErrors.concat(validateSharedFields(data));
    }

    //Format validation function for format checks when updating a student
    function validateUpdateStudent(data) {
        return validateSharedFields(data, { isUpdate: true });
    }

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

    // //Format validation function
    // function validateStudentInput(data) {
    //     const {
    //         student_number,
    //         user_id,
    //         pathway_id,
    //         first_name,
    //         last_name,
    //         study_status_id,
    //         entry_level_id
    //     } = data;

    //     const errors = [];

    //     //1. Presence check for required fields
    //     if (!student_number) {
    //         errors.push("Student number is required.");
    //     }

    //     if (!first_name) {
    //         errors.push("First name is required.");
    //     }

    //     if (!last_name) {
    //         errors.push("Last name is required.");
    //     }

    //     if (!pathway_id) {
    //         errors.push("Pathway is required.");
    //     }

    //     if (!study_status_id) {
    //         errors.push("Study status is required.");
    //     }

    //     if (!entry_level_id) {
    //         errors.push("Entry level is required.");
    //     }

    //     //2. Format checks for fields
    //     const isPositiveInteger = (value) => /^\d+$/.test(value) && Number(value) > 0;

    //     if (student_number && (student_number.length < 5 || student_number.length > 15 || !isPositiveInteger(student_number))) {
    //         errors.push("Student number must be a whole number between 5 and 15 characters.");
    //     }
    //     if (user_id && (!isPositiveInteger(user_id))) {
    //         errors.push("User ID must be a positive whole number.");
    //     }
    //     if (first_name && (!isNaN(first_name))) {
    //         errors.push("First name entries must not be numeric.");
    //     }
    //     if (first_name && (first_name.length < 2)) {
    //         errors.push("First name entries must be more than 1 character long.");
    //     }
    //     if (first_name && (first_name.length > 50)) {
    //         errors.push("First name entries must be less than 50 characters long.");
    //     }
    //     if (last_name && (!isNaN(last_name))) {
    //         errors.push("Last name entries must not be numeric.");
    //     }
    //     if (last_name && (last_name.length < 2)) {
    //         errors.push("Last name entries must be more than 1 character long.");
    //     }
    //     if (last_name && (last_name.length > 50)) {
    //         errors.push("First name entries must be less than 50 characters long.");
    //     }
    //     if (study_status_id && (!isPositiveInteger(study_status_id))) {
    //         errors.push("Study status ID must be a positive whole number.");
    //     }
    //     if (entry_level_id && (!isPositiveInteger(entry_level_id))) {
    //         errors.push("Entry level ID must be a positive whole number.");
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

    // POST a new student - /student
    // This route should add a new student to the database

    //adding callback function to handle separate error handling for duplicate student number

    router.post("/", async (req, res) => {
        const { student_number, user_id, pathway_id, first_name, last_name, study_status_id, entry_level_id } = req.body;

        const parsedUserId = user_id && user_id.trim() !== '' ? parseInt(user_id) : null; // Check if user_id is provided and set to null if empty (also checks for whitespace entries using .trim)

        // Validation function to validate input data - mirrors client-side validation for extra layer of security
        const validationErrors = validateNewStudent(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
        }

        // // Validate required fields
        // if (!student_number || !pathway_id || !first_name || !last_name || !study_status_id || !entry_level_id) {
        //     return res.status(400).json({ error: 'Missing required fields' });
        // }

        // // Validate data types
        // if (!isNaN(first_name) || !isNaN(last_name)) {
        //     return res.status(400).json({ error: 'Invalid data types: name entries cannot be numeric' });
        // }
        // if (isNaN(pathway_id) || isNaN(study_status_id) || isNaN(entry_level_id) || (user_id && isNaN(user_id))) { // Check if user_id is provided and numeric
        //     return res.status(400).json({ error: 'Invalid data types: must be numeric' });
        // }

        // Validate that student_number is unique if all other validaton passes above

        try {
            const [existingStudentId] = await db.promise().query(`SELECT * FROM student WHERE student_number = ?`, [student_number]

            );
            if (existingStudentId.length > 0) {
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

        // Validation function to validate input data - mirrors client-side validation for extra layer of security
        const validationErrors = validateUpdateStudent(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(", ") });
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

            // // Check if the data being updated is the same as existing data
            // if (
            //     existingStudent.student_number === student_number &&
            //     existingStudent.user_id === user_id &&
            //     existingStudent.pathway_id === pathway_id &&
            //     existingStudent.first_name === first_name &&
            //     existingStudent.last_name === last_name &&
            //     existingStudent.study_status_id === study_status_id &&
            //     existingStudent.entry_level_id === entry_level_id
            // ) {
            //     return res.status(400).json({ error: 'No changes detected. Student data is identical.' });
            // }

            // Check if the data being updated is the same as existing data
            // Checks only for fields which are being passed in - doesn't check undefined fields that aren't being toucehd
            const isIdentical = Object.keys(req.body).every((key) => {
                const newVal = req.body[key];
                const existingVal = existingStudent[key];

                // Convert both for comparison
                const normalizedNew = (newVal === null || newVal === undefined) ? "" : String(newVal).trim();
                const normalizedExisting = (existingVal === null || existingVal === undefined) ? "" : String(existingVal).trim();

                return normalizedNew === normalizedExisting;

            });

            if (isIdentical) {
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
                        const message = err.message || err.sqlMessage || '';
                        if (message.includes('unique_student_number')) { // name of unique constraint in db
                            return res.status(409).json({ error: 'Student Number already exists' });
                        } else {
                            return res.status(409).json({ error: 'Duplicate entry. A unique field already exists' }); // ensuring is scalable for addition of unique fields later
                        }
                    }
                    return res.status(500).json({ error: 'Failed to update student data', details: err.message });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Student not found' });
                }

                res.status(201).json({
                    message: "Student updated successfully!!!",
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