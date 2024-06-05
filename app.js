const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const http = require("http");
const sequelize = require("./config/database");
const { errorMessage } = require("./response_message/message");
const { statusCodes } = require("./utils/commonVars");

const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.static("public"));
app.use(morgan("combined"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(
  "/bootstrap",
  express.static(`${__dirname}/node_modules/bootstrap/dist`)
);
app.use("/uploads", express.static("uploads"));
app.use(
  "/.well-known/acme-challenge",
  express.static(".well-known/acme-challenge")
);

require("./router")(app);

app.use((error, req, res, next) => {
  console.log("Error in middleware ==>", error);
  const status = error.statusCode || statusCodes.INTERNAL_SERVER;
  const message = error.message || errorMessage.INTERNAL_SERVER_ERROR;
  return res.status(status).json({ status, message });
});
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Mehta India" });
});

sequelize
  // .authenticate()
  .sync()
  .then((result) => {
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });

const server = http.createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`server started on `, port);
});
