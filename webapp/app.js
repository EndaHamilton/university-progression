const express = require("express");
const app = express();
const axios = require("axios");

app.set('view engine', 'ejs');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: true })); 


app.get('/pagetemplate', (req, res) => {

    res.render("pagetemplate")

});

app.get('/', async (req, res) => {

    try {
        //GET request to API endpoint to get all students
        const allStudentsEp = "http://localhost:4000/student/details";
        const response = await axios.get(allStudentsEp);
        const students = response.data;

        //Render EJS view and pass in student data
        res.render("studentmanagement", { students: students });

    } catch (error) {
        console.error("Error returning students", error.message);
        res.status(500).send("Internal Server Error");
    }
    

});



app.listen(3000, (err) => {
    if (err) console.log(err);
    console.log("Academics Progression is listening on http://localhost:3000");
});