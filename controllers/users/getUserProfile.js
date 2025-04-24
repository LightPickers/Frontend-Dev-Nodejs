const { dataSource } = require("../../db/data-source");
const { validateSignup } = require("../../utils/validUtils");
const AppError = require("../../utils/appError");
const ERROR_MESSAGES = require("../../utils/errorMessages");

async function getUserProfile(req, res, next) {
  //const { id: userId } = req.user;
  const userId = req.body.userId;
  const user = await dataSource.getRepository("Users").findOne({
    select: [
      "name",
      "email",
      "phone",
      "gender",
      "birth_date",
      "address_zipcode",
      "address_district",
      "address_detail",
      "photo",
    ],
    where: { id: userId },
  });

  res.status(200).json({
    status: true,
    data: {
      user,
    },
  });
}

module.exports = getUserProfile;
