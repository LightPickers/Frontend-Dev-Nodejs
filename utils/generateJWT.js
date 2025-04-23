//utils/generateJWT.js

const jwt = require('jsonwebtoken')

/**
 * create JSON Web Token
 * @param {Object} payload token content
 * @param {String} secret token secret
 * @param {Object} [option] same to npm package - jsonwebtoken
 * @returns {String}
 */
module.exports = (payload, secret, option = {}) => new Promise((resolve, reject) => {
    jwt.sign(payload, secret, option, (err, token) => {
        if (err) {
            // reject(err)
            // return
            switch (err.name) {
                case 'TokenExpiredError':
                    reject(appError(401, 'Token 已過期'))
                    break
                default:
                    reject(appError(401, '無效的 token'))
                    break
            }
        }
        resolve(token)
    })
})
