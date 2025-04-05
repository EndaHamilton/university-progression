const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fetch all student details
router.get('/', async (req, res) => {

    try {
        //GET request to different API endpoints for all data studentManagement page uses

        const [studentsRes, pathwaysRes, studyStatusRes, entryLevelRes] = await Promise.all([
            axios.get("http://localhost:4000/student/details"),
            axios.get("http://localhost:4000/pathway"),
            axios.get("http://localhost:4000/studystatus"),
            axios.get("http://localhost:4000/entrylevel")
        ]);

        //Render EJS view with all data fetched from API endpoints
        res.render('studentmanagement', {
            students: studentsRes.data,
            pathways: pathwaysRes.data,
            studyStatuses: studyStatusRes.data,
            entryLevels: entryLevelRes.data,
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

    console.log("Incoming POST body: ", req.body);

    if (!studentData.user_id) {
        studentData.user_id = null; // Set user_id to null if it is not provided in the form
    }

    try {
        const addStudentEp = "http://localhost:4000/student";
        const response = await axios.post(addStudentEp, studentData);

        return res.status(200).json({ message: "Student created successfully" });

        // console.log("Response from API: ", response.data);

        // res.redirect('/studentmanagement');  // Redirect back to student mgmt page after successful addition
    } catch (error) {
        console.error('Error adding student:', error.message);

        const errorMessage = (error.response && error.response.data?.error) || 'An unknown error occurred.';
        return res.status(409).json({ error: errorMessage });

        // let students = [], pathways = [], studyStatuses = [], entryLevels = [];;

        // try {
        //     const [studentsRes, pathwaysRes, studyStatusRes, entryLevelRes] = await Promise.all([
        //         axios.get("http://localhost:4000/student/details"),
        //         axios.get("http://localhost:4000/pathway"),
        //         axios.get("http://localhost:4000/studystatus"),
        //         axios.get("http://localhost:4000/entrylevel")
        //     ]);

        //     // Fallback to fetch data for rendering the page in case of error
        //     // This is to ensure that the user still sees the data even if the add operation fails
        //     students = studentsRes.data;
        //     pathways = pathwaysRes.data;
        //     studyStatuses = studyStatusRes.data;
        //     entryLevels = entryLevelRes.data;

        // } catch (fetchErr) {
        //     console.error('Error fetching students for fallback:', fetchErr.message);
        // }

        // const errorMessage = (error.response && error.response.data?.error) || 'An unknown error occurred.';

        // res.status(400).render('studentmanagement', {
        //     students,
        //     pathways,
        //     studyStatuses,
        //     entryLevels,
        //     errorMessage
        // });

    }
});



module.exports = router;
