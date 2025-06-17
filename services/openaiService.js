const OpenAI = require("openai");
const config = require("../config/index");

const openai = new OpenAI({
  apiKey: config.get("openai.openAiApiKey"),
});

module.exports = openai;
