const express = require('express');
const router = express.Router();

module.exports = function (db) {
    router.post('/authenticate', (req, res) => {
        console.log('Received authentication request:', req.body);

        const { email, password } = req.body;
        const sql = 'SELECT * FROM user WHERE email = ? AND password = ?';

        db.query(sql, [email, password], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (rows.length > 0) {
                res.json({ authenticate: true, userID: rows[0].id, role: rows[0].role });
                console.log(`User ID: ${rows[0].id}
                            Role: ${rows[0].role}`);
            } else {
                res.json({ authenticate: false });
            }
        });
    });

    return router;
};