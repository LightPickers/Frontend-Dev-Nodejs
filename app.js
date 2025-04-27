const express = require("express");
const path = require("path");
const cors = require("cors");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");
const usersRouter = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        req.body = req.raw.body;
        return req;
      },
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/users", usersRouter);

//404
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "無此路由",
  });
  return;
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;
