const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const firebaseAdmin = require("firebase-admin");
const config = require("../config/index");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(
    config.get("secret.firebase.serviceAccount")
  ),
  storageBucket: config.get("secret.firebase.storageBucket"),
});

async function postUploadImage(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const bucket = firebaseAdmin.storage().bucket();
  const uploadedImages = [];

  // Process each file separately
  await Promise.all(
    req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const fileName = `${new Date().toISOString()}.${file.originalname
          .split(".")
          .pop()}`;
        const blob = bucket.file(`images/${fileName}`);
        const blobStream = blob.createWriteStream();

        blobStream.on("finish", async () => {
          const config = {
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 90, //設定圖片網址過期天數為90天
          };
          try {
            const [fileUrl] = await blob.getSignedUrl(config);
            uploadedImages.push(fileUrl);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        blobStream.on("error", (error) => {
          logger.error("上傳錯誤:", error);
          reject(new AppError(400, ERROR_MESSAGES.FILE_UPLOAD));
        });

        blobStream.end(file.buffer);
      });
    })
  );

  // Send response once all files are uploaded
  res.status(200).json({
    status: "success",
    message: "上傳成功",
    data: {
      image_urls: uploadedImages,
    },
  });
}

async function deleteImages(req, res, next) {
  const { imageUrls } = req.body;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    logger.error("未提供imageUrl:", error);
    return next(new AppError(400, "請提供至少一個 imageUrl"));
  }

  const bucket = firebaseAdmin.storage().bucket();
  const bucketName = config.get("secret.firebase.storageBucket");
  const signedUrlPrefix = `https://storage.googleapis.com/${bucketName}/`;

  const deletedPaths = [];

  await Promise.all(
    imageUrls.map(async (imageUrl) => {
      if (!imageUrl.startsWith(signedUrlPrefix)) {
        logger.error("無效的圖片網址", error);
        throw new AppError(400, `無效的圖片網址: ${imageUrl}`);
      }

      const decodedUrl = decodeURIComponent(imageUrl);
      const blobPath = decodedUrl.replace(signedUrlPrefix, "").split("?")[0];

      const file = bucket.file(blobPath);
      await file.delete();

      deletedPaths.push(blobPath);
    })
  );

  res.status(200).json({
    status: "success",
    message: "圖片已全部刪除",
    data: {
      deleted: deletedPaths,
    },
  });
}

module.exports = { postUploadImage, deleteImages };

// 僅上傳一張圖片
/*
async function postUploadImage(req, res, next) {
  if (!req.files) {
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const bucket = firebaseAdmin.storage().bucket();
  const file = req.files[0];
  const fileName = `${new Date().toISOString()}.${file.originalname
    .split(".")
    .pop()}`;
  const blob = bucket.file(`images/${fileName}`);
  const blobStream = blob.createWriteStream();

  blobStream.on("finish", () => {
    const config = {
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24, //網址的有效期限：24 小時
    };

    blob.getSignedUrl(config, (err, fileUrl) => {
      res.status(200).json({
        status: "success",
        message: "上傳成功",
        data: {
          image_url: fileUrl,
        },
      });
    });
  });

  blobStream.on("error", (error) => {
    logger.error("上傳錯誤:", error);
    return next(new AppError(400, ERROR_MESSAGES.FILE_UPLOAD));
  });

  blobStream.end(file.buffer);
}
*/
