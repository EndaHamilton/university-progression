const axios = require("axios");

const router = require("../utils/adminOnlyRouter")(); // wrapped router - middleware to check if user is admin

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

// GET: Render admin communication dashboard
router.get('/', async (req, res) => {
    try {
        const [pathwaysRes, levelsRes, statusesRes, studentsRes] = await Promise.all([
            axios.get('http://localhost:4000/pathway', config),
            axios.get('http://localhost:4000/level', config),
            axios.get('http://localhost:4000/studystatus', config),
            // axios.get('http://localhost:4000/student/details', config)
            axios.get('http://localhost:4000/messages/students-with-userid', config)
        ]);


        return res.render('adminmessages', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            pathways: pathwaysRes.data,
            levels: levelsRes.data,
            statuses: statusesRes.data,
            students: studentsRes.data
        });

    } catch (err) {
        console.error("Error loading messaging page:", err.message);
        return res.status(500).send("Error loading messaging page.");
    }
});

// POST: Send message to individual student
router.post('/send-individual', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:4000/messages/individual', req.body, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to send individual message";
        return res.status(status).json({ error: message });
    }
});

// POST: Send cohort message
router.post('/send-cohort', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:4000/messages/cohort', req.body, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to send cohort message";
        return res.status(status).json({ error: message });
    }
});

// GET: Admin inbox (direct messages only)
router.get('/admin-inbox', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:4000/messages/received-direct/${req.session.userID}`, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to load admin inbox";
        return res.status(status).json({ error: message });
    }
});

// GET: Fetch sent messages
router.get('/sent', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:4000/messages/sent/${req.session.userID}`, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to fetch sent messages";
        return res.status(status).json({ error: message });
    }
});

module.exports = router;