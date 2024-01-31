const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const QuestionSet = require('./questionSet');


const Poll = sequelize.define("Poll", {
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isCorrectFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error("startDate must be in YYYY-MM-DD format.");
        }
      },
    },
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isCorrectFormat(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error("endDate must be in YYYY-MM-DD format.");
        }
      },
    },
  },
  minReward: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  maxReward: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

Poll.hasMany(QuestionSet, { foreignKey: 'pollId' });

module.exports = Poll;
