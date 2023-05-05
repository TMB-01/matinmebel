const {startDB} = require("./db/db.js")
const {Salary} = require("./db/modules.js")
const {startServer} = require("./controller");
const {createSuperAdmin} = require("./db/modules");
require("dotenv").config();

//SERVER
startServer();


//DATABASE
const s = async () => {
    await startDB();
    await createSuperAdmin();
};
s()