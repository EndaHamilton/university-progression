const express = require("express");
const router = express.Router();
const axios = require("axios");

const getApiConfig = require("../utils/apiConfig");
const configForm = getApiConfig('application/x-www-form-urlencoded'); // Get the config for login - different from config for all other pages

router.get('/', (req, res) => {
    const showError = req.query.error; 
    const showLogout = req.query.loggedOut;
    res.render('signin', { error: showError, loggedOut: showLogout });
});

router.post('/login', async (req, res) => {
    const emailData = req.body.email_field;
    const passswordData = req.body.password_field;


    const authEndpoint = 'http://localhost:4000/auth/authenticate';
    const payload = { "email": emailData, "password": passswordData };


    try {
        const response = await axios.post(authEndpoint, payload, configForm);
        console.log("Response from API: ", response.data);
        if (response.data.authenticate) {
            req.session.userID = response.data.userID; 
            req.session.email = emailData; 
            req.session.role = response.data.role; 


            if (req.session.role === 'admin') {
                return res.redirect('studentmanagement');
            } else if (req.session.role === 'student') {
                req.session.studentID = response.data.student_id;
                return res.redirect('studentprofile');
            } else {
                return res.redirect('/?error=1'); // Fallback in case of unknown role error
            }
        } else {
            return res.redirect('/?error=1');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;