const {startDB} = require("./db/db.js")
const {Salary} = require("./db/modules.js")
const {startServer} = require("./controller");
require("dotenv").config();

//SERVER
startServer();


//DATABASE
startDB();