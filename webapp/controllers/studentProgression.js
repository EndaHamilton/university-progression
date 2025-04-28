const axios = require("axios");

const router = require("../utils/studentOnlyRouter")(); // wrapped router - middleware to check if user is student

const getApiConfig = require('../utils/apiConfig');
const config = getApiConfig(); //default JSON

//GET all profile details of specific student - based on user ID
router.get('/', async (req, res) => {

  try {

    const userId = req.session.userID;

    const profileRes = await axios.get(`http://localhost:4000/student/by-user/${userId}`, config);

    res.render('studentprogression', {
      user: {
        id: req.session.userID,
        email: req.session.email
      },
      student: profileRes.data
    });

  } catch (error) {
    console.error("Error fetching profile data:", error.message);
    res.status(500).send("Error loading profile.");
  }

});

module.exports = router;
