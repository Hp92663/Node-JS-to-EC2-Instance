const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");

let gmailTransporterForGsuit = nodemailer.createTransport({
  host: process.env.HOSTMAIL, // Gmail Host
  port: 465, // Port
  secure: true, // this is true as port is 465
  auth: {
    user: process.env.USEREMAIL, // generated ethereal user
    pass: process.env.PASS, // generated ethereal password
  },
});

const getTemplate = (type) => {
  const file = path.join(__dirname, `../html/${type}.hbs`);
  return file;
};

const getFilePath = (name) => {
  return path.join(__dirname, "./uploads", name);
};

const readFile = (name) => {
  return new Promise((resolve, reject) => {
    fs.readFile(name, "utf-8", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const sendEmailForOtp = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const filePath = await getTemplate("otp");

      const file = await readFile(filePath);
      const template = Handlebars.compile(file);

      var replacements = {
        reset_password_token: data.reset_password_token,
      };
      const html = template(replacements);

      const mailOptions = {
        from: process.env.USEREMAIL, // sender email address
        // to: "", // list of receivers
        to: data.email_id,
        subject: "Verify Otp", // Subject of Email
        text: "", // plain text body
        html: html, // html body
        replyTo: "", // If reply is required then add that emial address
        // attachments: attachments
      };

      gmailTransporterForGsuit.sendMail(mailOptions, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          return reject({ sattus: 0, message: err });
        }
        //Else we can greet\ and leave
        else {
          return resolve(body);
        }
      });
    } catch (e) {
      return resolve({ status: 0, message: e });
    }
  });
};

module.exports = {
  sendEmailForOtp,
};
