const validator = require('validator');

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

module.exports = {
    isUndefined,
    isValidString,
    isValidInteger,
    isValidEmail,
    isValidPassword,
    isValidUrl
};