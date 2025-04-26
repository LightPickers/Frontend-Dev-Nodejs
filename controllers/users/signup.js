// const { IsNull, In } = require("typeorm");
const bcrypt = require("bcrypt");
const { dataSource } = require("../../db/data-source");
const validateSignup = require("../../utils/validateSignup");
const ERROR_MESSAGES = require("../../utils/errorMessages");

async function signup(req, res, next) {
  try {
    const validation = validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        status: "false",
        message: validation.errors,
      });
    }

    const userData = {
      ...req.body,
      is_banned: false,
      role_id: "84f0e762-ff1c-4197-b525-c8ec22de8dd5",
    };

    const userRepository = dataSource.getRepository("Users");
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      return res.status(409).json({
        status: "false",
        message: ERROR_MESSAGES.EMAIL_ALREADY_USED,
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    await userRepository.save(newUser);

    res.status(201).json({
      status: "true",
      message: "註冊成功",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = signup;
