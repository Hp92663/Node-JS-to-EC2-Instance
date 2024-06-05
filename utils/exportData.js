const Excel = require("exceljs");
const nodemailer = require("nodemailer");

const gmailTransporterForGsuit = nodemailer.createTransport({
  host: process.env.HOSTMAIL, // Gmail Host
  port: 465, // Port
  secure: true, // this is true as port is 465
  auth: {
    user: process.env.USEREMAIL, // generated ethereal user
    pass: process.env.PASS, // generated ethereal password
  },
});

const flattenObj = (obj, parent = null, res = {}) => {
  Object.entries(obj).forEach(([key, value]) => {
    let propName;

    // In related models' data, data is stored at key which includes Id at the end. To remove that Id following code works

    if (parent) {
      propName = parent.includes("Id")
        ? `${parent.replace("Id", "")}_${key}`
        : `${parent}_${key}`;
    } else {
      propName = key;
    }

    // const propName = parent ? parent + '_' + key : key; & obj[key]!==null because typeof null = object

    if (value !== null && typeof value === "object") {
      // if value is array. also allows empty array to be added as a key
      if (value.length !== undefined && value.length >= 0) {
        res[propName] = value;
      } else flattenObj(value, propName, res);
    } else res[propName] = value;
  });
  return res;
};

const formatFirstRow = (workSheet, row) => {
  const firstRow = workSheet.getRow(row);
  firstRow.height = 20;
  firstRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",

      pattern: "solid",

      fgColor: { argb: "729fcf" },
    };
    cell.font = { bold: true, name: "calibri" };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
};

function countKeys(obj) {
  return Object.keys(obj).reduce((count, key) => {
    if (Array.isArray(obj[key]))
      return count + obj[key].reduce((c, o) => c + countKeys(o), 0);
    if (typeof obj[key] === "object" && obj[key] !== null)
      return count + countKeys(obj[key]);
    return count + 1;
  }, 0);
}

function findIndexParentWithMostKeys(arr) {
  return arr.reduce(
    (maxIndex, obj, index) =>
      countKeys(obj) > countKeys(arr[maxIndex]) ? index : maxIndex,
    0
  );
}

const generateExcel = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error("No data found to generate the file!");
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet("sheet");
  const headerNames = Object.keys(data[0]);
  const transformedObject = [];
  for (let i = 0; i < data.length; i++) {
    let isNotArray = true;
    headerNames.forEach((key) => {
      if (Array.isArray(data[i][key]) === true) {
        data[i][key].forEach((obj) => {
          isNotArray = false;
          // Deep copy so that values in data[i] does not get changed
          const transformedElement = JSON.parse(JSON.stringify(data[i]));
          transformedElement[key] = obj;
          transformedObject.push({ ...transformedElement });
        });
      }
    });
    if (isNotArray) transformedObject.push(JSON.parse(JSON.stringify(data[i])));
  }
  if (transformedObject.length === 0) transformedObject.push(...data);

  const keyData = flattenObj(
    transformedObject[findIndexParentWithMostKeys(transformedObject)]
  );

  const columns = Object.keys(keyData).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  workSheet.columns = columns;

  transformedObject.forEach((element) => {
    workSheet.addRow(flattenObj(element));
  });
  formatFirstRow(workSheet, 1);
  res.attachment(`${fileName}.${fileType}`);
  res.set({ "Access-Control-Expose-Headers": "*" });

  return fileType === "csv"
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExceltoMail = async (data, fileName, fileType, res, MailID) => {
  if (!data.length) throw new Error("No data found to generate the file!");
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet("sheet");
  const headerNames = Object.keys(data[0]);
  const transformedObject = [];
  for (let i = 0; i < data.length; i++) {
    let isNotArray = true;
    headerNames.forEach((key) => {
      if (Array.isArray(data[i][key]) === true) {
        data[i][key].forEach((obj) => {
          isNotArray = false;
          // Deep copy so that values in data[i] does not get changed
          const transformedElement = JSON.parse(JSON.stringify(data[i]));
          transformedElement[key] = obj;
          transformedObject.push({ ...transformedElement });
        });
      }
    });
    if (isNotArray) transformedObject.push(JSON.parse(JSON.stringify(data[i])));
  }
  if (transformedObject.length === 0) transformedObject.push(...data);

  const keyData = flattenObj(
    transformedObject[findIndexParentWithMostKeys(transformedObject)]
  );

  const columns = Object.keys(keyData).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  workSheet.columns = columns;

  transformedObject.forEach((element) => {
    workSheet.addRow(flattenObj(element));
  });
  formatFirstRow(workSheet, 1);
  res.attachment(`${fileName}.${fileType}`);
  res.set({ "Access-Control-Expose-Headers": "*" });

  try {
    const mailOptions = {
      from: process.env.USEREMAIL, // sender email address
      to: MailID,
      subject: "Expense Report", // Subject of Email
      text: "Please find the expense report attached.", // plain text body
      replyTo: "", // If reply is required then add that emial address
      attachments: [
        {
          filename: `ExpenseReport.xlsx`,
          content: await workBook.xlsx.writeBuffer(),
        },
      ], // attachments: attachments
    };

    gmailTransporterForGsuit.sendMail(mailOptions, function (err, body) {
      //If there is an error, render the error page
      if (err) {
        console.log(">>>>>>>>>error>>>>>>>>", err);
        return reject({ sattus: 0, message: err });
      }
      //Else we can greet\ and leave
      else {
        console.log(">>>>>>>>>body>>>>>>>>", body);
        return resolve(body);
      }
    });
  } catch (e) {
    return resolve({ status: 0, message: e });
  }

  return res.status(200).json({
    status: 200,
    message: "Mail sent Successfully",
  });
};

module.exports = {
  generateExcel,
  generateExceltoMail,
};
