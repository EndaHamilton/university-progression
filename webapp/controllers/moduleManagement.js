const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

const { ALLOWED_CREDIT_VALUES } = require("../../api/utils/constants");

// Fetch all module details
router.get('/', async (req, res) => {


    try {
        //GET request to different API endpoints for all data moduleManagement page uses

        const [moduleRes, semesterRes, pathwayRes, subjectRes] = await Promise.all([
            axios.get("http://localhost:4000/module", config),
            axios.get("http://localhost:4000/semester", config),
            axios.get("http://localhost:4000/pathway", config),
            axios.get("http://localhost:4000/subject", config),

        ]);

        //Render EJS view with all data fetched from API endpoints
        res.render('modulemanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            modules: moduleRes.data,
            semesters: semesterRes.data,
            pathways: pathwayRes.data,
            subjects: subjectRes.data,
            allowedCredits: ALLOWED_CREDIT_VALUES,
            errorMessage: null
        });

    } catch (error) {
        console.error("Error returning modules", error.message);
        res.status(500).send("Internal Server Error");
    }


});

// Get Module by ID Route - Fetching Data from API
router.get('/module/:id', async (req, res) => {
    try {
        const moduleId = req.params.id;
        const getModuleEp = `http://localhost:4000/module/${moduleId}`;
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

// Add Module Route - Posting Data to API
router.post('/add-module', async (req, res) => {

    const moduleData = { ...req.body };

    console.log("Incoming POST body: ", req.body);


    try {
        const addModuleEp = "http://localhost:4000/module";
        const response = await axios.post(addModuleEp, moduleData, config);

        //passing through response from API to the frontend
        console.log("Response from API: ", response.data);

        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error adding module:', error.message);

        const status = error.response?.status || 500; // Default to 500 if status is not available
        const errorMessage = (error.response?.data?.error) || 'An unknown error occurred.';
        console.error('Error message from API:', errorMessage);
        console.error('Status code from API:', status);

        return res.status(status).json({ error: errorMessage }); // updated to handle error response dynamically - not just 409

    }
});

// Edit Module Route - Putting Data to API
router.put('/edit-module/:id', async (req, res) => {
    try {
        const moduleId = req.params.id;
        const editModuletEp = `http://localhost:4000/module/${moduleId}`;
        const response = await axios.put(editModuletEp, req.body, config);
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

// Delete Module Route - Deleting Data from API
router.delete('/delete-module/:id', async (req, res) => {

    try {
        const moduleId = req.params.id;
        const deleteModuleEp = `http://localhost:4000/module/${moduleId}`;
        const response = await axios.delete(deleteModuleEp, config);
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