const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "contactForm";

const ContactForm = sequelize.define(table_name, {
  contactQueryFormID: {
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
});

module.exports = ContactForm;
