const path = require("path");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

function getLogFileName() {
  const logsDirectory = path.join(__dirname, "../logs");
  const splitPath = logsDirectory.split(path.sep);
  const projectRoot = splitPath.splice(splitPath.length - 2, 1);
  const logsFileNamewithFullPath = path.join(
    logsDirectory,
    projectRoot.toString().concat(".log")
  );
  return logsFileNamewithFullPath;
}

const myFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} : [${level}] : ${message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(timestamp(), myFormat),
  transports: [new transports.File({ filename: getLogFileName() })],
});
module.exports = logger;
