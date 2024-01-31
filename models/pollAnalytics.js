const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Option = require('./option');
const QuestionSet = require('./questionSet'); 
const Poll = require('./poll'); 


const PollAnalytics = sequelize.define('PollAnalytics', {
  totalVotes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
});

QuestionSet.belongsTo(Poll, { foreignKey: 'pollId' });
QuestionSet.hasMany(Option, { foreignKey: 'questionSetId' });


module.exports = PollAnalytics;
