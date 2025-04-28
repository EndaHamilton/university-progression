const axios = require("axios");

const router = require("../utils/studentOnlyRouter")(); // wrapped router - middleware to check if user is student

const getApiConfig = require('../utils/apiConfig');
const student = require("../../api/controllers/student");
const config = getApiConfig(); //default JSON

const LATEST_ACADEMIC_YEAR_ID = 3; // hardcoded for now - should be dynamic in future


//GET all profile details of specific student - based on user ID
router.get('/', async (req, res) => {

    try {
        const userId = req.session.userID;

        const studentProfileRes = await axios.get(`http://localhost:4000/student/by-user/${userId}`, config);

        if (!studentProfileRes.data || !studentProfileRes.data.id) {
            return res.status(404).send("Student profile not found.");
        }

        const studentId = studentProfileRes.data.id;

        // Fetch students  grades
        const studentGradesRes = await axios.get(`http://localhost:4000/grades/student/${studentId}`, config);

        // Fetch students progression decision
        const studentProgressionRes = await axios.get(`http://localhost:4000/grades/progression/${studentId}/${LATEST_ACADEMIC_YEAR_ID}`, config);

        // Fetch students grade summary (credits and average grade)
        const gradeSummaryRes = await axios.get(`http://localhost:4000/grades/summary/${studentId}?academic_year_id=${LATEST_ACADEMIC_YEAR_ID}`, config);


        res.render('studentprogression', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            student: studentProfileRes.data,
            studentGrades: studentGradesRes.data,
            studentProgression: studentProgressionRes.data,
            gradeSummary: gradeSummaryRes.data,

        });

    } catch (error) {
        console.error("Error loading student progression page:", error.message);
        res.status(500).send("An error occurred loading your progression details.");
    }

});

// Return JSON data to be used in script file for student progression page
router.get('/data', async (req, res) => {
    try {
        const userId = req.session.userID;

        const studentProfileRes = await axios.get(`http://localhost:4000/student/by-user/${userId}`, config);
        const studentProfile = studentProfileRes.data;
        const studentId = studentProfile.id;

        const studentGradesRes = await axios.get(`http://localhost:4000/grades/student/${studentId}`, config);
        const studentGrades = studentGradesRes.data;

        const studentProgressionRes = await axios.get(`http://localhost:4000/grades/progression/${studentId}/${LATEST_ACADEMIC_YEAR_ID}`, config);
        const studentProgression = studentProgressionRes.data;

        const gradeSummaryRes = await axios.get(`http://localhost:4000/grades/summary/${studentId}?academic_year_id=${LATEST_ACADEMIC_YEAR_ID}`, config);
        const gradeSummary = gradeSummaryRes.data;

        return res.status(200).json({
            studentProfile,
            studentGrades,
            studentProgression,
            gradeSummary
        });

    } catch (error) {
        console.error("Error fetching progression data:", error);
        return res.status(500).json({ error: "Failed to fetch student progression data" });
    }
});


module.exports = router;
