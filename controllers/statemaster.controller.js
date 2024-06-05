const Sequelize = require("sequelize");
const StateMaster = require("../models/statemaster");
const logger = require("../config/logger");
const message = require("../response_message/message");
const fs = require("fs");
const CountryMaster = require("../models/countrymaster");
const sequelize = require("../config/database");
/**
 * save state data.
 *
 * @body {}  user id of user who added the state.
 * @body {number}  if any user change data then updateBy id change.
 
 */
exports.postAddState = async (req, res, next) => {
  try {
    let { stateName, stateCode, countryMasterID } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await StateMaster.create(
        {
          stateName,
          stateCode,
          countryMasterID,
        },
        { transaction: t }
      );
      logger.info(`stateMaster insert data ${JSON.stringify(req.body)}`);
      res.status(200).json({
        status: 200,
        message: message.usermessage.stateadd,
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
 return all state data
 */

exports.getAllStateData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let state_master = [];
    if (limit == "" && page == "") {
      state_master = await StateMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [["stateName", "ASC"]],
        include: "countryMaster",
      });
    } else {
      state_master = await StateMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [["stateName", "ASC"]],
        limit: limit,
        offset: offset,
        include: "countryMaster",
      });
    }
    const totalcount = await StateMaster.count({
      raw: true,
      where: { status: ["0", "1"] },
    });

    logger.info(`stateMaster get data ${JSON.stringify(state_master)} `);
    res
      .status(200)
      .json({ status: 200, data: state_master, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with stateMaster id
 *
 * @param {id} stateMasterID  to fetch state name
 */

exports.getStateById = async (req, res, next) => {
  try {
    let get_one_data = await StateMaster.findOne({
      where: {
        stateMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    logger.info(
      `stateMaster get by id ${JSON.stringify(
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
 * find data with countryMaster id
 *
 * @param {id} countryMasterID  to fetch state name
 */

exports.getStateBycountryid = async (req, res, next) => {
  try {
    let get_one_data = await StateMaster.findAll({
      where: { countryMasterID: req.params.id },
      raw: true,
    });

    logger.info(
      `stateMaster get by countryMasterID ${JSON.stringify(
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
 * update data
 *
 * @param {id} stateMasterID  to update id
 */
exports.postUpdateState = async (req, res, next) => {
  try {
    let {
      stateMasterID,
      stateName,
      stateCode,
      countryMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await StateMaster.update(
        {
          stateName,
          stateCode,
          countryMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { stateMasterID: stateMasterID },
          transaction: t,
        }
      );
      logger.info(
        `stateMaster Update Data ${JSON.stringify(
          change_data_status
        )} By update By id ${updateBy}`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.stateupdate });
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
 * @param {id} stateMasterID  to update status of state
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { stateMasterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        delete_status = await StateMaster.update(
          {
            status: "1",
          },
          {
            where: { stateMasterID: stateMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        delete_status = await StateMaster.update(
          {
            status: "0",
          },
          {
            where: { stateMasterID: stateMasterID, status: ["1", "0"] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        logger.info(
          `stateMaster Delete by id ${delete_status} Delete By user Id 1`
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.statedelete,
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
 * @param {id} stateMasterID  to delete id
 */
exports.postDeleteStateById = async (req, res, next) => {
  try {
    let = { stateMasterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await StateMaster.update(
        {
          status: 2,
        },
        {
          where: { stateMasterID: stateMasterID },
          transaction: t,
        }
      );
      logger.info(
        `stateMaster Delete by id ${delete_status} Delete By user Id 1`
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.statedelete });
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
 * @param {*} countryName
 */

let getCountryId = async (countryName) => {
  try {
    let get_country_id = await CountryMaster.findOne({
      attributes: ["countryMasterID"],
      where: { countryName: countryName },
    });
    return get_country_id.countryMasterID;
  } catch (err) {
  }
};

/**
 * import state data
 * @param {file}
 */
exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      const error = new Error("No File");
      error.httpStatusCode = 400;
      return next(error);
    } else {
      fs.readFile("./uploads/" + file.filename, async (err, data) => {
        if (err) throw err;

        const countryData = JSON.parse(data);
        let states = [];

        for (const country of countryData) {
          let country_id = await getCountryId(country.name);
          for (const state of country.states) {
            states.push({
              stateName: state.name,
              stateCode: state.state_code,
              countryMasterID: country_id,
            });
          }
        }
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await StateMaster.bulkCreate(states, {
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
