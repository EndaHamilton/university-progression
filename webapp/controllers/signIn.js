const express = require("express");
const router = express.Router();
const axios = require("axios");

const getApiConfig = require("../utils/apiConfig"); // Import the API config function
const configForm = getApiConfig('application/x-www-form-urlencoded'); // Get the config for login

router.get('/', (req, res) => {
    const showError = req.query.error; // Check if error query parameter is present
    res.render('signin', { error: showError});
});

// Handle sign-in submission
router.post('/login', async (req, res) => {
    const emailData = req.body.email_field;
    const passswordData = req.body.password_field;


    const authEndpoint = 'http://localhost:4000/auth/authenticate';
    const payload = { "email" : emailData, "password" : passswordData };
    // const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded',
    //                             'x-api-key': 'my-secret-key' // API key for authentication
    //  } };

    try {
        const response = await axios.post(authEndpoint, payload, configForm);
        console.log("Response from API: ", response.data);
        if (response.data.authenticate) {
            req.session.userID = response.data.userID; // Store user ID in session
            req.session.email = emailData; // Store email in session
            req.session.role = response.data.role; // Store role in session

            console.log("User ID stored in session: ", req.session.userID);
            console.log("User role stored in session: ", req.session.role);

            if(req.session.role === 'admin') {
                return res.redirect('studentmanagement');
            } else if(req.session.role === 'student') {
                return res.redirect('studentprofile'); 
            } else {
                return res.redirect('/?error=1'); // Fallback in case of unknown role error
            }
        } else {
            return res.redirect('/?error=1'); // Redirect back to sign-in page with error message
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;