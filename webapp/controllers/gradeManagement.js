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
        console.error("Error loading grades:", err.message);
        res.status(500).send("Error loading grades");
    }

});

module.exports = router;