const UserMaster = require("../models/userMaster");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const logger = require("../config/logger");

exports.getUserProfileData = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await UserMaster.findByPk(id);

    res.status(200).json({
      status: 200,
      message: "user data fetch successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { id, userName, emailAddress, userMobile, userAddress } = req.body;

    const editUserProfile = await UserMaster.update(
      {
        userName,
        emailAddress,
        userMobile,
        userAddress,
      },

      { where: { userMasterID: id } }
    );

    res.status(200).json({
      status: 200,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
    next(error);
  }
};

exports.getAllUserData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, exportData } = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { userName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { userMobile: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    const order = [["userMasterID", "DESC"]];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const allUserData = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });

    const dataToExport = allUserData.rows;

    if (exportData) {
      await generateExcel(dataToExport, "Order", "xlsx", res);
      return;
    }

    return res.status(200).json({
      message: "Order Data fetched Successfully",
      status: 200,
      data: allUserData.rows,
      totalcount: allUserData.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
    next(err);
  }
};
