const express = require("express");
const app = express();

app.set('view engine', 'ejs');

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {

    res.render("studentmanagement")

});

app.listen(3000, (err) => {
    if (err) console.log(err);
    console.log("Academics Progression is listening on port 3000.");
});