const express = require("express");
const app = express();
const session = require("express-session");

const port = 3000;

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

// Module Mamagement page route
const moduleManagementRoutes = require("./controllers/moduleManagement");
app.use('/modulemanagement', moduleManagementRoutes);

//Sign in page route
const signInRoutes = require("./controllers/signIn");
app.use('/', signInRoutes);

// Student profile route
const studentProfileRoutes = require("./controllers/studentProfile");
app.use('/studentprofile', studentProfileRoutes);

// Student Progression page route
const studentProgressionRoutes = require("./controllers/studentProgression");
app.use('/studentprogression', studentProgressionRoutes);

// Grade Management page route
const gradeManagementRoutes = require("./controllers/gradeManagement");
app.use('/grademanagement', gradeManagementRoutes);

// Pathway Management page route
const pathwayManagementRoutes = require("./controllers/pathwayManagement");
app.use('/pathwaymanagement', pathwayManagementRoutes);

// Admin Analytics page route
const adminAnalyticsRoutes = require("./controllers/adminAnalytics");
app.use('/adminanalytics', adminAnalyticsRoutes); 

// Message Management page route
const messageManagementRoutes = require("./controllers/messageManagement");
app.use('/adminmessages', messageManagementRoutes); // admin messages page access
app.use('/studentmessages', messageManagementRoutes); // student messages page access - using different namnes to avoid confusion, even though they are accessing same route

app.listen(port, (err) => {
    if (err) console.log(err);
    console.log(`Academics Progression is listening on http://localhost:${port}`);
});