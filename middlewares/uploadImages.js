const multer = require("multer");
const path = require("path");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILE = 5;
const ALLOWED_FILE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];
const API_KEY = "files";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILE,
  },

  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
    }
    cb(null, true);
  },
}).array(API_KEY, MAX_FILE);

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return next(new AppError(400, ERROR_MESSAGES.FILE_SIZE));
          case "LIMIT_UNEXPECTED_FILE":
            return next(
              new AppError(
                400,
                `檔案格式錯誤，僅限上傳  ${ALLOWED_FILE_TYPES.join(",")} 格式`
              )
            );
          default:
            return next(new AppError(500, ERROR_MESSAGES.FILE_UPLOAD));
        }
      }
      return next(new AppError(500, err.message || ERROR_MESSAGES.FILE_UPLOAD));
    }
    next();
  });
};
