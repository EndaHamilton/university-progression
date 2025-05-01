const express = require('express');
const mysql = require('mysql2');

const app = express(); // create express app
const port = 4000;

app.use(express.json({limit: '10mb'})); // middleware to parse json requests
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Middleware to parse URL-encoded data

//create a mySQL connection 
const db = mysql.createConnection({
    host: "localhost",
    user: "root",       //  MySQL username
    password: "root",       // MySQL password
    database: "acad_progression_new"    // Name of the database
});

//connect to mySQL
db.connect(err => {
    if (err) {
        console.error('Failed to connect to database');
    } else {
        console.log('Connected to database');
    }
});

// define authentication route that uses the auth controller
const authRoutes = require('./controllers/auth')(db);
app.use('/auth', authRoutes);

// define a route on '/module' that uses the module controller
const moduleRoutes = require('./controllers/module')(db);
app.use('/module', moduleRoutes);

// define a route on '/students' that uses the studentRoutes controller
const studentRoutes = require('./controllers/student')(db);
app.use('/student', studentRoutes);

// define a route on '/pathway' that uses the pathwayRoutes controller
const pathwayRoutes = require('./controllers/pathway')(db);
app.use('/pathway', pathwayRoutes);

// define a route on '/studystatus' that uses the studyStatus controller
const studyStatus = require('./controllers/studystatus')(db);
app.use('/studystatus', studyStatus);

// define a route on '/entrylevel' that uses the entryLevelRoutes controller
const levelRoutes = require('./controllers/level')(db);
app.use('/level', levelRoutes);

// define a route on '/semester' that uses the semesterRoutes controller
const semesterRoutes = require('./controllers/semester')(db);
app.use('/semester', semesterRoutes);

// define a route on '/grades' that uses the gradesRoutes controller
const gradesRoutes = require('./controllers/grades')(db);
app.use('/grades', gradesRoutes);

// define a route on '/acadyear' that uses the acadYearRoutes controller
const acadYearRoutes = require('./controllers/acadyear')(db);
app.use('/acadyear', acadYearRoutes);

// define a route on '/subject' that uses the subectRoutes controller
const subjectRoutes = require('./controllers/subject')(db);
app.use('/subject', subjectRoutes);

// define a route on '/messages' that uses the messages controller
const messagesRoutes = require('./controllers/messages')(db);
app.use('/messages', messagesRoutes);


// start express server on port 4000
app.listen(port, () => {
    console.log(`Server started on port http://localhost:${port}`);
});