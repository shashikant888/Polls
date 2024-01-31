const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuestionSet = sequelize.define('QuestionSet', {
  questionType: {
    type: DataTypes.ENUM('single', 'multiple'),
    allowNull: false
  },
  questionText: {
    type: DataTypes.STRING,
    allowNull: false
  },
  options: {
    type: DataTypes.JSON, 
    defaultValue: [] 
  },
});

module.exports = QuestionSet;
