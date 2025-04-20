const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all students - /student/details - this is to present the grid for all students - each one clickable to display individual grade details
router.get('/', async (req, res) => {

    try {
        const studentRes = await axios.get("http://localhost:4000/student/details", config);

        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            students: studentRes.data
        });
    } catch (err) {
        console.error("Error loading students:", err.message);
        res.status(500).send("Error loading students");
    }

});

// GET all grades for a specific student
router.get('/student/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }

    try {
        const [studentGradesRes, studentRes] = await Promise.all([
            axios.get(`http://localhost:4000/grades/student/${studentId}`, config),
            axios.get(`http://localhost:4000/student/details/${studentId}`, config)
        ]);

        return res.status(200).json({
            studentGrades: studentGradesRes.data,
            student: studentRes.data
        });
    } catch (error) {
        console.error("Error fetching student grades:", error.message);
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || "Failed to retrieve student grades";
        return res.status(status).json({ error: errorMessage });
    }
});

// //GET all grades grouped by student
// router.get('/', async (req, res) => {

//     try {
//         //GET request to different API endpoints for all data gradeManagement page uses

//         const [gradeRes, studentRes, moduleRes, acadYearRes, entryLevelRes, studyStatusRes] = await Promise.all([
//             axios.get("http://localhost:4000/grades", config),
//             axios.get("http://localhost:4000/student", config),
//             axios.get("http://localhost:4000/module", config),
//             axios.get("http://localhost:4000/acadyear", config),
//             axios.get("http://localhost:4000/entrylevel", config),
//             axios.get("http://localhost:4000/studystatus", config),

//         ]);


//         // const gradeRes = await axios.get('http://localhost:4000/grades', config);

//         res.render('grademanagement', {
//             user: {
//                 id: req.session.userID,
//                 email: req.session.email
//             },
//             groupBy: 'student',
//             groupedByStudent: gradeRes.data,
//             students: studentRes.data,
//             modules: moduleRes.data,
//             academicYears: acadYearRes.data,
//             entryLevels: entryLevelRes.data,
//             studyStatuses: studyStatusRes.data
//         });

//     } catch (err) {
//         console.error("Error loading grades by student:", err.message);
//         res.status(500).send("Error loading grades by student");
//     }

// });

// //GET all grades grouped by module
// router.get('/by-module', async (req, res) => {

//     try {

//         //GET request to different API endpoints for all data gradeManagement page uses
//         const [gradeRes, studentRes, moduleRes, acadYearRes, entryLevelRes, studyStatusRes] = await Promise.all([
//             axios.get("http://localhost:4000/grades/by-module", config),
//             axios.get("http://localhost:4000/student", config),
//             axios.get("http://localhost:4000/module", config),
//             axios.get("http://localhost:4000/acadyear", config),
//             axios.get("http://localhost:4000/entrylevel", config),
//             axios.get("http://localhost:4000/studystatus", config),

//         ]);

//         // const gradeRes = await axios.get('http://localhost:4000/grades/by-module', config);


//         res.render('grademanagement', {
//             user: {
//                 id: req.session.userID,
//                 email: req.session.email
//             },
//             groupBy: 'module',
//             groupedByModule: gradeRes.data,
//             students: studentRes.data,
//             modules: moduleRes.data,
//             academicYears: acadYearRes.data,
//             entryLevels: entryLevelRes.data,
//             studyStatuses: studyStatusRes.data
//         });

//     } catch (err) {
//         console.error("Error loading grades by module:", err.message);
//         res.status(500).send("Error loading grades by module");
//     }

// });

// Get Grade by ID Route - Fetching Data from API
router.get('/:id', async (req, res) => {
    try {
        const moduleId = req.params.id;
        const getModuleEp = `http://localhost:4000/grades/${moduleId}`;
        const response = await axios.get(getModuleEp, config);
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

// Add Grade Route - Posting Data to API
router.post('/add-grade', async (req, res) => {

    const gradeData = { ...req.body };

    console.log("Incoming POST body: ", req.body);


    try {
        const addGradeEp = "http://localhost:4000/grades";
        const response = await axios.post(addGradeEp, gradeData, config);

        //passing through response from API to the frontend
        console.log("Response from API: ", response.data);

        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error adding grade:', error.message);

        const status = error.response?.status || 500; // Default to 500 if status is not available
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);

        return res.status(status).json({ error: errorMessage }); // updated to handle error response dynamically - not just 409

    }
});

// Edit Grade Route - Putting Data to API
router.put('/edit-grade/:id', async (req, res) => {
    try {
        const gradeId = req.params.id;
        const editGradeEp = `http://localhost:4000/grades/${gradeId}`;
        const response = await axios.put(editGradeEp, req.body, config);
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

// Delete Grade Route - Deleting Data from API
router.delete('/delete-grade/:id', async (req, res) => {

    try {
        const gradeId = req.params.id;
        const deleteGradeEp = `http://localhost:4000/grades/${gradeId}`;
        const response = await axios.delete(deleteGradeEp, config);
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



module.exports = router;