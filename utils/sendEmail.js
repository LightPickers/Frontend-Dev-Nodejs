const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const logger = require("../utils/logger")("sendEmail");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

async function registerSuccess(to) {
  const subject = "拾光堂會員註冊完成通知信";
  const htmlPath = path.join(
    __dirname,
    "../emailTemplates/registerSuccess.html"
  );

  let html;
  try {
    html = fs.readFileSync(htmlPath, "utf-8");
  } catch (err) {
    logger.error(`讀取 email 模板失敗: ${err.message}`);
    throw new AppError(500, ERROR_MESSAGES.EMAIL_NOT_READ);
  }

  const oauth2Client = new OAuth2(
    `${config.get("google.googleAuthClientId")}`,
    `${config.get("google.googleAuthClientSecret")}`,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: `${config.get("google.googleAuthRefreshToken")}`,
  });

  const accessToken = await oauth2Client.getAccessToken();

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: `${config.get("google.sendUser")}`,
      clientId: `${config.get("google.googleAuthClientId")}`,
      clientSecret: `${config.get("google.googleAuthClientSecret")}`,
      refreshToken: `${config.get("google.googleAuthRefreshToken")}`,
      accessToken: accessToken,
    },
  });
  const mailOptions = {
    from: `拾光堂 <${config.get("google.sendUser")}>`,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions); //送 smtp 請求給Gmail Server
}

async function resetPassword(to, extraData = {}) {
  const subject = "重設密碼連結";
  const htmlPath = path.join(__dirname, "../emailTemplates/resetPassword.html");

  let html;
  try {
    html = fs
      .readFileSync(htmlPath, "utf-8")
      .replace("{{TOKEN}}", extraData.token);
  } catch (err) {
    logger.error(`讀取 email 模板失敗: ${err.message}`);
    throw new AppError(500, ERROR_MESSAGES.EMAIL_NOT_READ);
  }

  const oauth2Client = new OAuth2(
    `${config.get("google.googleAuthClientId")}`,
    `${config.get("google.googleAuthClientSecret")}`,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: `${config.get("google.googleAuthRefreshToken")}`,
  });

  const accessToken = await oauth2Client.getAccessToken();

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: `${config.get("google.sendUser")}`,
      clientId: `${config.get("google.googleAuthClientId")}`,
      clientSecret: `${config.get("google.googleAuthClientSecret")}`,
      refreshToken: `${config.get("google.googleAuthRefreshToken")}`,
      accessToken: accessToken,
    },
  });
  const mailOptions = {
    from: `拾光堂 <${config.get("google.sendUser")}>`,
    to,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions); //送 smtp 請求給Gmail Server
}

async function getGoogleTransporter() {
  const oauth2Client = new OAuth2(
    config.get("google.googleAuthClientId"),
    config.get("google.googleAuthClientSecret"),
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: config.get("google.googleAuthRefreshToken"),
  });

  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: config.get("google.sendUser"),
      clientId: config.get("google.googleAuthClientId"),
      clientSecret: config.get("google.googleAuthClientSecret"),
      refreshToken: config.get("google.googleAuthRefreshToken"),
      accessToken: accessToken,
    },
  });
}

async function orderConfirm(to, data) {
  const templatePath = path.join(
    __dirname,
    "../emailTemplates/orderConfirm.hbs"
  );
  let templateContent;

  try {
    templateContent = fs.readFileSync(templatePath, "utf-8");
  } catch (err) {
    logger.error(`\u8B80\u53D6 email \u6A21\u677F\u5931\u6557: ${err.message}`);
    throw new AppError(500, "無法載入信件樣板");
  }

  // 編譯 handlebars 模板
  const template = handlebars.compile(templateContent);

  // 建立插入資料（可直接用 data 傳入的結構）
  const html = template(data);

  const transporter = await getGoogleTransporter();

  await transporter.sendMail({
    from: `拾光堂 <${config.get("google.sendUser")}>`,
    to,
    subject: `訂單確認通知 - 訂單編號 ${data.orderNumber}`,
    html,
  });
}

module.exports = {
  registerSuccess,
  resetPassword,
  orderConfirm,
};
