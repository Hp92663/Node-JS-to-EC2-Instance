const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "userMaster";

const UserMaster = sequelize.define(
  table_name,
  {
    userMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    userName: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    password: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    emailAddress: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    },

    userAddress: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    userMobile: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    },

    resetpassword: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },

    passwordToken: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    admin: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },

    createBy: {
      type: Sequelize.INTEGER,
    },

    updateBy: {
      type: Sequelize.INTEGER,
    },

    deleteBy: {
      type: Sequelize.INTEGER,
    },

    createByIp: {
      type: Sequelize.STRING,
    },

    updateByIp: {
      type: Sequelize.STRING,
    },

    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

module.exports = UserMaster;
