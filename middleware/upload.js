const multer = require("multer");
const mime = require("mime-types");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = "./uploads";

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
  },
});

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};

const product = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = "./uploads/product";

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + "." + mime.extension(file.mimetype)
    );
  },
});

const uploadfile = multer({
  storage: storage,
  fileFilter: excelFilter,
}).single("file");

const uploadproduct = multer({
  storage: product,
}).single("image");

module.exports = {
  uploadfile,
  uploadproduct,
};
