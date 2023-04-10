const {Sequelize} = require("sequelize")
// const {Salary} = require("./modules");


const sequelize = new Sequelize('matin_mebel', 'postgres', 'maraim', {
    host: 'localhost',
    dialect: 'postgres',
    logging:true,
});

const startDB = async () => {
    try {
        sequelize.authenticate();
        sequelize.sync({alter: true})
            .then((r) => {
                // createEventTypes();
                console.log("Synchronized")
                // Salary.create();
            })
            .catch((err) => {
                console.log("this is sync err ", err)
            });
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = {
    // data: {
    sequelize, startDB
    // }
}