const ContactForm = require("../models/contactForm");
const Sequelize = require("sequelize");
const nodemailer = require("nodemailer");
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

    let transporter = nodemailer.createTransport({
      service: "gmail", // you can use other service providers
      auth: {
        user: "mailto:ghadiyaliburhan7@gmail.com", // your email
        pass: "uoon fwkl gxdu jqky", // your email password
      },
    });

    let htmlTemplate = `
    <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Form Submission Confirmation</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      background-color: #f4f4f4;
                      padding: 20px;
                  }
                  .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background: #fff;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  }
                  h2 {
                      color: #333;
                  }
                  ul {
                      list-style: none;
                      padding: 0;
                  }
                  li {
                      margin-bottom: 10px;
                  }
                  strong {
                      font-weight: bold;
                  }
                  p {
                      margin-bottom: 10px;
                  }
                  .footer {
                      margin-top: 20px;
                      text-align: center;
                      color: #888;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <h2>Dear ${contactName},</h2>
                  <p>Thank you for contacting us. We have received your request with the following details:</p>
                  <ul>
                      <li><strong>Name:</strong> ${contactName}</li>
                      <li><strong>Email:</strong> ${contactEmail}</li>
                      <li><strong>Phone:</strong> ${contactPhone}</li>
                      <li><strong>Subject:</strong> ${contactSubject}</li>
                      <li><strong>Description:</strong> ${contactDescription}</li>
                  </ul>
                  <p>We will get back to you as soon as possible.</p>
                  <div class="footer">
                      <p>Best regards</p>
                      <hr>  
                      <p>Mehta India</p>
                      <p>Mehta Hitech Industries Limited
                      formerly known as Mehta Cad Cam Systems Pvt. Ltd.
                      Plot No.3, Road No.1, Kathwada GIDC, Kathwada, SP Ring Road, Ahmedabad-382430, Gujarat, India.</p>
                        <h1>Customer Care</h1>
                        <p>If you have any query or
                        complains,please contact our
                        Customer Care Dept.
                        +91-92279 85781
                        mailto:care@mehtaindia.com
                        <br>
                        WE SUPPORT & PROMOTE E-WASTE MANAGEMENT</p>
                  </div>
              </div>
          </body>
          </html>
  `;

    let mailOptions = {
      from: "mailto:ghadiyaliburhan7@gmail.com", // sender address
      to: contactEmail, // list of receivers
      subject: "Form Submission Confirmation", // Subject line
      html: htmlTemplate, // HTML body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email: ", error);
      } else {
        console.log("Email sent: " + info.response);
      }
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
      ];
    }

    const order = [["contactFormID", "DESC"]];

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

    const dataToExport = allContactData.rows;

    if (exportData) {
      await generateExcel(dataToExport, "Contact_Details", "xlsx", res);
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
