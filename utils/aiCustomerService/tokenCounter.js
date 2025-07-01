const { encoding_for_model } = require("@dqbd/tiktoken");

// 填入自己的模型
// 如果是 fine-tuned 模型，填入 訓練的版本
const encoder = encoding_for_model("gpt-3.5-turbo");

function countTokens(text) {
  return encoder.encode(text).length;
}

module.exports = countTokens;
