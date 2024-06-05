const Sequelize = require("sequelize");
const CityMaster = require("../models/citymaster");
const logger = require("../config/logger");
const message = require("../response_message/message");
const sequelize = require("../config/database");
const StateMaster = require("../models/statemaster");
const fs = require("fs");
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCity = async (req, res, next) => {
  try {
    let { cityName, stateMasterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await CityMaster.create(
        {
          cityName,
          stateMasterID,
        },
        { transaction: t }
      );
      logger.info(`cityMaster insert data ${JSON.stringify(req.body)}`);
      res.status(200).json({
        status: 200,
        message: message.usermessage.cityadd,
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
 return all city data
 */

exports.getAllCityData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let city_master = [];
    if (limit == "" && page == "") {
      city_master = await CityMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [["cityName", "ASC"]],
        include: "stateMaster",
      });
    } else {
      city_master = await CityMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [["cityName", "ASC"]],
        limit: limit,
        offset: offset,
        include: "stateMaster",
      });
    }
    const totalcount = await CityMaster.count({
      raw: true,
      where: { status: ["0", "1"] },
    });
    logger.info(`cityMaster get data ${JSON.stringify(city_master)} `);
    res
      .status(200)
      .json({ status: 200, data: city_master, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with cityMaster id
 *
 * @param {id} cityMasterID  to fetch city name
 */

exports.getCityById = async (req, res, next) => {
  try {
    let get_one_data = await CityMaster.findOne({
      where: {
        cityMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });
    logger.info(
      `cityMaster get by stateMasterID ${JSON.stringify(
        req.params.id
      )} Results ${JSON.stringify(get_one_data)}`
    );
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

/**
 * find data with stateMasterID
 *
 * @param {id} stateMasterID  to fetch city name
 */

exports.getCityBystateId = async (req, res, next) => {
  try {
    let get_one_data = await CityMaster.findAll({
      where: { stateMasterID: req.params.id },
      raw: true,
    });
    logger.info(
      `cityMaster get by id ${JSON.stringify(
        req.params.id
      )} Results ${JSON.stringify(get_one_data)}`
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
 * @param {id} cityMasterID  to update id
 */
exports.postUpdateCity = async (req, res, next) => {
  try {
    let { cityMasterID, cityName, stateMasterID, updateBy, updateByIp } =
      await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CityMaster.update(
        {
          cityName,
          stateMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { cityMasterID: cityMasterID },
          transaction: t,
        }
      );
      logger.info(
        `cityMaster Update Data ${JSON.stringify(
          change_data_status
        )} By update By id ${updateBy}`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.cityupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} cityMasterID  to update status of city
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { cityMasterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        delete_status = await CityMaster.update(
          {
            status: "1",
          },
          {
            where: { cityMasterID: cityMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        delete_status = await CityMaster.update(
          {
            status: "0",
          },
          {
            where: { cityMasterID: cityMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        logger.info(
          `cityMaster Delete by id ${delete_status} Delete By user Id 1`
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.citydelete,
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

/**
 * delete by i
 *
 * @param {id} cityMasterID  to delete id
 */
exports.postDeleteCityById = async (req, res, next) => {
  try {
    let = { cityMasterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await CityMaster.update(
        {
          status: 2,
        },
        {
          where: { cityMasterID: cityMasterID },
          transaction: t,
        }
      );
      logger.info(
        `cityMaster Delete by id ${delete_status} Delete By user Id 1`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.citydelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * to get country id of state
 * @param {*} stateName
 */

let getStateId = async (stateName) => {
  try {
    let get_state_id = await StateMaster.findOne({
      attributes: ["stateMasterID"],
      where: { stateName: stateName },
    });
    return get_state_id.stateMasterID;
  } catch (err) {
    return err;
  }
};

/**
 * import country data
 * @param {file}
 */
exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;
    let {} = req.body;

    if (!file) {
      const error = new Error("No File");
      error.httpStatusCode = 400;
      console.log("Getting error :-", error);
      return next(error);
    } else {
      fs.readFile("./uploads/" + file.filename, async (err, data) => {
        if (err) throw err;

        const countryData = JSON.parse(data);
        let cities = [];

        // for (const country of countryData) {
        for (const state of countryData[102].states) {
          let state_id = await getStateId(state.name);
          for (const city of state.cities) {
            cities.push({
              cityName: city.name,
              stateMasterID: state_id,
            });
          }
        }
        // }
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await CityMaster.bulkCreate(cities, {
            returning: true,
            transaction: t,
          });

          res.json({ success: 200, message: "data inserted" });
          return insert_db_status;
        });
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
