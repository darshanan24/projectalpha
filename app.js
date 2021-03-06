const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');

//routing to different apis
const projectRoutes = require("./api/routes/projects");
const profileRoutes = require("./api/routes/profiles");
const enrichedEventRoutes = require("./api/routes/enrichedEvents");
const rawEventRoutes = require("./api/routes/rawEvents");
const dataSourcesRoutes = require("./api/routes/dataSources")
const joinedEventRoutes = require("./api/routes/joinedEvents")
const userRoutes = require("./api/routes/users");
//const kafkadataRoutes = require("./api/routes/confluentkafkadata");
const config = require('./config/database');

mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
  console.log(err);
}); 
//mongoose.connect("mongodb://127.0.0.1:27017/test");

//to avoid depricated warning
mongoose.Promise = global.Promise;
// can Remove this app.use(morgan("dev")) before releasing to production 
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false })); // extended is false, coz since we are not using complicated urls. If i do, then performance may not be optimum.
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  }));
// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});


// Routes which should handle requests
app.use("/", projectRoutes);  //base path for projects
app.use("/profiles", profileRoutes);
app.use("/project/v1", enrichedEventRoutes);  //base path for Enriched Event
app.use("/project/v1", rawEventRoutes);  //base path for Raw Event
app.use("/project/v1",dataSourcesRoutes);
app.use("/project/v1",joinedEventRoutes);
app.use("/user", userRoutes);
//app.use("/confluent/kafka",kafkadataRoutes);
// applicable to all apis
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});
// applicable to all apis
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;
