const bcrypt = require('bcrypt');
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const { isUndefined, isValidString, isValidEmail, isValidPassword } = require('../utils/validUtils');
const appError = require('../utils/appError');
const ERROR_MESSAGES = require('../utils/errorMessages');

async function postLogin(req, res, next) {
    const { email, password } = req.body

    if (isUndefined(email) || !isValidString(email) || !isValidEmail(email) || isUndefined(password) || !isValidString(password)) {
        logger.warn(ERROR_MESSAGES.FIELDS_INCORRECT)
        return next(appError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
    }

    if (!isValidPassword(password)) {
        logger.warn(ERROR_MESSAGES.PASSWORD_NOT_RULE)
        return next(appError(400, ERROR_MESSAGES.PASSWORD_NOT_RULE));
    }

    const userRepository = dataSource.getRepository('Users')
    const existingUser = await userRepository.findOne({
        select:{
            id: true,
            name: true,
            password: true,
            // role_id: true,
            photo: true
        },
        where: { email }
    })

    if (!existingUser) {
        return next(appError(400, ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE));
    }

    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`)
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
        return next(appError(400, ERROR_MESSAGES.USER_NOT_FOUND_OR_PASSWORD_FALSE));
    }

    const token = await generateJWT({
        id: existingUser.id,
        role: existingUser.role_id
    }, config.get('secret.jwtSecret'), {
        expiresIn: `${config.get('secret.jwtExpiresDay')}`
    })

    res.status(201).json({
        status: 'true',
        message: '登入成功',
        data: {
            token,
            user: {
                name: existingUser.name,
                photo: existingUser.photo
            }
        }
    })
}

module.exports = {
    postLogin
}