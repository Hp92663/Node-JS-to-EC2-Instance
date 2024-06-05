const { join } = require("path");
const { readFileSync } = require("fs");
const { launch } = require("puppeteer");
const handlebars = require("handlebars");

handlebars.registerHelper("multiply", function (a, b) {
  return a * b;
});

/**
 * Generates the PDF using Handlebars file and input data
 * @param {string} hbsFileName name of Handlebars file
 * @param {object} obj object that contains dynamic data that needs to be replaced in Handlebars file
 */
exports.generatePDF = async (hbsFileName, obj) => {
  try {
    const hbsFilePath = join(__dirname, "../html/", `${hbsFileName}.hbs`);

    // Read the Handlebars file
    let hbsContent = readFileSync(hbsFilePath, "utf-8");

    // Compile the Handlebars template
    const template = handlebars.compile(hbsContent);

    // Generate HTML content by passing the data to the compiled template
    const htmlContent = template(obj);

    const browser = await launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
    });

    await page.emulateMediaType("screen");
    const pdfBuffer = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
    });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.log("Error in Generate PDF Function", error);
    throw error;
  }
};
