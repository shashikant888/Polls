const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,{
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});


// // sync the models with the database
// const syncDatabase = async () => {
//     await sequelize.sync({ force: true }); // set force to true to recreate tables
//     console.log('Database synchronized successfully!');
//   };
//   // Run the syncDatabase function
//   syncDatabase();
  
module.exports = sequelize;
