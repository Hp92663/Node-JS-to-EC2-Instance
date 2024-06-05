const sequelize = require("../config/database");
const CartItem = require("../models/cartItem");
const ProductMaster = require("../models/productMaster");
const { Op } = require("sequelize");
const OrderMaster = require("../models/orderMaster");
const UserMaster = require("../models/userMaster");
const CartItems = require("../models/cartItem");
const CountryMaster = require("../models/countrymaster");
const StateMaster = require("../models/statemaster");
const CityMaster = require("../models/citymaster");
const { generatePDF } = require("../utils/pdfGenerate");
const { generateExcel } = require("../utils/exportData");

// yearly , monthly, daily report of product sales
exports.productSellingReport = async (req, res, next) => {
  try {
    const { exportData, reportType, startDate, endDate } = req.body;

    let condition = {};
    let group = [
      "cartItem.productMasterID",
      "productMaster.productName",
      "productMaster.productCode",
      "productMaster.price",
    ];

    // Set condition and group for different report types
    if (reportType === "monthly") {
      condition = sequelize.literal(
        `EXTRACT(MONTH FROM "cartItem"."createdAt") = EXTRACT(MONTH FROM '${startDate}'::timestamp)`
      );
      group.push(
        sequelize.literal(`EXTRACT(MONTH FROM "cartItem"."createdAt")`)
      );
    } else if (reportType === "yearly") {
      condition = sequelize.literal(
        `EXTRACT(YEAR FROM "cartItem"."createdAt") = EXTRACT(YEAR FROM '${startDate}'::timestamp)`
      );
      group.push(
        sequelize.literal(`EXTRACT(YEAR FROM "cartItem"."createdAt")`)
      );
    } else if (reportType === "daily") {
      condition = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("cartItem.createdAt")),
            ">=",
            startDate
          ),
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("cartItem.createdAt")),
            "<=",
            endDate
          ),
        ],
      };
      group.push(sequelize.literal(`DATE("cartItem"."createdAt")`));
    }

    const topProducts = await CartItem.findAll({
      attributes: [
        [sequelize.col("cartItem.productMasterID"), "productMasterID"],
        [
          sequelize.fn("COUNT", sequelize.col("cartItem.productMasterID")),
          "productCount",
        ],
      ],
      group,
      where: condition,
      order: [[sequelize.literal('"productCount"'), "DESC"]],
      limit: 10,
      include: [
        {
          model: ProductMaster,
          attributes: ["productName", "productCode", "price"], // Include productName and productCode
        },
      ],
      raw: true,
      nest: true,
    });

    // Export to Excel if requested
    if (exportData === "excel") {
      const dataToExport = topProducts.map((product) => ({
        "Product Name": product.productMaster.productName,
        "Product Code": product.productMaster.productCode,
        "Product Price": product.productMaster.price,
        "Total Selling Quantity": product.productCount,
      }));
      await generateExcel(
        dataToExport,
        `TopOrderedProducts_${reportType}_${startDate}_${endDate}`,
        "xlsx",
        res
      );
      return;
    }

    // Return the top products if no export is requested
    res.status(200).json({
      status: 200,
      data: topProducts,
      message: "Top ordered products fetched successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message || "Failed to fetch top ordered products",
    });
    next(err);
  }
};

exports.getOrderDetailReport = async (req, res, next) => {
  try {
    const { page =1 , limit = 10, searchQuery, exportData } = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Op.or] = [
        { firstName: { [Op.iLike]: "%" + searchQuery + "%" } },
        { lastName: { [Op.iLike]: "%" + searchQuery + "%" } },
        { emailAddress: { [Op.iLike]: "%" + searchQuery + "%" } },
        { productName: { [Op.iLike]: "%" + searchQuery + "%" } },
        { productCode: { [Op.iLike]: "%" + searchQuery + "%" } },
      ];
    }

    const order = [["orderMasterID", "DESC"]];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const orderDataAdmin = await OrderMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          attributes: ["userName"],
        },
        {
          model: CountryMaster,
          attributes: ["countryName"],
        },
        {
          model: StateMaster,
          attributes: ["stateName"],
        },
        {
          model: CityMaster,
          attributes: ["cityName"],
        },
      ],
    });

    let productDetails = [];

    for (const order of orderDataAdmin.rows) {
      const cartItems = await CartItems.findAll({
        where: { cartItemID: order.cartID },
        include: [
          {
            model: ProductMaster,
            attributes: ["productName", "productCode", "price"],
          },
        ],
        attributes: ["quantity"],
      });

      const {
        orderMasterID,
        firstName,
        lastName,
        emailAddress,
        shippingAddress,
        billingAddress,
        zipCode,
        amount,

        paymentId,
        createdAt,
        updatedAt,
        userMasterID,
        countryMasterID,
        stateMasterID,
        cityMasterID,
      } = order;

      const orderWithItems = {
        order: {
          orderMasterID,
          firstName,
          lastName,
          emailAddress,
          shippingAddress,
          billingAddress,
          zipCode,
          amount,

          paymentId,
          cartID: order.cartID,
          createdAt,
          updatedAt,
          // userMasterID: order['UserMaster.userName'],
          // countryMasterID: order['CountryMaster.countryName'],
          // stateMasterID: order['StateMaster.stateName'],
          // cityMasterID: order['CityMaster.cityName'],
          userMasterID,
          countryMasterID,
          stateMasterID,
          cityMasterID,
          cartItems,
        },
      };

      productDetails.push(orderWithItems);
    }

    // Export data to Excel if exportData is 'excel'
    if (exportData === "excel") {
      const dataToExport = orderDataAdmin.rows;
      await generateExcel(dataToExport, "Order", "xlsx", res);
      return;
    }

    // Export data to PDF if exportData is 'pdf'
    if (exportData === "pdf") {
      const dataToExport = orderDataAdmin.rows;
      await generatePDF(dataToExport, "order", "pdf", res);
      return;
    }

    return res.status(200).json({
      message: "Order Data fetched Successfully",
      status: 200,
      data: productDetails,
      totalcount: orderDataAdmin.count,
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