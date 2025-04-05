const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fetch all student details
router.get('/', async (req, res) => {

    try {
        //GET request to different API endpoints for all data studentManagement page uses

        const [studentsRes, pathwaysRes] = await Promise.all([
            axios.get("http://localhost:4000/student/details"),
            axios.get("http://localhost:4000/pathway"),
        ]);

        //Render EJS view with all data fetched from API endpoints
        console.log("Students: ", studentsRes.data);
        console.log("Pathways: ", pathwaysRes.data);

        res.render('studentmanagement', {
            students: studentsRes.data,
            pathways: pathwaysRes.data,
            errorMessage: null
        });




    } catch (error) {
        console.error("Error returning students", error.message);
        res.status(500).send("Internal Server Error");
    }


});

// Add Student Route - Posting Data to API
router.post('/add-student', async (req, res) => {

    const studentData = { ...req.body };

    if (!studentData.user_id) {
        studentData.user_id = null; // Set user_id to null if it is not provided in the form
    }

    try {
        const addStudentEp = "http://localhost:4000/student";
        const response = await axios.post(addStudentEp, studentData);

        console.log("Response from API: ", response.data);

        res.redirect('/studentmanagement');  // Redirect back to student mgmt page after successful addition
    } catch (error) {
        console.error('Error adding student:', error.message);

        let students = [];

        try {
            const studentRes = await axios.get("http://localhost:4000/student/details");
            students = studentRes.data;
        } catch (fetchErr) {
            console.error('Error fetching students for fallback:', fetchErr.message);
        }

        const errorMessage = (error.response && error.response.data?.error) || 'An unknown error occurred.';

        res.status(400).render('studentmanagement', {
            students,
            errorMessage
        });

    }
});

module.exports = router;
