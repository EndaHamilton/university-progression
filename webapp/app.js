const express = require("express");
const app = express();
const session = require("express-session");

app.use(session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.set('view engine', 'ejs');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: true }));

app.use(express.json()); // middleware to parse json requests

//Student Mannagement page route
const studentManagementRoutes = require("./controllers/studentManagement");
app.use('/studentmanagement', studentManagementRoutes);

//Sign in page route
const signInRoutes = require("./controllers/signIn");
app.use('/', signInRoutes);


app.listen(3000, (err) => {
    if (err) console.log(err);
    console.log("Academics Progression is listening on http://localhost:3000");
});