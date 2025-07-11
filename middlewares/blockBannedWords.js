const TrieSearch = require("trie-search");
const bannedWords = require("../utils/aiCustomerService/bannedWords");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

// 建立 Trie 並加進禁字
const trie = new TrieSearch("word", {
  ignoreCase: false, // 禁止自動忽略大小寫
  splitOnRegEx: false, // 禁止自動 tokenize 分詞（這會誤傷）
  min: 1, // 最小查找長度
});
bannedWords.forEach((word) => trie.add({ word }));

// middleware 工廠函數，可指定 req.body 的欄位名稱（預設是 "message"）
function blockBannedWords(fieldName = "message") {
  return (req, res, next) => {
    const text = req.body?.[fieldName];
    if (typeof text !== "string") return next();

    const containsBanned = hasBannedWord(text);
    if (containsBanned) {
      return next(new AppError(400, ERROR_MESSAGES.NOT_ENTER_BANNED_WORDS));
    }

    next();
  };
}

// 檢查輸入句子是否含有禁字（逐字切片比對 Trie）
function hasBannedWord(message) {
  const lowerMsg = message.toLowerCase();
  for (let i = 0; i < lowerMsg.length; i++) {
    let str = "";
    for (let j = i; j < lowerMsg.length; j++) {
      str += lowerMsg[j];
      const results = trie.get(str);
      if (results.find((item) => item.word === str)) {
        return true;
      }
    }
  }
  return false;
}

module.exports = blockBannedWords;
