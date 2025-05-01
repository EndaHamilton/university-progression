const axios = require("axios");

const router = require("../utils/studentOnlyRouter")(); // wrapped router - middleware to check if user is student

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all profile details of specific student - based on user ID
router.get('/', async (req, res) => {

  try {

    const userId = req.session.userID;

    const profileRes = await axios.get(`http://localhost:4000/student/by-user/${userId}`, config);

    res.render('studentprofile', {
      user: {
        id: req.session.userID,
        email: req.session.email
      },
      student: profileRes.data
    });

  } catch (error) {
    console.error("Error fetching profile data:", error.message);
    return res.status(500).send("Error loading profile.");
  }

});

// Update student profile - sends limited upate data to student PUT endpoint
router.put('/update', async (req, res) => {
  const studentId = req.session.studentID;
  const payload = {
    secondary_email: req.body.secondary_email || null
  };

  try {
    const response = await axios.put(`http://localhost:4000/student/${studentId}`, payload, config);
    return res.json(response.data);
  } catch (err) {
    console.error("Error updating student:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({ error: err.response?.data?.error || "Server error" });
  }
});

module.exports = router;
