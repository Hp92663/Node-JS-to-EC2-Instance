const OrderMaster = require("../models/orderMaster");
const UserMaster = require("../models/userMaster");
const ProductMaster = require("../models/productMaster");
const CartItems = require("../models/cartItem");
const cartItem = require("../models/cartItem");
const CountryMaster = require("../models/countrymaster");
const StateMaster = require("../models/statemaster");
const CityMaster = require("../models/citymaster");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { generatePDF } = require("../utils/pdfGenerate");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const moment = require("moment");

exports.postAddOrder = async (req, res, next) => {
  try {
    let {
      firstName,
      lastName,
      emailAddress,
      mobileNo,
      shippingAddress,
      billingAddress,
      countryMasterID,
      stateMasterID,
      cityMasterID,
      zipCode,
      amount,
      cartID,
      userMasterID,
      paymentId,
    } = await req.body;

    let addOrderData = await OrderMaster.create({
      firstName,
      lastName,
      emailAddress,
      mobileNo,
      shippingAddress,
      billingAddress,
      countryMasterID,
      stateMasterID,
      cityMasterID,
      zipCode,
      amount,
      cartID,
      userMasterID,
      paymentId,
    });

    await CartItems.update(
      { status: 1 },
      { where: { cartItemID: { [Sequelize.Op.in]: cartID } } }
    );

    await sendOrderConfirmationEmail(
      emailAddress,
      addOrderData,
      amount,
      paymentId,
      shippingAddress,
      billingAddress,
    );

    res.status(200).json({
      status: 200,
      message: "Order Created Successfully",
      data: addOrderData,
    });

    return addOrderData;
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message, data: {} });

    next(err);
  }
};

async function sendOrderConfirmationEmail(
  emailAddress,
  orderData,
  amount,
  paymentId,
  shippingAddress,
  billingAddress,
) {
  let transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.USEREMAIL,
      pass: process.env.PASS,
    },
  });

  let mailOptions = {
    from: process.env.USEREMAIL,
    to: emailAddress,
    subject: "Order Confirmation",
    html: `<!DOCTYPE html>
    <html>
    <head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style type="text/css">
    
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    
    a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
    }
    
    @media screen and (max-width: 480px) {
        .mobile-hide {
            display: none !important;
        }
        .mobile-center {
            text-align: center !important;
        }
    }
    div[style*="margin: 16px 0;"] { margin: 0 !important; }
    </style>
    <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
    
    
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    </div>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
            
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                <tr>
                    <td align="center" valign="top" style="font-size:0; padding-top: 35px; margin-right: 50%;" bgcolor="#fff">
                   
                        <table align="center" border="0" cellpadding="0" cellspacing="0" >
                            <tr>
                                <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 800; line-height: 48px;" class="mobile-center">
                                <img src="../uploads/hero_logo.jpg" alt="">
                                </td> 
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding: 35px 35px 20px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                            <td align="center" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;">
                                <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">
                                    Thank You For Your Order!
                                </h2>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                                <p style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777;">
                                        <b>Dear ${orderData.firstName} ${orderData.lastName} Your order has been confirmed sucessfully<b>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding-top: 20px;">
                                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td width="75%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                                            Order Id 
                                        </td>
                                        <td width="25%" align="left" bgcolor="#eeeeee" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                                         ${orderData.orderMasterID}
                                        </td>
                                    </tr>   
                                </table>
                            </td>
                        </tr>
                        <tr>
                        <td align="left" style="padding-top: 20px;">
                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                                        Payment ID
                                    </td>
                                    <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                                    ${paymentId} 
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                        <tr>
                            <td align="left" style="padding-top: 20px;">
                                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td width="75%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                                            TOTAL
                                        </td>
                                        <td width="25%" align="left" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                                        ${amount} 
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    </td>
                </tr>
                 <tr>
                    <td align="center" height="100%" valign="top" width="100%" style="padding: 0 35px 35px 35px; background-color: #ffffff;" bgcolor="#ffffff">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px;">
                        <tr>
                            <td align="center" valign="top" style="font-size:0;">
                                <div style="display:inline-block; max-width:50%; min-width:240px; vertical-align:top; width:100%;">
    
                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                        <tr>
                                            <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px;">
                                                <p style="font-weight: 800;">Delivery Address</p>
                                                <p> ${orderData. shippingAddress}</p>
    
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div style="display:inline-block; max-width:50%; min-width:240px; vertical-align:top; width:100%;">
                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:300px;">
                                        <tr>
                                            <td align="left" valign="top" style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px;">
                                                <p style="font-weight: 800;">Billing Address: </p>
                                                <p>${orderData.billingAddress} </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </table>
                    </td>
                </tr>
                <tr>
                  
                </tr>
              
            </table>
            </td>
        </tr>
    </table>
        
    </body>
    </html>
    `,
  };

  // Send mail with defined transport object
  let info = await transporter.sendMail(mailOptions);
}

exports.getOrderDataForAdmin = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, exportData } = req.body;

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

exports.getProductCountForAdmin = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, exportData } = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { firstName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { lastName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { emailAddress: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
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
    });

    let productCounts = {}; // Object to store product counts

    for (const order of orderDataAdmin.rows) {
      const cartItems = await CartItems.findAll({
        where: { cartItemID: order.cartID },
        include: [
          {
            model: ProductMaster,
            attributes: ["productMasterID"], // Assuming product ID is stored as 'productId'
          },
        ],
        attributes: ["quantity"],
      });

      for (const item of cartItems) {
        const productId = item.productMaster.productId;
        if (productCounts[productId]) {
          productCounts[productId] += item.quantity;
        } else {
          productCounts[productId] = item.quantity;
        }
      }
    }

    return res.status(200).json({
      message: "Product Counts Fetched Successfully",
      status: 200,
      productCounts,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
    next(err);
  }
};

exports.getUserOrderData = async (req, res, next) => {
  const { page, limit, searchQuery, exportData, id } = req.body;

  const condition = {};
  if (searchQuery) {
    condition[Sequelize.Op.or] = [
      { firstName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      { lastName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      { emailAddress: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
    ];
  }



  condition.userMasterID = id;
  const order = [["orderMasterID", "DESC"]];

  const paginationQuery = {};
  if (!exportData) {
    paginationQuery.offset = (page - 1) * limit;
    paginationQuery.limit = limit;
  }
  // const currentDate = new Date();
  // let startDate;

  // if (filter === 'last3months') {
  //   startDate = new Date(currentDate);
  //   startDate.setMonth(currentDate.getMonth() - 3);
  // } else if (filter === 'last6months') {
  //   startDate = new Date(currentDate);
  //   startDate.setMonth(currentDate.getMonth() - 6);
  // } else if (filter === 'YAREBASIS') {
  //
  // }

  try {
    const userOrder = await OrderMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });

    let productDetails = [];

    for (const order of userOrder.rows) {
      const cartItems = await CartItems.findAll({
        where: { cartItemID: order.cartID },
        include: [
          {
            model: ProductMaster,
            attributes: ["productName", "productCode", "image", "price"],
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
          userMasterID,
          countryMasterID,
          stateMasterID,
          cityMasterID,
          cartItems, // all data from cart
        },
      };

      productDetails.push(orderWithItems);
    }

    res.status(200).json({
      status: 200,
      data: productDetails,
      totalCount: userOrder.count,
      message: "User Order data fetched successfully",
    });
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
    next(err);
  }
};

exports.getOrderDataById = async (req, res, next) => {
  try {
    const { orderMasterID } = req.params;

    // Fetch order details based on orderMasterID
    const orderDetails = await OrderMaster.findOne({
      where: { orderMasterID },
      attributes: [
        "orderMasterID",
        "firstName",
        "lastName",
        "emailAddress",
        "shippingAddress",
        "billingAddress",
        "zipCode",
        "amount",
        "paymentId",
        "createdAt",
        "updatedAt",
        "userMasterID",
        "countryMasterID",
        "stateMasterID",
        "cityMasterID",
        "cartID",
      ],
    });

    if (!orderDetails) {
      return res.status(200).json({ status:404 ,message: "Your Order is Empty" });
    }

    // Fetch all cart items associated with the order
    const cartItems = await cartItem.findAll({
      where: { cartItemID: orderDetails.cartID },
      include: [
        {
          model: ProductMaster,
          attributes: ["model", "productName", "productCode", "price", "image"],
        },
      ],
      attributes: ["quantity"],
    });

    let today = new Date();
    const options = { day: "2-digit", month: "long", year: "numeric" };
    const invoiceDate = today.toLocaleDateString("en-US", options);

    const dataForPDF = {
      orderMasterID: orderDetails.orderMasterID,
      firstName: orderDetails.firstName,
      lastName: orderDetails.lastName,
      emailAddress: orderDetails.emailAddress,
      shippingAddress: orderDetails.shippingAddress,
      billingAddress: orderDetails.billingAddress,
      zipCode: orderDetails.zipCode,
      amount: orderDetails.amount,
      paymentId: orderDetails.paymentId,
      createdAt: orderDetails.createdAt,
      updatedAt: orderDetails.updatedAt,
      userMasterID: orderDetails.userMasterID,
      countryMasterID: orderDetails.countryMasterID,
      stateMasterID: orderDetails.stateMasterID,
      cityMasterID: orderDetails.cityMasterID,
      cartItems: cartItems.map((item) => item.toJSON()),
      invoiceDate,
    };

    res.status(200).json({
      status: 200,
      data: dataForPDF,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.generateOrderInvoicePDF = async (req, res, next) => {
  try {
    const { orderMasterID } = req.params;

    // Fetch order details based on orderMasterID
    const orderDetails = await OrderMaster.findOne({
      where: { orderMasterID },
      attributes: [
        "orderMasterID",
        "firstName",
        "lastName",
        "emailAddress",
        "shippingAddress",
        "billingAddress",
        "zipCode",
        "amount",
        "paymentId",
        "createdAt",
        "updatedAt",
        "userMasterID",
        "countryMasterID",
        "stateMasterID",
        "cityMasterID",
        "cartID",
      ],
    });

    if (!orderDetails) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch all cart items associated with the order
    const cartItems = await cartItem.findAll({
      where: { cartItemID: orderDetails.cartID },
      include: [
        {
          model: ProductMaster,
          attributes: ["productName", "productCode", "price", "image"],
        },
      ],
      attributes: ["quantity"],
    });

    const invoiceDate = orderDetails.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Prepare data to be passed to generatePDF function
    const dataForPDF = {
      orderMasterID: orderDetails.orderMasterID,
      firstName: orderDetails.firstName,
      lastName: orderDetails.lastName,
      emailAddress: orderDetails.emailAddress,
      shippingAddress: orderDetails.shippingAddress,
      billingAddress: orderDetails.billingAddress,
      zipCode: orderDetails.zipCode,
      amount: orderDetails.amount,
      paymentId: orderDetails.paymentId,
      createdAt: orderDetails.createdAt,
      updatedAt: orderDetails.updatedAt,
      userMasterID: orderDetails.userMasterID,
      countryMasterID: orderDetails.countryMasterID,
      stateMasterID: orderDetails.stateMasterID,
      cityMasterID: orderDetails.cityMasterID,
      cartItems: cartItems.map((item) => item.toJSON()),
      invoiceDate,
    };

    const pdfBuffer = await generatePDF("orderdetails", dataForPDF);
    const base64String = pdfBuffer.toString("base64");

    res.status(200).json({
      status: 200,
      data: base64String,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.getTotalOrderRevenue = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const condition = {};

    // Define date range based on filter
    if (filter === "today") {
      condition.createdAt = {
        [Op.gte]: moment().startOf("day").toDate(),
        [Op.lte]: moment().endOf("day").toDate(),
      };
    } else if (filter === "thisMonth") {
      condition.createdAt = {
        [Op.gte]: moment().startOf("month").toDate(),
        [Op.lte]: moment().endOf("month").toDate(),
      };
    } else if (filter === "thisYear") {
      condition.createdAt = {
        [Op.gte]: moment().startOf("year").toDate(),
        [Op.lte]: moment().endOf("year").toDate(),
      };
    }

    const totalOrderAmount = await OrderMaster.sum("amount", {
      where: condition,
    });

    res.status(200).json({
      message: "Total order amount fetched successfully",
      status: 200,
      totalOrderAmount,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
    next(err);
  }
};

exports.getBestSellingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, searchQuery, exportData } = req.body;

    const condition = {};
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { firstName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { lastName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { emailAddress: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
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
    });

    let productCounts = {};
    let productDetails = {};

    for (const order of orderDataAdmin.rows) {
      const cartIds = Array.isArray(order.cartID) ? order.cartID : [order.cartID]; 

      for (const cartId of cartIds) {
        const cartItems = await CartItems.findAll({
          where: { cartItemID: cartId }, 
          include: [
            {
              model: ProductMaster,
              as: 'productMaster', 
              attributes: ["productMasterID", "productName", "productCode", "description", "image", "price"],
            },
          ],
          attributes: ["quantity"],
        });

        for (const item of cartItems) {
          const product = item.productMaster;
          const productId = product.productMasterID;

          if (productCounts[productId]) {
            productCounts[productId] += item.quantity;
          } else {
            productCounts[productId] = item.quantity;
            productDetails[productId] = {
              productName: product.productName,
              productCode: product.productCode,
              description: product.description,
              image: product.image,
              price: product.price,
            };
          }
        }
      }
    }

    const sortedProductCounts = Object.keys(productCounts)
      .map(productId => ({
        productId,
        count: productCounts[productId],
        ...productDetails[productId],
      }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      message: "Most Ordered Products Fetched Successfully",
      status: 200,
      data: sortedProductCounts,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
    next(err);
  }
};



