const express = require('express');
const router = express.Router();
const checkApiKey = require("../middleware/checkApiKey");

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    // GET: All grades grouped by student
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
         SELECT 
        sm.id AS student_module_id,
        s.id AS student_id,
        s.student_number,
        s.first_name,
        s.last_name,
        m.title AS module_title,
        ay.name AS academic_year,
        sm.first_grade,
        sm.grade_result,
        sm.resit_grade,
        sm.resit_result
      FROM student_module sm
      JOIN student s ON sm.student_id = s.id
      JOIN module m ON sm.module_id = m.id
      JOIN acad_year ay ON sm.academic_year_id = ay.id
      ORDER BY s.last_name, ay.name
      `);

            // Group results by student
            const grouped = {};
            rows.forEach(row => {
                if (!grouped[row.student_id]) {
                    grouped[row.student_id] = {
                        student_id: row.student_id,
                        student_number: row.student_number,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        grades: []
                    };
                }
                grouped[row.student_id].grades.push({
                    module_title: row.module_title,
                    academic_year: row.academic_year,
                    first_grade: row.first_grade,
                    grade_result: row.grade_result,
                    resit_grade: row.resit_grade,
                    resit_result: row.resit_result
                });
            });

            res.json(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching grades:', error);
            res.status(500).json({ message: 'Failed to retrieve grades' });
        }
    });

    return router;
}