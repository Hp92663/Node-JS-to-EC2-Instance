const Excel = require('exceljs');
const nodemailer = require('nodemailer');
const { Sequelize } = require('sequelize');
// const UserRightsMaster = require('../models/userRightsMaster');
const UserMaster = require('../models/userMaster');
// const FormMaster = require('../models/formMaster');
// const notificationPolicy = require('../models/notificationPolicy');
const JSZip = require('jszip');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');

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
      propName = parent.includes('Id')
        ? `${parent.replace('Id', '')}_${key}`
        : `${parent}_${key}`;
    } else {
      propName = key;
    }

    // const propName = parent ? parent + '_' + key : key; & obj[key]!==null because typeof null = object

    if (value !== null && typeof value === 'object') {
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
      type: 'pattern',

      pattern: 'solid',

      fgColor: { argb: '729fcf' },
    };
    cell.font = { bold: true, name: 'calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
};

function countKeys(obj) {
  return Object.keys(obj).reduce((count, key) => {
    if (Array.isArray(obj[key]))
      return count + obj[key].reduce((c, o) => c + countKeys(o), 0);
    if (typeof obj[key] === 'object' && obj[key] !== null)
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
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
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
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExceltoMail = async (data, fileName, fileType, res, MailID) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
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
  res.set({ 'Access-Control-Expose-Headers': '*' });

  try {
    const mailOptions = {
      from: process.env.USEREMAIL, // sender email address
      to: MailID,
      subject: 'Expense Report', // Subject of Email
      text: 'Please find the expense report attached.', // plain text body
      replyTo: '', // If reply is required then add that emial address
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
        console.log('>>>>>>>>>error>>>>>>>>', err);
        return reject({ sattus: 0, message: err });
      }
      //Else we can greet\ and leave
      else {
        console.log('>>>>>>>>>body>>>>>>>>', body);
        return resolve(body);
      }
    });
  } catch (e) {
    return resolve({ status: 0, message: e });
  }

  return res.status(200).json({
    status: 200,
    message: 'Mail sent Successfully',
  });
  // return fileType === 'csv'
  //   ? workBook.csv.write(res)
  //   : workBook.xlsx.write(res);
};

const generateChecklistExcel = async (
  data,
  fileName,
  fileType,
  res,
  CheckListNames
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let checkList of data) {
    const workSheet = workBook.addWorksheet(CheckListNames[i]);
    i++;

    const headerNames = Object.keys(checkList[0]);

    const transformedObject = [];
    for (let i = 0; i < checkList.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(checkList[i][key]) === true) {
          checkList[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(checkList[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(checkList[i])));
    }
    if (transformedObject.length === 0) transformedObject.push(...checkList);

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
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelforSalaryStructure = async (
  data,
  fileName,
  fileType,
  res,
  sheetNames
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let checkList of data) {
    const workSheet = workBook.addWorksheet(sheetNames[i]);
    i++;

    let salarycalculation =
      checkList[0][0].baseOnCalculation === 'M'
        ? 'Monthly'
        : checkList[0][0].baseOnCalculation === 'D'
          ? 'Daily'
          : 'Hourly';

    workSheet.addRow([
      'Salary From YYYYMM',
      `${checkList[0][0].salaryFromYYYYMM}`,
    ]);
    workSheet.addRow(['Salary Structure', salarycalculation]);

    checkList = checkList[1];

    // const headerNames = Object.keys(checkList[0]);

    workSheet.addRow([
      'Payhead Name',
      'Employee SalaryAmount',
      'Formula',
      'SalaryField SrNo',
    ]);

    const employeedata = checkList.map((employee) => Object.values(employee));

    employeedata.map((e) => workSheet.addRow(e));

    formatFirstRow(workSheet, 3);

    workSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const payheadNameCell = row.getCell(1).text;
      if (['Gross', 'Net Pay', 'CTC'].includes(payheadNameCell)) {
        // Apply your desired styles here, for example:
        row.eachCell((cell) => {
          // cell.fill = {
          //   type: 'pattern',
          //   pattern: 'solid',
          //   fgColor: { argb: 'FFFF00' }, // Yellow background color
          // };
          cell.font = { color: { argb: '000000' }, bold: true }; // Red bold text
        });
      }
    });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

async function styleRow(worksheet, row) {
  worksheet.getRow(row).font = {
    bold: true,
    color: { argb: '000000' },
  };

  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

function alignment(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };
}

function alignment2(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

const generateExcelForLeave = async (
  Leaveata,
  firstHeader,
  leaveHeader,
  companyid,
  sendmail,
  date,
  fileName,
  fileType,
  res,
  SheetsNames
) => {
  if (!Leaveata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let data of Leaveata) {
    const worksheet = workBook.addWorksheet(SheetsNames[i]);
    i++;

    // const worksheet = workBook.addWorksheet('sheet');

    worksheet.addRow([]);
    worksheet.addRow([firstHeader]);

    const leave_header = Array.from(
      { length: leaveHeader.length - 1 },
      () => ''
    );

    const header2 = [
      ...[
        'Sr. No.',
        'Name Of Employee',
        'Department',
        'Leave',
        '',
        'Leave Approved/Pending/Absent',
        'No. Of',
        'Before This Application Leave Taken',
      ],
      ...leave_header,
      ...[
        'No. Of Absent Leaves in this Financial Year',
        'No. Of Late In/Early Out in Financial Year',
      ],
    ];
    const header3 = [
      ...['', '', '', 'From', 'To', '', 'Days'],
      ...leaveHeader,
      ...['No.', 'No.'],
    ];

    worksheet.addRow(header2);
    worksheet.addRow(header3);

    await styleRow(worksheet, 2);
    await styleRow(worksheet, 3);
    await styleRow(worksheet, 4);

    worksheet.mergeCells(2, 1, 2, +header2.length);
    worksheet.mergeCells(3, 1, 4, 1);
    worksheet.mergeCells(3, 2, 4, 2);
    worksheet.mergeCells(3, 3, 4, 3);
    worksheet.mergeCells(3, 4, 3, 5);
    worksheet.mergeCells(3, 8, 3, 8 + +leave_header.length);

    const row2 = worksheet.getRow(2);
    row2.height = 20;

    row2.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'daeef3' }, // Red color
      };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    const mergeRanges = {};
    const data2 = data.map((row, index) => {
      row['SrNo'] = index;
      return Object.values(row);
    });

    let num = 1;
    await Promise.all(
      data2.map(async (d, i) => {
        const currentDisplayName = data[i].displayName;

        // Check if the display name is the same as the previous row
        if (i > 0 && currentDisplayName === data[i - 1].displayName) {
          d[0] = '';
          // Increment the end column of the merged range
          mergeRanges[currentDisplayName].map((a) => {
            a.endRow++;
          });
        } else {
          d[0] = num++;
          const leavemergecell = leaveHeader.map((m, index) => {
            return {
              startRow: i + 5,
              startColumn: 8 + index, // Assuming display name is in the second column
              endRow: i + 5,
              endColumn: 8 + index,
            };
          });

          // Create a new entry for the display name
          mergeRanges[currentDisplayName] = [
            ...[
              {
                startRow: i + 5,
                startColumn: 1, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 1,
              },
              {
                startRow: i + 5,
                startColumn: 2, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 2,
              },
              {
                startRow: i + 5,
                startColumn: 3, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 3,
              },
              {
                startRow: i + 5,
                startColumn: 8 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 8 + +leaveHeader.length,
              },
              {
                startRow: i + 5,
                startColumn: 9 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 9 + +leaveHeader.length,
              },
            ],
            ...leavemergecell,
          ];
        }
        worksheet.addRow(d);
      })
    );

    for (const displayName in mergeRanges) {
      const range = mergeRanges[displayName];

      range.map((e) => {
        worksheet.mergeCells(e.startRow, e.startColumn, e.endRow, e.endColumn);
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        alignment(worksheet, rowNumber + 3);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        // }
      });
    });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  if (sendmail == true) {
    const user = await UserRightsMaster.findAll({
      raw: true,
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: companyid, status: 1 },
          attributes: [],
        },
        {
          model: FormMaster,
          where: { formName: 'FYWiseLeaveReport' },
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('userMaster.email'), 'email'],
        [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
      ],
    });

    const fromtomail = await notificationPolicy.findOne({
      raw: true,
      where: {
        companyMasterID: companyid,
        status: 1,
      },
    });

    if (fromtomail) {
      if (fromtomail.email) {
        let gmailTransporterForTP = nodemailer.createTransport({
          host: 'smtp.gmail.com', // Gmail Host
          port: 465, // Port
          secure: true, // this is true as port is 465
          auth: {
            user: fromtomail.email, // generated ethereal user
            pass: fromtomail.password, // generated ethereal password
          },
        });

        const data = [];
        user.map((e) => {
          if (e.email) data.push(e.email);
        });

        if (data.length > 0) {
          try {
            const mailOptions = {
              from: fromtomail.email, // sender email address
              to: data,
              subject: 'FY Leave Report Date' + `${date}`, // Subject of Email
              text: 'Please find the Leave report attached.', // plain text body
              replyTo: '', // If reply is required then add that emial address
              attachments: [
                {
                  filename: `${fileName}.xlsx`,
                  content: await workBook.xlsx.writeBuffer(),
                },
              ], // attachments: attachments
            };

            gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
              //If there is an error, render the error page
              if (err) {
                console.log('>>>>>>>>>error>>>>>>>>', err);
                return { sattus: 0, message: err };
              }
              //Else we can greet\ and leave
              else {
                console.log('>>>>>>>>>body>>>>>>>>', body);
                return body;
              }
            });
          } catch (e) {
            return { status: 0, message: e };
          }
        }
      }
    }
  } else {
    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  }
};

const generateExcelForLeaveBalance = async (
  leaveHeader,
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const worksheet = workBook.addWorksheet('sheet');

  const leave_header = Array.from({ length: leaveHeader.length - 1 }, () => '');

  const header1 = [
    ...[
      'Employee Name',
      'Employee Number',
      'Branch',
      'Department',
      'Opening Balance',
    ],
    ...leave_header,
    ...['Added Balance'],
    ...leave_header,
    ...['Used Balance'],
    ...leave_header,
    ...['Lapse Balance'],
    ...leave_header,
    ...['Closing Balance'],
  ];
  const header2 = [
    ...['', '', '', ''],
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
  ];

  worksheet.addRow(header1);
  worksheet.addRow(header2);

  worksheet.mergeCells(1, 1, 2, 1);
  worksheet.mergeCells(1, 2, 2, 2);
  worksheet.mergeCells(1, 3, 2, 3);
  worksheet.mergeCells(1, 4, 2, 4);

  worksheet.mergeCells(1, 5, 1, 4 + +leaveHeader.length);
  worksheet.mergeCells(
    1,
    5 + +leaveHeader.length,
    1,
    4 + +leaveHeader.length * 2
  );
  worksheet.mergeCells(
    1,
    5 + +leaveHeader.length * 2,
    1,
    4 + +leaveHeader.length * 3
  );
  worksheet.mergeCells(
    1,
    5 + +leaveHeader.length * 3,
    1,
    4 + +leaveHeader.length * 4
  );
  worksheet.mergeCells(
    1,
    5 + +leaveHeader.length * 4,
    1,
    4 + +leaveHeader.length * 5
  );

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      alignment(worksheet, rowNumber + 2);
      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function setCellColor(headerRow, startIndex, endIndex, color) {
  for (let i = startIndex; i <= endIndex; i++) {
    headerRow.getCell(i).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    };
  }
}

const generateDemoExcelForVariable = async (
  header,
  final,
  fileName,
  fileType,
  res
) => {
  if (!final.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  const headerNames = Object.keys(final[0]);

  const finalHeader = [...headerNames, ...header];

  const headerRow = workSheet.addRow(finalHeader);

  workSheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.protection = { locked: true };
  });

  // Set light blue color for cells 1 to 5
  setCellColor(headerRow, 1, 5, 'ADD8E6'); // Light Blue

  if (fileName == 'incentive') {
    // Set light green color for cells 6 to incentiveHeader.length
    setCellColor(headerRow, 6, finalHeader.length, '90EE90'); // Light Green
  } else {
    // Set red color for penaltyHeader
    setCellColor(headerRow, 6, finalHeader.length, 'FF0000');
  }

  const data2 = final.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function alignmentmiddle(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

function bold(worksheet, row) {
  worksheet.getRow(row).font = {
    bold: true,
    color: { argb: '000000' },
  };
}

const generateExcelForDailyCost = async (
  headerMonth,
  datesArray,
  finaldata,
  wagessumArray,
  staffsumArray,
  othersumArray,
  sheetNames,
  sendmail,
  companyid,
  oneDayBeforedate,
  fileName,
  fileType,
  res
) => {
  if (!finaldata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  datesArray.unshift('Date');

  finaldata.map((data, index) => {
    const worksheet = workBook.addWorksheet(sheetNames[index]);

    worksheet.addRow([]);
    worksheet.addRow([`Month:- ${headerMonth}`]);

    worksheet.getRow(2).height = 30;

    //  worksheet.getRow(2).font = { size: 40, bold: true };

    worksheet.addRow(datesArray);

    const costheader = Array.from(
      { length: datesArray.length - 1 },
      () => 'Cost'
    );

    costheader.unshift('Department Name');

    worksheet.addRow(costheader);

    worksheet.getRow(4).height = 22;

    worksheet.mergeCells(2, 1, 2, +costheader.length);

    data.map((e) => {
      const amountArray = e.amount;

      amountArray.unshift(e.department);

      worksheet.addRow(amountArray);
    });

    worksheet.addRow([]);

    console.log(wagessumArray, staffsumArray, othersumArray);

    if (sheetNames[index] == 'Wages')
      wagessumArray.unshift('Total Cost'), worksheet.addRow(wagessumArray);
    else if (sheetNames[index] == 'Staff')
      staffsumArray.unshift('Total Cost'), worksheet.addRow(staffsumArray);
    else othersumArray.unshift('Total Cost'), worksheet.addRow(othersumArray);

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber == 1 && rowNumber > 4) {
          cell.font = {
            size: 12,
            bold: true,
            color: { argb: '000000' },
          };
        }

        if (rowNumber < 5 && rowNumber != 2) {
          bold(worksheet, rowNumber);
        }

        alignmentmiddle(worksheet, rowNumber);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };

        if (rowNumber === 2) {
          cell.border = {
            top: { style: 'thick', color: { argb: '000000' } },
            left: { style: 'thick', color: { argb: '000000' } },
            bottom: { style: 'thick', color: { argb: '000000' } },
            right: { style: 'thick', color: { argb: '000000' } },
          };
          cell.font = { size: 20, bold: true }; // Make the text bold as well
        }
        // }
      });
    });

    worksheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'eeece1' },
      };
      // cell.font = {size:15, bold: true };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'e6b8b7' },
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f2dcdb' },
      };
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  if (sendmail == true) {
    const user = await UserRightsMaster.findAll({
      raw: true,
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: companyid, status: 1 },
          attributes: [],
        },
        {
          model: FormMaster,
          where: { formName: 'DailyCostReport' },
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('userMaster.email'), 'email'],
        [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
      ],
    });

    const fromtomail = await notificationPolicy.findOne({
      raw: true,
      where: {
        companyMasterID: companyid,
        status: 1,
      },
    });

    console.log(fromtomail);

    if (fromtomail) {
      if (fromtomail.email) {
        let gmailTransporterForTP = nodemailer.createTransport({
          host: 'smtp.gmail.com', // Gmail Host
          port: 465, // Port
          secure: true, // this is true as port is 465
          auth: {
            user: fromtomail.email, // generated ethereal user
            pass: fromtomail.password, // generated ethereal password
          },
        });

        const data = [];
        user.map((e) => {
          if (e.email) data.push(e.email);
        });

        console.log(data);

        if (data.length > 0) {
          try {
            const mailOptions = {
              from: fromtomail.email, // sender email address
              to: data,
              subject: 'Daily Cost Report -' + `${oneDayBeforedate}`, // Subject of Email
              text: '', // plain text body
              replyTo: '', // If reply is required then add that emial address
              attachments: [
                {
                  filename: `${fileName}.xlsx`,
                  content: await workBook.xlsx.writeBuffer(),
                },
              ], // attachments: attachments
            };

            gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
              //If there is an error, render the error page
              if (err) {
                console.log('>>>>>>>>>error>>>>>>>>', err);
                return reject({ sattus: 0, message: err });
              }
              //Else we can greet\ and leave
              else {
                console.log('>>>>>>>>>body>>>>>>>>', body);
                return resolve(body);
              }
            });
          } catch (e) {
            return resolve({ status: 0, message: e });
          }
        }
      }
    }
  } else {
    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  }
};

const generateExcelForBankReport = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');

  let newData = data.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let finalData = newData.map((item) => ({
    'USER NAME': item['userMaster.displayName'],
    'USER NUMBER': item['userMaster.userNumber'],
    'EMPLOYEE CODE': item.employeeCode,
    DESIGNATION: item.Designation,
    DEPARTMENT: item.Department,
    BANKNAME: item['bankMaster.bankName'],
    'BANK ACCOUNT NUMBER': item.bankAccountNo,
    'BANK IFSC CODE': item.bankIFSC,
    'GROSS SALARY': item.GrossSalary,
    'NET SALARY': item.NetSalary,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  workSheet.addRow([data[0]['bankMaster.bankName']]);
  workSheet.mergeCells(1, 1, 1, 10);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(finalData[0]);

  workSheet.addRow(headerNames);

  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = finalData.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const EmailSalarySlip = async (AllsalarySlips, fromMail, month) => {
  const gmailTransporterForTP = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Gmail Host
    port: 465, // Port
    secure: true, // this is true as port is 465
    auth: {
      user: fromMail.email, // generated ethereal user
      pass: fromMail.password, // generated ethereal password
    },
  });

  AllsalarySlips.forEach((data) => {
    const pdfBuffer = Buffer.from(data.path, 'base64');

    if (data.email) {
      try {
        const mailOptions = {
          from: fromMail.email, // sender email address
          to: data.email,
          subject: 'Salary Slip for the Month -' + `${month}`, // Subject of Email
          text: '', // plain text body
          replyTo: '', // If reply is required then add that emial address
          attachments: [
            {
              filename: `SalarySlip_${month}.pdf`,
              content: pdfBuffer,
            },
          ], // attachments: attachments
        };

        gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            console.log('>>>>>>>>>error>>>>>>>>', err);
            return resolve({ sattus: 0, message: err });
          }
          //Else we can greet\ and leave
          else {
            console.log('>>>>>>>>>body>>>>>>>>', body);
            return resolve(body);
          }
        });
      } catch (e) {
        return resolve({ status: 0, message: e });
      }
    }
  });
};

const generateAttendanceExcel = async (
  data,
  fileName,
  fileType,
  reportType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const headerNames = Object.keys(data[0]);
  const transformedObject = [];

  if (+reportType == 1) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        data[i][
          new Date(data[i].attendancedata[j].attendancedate)
            .toISOString()
            .slice(0, 10)
        ] = data[i].attendancedata[j].attendancetype;
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 2) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].attendancetype.includes('holiday')
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].intime == '-' &&
          data[i].attendancedata[j].outtime == '-'
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else {
          {
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - IN'
            ] =
              data[i].attendancedata[j].intime != '-'
                ? new Date(data[i].attendancedata[j].intime).toLocaleString()
                : '-';
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - OUT'
            ] =
              data[i].attendancedata[j].outtime != '-'
                ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
                : '-';
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - In Hrs'
            ] = data[i].attendancedata[j].minutes;
          }
        }
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 3) {
    let data4 = [];
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        data[i][
          new Date(data[i].attendancedata[j].attendancedate)
            .toISOString()
            .slice(0, 10)
        ] = data[i].attendancedata[j].attendancetype;

        data4.push({
          Employeecode: data[i].attendancedata[j].employeecode,
          Name: data[i].attendancedata[j].userName,
          Number: data[i].attendancedata[j].userNumber,
          Branch: data[i].attendancedata[j].branch,
          Department: data[i].attendancedata[j].department,
          Designation: data[i].attendancedata[j].designation,
          Date: data[i].attendancedata[j].attendancedate,
          Attendance: data[i].attendancedata[j].attendancetype,
          Minutes: Math.trunc(data[i].attendancedata[j].finalminutes),
          Shift: data[i].attendancedata[j].shift,
          ShiftHours: data[i].attendancedata[j].shiftHours,
          ShiftInTime: data[i].attendancedata[j].shiftInTime,
          ShiftOutTime: data[i].attendancedata[j].shiftOutTime,
          LateBy: data[i].attendancedata[j].Lateby,
          EarlyBy: data[i].attendancedata[j].EarlyBy,
          Penalty: data[i].attendancedata[j].Penalty,
          PenaltyDeduction: data[i].attendancedata[j].PenaltyDeduction,
          ['LateComing Penalty']: data[i].attendancedata[j].Penalty
            ? data[i].attendancedata[j].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[i].attendancedata[j]
            .PenaltyDeduction
            ? data[i].attendancedata[j].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[i].attendancedata[j].goEarlyPanalty
            ? data[i].attendancedata[j].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[i].attendancedata[j]
            .goEarlyPanaltyDeduction
            ? data[i].attendancedata[j].goEarlyPanaltyDeduction
            : '-',
        });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[i].totalpresentday,
        Name: 'Total Absent: ' + data[i].totalabsentday,
        Number: 'Total Half Day: ' + data[i].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[i].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[i].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[i].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[i].totalpendingleave,
        Attendance: '',
        Minutes: '',
        Shift: '',
        ShiftHours: '',
        ShiftInTime: '',
        ShiftOutTime: '',
        LateBy: '',
        EarlyBy: '',
        Penalty: '',
        PenaltyDeduction: '',
        ['LateComing Penalty']: '',
        ['LateComing Penalty Deduction']: '',
        ['EarlyGoing Penalty']: '',
        ['EarlyGoing Penalty Deduction']: '',
      });
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
    data = data4;
  } else if (+reportType == 4) {
    let data4 = [];
    for (var k = 0; k < data.length; k++) {
      for (var l = 0; l < data[k].attendancedata.length; l++) {
        data[k].attendancedata[l].intime =
          data[k].attendancedata[l].intime != '-'
            ? new Date(data[k].attendancedata[l].intime).toLocaleString()
            : '-';
        data[k].attendancedata[l].outtime =
          data[k].attendancedata[l].outtime != '-'
            ? new Date(data[k].attendancedata[l].outtime).toLocaleString()
            : '-';

        if (
          data[k].attendancedata[l].outtime == '-' &&
          data[k].attendancedata[l].intime == '-'
        ) {
          data[k].attendancedata[l].outtime =
            data[k].attendancedata[l].attendancetype;
          data[k].attendancedata[l].intime =
            data[k].attendancedata[l].attendancetype;
        }

        data4.push({
          Employeecode: data[k].attendancedata[l].employeecode,
          Name: data[k].attendancedata[l].userName,
          Number: data[k].attendancedata[l].userNumber,
          Branch: data[k].attendancedata[l].branch,
          Department: data[k].attendancedata[l].department,
          Designation: data[k].attendancedata[l].designation,
          Date: data[k].attendancedata[l].attendancedate,
          InTime: data[k].attendancedata[l].intime,
          OutTime: data[k].attendancedata[l].outtime,
          Hours_Minutes: data[k].attendancedata[l].minutes,
          Minutes: Math.trunc(data[k].attendancedata[l].finalminutes),
          Shift: data[k].attendancedata[l].shift,
          ShiftHours: data[k].attendancedata[l].shiftHours,
          ShiftInTime: data[k].attendancedata[l].shiftInTime,
          ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
          LateBy: data[k].attendancedata[l].Lateby,
          EarlyBy: data[k].attendancedata[l].EarlyBy,
          Penalty: data[k].attendancedata[l].Penalty,
          PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
          GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
          ['LateComing Penalty']: data[k].attendancedata[l].Penalty
            ? data[k].attendancedata[l].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[k].attendancedata[l]
            .PenaltyDeduction
            ? data[k].attendancedata[l].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
            ? data[k].attendancedata[l].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
            .goEarlyPanaltyDeduction
            ? data[k].attendancedata[l].goEarlyPanaltyDeduction
            : '-',
        });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[k].totalpresentday,
        Name: 'Total Absent: ' + data[k].totalabsentday,
        Number: 'Total Half Day: ' + data[k].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[k].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[k].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[k].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[k].totalpendingleave,
      });
    }
    data = data4;
  } else if (+reportType == 5) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].attendancetype.includes('holiday')
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].intime == '-' &&
          data[i].attendancedata[j].outtime == '-'
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] =
            data[i].attendancedata[j].intime != '-'
              ? new Date(data[i].attendancedata[j].intime).toLocaleString()
              : '-';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] =
            data[i].attendancedata[j].outtime != '-'
              ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
              : '-';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        }
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 6 || +reportType == 7) {
    let data4 = [];
    for (var k = 0; k < data.length; k++) {
      for (var l = 0; l < data[k].attendancedata.length; l++) {
        const attdata = {
          Employeecode: data[k].attendancedata[l].employeecode,
          Name: data[k].attendancedata[l].userName,
          Number: data[k].attendancedata[l].userNumber,
          Branch: data[k].attendancedata[l].branch,
          Department: data[k].attendancedata[l].department,
          Designation: data[k].attendancedata[l].designation,
          Date: data[k].attendancedata[l].attendancedate,
        };

        if (+reportType == 6) {
          data[k][
            new Date(data[k].attendancedata[l].attendancedate)
              .toISOString()
              .slice(0, 10)
          ] = data[k].attendancedata[l].attendancetype;

          attdata['Attendance'] = data[k].attendancedata[l].attendancetype;
        } else {
          data[k].attendancedata[l].intime =
            data[k].attendancedata[l].intime != '-'
              ? new Date(data[k].attendancedata[l].intime).toLocaleString()
              : '-';
          data[k].attendancedata[l].outtime =
            data[k].attendancedata[l].outtime != '-'
              ? new Date(data[k].attendancedata[l].outtime).toLocaleString()
              : '-';

          if (
            data[k].attendancedata[l].outtime == '-' &&
            data[k].attendancedata[l].intime == '-'
          ) {
            data[k].attendancedata[l].outtime =
              data[k].attendancedata[l].attendancetype;
            data[k].attendancedata[l].intime =
              data[k].attendancedata[l].attendancetype;
          }

          attdata['InTime'] = data[k].attendancedata[l].intime;
          attdata['OutTime'] = data[k].attendancedata[l].outtime;
        }

        const attdata1 = {
          Hours_Minutes: data[k].attendancedata[l].minutes,
          Minutes: Math.trunc(data[k].attendancedata[l].finalminutes),
          Shift: data[k].attendancedata[l].shift,
          ShiftHours: data[k].attendancedata[l].shiftHours,
          ShiftInTime: data[k].attendancedata[l].shiftInTime,
          ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
          LateBy: data[k].attendancedata[l].Lateby,
          EarlyBy: data[k].attendancedata[l].EarlyBy,
          Penalty: data[k].attendancedata[l].Penalty,
          PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
          GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
          ['LateComing Penalty']: data[k].attendancedata[l].Penalty
            ? data[k].attendancedata[l].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[k].attendancedata[l]
            .PenaltyDeduction
            ? data[k].attendancedata[l].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
            ? data[k].attendancedata[l].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
            .goEarlyPanaltyDeduction
            ? data[k].attendancedata[l].goEarlyPanaltyDeduction
            : '-',
          ['Attendance Log']:
            +data[k].attendancedata[l].logData.length > 0
              ? data[k].attendancedata[l].logData.join(', ')
              : '-',
        };

        data4.push({ ...attdata, ...attdata1 });

        // data4.push({
        //   Employeecode: data[k].attendancedata[l].employeecode,
        //   Name: data[k].attendancedata[l].userName,
        //   Number: data[k].attendancedata[l].userNumber,
        //   Branch: data[k].attendancedata[l].branch,
        //   Department: data[k].attendancedata[l].department,
        //   Designation: data[k].attendancedata[l].designation,
        //   Date: data[k].attendancedata[l].attendancedate,
        //   InTime: data[k].attendancedata[l].intime,
        //   OutTime: data[k].attendancedata[l].outtime,
        //   Hours_Minutes: data[k].attendancedata[l].minutes,
        //   Minutes: Math.trunc(data[k].attendancedata[l].finalminutes),
        //   Shift: data[k].attendancedata[l].shift,
        //   ShiftHours: data[k].attendancedata[l].shiftHours,
        //   ShiftInTime: data[k].attendancedata[l].shiftInTime,
        //   ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
        //   LateBy: data[k].attendancedata[l].Lateby,
        //   EarlyBy: data[k].attendancedata[l].EarlyBy,
        //   Penalty: data[k].attendancedata[l].Penalty,
        //   PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
        //   GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
        //   ['LateComing Penalty']: data[k].attendancedata[l].Penalty
        //     ? data[k].attendancedata[l].Penalty
        //     : '-',
        //   ['LateComing Penalty Deduction']: data[k].attendancedata[l]
        //     .PenaltyDeduction
        //     ? data[k].attendancedata[l].PenaltyDeduction
        //     : '-',
        //   ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
        //     ? data[k].attendancedata[l].goEarlyPanalty
        //     : '-',
        //   ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
        //     .goEarlyPanaltyDeduction
        //     ? data[k].attendancedata[l].goEarlyPanaltyDeduction
        //     : '-',
        //   ['Attendance Log']: +data[k].attendancedata[l]
        //     .logData.length > 0
        //     ? data[k].attendancedata[l].logData.join(', ')
        //     : '-',
        // });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[k].totalpresentday,
        Name: 'Total Absent: ' + data[k].totalabsentday,
        Number: 'Total Half Day: ' + data[k].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[k].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[k].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[k].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[k].totalpendingleave,
      });
    }
    data = data4;
  }
  console.log(data, '0---');
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
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForTackingReport = async (
  total_kms,
  final,
  fileName,
  fileType,
  res
) => {
  if (!final.length) throw new Error('No data found to generate the file!');

  let newData = final.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let final1 = newData.map((item) => ({
    'USER NAME': item.displayName,
    'USER NUMBER': item.userNumber,
    ADRESS: item.Address,
    'TRACK DATETIME': asiaKolkataDateTime(item.Track_datetime),
    BATTERY: item.Battery,
    GPS: item.Gps,
    WIFI: item.Wifi,
    'MOBILE NAME': item.Mobile_name,
    'ITEM TYPE': item.type,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  workSheet.addRow([` Total Kms : ${total_kms}`]);
  workSheet.mergeCells(1, 1, 1, 10);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(final1[0]);

  workSheet.addRow(headerNames);

  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = final1.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForMusterRoll = async (
  data,
  companyName,
  Branch,
  month,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  const mergeCells = (startRow, endRow) =>
    workSheet.mergeCells(
      startRow,
      1,
      endRow,
      9 + +data[0].attendance.length + +data[0].leaveArray.length
    );

  const setRowHeight = (rowNumber, height) =>
    (workSheet.getRow(rowNumber).height = height);

  workSheet.addRow(['FORM XVI']);
  workSheet.addRow(['[See Rule 78 (2) (a)]']);
  workSheet.addRow(['Muster Roll']);
  workSheet.addRow(['For the month of : ' + month]);
  workSheet.addRow(['Name and Address of Company : ' + companyName]);
  workSheet.addRow(['Name and Address of Branch : ' + Branch]);
  workSheet.addRow([]);

  mergeCells(1, 1);
  mergeCells(2, 2);
  mergeCells(3, 3);
  mergeCells(4, 4);
  mergeCells(5, 5);
  mergeCells(6, 6);
  mergeCells(7, 7);
  setRowHeight(1, 25);
  setRowHeight(2, 25);
  setRowHeight(3, 25);

  await styleRow(workSheet, 1);
  await styleRow(workSheet, 2);
  await styleRow(workSheet, 3);

  const sefontSize = (row, size) => {
    workSheet.getRow(row).font = {
      bold: true,
      size: size,
      color: { argb: '000000' },
    };
  };

  sefontSize(1, 17);
  sefontSize(2, 15);
  sefontSize(3, 16);

  workSheet.getRow(4).alignment = {
    vertical: 'middle',
    horizontal: 'right',
  };
  workSheet.getRow(4).font = {
    bold: true,
    color: { argb: '000000' },
  };

  const header = ['Sr No.', 'Employee Code', 'Employee Name', 'Designation'];

  data[0].attendance.map((e) => {
    header.push(e.date);
  });

  const leaveheader = data[0].leaveArray.map((e) => e.leaveName);

  const headerNames = [
    ...header,
    ...['Working Days', 'WH', 'PH'],
    ...leaveheader,
    ...['AB', 'Total'],
  ];

  workSheet.addRow(headerNames);

  workSheet.getRow(8).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  data.map((e) => {
    const rowdata = [e.SrNo, e.employeeCode, e.employeeName, e.designation];

    e.attendance.map((a) => rowdata.push(a.value));

    const leavedata = e.leaveArray.map((l) => l.value);

    const final = [
      ...rowdata,
      ...[e.workingday, e.week_Off, e.holiday],
      ...leavedata,
      ...[e.absent, e.total],
    ];
    workSheet.addRow(final);
  });

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 8) {
      row.eachCell((cell, colNumber) => {
        // alignment(workSheet, rowNumber + 7);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        // }
      });
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForFORM_D_AttendanceRegister = async (
  data,
  otherdata,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  const mergeCells = (startRow, endRow) =>
    workSheet.mergeCells(startRow, 1, endRow, 12 + +data[0].attendance.length);

  const setRowHeight = (rowNumber, height) =>
    (workSheet.getRow(rowNumber).height = height);

  workSheet.addRow(['FORM D']);
  workSheet.addRow(['FORMAT OF ATTENDANCE REGISTER']);
  workSheet.addRow([`Name and Address of Company : ${otherdata.companydata}`]);
  workSheet.addRow([`Name and Address of Branch : ${otherdata.branchdata}`]);
  workSheet.addRow([
    `For the period From : ${otherdata.start_date} To ${otherdata.end_date}`,
  ]);
  workSheet.addRow([]);

  mergeCells(1, 1);
  mergeCells(2, 2);
  mergeCells(3, 3);
  mergeCells(4, 4);
  mergeCells(5, 5);
  mergeCells(6, 6);

  setRowHeight(1, 25);
  setRowHeight(2, 25);

  await styleRow(workSheet, 1);
  await styleRow(workSheet, 2);

  const sefontSize = (row, size) => {
    workSheet.getRow(row).font = {
      bold: true,
      size: size,
      color: { argb: '000000' },
    };
  };

  sefontSize(1, 17);
  sefontSize(2, 15);

  const date_header = data[0].attendance.map((e) => e.date);

  const mainHeader = [
    ...[
      'Sr No.',
      'Employee Code',
      'Designation',
      'Employee Name',
      'Branch',
      'Time',
    ],
    ...date_header,
    ...[
      'summary No. of days',
      'WeekOff',
      'Holiday',
      'Absent',
      'Remarks No. of Hours',
      'Signature of Register Keeper',
    ],
  ];

  workSheet.addRow(mainHeader);

  workSheet.getRow(7).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  let countrow = 7;
  data.map((e, index) => {
    const rowdata = [
      index + 1,
      e.employeeCode,
      e.designation,
      e.employeeName,
      e.branch,
    ];

    const indata = e.attendance.map((a) => a.intime);

    const outdata = e.attendance.map((a) => a.outtime);

    workSheet.addRow([
      ...rowdata,
      ...['IN'],
      ...indata,
      ...[e.present, e.week_Off, e.holiday, e.absent, '', ''],
    ]);
    countrow++;
    const firstrow = countrow;
    workSheet.addRow([
      ...rowdata,
      ...['OUT'],
      ...outdata,
      ...[e.present, e.week_Off, e.holiday, e.absent, '', ''],
    ]);
    countrow++;
    const lasttrow = countrow;

    workSheet.mergeCells(firstrow, 1, lasttrow, 1);
    workSheet.mergeCells(firstrow, 2, lasttrow, 2);
    workSheet.mergeCells(firstrow, 3, lasttrow, 3);
    workSheet.mergeCells(firstrow, 4, lasttrow, 4);
    workSheet.mergeCells(firstrow, 5, lasttrow, 5);

    workSheet.mergeCells(
      firstrow,
      7 + +indata.length,
      lasttrow,
      7 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      8 + +indata.length,
      lasttrow,
      8 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      9 + +indata.length,
      lasttrow,
      9 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      10 + +indata.length,
      lasttrow,
      10 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      11 + +indata.length,
      lasttrow,
      11 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      12 + +indata.length,
      lasttrow,
      12 + +indata.length
    );
  });

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 7) {
      row.eachCell((cell, colNumber) => {
        alignmentmiddle(workSheet, rowNumber);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });
    }
  });

  workSheet.addRow([]);

  const tempheader = Array.from(
    { length: +data[0].attendance.length + 5 },
    () => ''
  );

  workSheet.addRow([
    ...[
      '#Relay and *Place of Work in case of Mines only (Underground/Opencast/Surface)',
    ],
    ...tempheader,
  ]);
  const tempadd1 = [
    ...[
      '**In case an employee is not present the following to be entered : PL for PaidLeave / A for Absent / WH for WeekOff / PH for Holiday',
    ],
    ...tempheader,
    ...['M/s. .....................................'],
  ];
  const tempadd2 = [
    ...['**Not neccessary in case of E Form maintenance.'],
    ...tempheader,
    ...['Authorised Signatory'],
  ];
  workSheet.addRow(tempadd1);
  workSheet.addRow(tempadd2);

  workSheet.mergeCells(
    countrow + 2,
    1,
    countrow + 2,
    6 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 3,
    1,
    countrow + 3,
    6 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 4,
    1,
    countrow + 4,
    6 + +data[0].attendance.length
  );

  workSheet.mergeCells(
    countrow + 3,
    7 + +data[0].attendance.length,
    countrow + 3,
    12 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 4,
    7 + +data[0].attendance.length,
    countrow + 4,
    12 + +data[0].attendance.length
  );

  // mergeCells(countrow + 3, countrow + 3);

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForAttendanceData = async (
  data,
  resultArray,
  companyName,
  Branch,
  month,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  workSheet.addRow([companyName]);

  workSheet.mergeCells(1, 1, 1, 9 + +data[0].attendance.length);
  workSheet.getRow(1).height = 20;

  await styleRow(workSheet, 1);

  workSheet.getRow(1).font = {
    bold: true,
    size: 12,
    color: { argb: '000000' },
  };

  workSheet.addRow([
    'ATTENDANCE SHEET FOR THE MONTH OF ' +
      `${month}                        ` +
      `SITE : ${Branch}`,
  ]);

  workSheet.mergeCells(2, 1, 2, 9 + +data[0].attendance.length);

  const header = ['Sr No.', 'Employee Code', 'Employee Name', 'Designation'];

  data[0].attendance.map((e) => {
    header.push(e.date);
  });

  const headerNames = [
    ...header,
    ...[
      'Working Days',
      'WeeklyOff Days',
      'Absent Days',
      'FHD/NHD',
      'Total Days',
    ],
  ];

  workSheet.addRow(headerNames);

  workSheet.getRow(3).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  data.map((e) => {
    const rowdata = [e.SrNo, e.employeeCode, e.employeeName, e.designation];

    e.attendance.map((a) => rowdata.push(a.value));

    const final = [
      ...rowdata,
      ...[e.workingday, e.week_Off, e.absent, e.holiday, e.total],
    ];
    workSheet.addRow(final);
  });

  const sumdata = resultArray.map((e) => e.totalValue);

  workSheet.addRow([
    ...['Daily Total', '', '', ''],
    ...sumdata,
    ...['', '', '', '', ''],
  ]);

  workSheet.mergeCells(4 + +data.length, 1, 4 + +data.length, 4);

  workSheet.getRow(4 + +data.length).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  const tempheader = Array.from({ length: +sumdata.length + 8 }, () => '');

  workSheet.addRow([...['Initial Of Client'], ...tempheader]);

  workSheet.mergeCells(5 + +data.length, 1, 5 + +data.length, 4);
  workSheet.mergeCells(
    5 + +data.length,
    5,
    5 + +data.length,
    4 + +data[0].attendance.length
  );

  workSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      alignment(workSheet, rowNumber + 2);
      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForShift = async (ShiftData, fileName, fileType, res) => {
  if (!ShiftData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Shift Name',
    'Company Name',
    'Shift Code',
    'Shift Desc',
    'Status',
    'Shift Grace',
    'Shift Time',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Day',
    'Start Time',
    'First Half End Time',
    'Second Half Start Time',
    'End Time',
    'Minimum Hours For Halfday',
    'Minimum Hours For Fullday ',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 8, 1, 14);

  for (let i = 1; i <= 7; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = ShiftData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  for (let j = 3; j <= data2.length; j = j + 7) {
    for (let i = 1; i <= 7; i++) {
      worksheet.mergeCells(j, i, j + 6, i);
    }
  }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForFiveMinuteTackingReport = async (
  final,
  fileName,
  fileType,
  res,
  displayName,
  Track_datetime
) => {
  if (!final.length) throw new Error('No data found to generate the file!');

  let newData = final.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let final1 = newData.map((item) => ({
    ADRESS: item.Address,
    'TRACK TIME': new Date(item.Track_datetime).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
    }),
    BATTERY: item.Battery,
    GPS: item.Gps,
    WIFI: item.Wifi,
    'Duration (minutes)': item.duration,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);
  const currentDate = new Date(Track_datetime).toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
  });
  const [month, day, year] = currentDate.split('/');
  const formattedDate = `${day}-${month}-${year}`;
  workSheet.addRow([`User Name :  ${displayName} , Date:${formattedDate}`]);

  // workSheet.addRow([`User Name :  ${displayName} , ${(Track_datetime)}`]);
  workSheet.mergeCells(1, 1, 1, 6);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(final1[0]);
  workSheet.addRow(headerNames);
  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
  });

  const data2 = final1.map((row) => Object.values(row));
  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

//exportdata.js

const generateExcelForSalaryRegister = async (
  data,
  headerData,
  report,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const keysArray = Object.keys(data[0]);

  if (report == 'salaryRegisterWithDateOfPay') {
    const tempheader = Array.from({ length: +keysArray.length - 5 }, () => '');

    workSheet.addRow([headerData.companyName]);
    workSheet.addRow([
      ...[headerData.companyAddress],
      ...tempheader,
      ...[headerData.month],
    ]);
    if (headerData.branchName) {
      workSheet.addRow([
        `${headerData.branchName} , ${headerData.branchAddress}`,
      ]);
    }

    workSheet.mergeCells(1, 1, 1, keysArray.length);
    workSheet.mergeCells(2, 1, 2, keysArray.length - 4);
    workSheet.mergeCells(2, keysArray.length - 3, 2, keysArray.length);
    workSheet.mergeCells(3, 1, 3, keysArray.length);

    workSheet.getRow(1).height = 25;

    await styleRow(workSheet, 1);
    await styleRow(workSheet, 2);
    await styleRow(workSheet, 3);

    workSheet.getRow(1).font = {
      bold: true,
      size: 15,
      color: { argb: '000000' },
    };
  }

  workSheet.addRow(keysArray);

  if (report == 'salaryRegisterWithDateOfPay') {
    workSheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue Color
      };
      cell.font = { bold: true };
    });
  } else {
    workSheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue color
      };
      cell.font = { bold: true };
    });
  }

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function base64ToUint8Array(base64String) {
  // const binaryString = atob(base64String);
  const binaryString = Buffer.from(base64String, 'base64').toString('binary');
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Function to create a zip file containing PDF files for salary slip

async function createZipFileForsalarySlip(
  salarySlipData,
  yearMonth,
  fileName,
  res
) {
  const zip = new JSZip();
  for (let i = 0; i < salarySlipData.length; i++) {
    const pdfBytes = base64ToUint8Array(salarySlipData[i].path);
    zip.file(
      `${i + 1} ${salarySlipData[i].displayName} - ${yearMonth}.pdf`,
      pdfBytes
    );
  }
  const zipbuffer = await zip.generateAsync({ type: 'nodebuffer' });
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=${fileName}.zip`,
  });
  return res.end(zipbuffer);
}

const setColorInBackground = (workSheet, row, color) => {
  workSheet.getRow(row).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `${color}` },
    };
    cell.font = { bold: true };
  });
};

const generateDemoExcelForAdvance = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Advance Data');
  const workSheet1 = workBook.addWorksheet('Basic Instructions');
  workSheet1.addRow(['Date Format must be in yyyy-mm-dd format.']);
  workSheet1.addRow([
    'Reference Date is required ,if you are selecting payment mode Cheque,UPI or NetBanking.',
  ]);

  setColorInBackground(workSheet1, 1, 'FF0000'); // light red
  setColorInBackground(workSheet1, 2, 'FF0000');

  const keysArray = Object.keys(data[0]);
  workSheet.addRow(keysArray);
  setColorInBackground(workSheet, 1, '729fcf'); // blue
  await styleRow(workSheet, 1);

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  // set payment mode in dropdown
  const paymentModeColumn = workSheet.getColumn(5);
  const paymentModeValues = ['Cash', 'UPI', 'Cheque', 'NetBanking'];
  paymentModeColumn.eachCell((cell, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip the header row
      const dataValidation = {
        type: 'list',
        formulae: [`"${paymentModeValues.join(',')}"`],
        allowNulls: true,
      };
      cell.dataValidation = dataValidation;
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForPreboarding = async (
  PreboardingData,
  fileName,
  fileType,
  res,
  index1
) => {
  if (!PreboardingData.length)
    throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'User Name',
    'User Number',
    'Date of Birth',
    'Email',
    'Address',
    'Branch',
    'Designation',
    'Date Time',
    'Preboarding Request',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Assigned By',
    'Remarks',
    'Request Status',
    'Assigned to',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 10, 1, 12);

  for (let i = 1; i <= 9; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = PreboardingData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 9; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }
  worksheet.getColumn(9).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference

  // var indexofIndex1 = 0
  // for (let j = 3; j <= data2.length; j = j + index1[indexofIndex1]) {
  //   for (let i = 1; i <= 8; i++) {
  //     worksheet.mergeCells(j, i, j + 2, i);
  //   }
  // }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForEmployeeGatePass = async (
  ShiftData,
  fileName,
  fileType,
  res
) => {
  if (!ShiftData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Employee Name',
    'Company Name',
    'Branch',
    'Department',
    'Designation',
    'Stauts',
    'Description',
    'Date',
    'From Time',
    'To Time',
    'Purpose',
    'Rejection Reason',
    'Check In/Out Details',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',

    'Date',
    'Time',
    'Type',
    'Address',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 14, 1, 17);

  for (let i = 1; i <= 13; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = ShiftData.map((row) => Object.values(row));
  data2.map((e) => worksheet.addRow(e));

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 13; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

module.exports = {
  generateExcelForSalaryRegister,
  generateExcel,
  generateExceltoMail,
  generateChecklistExcel,
  generateExcelforSalaryStructure,
  generateExcelForLeave,
  generateDemoExcelForVariable,
  generateExcelForLeaveBalance,
  generateExcelForDailyCost,
  generateExcelForBankReport,
  EmailSalarySlip,
  generateAttendanceExcel,
  generateExcelForAttendanceData,
  generateExcelForTackingReport,
  generateExcelForMusterRoll,
  generateExcelForFORM_D_AttendanceRegister,
  generateExcelForShift,
  generateExcelForFiveMinuteTackingReport,
  createZipFileForsalarySlip,
  generateDemoExcelForAdvance,
  generateExcelForPreboarding,
  generateExcelForEmployeeGatePass,
};
