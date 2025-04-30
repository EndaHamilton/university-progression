const express = require('express');
const router = express.Router();

const checkApiKey = require("../middleware/checkApiKey");
router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM semester';
        db.query(sql, (err, rows) => {
            if (err) {
                console.error('Error fetching semesters:', err);
                return res.status(500).send('Error fetching semesters');
            }
            if (rows.length === 0) {
                return res.status(404).send('No semesters found');
            }
            res.json(rows);
        });
    });


    return router;
};