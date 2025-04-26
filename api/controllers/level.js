const express = require('express');
const router = express.Router();

module.exports = function (db) {

    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM level';
        db.query(sql, (err, rows) => {
            if (err) {
                console.error('Error fetching level:', err);
                return res.status(500).send('Error fetching level');
            }
            if (rows.length === 0) {
                return res.status(404).send('No level found');
            }
            res.json(rows);
        });
    });


    return router;
};