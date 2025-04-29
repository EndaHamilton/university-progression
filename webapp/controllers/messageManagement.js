const express = require('express');
const router = express.Router();
const axios = require('axios');

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig();

const requireAdmin = require('../middleware/requireAdmin');
const requireStudent = require('../middleware/requireStudent');


// Admin only routes

// GET: Render admin communication dashboard
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [pathwaysRes, levelsRes, statusesRes, studentsRes] = await Promise.all([
            axios.get('http://localhost:4000/pathway', config),
            axios.get('http://localhost:4000/level', config),
            axios.get('http://localhost:4000/studystatus', config),
            axios.get('http://localhost:4000/student/details', config)
        ]);

        console.log('Rendering adminmessages.ejs for user:', req.session.userID, req.session.email);
        console.log('Session contents:', req.session);


        res.render('adminmessages', {
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
        res.status(500).send("Error loading messaging page.");
    }
});

// POST: Send message to individual student
router.post('/send-individual', requireAdmin, async (req, res) => {
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
router.post('/send-cohort', requireAdmin, async (req, res) => {
    try {
        const response = await axios.post('http://localhost:4000/messages/cohort', req.body, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to send cohort message";
        return res.status(status).json({ error: message });
    }
});


// Student only routes

// GET: Student inbox messages
router.get('/inbox', requireStudent, async (req, res) => {
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
router.post('/contact-advisor', requireStudent, async (req, res) => {
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

// Routes accessed by both admin and student

// PATCH: Mark message as read
router.patch('/read/:id', async (req, res) => {
    try {
        const response = await axios.patch(`http://localhost:4000/messages/read/${req.params.id}`, {}, config);
        return res.status(200).json(response.data);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.error || "Failed to update message status";
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