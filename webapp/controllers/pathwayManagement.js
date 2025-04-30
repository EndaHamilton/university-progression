const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

// Fetch all pathway and module details
router.get('/', async (req, res) => {
    try {
        const [pathwayRes, moduleRes] = await Promise.all([
            axios.get("http://localhost:4000/pathway", config),
            axios.get("http://localhost:4000/module", config),
        ]);

        res.render('pathwaymanagement', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            pathways: pathwayRes.data,
            modules: moduleRes.data,
            errorMessage: null
        });
    } catch (err) {
        console.error("Error loading pathway data", err.message);
        res.status(500).send("Internal Server Error");
    }
});

// POST - Assign module to pathway
router.post('/assign-module', async (req, res) => {
    try {
        const response = await axios.post("http://localhost:4000/pathway/assign-module", req.body, config);
        return res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || "An error occurred while assigning module.";
        console.error("API Error:", errorMessage);
        return res.status(status).json({ error: errorMessage });
    }
});


module.exports = router;
