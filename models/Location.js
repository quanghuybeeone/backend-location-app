const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Location = sequelize.define(
  'Location',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('approved', 'rejected', 'pending'),
      allowNull: false,
    },
    types: {
      type: DataTypes.ENUM('hospital', 'school', 'park', 'supermarket'),
      allowNull: false,
    },
  },
  {
    tableName: 'locations',
    timestamps: false,
  }
);

module.exports = Location;