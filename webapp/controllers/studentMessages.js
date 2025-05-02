const axios = require("axios");

const router = require("../utils/studentOnlyRouter")(); // wrapped router - middleware to check if user is student

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSO

// GET : Render student communication dashboard
router.get('/', async (req, res) => {
    try {
        const [pathwaysRes, levelsRes, statusesRes, studentsRes, studentProfileRes] = await Promise.all([
            axios.get('http://localhost:4000/pathway', config),
            axios.get('http://localhost:4000/level', config),
            axios.get('http://localhost:4000/studystatus', config),
            axios.get('http://localhost:4000/messages/students-with-userid', config),
            axios.get(`http://localhost:4000/student/by-user/${req.session.userID}`, config)
        ]);

        return res.render('studentmessages', {
            user: {
                id: req.session.userID,
                email: req.session.email
            },
            pathways: pathwaysRes.data,
            levels: levelsRes.data,
            statuses: statusesRes.data,
            students: studentsRes.data,
            student: studentProfileRes.data
        });

    } catch (err) {
        console.error("Error loading messaging page:", err.message);
        return res.status(500).send("Error loading messaging page.");
    }
});

// GET: Student inbox messages
router.get('/inbox', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:4000/messages/received/${req.session.userID}`, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to load inbox";
        return res.status(status).json({ error: message });
    }
});

// POST: Student contacts advisor
router.post('/contact-advisor', async (req, res) => {
    const payload = {
        sender_id: req.session.userID,
        subject: req.body.subject,
        body: req.body.body
    };

    try {
        const response = await axios.post('http://localhost:4000/messages/contact-advisor', payload, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to send message to advisor";
        return res.status(status).json({ error: message });
    }
});

// GET: Student sent messages
router.get('/sent-from-student', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:4000/messages/sent-from-student/${req.session.userID}`, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to fetch sent messages";
        return res.status(status).json({ error: message });
    }
});

// Routes accessed by both admin and student

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