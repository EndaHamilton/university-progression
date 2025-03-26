const express = require('express');
const mysql = require('mysql2');

const app = express(); // create express app
const port = 3000;

app.use(express.json()); // middleware to parse json requests

//create a mySQL connection 
const db = mysql.createConnection({
    host: "localhost",
    user: "root",       // Replace with your MySQL username
    password: "root",       // Replace with your MySQL password
    database: "academics"    // Name of the database
});

//connect to mySQL
db.connect(err => {
    if (err) {
        console.error('Failed to connect to database');
    } else {
        console.log('Connected to database');
    }
});

// // define a route on '/students' that uses the studentRoutes controller
const studentRoutes = require('./controllers/student')(db);
app.use('/student', studentRoutes);


// start express server on port 3000
app.listen(port, () => {
    console.log(`Server started on port http://localhost:${port}`);
});