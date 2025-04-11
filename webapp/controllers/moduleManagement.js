const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

// Fetch all module details
router.get('/', async (req, res) => {

    if(!req.session.userID) {
        return res.redirect('/'); // Redirect to sign-in page if user is not authenticated
    }

    try {
        //GET request to different API endpoints for all data moduleManagement page uses

        const [moduleRes] = await Promise.all([
            axios.get("http://localhost:4000/module", config),
            // axios.get("http://localhost:4000/semester", config) -- need to put in semester endpoint
        ]);

        console.log(moduleRes.data);

        //Render EJS view with all data fetched from API endpoints
        res.render('modulemanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            modules: moduleRes.data,
            // semesters: semesterRes.data, -- need to put in semester endpoint
            errorMessage: null
        });

    } catch (error) {
        console.error("Error returning modules", error.message);
        res.status(500).send("Internal Server Error");
    }


});

module.exports = router; 