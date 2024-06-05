const Sequelize = require("sequelize");
const CountryMaster = require("../models/countrymaster");
const logger = require("../config/logger");
const message = require("../response_message/message");
const fs = require("fs");
const sequelize = require("../config/database");
/**
 * save country data.
 *
 * @body {}  user id of user who added the country.
 * @body {number}  if any user change data then updateBy id change.
 
 */
exports.postAddCountry = async (req, res, next) => {
  try {
    let = { countryName, countryCode } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await CountryMaster.create(
        {
          countryName,
          countryCode,
        },
        { transaction: t }
      );
      logger.info(`countryMaster insert data ${JSON.stringify(req.body)}`);
      res.status(200).json({
        status: 200,
        message: message.usermessage.countryadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all country data
 */

exports.getAllCountryData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let country_master = [];
    if (limit == "" && page == "") {
      country_master = await CountryMaster.findAll({
        raw: true,
        order: [["countryName", "ASC"]],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      country_master = await CountryMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [["countryName", "ASC"]],
      });
    }
    const totalcount = await CountryMaster.count({
      raw: true,
      where: { status: ["0", "1"] },
    });

    logger.info(`countryMaster get data ${JSON.stringify(country_master)} `);
    res
      .status(200)
      .json({ status: 200, data: country_master, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with countryMaster id
 *
 * @param {id} countryMasterID  to fetch country name
 */

exports.getCountryById = async (req, res, next) => {
  try {
    let get_one_data = await CountryMaster.findOne({
      where: {
        countryMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });
    logger.info(
      `countryMaster get by id ${JSON.stringify(
        req.params.id
      )} Resultes ${JSON.stringify(get_one_data)}`
    );
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} countryMasterID  to update id
 */
exports.postUpdateCountry = async (req, res, next) => {
  try {
    let = { countryMasterID, countryName, countryCode, updateBy, updateByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CountryMaster.update(
        {
          countryName,
          countryCode,
          updateBy,
          updateByIp,
        },
        {
          where: { countryMasterID: countryMasterID },
          transaction: t,
        }
      );
      logger.info(
        `countryMaster Update Data ${JSON.stringify(
          change_data_status
        )} By update By id ${updateBy}`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.countryupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} countryMasterID  to update status of country
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { countryMasterID, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        delete_status = await CountryMaster.update(
          {
            status: "1",
          },
          {
            where: { countryMasterID: countryMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        delete_status = await CountryMaster.update(
          {
            status: "0",
          },
          {
            where: { countryMasterID: countryMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        logger.info(
          `countryMaster Delete by id ${delete_status} Delete By user Id 1`
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.countrydelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      const error = new Error("No File");
      error.httpStatusCode = 400;
      console.log("Getting error :-", error);
      return next(error);
    } else {
      fs.readFile("./uploads/" + file.filename, async (err, data) => {
        if (err) throw err;

        const countryData = JSON.parse(data);
        let countries = [];

        for (const country of countryData) {
          countries.push({
            countryName: country.name,
            countryCode: country.phone_code,
          });
        }

        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await CountryMaster.bulkCreate(countries, {
            returning: true,
            transaction: t,
          });
          res.json({ success: 200, message: "data inserted" });
          return insert_db_status;
        });
      });
    }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} countryMasterID  to delete id
 */
exports.postDeleteCountryById = async (req, res, next) => {
  try {
    let = { countryMasterID } = await req.body;
    // let delete_db_status = await CountryMaster.destroy({
    //     where: {
    //         countryMasterID: countryMasterID
    //     }
    // });

    let result = await sequelize.transaction(async (t) => {
      let delete_status = await CountryMaster.update(
        {
          status: 2,
        },
        {
          where: { countryMasterID: countryMasterID },
          transaction: t,
        }
      );
      logger.info(
        `countryMaster Delete by id ${delete_status} Delete By user Id 1`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.countrydelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
