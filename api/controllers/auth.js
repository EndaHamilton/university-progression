const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {
    router.post('/authenticate', (req, res) => {
        console.log('Received authentication request:', req.body);

        const { email, password } = req.body;
        const sql = 'SELECT * FROM user WHERE email = ? OR username = ?'; // allows login with either email or username

        db.query(sql, [email, email], async (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (rows.length > 0) {
                const user = rows[0];
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (passwordMatch) {
                    return res.json({ authenticate: true, userID: user.id, role: user.role });
                } else {
                    return res.json({ authenticate: false });
                }
            } else {
                return res.status(404).json({ error: "User not found." });
            }
        });
    });

    return router;
};