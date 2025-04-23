const express = require("express");
const path = require("path");
const usersRouter = require("./routes/users");

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, "public")));

  app.use("/api/v1/users", usersRouter);

  //404
  app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: "無此路由",
    })
    return
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

  return app;
};

module.exports = createApp;
