const ContactForm = require("../models/contactForm");
const Sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const { generateExcel } = require("../utils/exportData");

exports.postAddContact = async (req, res, next) => {
  try {
    let {
      contactName,
      contactEmail,
      contactPhone,
      contactSubject,
      contactDescription,
    } = await req.body;

    let contactForm = await ContactForm.create({
      contactName,
      contactEmail,
      contactPhone,
      contactSubject,
      contactDescription,
    });

    res.status(200).json({
      status: 200,
      message: "Form Submitted Successfully",
      data: contactForm,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(500).json({ status: 500, message: err.message });
    }
    next(err);
  }
};

exports.getAllContactData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, exportData } = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { contactName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { contactSubject: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { contactEmail: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        {
          contactDescription: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" },
        },
        { contactPhone: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    const order = [["contactQueryFormID", "DESC"]];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const allContactData = await ContactForm.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });
    if (exportData) {
      const finaldata = [];

      for (let i = 0; i < allContactData.rows.length; i++) {
        const rowData = allContactData.rows[i]; // Fetch the row directly

        const object = {
          QueryID: rowData.contactQueryFormID,
          ContactName: rowData.contactName,
          ContactEmail: rowData.contactEmail,
          ContactNumber: rowData.contactPhone,
          QuerySubject: rowData.contactSubject,
          QueryDescription: rowData.contactDescription,
          QueryDateTime: rowData.createdAt,
        };
        finaldata.push(object);
      }
      await generateExcel(
        finaldata,
        "NewsNews Letter Subscriber Details",
        "xlsx",
        res
      );
      return;
    }

    return res.status(200).json({
      message: "Contact Data fetched Successfully",
      status: 200,
      data: allContactData.rows,
      totalcount: allContactData.count,
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
