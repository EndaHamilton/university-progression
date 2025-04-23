const express = require("express");
// const router = express.Router();
const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

// const requireAdmin = require("../middleware/requireAdmin"); // Middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

// const config = {
//     headers: {
//       'Content-Type': 'application/json',
//       'x-api-key': 'my-secret-key'
//     }
//   };


// Fetch all student details
router.get('/', async (req, res) => {


    try {
        //GET request to different API endpoints for all data studentManagement page uses

        const [studentsRes, pathwaysRes, studyStatusRes, entryLevelRes] = await Promise.all([
            axios.get("http://localhost:4000/student/details", config),
            axios.get("http://localhost:4000/pathway", config),
            axios.get("http://localhost:4000/studystatus", config),
            axios.get("http://localhost:4000/entrylevel", config)
        ]);

        //Render EJS view with all data fetched from API endpoints
        res.render('studentmanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
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
        const response = await axios.post(addStudentEp, studentData, config);

        //passing through response from API to the frontend
        console.log("Response from API: ", response.data);

        return res.status(200).json(response.data);



        // res.redirect('/studentmanagement');  // Redirect back to student mgmt page after successful addition
    } catch (error) {
        console.error('Error adding student:', error.message);

        const status = error.response?.status || 500; // Default to 500 if status is not available
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);

        return res.status(status).json({ error: errorMessage }); // updated to handle error response dynamically - not just 409


    }
});

// Get Student by ID Route - Fetching Data from API
router.get('/student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const getStudentEp = `http://localhost:4000/student/${studentId}`;
        const response = await axios.get(getStudentEp, config);
        console.log("Response from API: ", response.data);
        return res.status(200).json(response.data);
    } catch (error) {

        const status = error.response?.status || 500;
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);
        // Handle the error response dynamically

        return res.status(status).json({ error: errorMessage });
    }

});

// Edit Student Route - Putting Data to API
router.put('/edit-student/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const editStudentEp = `http://localhost:4000/student/${studentId}`;
        const response = await axios.put(editStudentEp, req.body, config);
        console.log("Response from API: ", response.data);
        return res.status(response.status).json(response.data);
    } catch (error) {

        const status = error.response?.status || 500;
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);
        // Handle the error response dynamically

        return res.status(status).json({ error: errorMessage });
    }
});

// Delete Student Route - Deleting Data from API
router.delete('/delete-student/:id', async (req, res) => {

    try {
        const studentId = req.params.id;
        const deleteStudentEp = `http://localhost:4000/student/${studentId}`;
        const response = await axios.delete(deleteStudentEp, config);
        console.log("Response from API: ", response.data);
        return res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);
        // Handle the error response dynamically

        return res.status(status).json({ error: errorMessage });
    }

});

// GET students available modules
router.get('/student/:id/available-modules', async (req, res) => {

    try {
        const studentId = req.params.id;
        const getStudentModulesEp = `http://localhost:4000/student/${studentId}/available-modules`;
        const response = await axios.get(getStudentModulesEp, config);
        console.log("Response from API: ", response.data);
        return res.status(200).json(response.data);
    } catch (error) {

        const status = error.response?.status || 500;
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);
        // Handle the error response dynamically

        return res.status(status).json({ error: errorMessage });
    }
});

module.exports = router;
