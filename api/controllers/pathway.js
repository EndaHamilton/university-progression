const express = require('express');
const router = express.Router();

const checkApiKey = require("../middleware/checkApiKey");
router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    // GET - Fetch all pathways
    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM pathway';
        db.query(sql, (err, rows) => {
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

    // POST - Assign a module to a pathway
    router.post('/assign-module', async (req, res) => {
        const { pathway_id, module_id, pathway_level, is_core, is_optional_core, optional_amount } = req.body;

        if (isNaN(pathway_id)) {
            return res.status(400).json({ error: 'Invalid pathway ID. Must be a number' });
        }
        if (isNaN(module_id)) {
            return res.status(400).json({ error: 'Invalid module ID. Must be a number' });
        }
        if (isNaN(pathway_level)) {
            return res.status(400).json({ error: 'Invalid pathway level. Must be a number' });
        }
        if (pathway_level < 1 || pathway_level > 3) {
            return res.status(400).json({ error: 'Invalid pathway level. Must be between 1 and 3' });
        }
        if (is_core !== undefined && is_core !== null && is_core !== '') {
            if (isNaN(is_core)) {
                return res.status(400).json({ error: 'Invalid core status. Must be a boolean' });
            }
            if (is_core !== 0 && is_core !== 1) {
                return res.status(400).json({ error: 'Invalid core status. Must be 0 or 1' });
            }
        }
        if (is_optional_core !== undefined && is_optional_core !== null && is_optional_core !== '') {
            if (isNaN(is_optional_core)) {
                return res.status(400).json({ error: 'Invalid optional core status. Must be a boolean' });
            }
            if (is_optional_core !== 0 && is_optional_core !== 1) {
                return res.status(400).json({ error: 'Invalid optional core status. Must be 0 or 1' });
            }
        }
        if (optional_amount !== undefined && optional_amount !== null && optional_amount !== '') {
            if (isNaN(optional_amount)) {
                return res.status(400).json({ error: 'Invalid optional amount. Must be a number' });
            }
        }

        try {
            await db.promise().query(
                `INSERT INTO pathway_module 
                 (pathway_id, module_id, pathway_level, core, optional_core, optional_amount)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    parseInt(pathway_id),
                    parseInt(module_id),
                    parseInt(pathway_level),
                    parseInt(is_core),
                    is_optional_core !== null ? parseInt(is_optional_core) : null,
                    optional_amount !== null && optional_amount !== '' ? parseInt(optional_amount) : null
                ]
            );

            return res.status(200).json({ message: "Module assigned to pathway successfully!" });
        } catch (err) {
            console.error("Error assigning module to pathway:", err);
            return res.status(500).json({ error: "Failed to assign module to pathway" });
        }
    });



    return router;
};