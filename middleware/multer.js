const multer = require("multer");
const path = require("path");
const fs = require("fs");

const generateStorageConfig = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.normalize(path.join(destination)));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  });
};

const configureMulter = (destination, fileSize, allowedFileTypes) => {
  if (!fs.existsSync(path.join(destination))) {
    fs.mkdirSync(path.join(destination), { recursive: true }, (err) => {
      if (err) {
        console.error(`Error creating directory: ${err}`);
      } else {
        console.log(`Directory created: ${destination}`);
      }
    });
  }
  return multer({
    storage: generateStorageConfig(destination),
    limits: {
      fileSize,
    },
    fileFilter: (req, file, cb) => {
      if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Only ${allowedFileTypes} filetypes are allowed!`));
      }
    },
  });
};

const configureMulterMultipleNames = (
  destination,
  fileSize,
  allowedFileTypes
) => {
  if (!fs.existsSync(path.join(destination))) {
    fs.mkdirSync(path.join(destination), { recursive: true }, (err) => {
      if (err) {
        console.error(`Error creating directory: ${err}`);
      } else {
        console.log(`Directory created: ${destination}`);
      }
    });
  }

  const storage = generateStorageConfig(destination);

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + extension);
      },
    }),
    limits: {
      fileSize,
    },
    fileFilter: (req, file, cb) => {
      if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Only ${allowedFileTypes} filetypes are allowed!`));
      }
    },
  });
};

const handleMulterErrors = (err, req, res, next) => {
  if (err) {
    return res
      .status(400)
      .json({ message: err.message || "Internal server error!" });
  }
  // No errors, proceed to the next middleware/route handler
  next();
};

module.exports = {
  configureMulter,
  handleMulterErrors,
  configureMulterMultipleNames,
};
