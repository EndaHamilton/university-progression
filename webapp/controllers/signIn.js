const express = require("express");
const router = express.Router();
const axios = require("axios");

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
    const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

    try {
        const response = await axios.post(authEndpoint, payload, config);
        console.log("Response from API: ", response.data);
        if (response.data.authenticate) {
            req.session.userID = response.data.userID; // Store user ID in session
            req.session.email = emailData; // Store email in session
            console.log("User ID stored in session: ", req.session.userID);

            return res.redirect('/studentmanagement'); // Redirect to student management page
        } else {
            return res.redirect('/?error=1'); // Redirect back to sign-in page with error message
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;