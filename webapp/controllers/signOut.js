const express = require("express");
const router = express.Router();

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Error logging out");
        }

        res.clearCookie('connect.sid'); 
        res.redirect('/?loggedOut=1');
    });
});

module.exports = router;
