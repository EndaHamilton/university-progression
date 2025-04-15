const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all grades grouped by student
router.get('/', async (req, res) => {

    try {
        const gradeRes = await axios.get('http://localhost:4000/grades', config);

        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            groupBy: 'student',
            groupedByStudent: gradeRes.data
        });

    } catch (err) {
        console.error("Error loading grades by student:", err.message);
        res.status(500).send("Error loading grades by student");
    }

});

//GET all grades grouped by module
router.get('/by-module', async (req, res) => {

    try {
        const gradeRes = await axios.get('http://localhost:4000/grades/by-module', config);

        res.render('grademanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            groupBy: 'module',
            groupedByModule: gradeRes.data
        });

    } catch (err) {
        console.error("Error loading grades by module:", err.message);
        res.status(500).send("Error loading grades by module");
    }

});



module.exports = router;