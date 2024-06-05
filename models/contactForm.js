const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "contactForm";

const ContactForm = sequelize.define(
  table_name,
  {
    contactFormID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    contactName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    contactEmail: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    contactPhone: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    contactSubject: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    contactDescription: {
      type: Sequelize.STRING,
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

module.exports = ContactForm;
