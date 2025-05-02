const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all students - /student/details - this is to present the grid for all students - each one clickable to display individual grade details
router.get('/', async (req, res) => {

    try {
        const [studentRes, moduleRes, acadYearRes, gradeRes] = await Promise.all([
            axios.get("http://localhost:4000/student/details", config),
            axios.get("http://localhost:4000/module", config),
            axios.get("http://localhost:4000/acadyear", config),
            axios.get("http://localhost:4000/grades", config)
        ]);

        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            students: studentRes.data,
            modules: moduleRes.data,
            academicYears: acadYearRes.data,
            grades: gradeRes.data
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

        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error adding grade:', error.message);

        const status = error.response?.status || 500; 
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);

        return res.status(status).json({ error: errorMessage }); 

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


        return res.status(status).json({ error: errorMessage });
    }
});

// Delete Grade Route - Deleting Data from API
router.delete('/delete-grade/:id', async (req, res) => {

    try {
        const gradeId = req.params.id;
        const deleteGradeEp = `http://localhost:4000/grades/${gradeId}`;
        const response = await axios.delete(deleteGradeEp, config);
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

// GET: Grade summary for a student for a specific academic year
router.get('/student/:studentId/summary/:acadYearId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const acadYearId = parseInt(req.params.acadYearId);

    const config = getApiConfig();

    if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID. Must be a number" });
    }
    if (isNaN(acadYearId)) {
        return res.status(400).json({ error: "Invalid acad year ID. Must be a number" });
    }

    try {
        const summaryRes = await axios.get(`http://localhost:4000/grades/summary/${studentId}?academic_year_id=${acadYearId}`, config);
        return res.status(200).json(summaryRes.data);
    } catch (error) {
        console.error("Error fetching grade summary:", error.message);
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || "Failed to retrieve summary.";
        return res.status(status).json({ error: errorMessage });
    }
});

// GET: Fetch automatic progression decision for a student
router.get('/student/:studentId/progression/:acadYearId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const acadYearId = parseInt(req.params.acadYearId);

    if (isNaN(studentId)) {
        return res.status(400).json({ error: "Invalid student ID. Must be a number" });
    }
    if (isNaN(acadYearId)) {
        return res.status(400).json({ error: "Invalid acad year ID. Must be a number" });
    }

    try {
        const progressionRes = await axios.get(`http://localhost:4000/grades/progression/${studentId}/${acadYearId}`, config);

        return res.status(200).json(progressionRes.data);
    } catch (error) {
        console.error("Error fetching progression decision:", error.message);
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || "Failed to retrieve progression decision.";
        return res.status(status).json({ error: errorMessage });
    }
});

const validateProgressionPayload = require('../utils/validateProgressionPayload');

// POST: Finalise student progression
router.post('/finalise-progression', validateProgressionPayload, async (req, res) => {
    const { student_id, academic_year_id, progression_result, mitigating_circumstances } = req.body;

    if (!student_id || !academic_year_id || !progression_result) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const response = await axios.post('http://localhost:4000/grades/finalise-progression', {
            student_id,
            academic_year_id,
            progression_result,
            mitigating_circumstances
        }, config);

        return res.status(200).json(response.data);
    } catch (err) {
        console.error("Error finalising progression:", err.message);
        const status = err.response?.status || 500;
        const errorMessage = err.response?.data?.error || "Failed to finalise progression.";
        return res.status(status).json({ error: errorMessage });
    }
});

// GET: Fetch progression result
router.get('/progression-result/:studentId/:acadYearId', async (req, res) => {
    const { studentId, acadYearId } = req.params;

    try {
        const response = await axios.get(`http://localhost:4000/grades/progression-result/${studentId}/${acadYearId}`, config);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching progression result:", error.message);
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || "Failed to fetch progression result.";
        return res.status(status).json({ error: errorMessage });
    }
});

router.post('/upload-csv', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:4000/grades/upload-csv', req.body, config);

        return res.status(200).json(response.data);
    } catch (err) {
        console.error("Error importing grades:", err.message);
        const status = err.response?.status || 500;
        const errorMessage = err.response?.data?.error || "Failed to import grades.";
        return res.status(status).json({ error: errorMessage });
    }
});



module.exports = router;