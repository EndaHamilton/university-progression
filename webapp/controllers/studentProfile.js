const express = require("express");
const router = express.Router();
const requireStudent = require("../middleware/requireStudent");

router.get('/', requireStudent, (req, res) => {
  res.render('studentprofile', {
    user: {
      id: req.session.userID,
      email: req.session.email
    }
  });
});

module.exports = router;
