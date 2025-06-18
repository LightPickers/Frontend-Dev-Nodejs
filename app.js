const express = require("express");
const path = require("path");
const cors = require("cors");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger")("App");
require("./crons/orderExpire.cron.js");

const usersRouter = require("./routes/users");
const emailRouter = require("./routes/email");
const authRouter = require("./routes/auth");
const productsRouter = require("./routes/products.js");
const cartRouter = require("./routes/cart.js");
const ordersRouter = require("./routes/orders.js");
const neWebPayRouter = require("./routes/neWebPay.js");
const categoriesRouter = require("./routes/categories.js");
const brandsRouter = require("./routes/brands.js");
const conditionsRouter = require("./routes/conditions.js");
const categoryRouter = require("./routes/category.js");
const uploadRouter = require("./routes/upload");
const healthRouter = require("./routes/health.js");
const aiCustomerServiceRouter = require("./routes/aiCustomerService.js");

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
app.use("/api/v1/email", emailRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/newebpay", neWebPayRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/conditions", conditionsRouter);
app.use("/api/v1/brands", brandsRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/upload/image", uploadRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/aiCustomerService", aiCustomerServiceRouter);

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
