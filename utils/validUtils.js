const validator = require('validator');
const ERROR_MESSAGES = require('./errorMessages');

function isUndefined(value){
    return value === undefined;
};
function isValidString(value){
    return typeof value === 'string' && !validator.isEmpty(value.trim());
};
function isValidInteger(value){
    return typeof value === 'number' && validator.isInt(String(value),{min:0})
};
function isValidEmail(value){
    return validator.isEmail(value);
};
function isValidPassword(value){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/.test(value);
};
function isValidUrl(value){
    return /^(https:\/\/)([a-zA-Z0-9.-]+)(\.[a-zA-Z]{2,})(\/.*)?$/.test(value);
};
function isValidPhone(value){
    return /^(09\d{8})$/.test(value);
};
function isValidName(value){
    return /^[\u4e00-\u9fa5a-zA-Z]{2,10}$/.test(value);
};

function validateSignup(data) {
    const errors = {};

    if (!isValidEmail(data.email)) {
        errors.email = ERROR_MESSAGES.EMAIL_NOT_RULE;
    }

    if (!isValidPassword(data.password)) {
        errors.password = ERROR_MESSAGES.PASSWORD_NOT_RULE;
    }

    if (!data.name?.match(/^[a-zA-Z\u4e00-\u9fa5]{2,10}$/)) {
        errors.name = ERROR_MESSAGES.FIELDS_INCORRECT;
    }

    if (!data.phone?.match(/^09\d{8}$/)) {
        errors.phone = ERROR_MESSAGES.FIELDS_INCORRECT;
    }

    if (data.address) {
        if (!data.address.zipcode || !data.address.zipcode.match(/^\d{3}$/)) {
            errors.zipcode = ERROR_MESSAGES.FIELDS_INCORRECT;
        }
        if (!data.address.district) {
            errors.district = ERROR_MESSAGES.FIELDS_INCORRECT;
        }
        if (!data.address.street_address) {
            errors.street_address = ERROR_MESSAGES.FIELDS_INCORRECT;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };

}
module.exports = {
    isUndefined,
    isValidString,
    isValidInteger,
    isValidEmail,
    isValidPassword,
    isValidUrl,
    isValidPhone,
    isValidName,
    validateSignup,
};