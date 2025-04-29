const express = require('express');
const router = express.Router();
const checkApiKey = require('../middleware/checkApiKey');

router.use(checkApiKey) // Apply the API key check middleware to all routes in this router

module.exports = function (db) {

    const validateMessageFields = require('../utils/validateMessageFields');

    // GET: List of students with user.id (for admin messaging dropdown)
    router.get('/students-with-userid', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
        SELECT 
            s.id AS student_id,
            u.id AS user_id,
            s.first_name,
            s.last_name,
            s.student_number,
            p.name AS pathway_name,
            l.name AS level_name,
            ss.name AS study_status_name
        FROM user u
        JOIN student s ON u.student_id = s.id
        LEFT JOIN pathway p ON s.pathway_id = p.id
        LEFT JOIN level l ON s.current_level_id = l.id
        LEFT JOIN study_status ss ON s.study_status_id = ss.id
        WHERE u.role = 'student'
        ORDER BY s.first_name;
      `);

            return res.status(200).json(rows);
        } catch (err) {
            console.error("Error fetching students with user IDs:", err.message);
            return res.status(500).json({ error: "Failed to fetch students" });
        }
    });

    // POST: Send individual message
    router.post('/individual', validateMessageFields('individual'), async (req, res) => {
        const { sender_id, receiver_id, subject, body } = req.body;

        try {
            const [result] = await db.promise().query(`
        INSERT INTO messages (sender_id, receiver_id, subject, body)
        VALUES (?, ?, ?, ?)
      `, [sender_id, receiver_id, subject, body]);

            return res.status(200).json({ message: "Message sent successfully", insertId: result.insertId });
        } catch (err) {
            console.error("Error sending individual message:", err);
            return res.status(500).json({ error: "Failed to send individual message" });
        }
    });

    // POST: Send cohort message
    router.post('/cohort', validateMessageFields('cohort'), async (req, res) => {
        const { sender_id, subject, body, target_pathway_id, target_level_id, target_study_status_id } = req.body;

        let targetPathwayId = null;
        let targetLevelId = null;
        let targetStudyStatusId = null;

        if (target_pathway_id) {
            targetPathwayId = parseInt(target_pathway_id);
            if (isNaN(targetPathwayId) || targetPathwayId <= 0) {
                return res.status(400).json({ error: "Target pathway ID must be a positive number" });
            }
        }
        if (target_level_id) {
            targetLevelId = parseInt(target_level_id);
            if (isNaN(targetLevelId) || targetLevelId <= 0) {
                return res.status(400).json({ error: "Target level ID must be a positive number" });
            }
        }
        if (target_study_status_id) {
            targetStudyStatusId = parseInt(target_study_status_id);
            if (isNaN(targetStudyStatusId) || targetStudyStatusId <= 0) {
                return res.status(400).json({ error: "Target study status ID must be a positive number" });
            }
        }

        try {
            const [result] = await db.promise().query(`
        INSERT INTO messages (sender_id, subject, body, target_pathway_id, target_level_id, target_study_status_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
                sender_id,
                subject,
                body,
                targetPathwayId || null,
                targetLevelId || null,
                targetStudyStatusId || null
            ]);

            res.status(200).json({ message: "Cohort message sent successfully", insertId: result.insertId });
        } catch (err) {
            console.error("Error sending cohort message:", err);
            res.status(500).json({ error: "Failed to send cohort message" });
        }
    });

    // Fetch received messages for a student
    router.get('/received/:userId', async (req, res) => {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        try {
            // Fetch student's pathway, level, study status
            const [studentRows] = await db.promise().query(`
                SELECT pathway_id, entry_level_id, study_status_id 
                FROM student s
                JOIN user u ON s.id = u.student_id
                WHERE u.id = ?
                `, [userId]);

            if (studentRows.length === 0) {
                return res.status(404).json({ error: "Student not found" });
            }

            const { pathway_id, entry_level_id, study_status_id } = studentRows[0];

            // 2. Fetch matching messages
            const [messages] = await db.promise().query(`
            SELECT * FROM messages
            WHERE 
              receiver_id = ?
              OR (
                (target_pathway_id IS NULL OR target_pathway_id = ?)
                AND (target_level_id IS NULL OR target_level_id = ?)
                AND (target_study_status_id IS NULL OR target_study_status_id = ?)
              )
            ORDER BY created_at DESC
          `, [userId, pathway_id, entry_level_id, study_status_id]);

            res.status(200).json(messages);
        } catch (err) {
            console.error("Error fetching received messages:", err);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });


    // GET: Fetch sent messages for a user
    router.get('/sent/:userId', async (req, res) => {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        if (userId <= 0) {
            return res.status(400).json({ error: "Invalid user ID. Must be a postive whole number" });
        }

        try {
            const [rows] = await db.promise().query(`
        SELECT 
            m.*, 
            s.first_name AS receiver_first_name, 
            s.last_name AS receiver_last_name, 
            s.student_number AS receiver_student_number,
            p.name AS target_pathway_name,
            l.name AS target_level_name,
            ss.name AS target_status_name
        FROM messages m
        LEFT JOIN user u ON m.receiver_id = u.id
        LEFT JOIN student s ON u.student_id = s.id
        LEFT JOIN pathway p ON m.target_pathway_id = p.id
        LEFT JOIN level l ON m.target_level_id = l.id
        LEFT JOIN study_status ss ON m.target_study_status_id = ss.id
        WHERE m.sender_id = ?
        ORDER BY m.created_at DESC

      `, [userId]);

            res.status(200).json(rows);
        } catch (err) {
            console.error("Error fetching sent messages:", err);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });

    // PATCH: Mark a message as read
    router.patch('/read/:messageId', async (req, res) => {
        const messageId = parseInt(req.params.messageId);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: "Invalid message ID" });
        }

        try {
            await db.promise().query(`
        UPDATE messages SET is_read = 1 WHERE id = ?
      `, [messageId]);

            res.status(200).json({ message: "Message marked as read" });
        } catch (err) {
            console.error("Error marking message as read:", err);
            res.status(500).json({ error: "Failed to update message status" });
        }
    });

    //POST: for student messaging - as they can only contact their advisor
    router.post('/contact-advisor', validateMessageFields('contact'), async (req, res) => {
        const { sender_id, subject, body } = req.body;

        try {
            const [studentRows] = await db.promise().query(`
                SELECT pathway_id
                FROM student s
                JOIN user u ON s.id = u.student_id
                WHERE u.id = ?
            `, [sender_id]);

            if (!studentRows.length) return res.status(404).json({ error: "Student not found" });

            const pathwayId = studentRows[0].pathway_id;

            const advisorByPathway = {
                1: 6, // Hardcoded user ID for IFSY advisor from user table in DB
                2: 7, // Hardcoded user ID for BSAS advisor from user table in DB
            };

            const receiver_id = advisorByPathway[pathwayId];
            if (!receiver_id) return res.status(400).json({ error: "No advisor assigned for this pathway" });

            await db.promise().query(`
                INSERT INTO messages (sender_id, receiver_id, subject, body)
                VALUES (?, ?, ?, ?)
            `, [sender_id, receiver_id, subject, body]);

            return res.status(200).json({ message: "Message sent to advisor" });

        } catch (err) {
            console.error("Error contacting advisor:", err.message);
            return res.status(500).json({ error: "Failed to send message to advisor" });
        }
    });

    // GET: Sent messages from student (to advisor/admin)
    router.get('/sent-from-student/:userId', async (req, res) => {
        try {
            const [rows] = await db.promise().query(`
        SELECT 
          m.*, 
          u.email AS receiver_email
        FROM messages m
        LEFT JOIN user u ON m.receiver_id = u.id
        WHERE m.sender_id = ?
        ORDER BY m.created_at DESC
      `, [req.params.userId]);

            res.status(200).json(rows);
        } catch (err) {
            console.error("Error fetching student sent messages:", err.message);
            res.status(500).json({ error: "Failed to fetch sent messages" });
        }
    });



    return router;

}