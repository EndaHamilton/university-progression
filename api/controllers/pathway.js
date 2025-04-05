const express = require('express');
const router = express.Router();

module.exports = function (db) {

    router.get('/', (req, res) => {
        const pathwaySQL = 'SELECT * FROM pathway';
        db.query(pathwaySQL, (err, rows) => {
            if (err) {
                console.error('Error fetching pathways:', err);
                return res.status(500).send('Error fetching pathways');
            }
            if (rows.length === 0) {
                return res.status(404).send('No pathways found');
            }
            res.json(rows);
        });
    });


    return router;
};