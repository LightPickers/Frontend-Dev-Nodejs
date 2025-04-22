const ERROR_MESSAGES = {
    FIELDS_INCORRECT: '欄位未填寫正確',
    URL_INCORRECT: '網址未填寫正確',
    PROFILE_PHOTO_URL_INCORRECT: '大頭貼網址未填寫正確',
    USER_NOT_FOUND: '使用者不存在',
    UPDATE_USER_FAILED: '更新使用者失敗',
    USER_NOT_CHANGE: '使用者名稱未改變',
    EMAIL_NOT_RULE: 'Email不符合規則',
    EMAIL_ALREADY_USED: 'Email已被使用',
    PASSWORD_NOT_RULE: '密碼不符合規則，包含英文大小寫和數字，長度最少8字、最多16個字',
    USER_NOT_FOUND_OR_PASSWORD_FALSE: '使用者不存在或密碼輸入錯誤',
    PASSWORD_FALSE: '密碼輸入錯誤',
    INVALID_OR_EXPIRED_TOKEN: 'Token無效或過期',
    NAME_NOT_RULE: '姓名須為2-10個字，不可包含特殊符號與空白',
    PHONE_NOT_RULE: '電話號碼格式錯誤，須為09開頭加8碼數字',
    ADDRESS_NOT_RULE: '地址資料填寫不完整',
    ZIPCODE_NOT_RULE: '郵遞區號必須為3碼數字',
};

module.exports = ERROR_MESSAGES;