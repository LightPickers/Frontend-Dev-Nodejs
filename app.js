const express = require("express");
const path = require("path");
const cors = require("cors");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");
const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products.js");
const cartRouter = require("./routes/cart.js");
const ordersRouter = require("./routes/orders.js");
const neWebPayRouter = require("./routes/neWebPay.js");
//const productsUtilsRouter = require("./routes/productsUtils.js");
const categoriesRouter = require("./routes/categories.js");
const brandsRouter = require("./routes/brands.js");
const conditionsRouter = require("./routes/conditions.js");
const categoryRouter = require("./routes/category.js");

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
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/newebpay", neWebPayRouter);
//app.use("/api/v1/productsUtils", productsUtilsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/conditions", brandsRouter);
app.use("/api/v1/brands", conditionsRouter);
app.use("/api/v1/category", categoryRouter);

//404
app.use((req, res, next) => {
  res.status(404).json({
    status: "false",
    message: "無此路由",
  });
  return;
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || "false",
    message: err.message,
    //error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;
