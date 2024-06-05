const productCategory = require("./productCategory");
const ParentSubCategory = require("./parentSubCategory");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "productMaster";

const productMaster = sequelize.define(
  table_name,
  {
    productMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    model: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    productName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    productCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    price: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },

    image: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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

productMaster.belongsTo(productCategory, {
  foreignKey: "productCategoryID",
});

productMaster.belongsTo(ParentSubCategory, {
  foreignKey: "parentSubCategoryID",
});

module.exports = productMaster;
