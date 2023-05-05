const {Sequelize} = require("sequelize")
// const {Salary} = require("./modules");


const sequelize = new Sequelize('matin_mebel', 'postgres', 'maraim', {
    host: 'localhost',
    dialect: 'postgres',
    // logging:false,
});


const startDB = async () => {
    return new Promise((resolve, reject) => {
        try {
            sequelize.authenticate();
            sequelize.sync({alter: true})
                .then((r) => {
                    // createSuperAdmin();
                    console.log("Synchronized")
                    resolve("done")
                    // Salary.create();
                })
                .catch((err) => {
                    console.log("this is sync err ", err)
                    reject("Error: ", err)
                });
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            reject("Error: ", error)
        }
    })
}

module.exports = {
    // data: {
    sequelize, startDB
    // }
}