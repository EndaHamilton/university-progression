const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all grades grouped by student
router.get('/', async (req, res) => {

    try {
        //GET request to different API endpoints for all data gradeManagement page uses

        const [gradeRes, studentRes, moduleRes, acadYearRes, entryLevelRes, studyStatusRes] = await Promise.all([
            axios.get("http://localhost:4000/grades", config),
            axios.get("http://localhost:4000/student", config),
            axios.get("http://localhost:4000/module", config),
            axios.get("http://localhost:4000/acadyear", config),
            axios.get("http://localhost:4000/entrylevel", config),
            axios.get("http://localhost:4000/studystatus", config),

        ]);


        // const gradeRes = await axios.get('http://localhost:4000/grades', config);

        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            groupBy: 'student',
            groupedByStudent: gradeRes.data,
            students: studentRes.data,
            modules: moduleRes.data,
            academicYears: acadYearRes.data,
            entryLevels: entryLevelRes.data,
            studyStatuses: studyStatusRes.data
        });

    } catch (err) {
        console.error("Error loading grades by student:", err.message);
        res.status(500).send("Error loading grades by student");
    }

});

//GET all grades grouped by module
router.get('/by-module', async (req, res) => {

    try {

        //GET request to different API endpoints for all data gradeManagement page uses

        const [gradeRes, studentRes, moduleRes, acadYearRes, entryLevelRes, studyStatusRes] = await Promise.all([
            axios.get("http://localhost:4000/grades", config),
            axios.get("http://localhost:4000/student", config),
            axios.get("http://localhost:4000/module", config),
            axios.get("http://localhost:4000/acadyear", config),
            axios.get("http://localhost:4000/entrylevel", config),
            axios.get("http://localhost:4000/studystatus", config),

        ]);

        // const gradeRes = await axios.get('http://localhost:4000/grades/by-module', config);


        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            groupBy: 'module',
            groupedByModule: gradeRes.data,
            students: studentRes.data,
            modules: moduleRes.data,
            academicYears: acadYearRes.data,
            entryLevels: entryLevelRes.data,
            studyStatuses: studyStatusRes.data
        });

    } catch (err) {
        console.error("Error loading grades by module:", err.message);
        res.status(500).send("Error loading grades by module");
    }

});



module.exports = router;