const { dataSource } = require("../db/data-source");
const openai = require("../services/openaiService");
const logger = require("../utils/logger")("aiCustomerServiceController");
const countTokens = require("../utils/aiCustomerService/tokenCounter");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");
const BANNED_WORDS = require("../utils/aiCustomerService/bannedWords");

async function postAiCustomerService(req, res, next) {
  const { id: user_id } = req.user;
  const { message } = req.body;

  // 缺少訊息
  if (!message) {
    logger.warn(ERROR_MESSAGES.MESSAGE_NOT_EMPTY);
    return next(new AppError(400, ERROR_MESSAGES.MESSAGE_NOT_EMPTY));
  }

  // 計算 token 數，且限制輸入成本
  const tokenCount = countTokens(message);
  const MAX_INPUT_TOKENS = 100;

  if (tokenCount > MAX_INPUT_TOKENS) {
    return next(new AppError(400, ERROR_MESSAGES.MESSAGE_LENGTH_TOO_LONG));
  }

  // 禁止不當內容
  const containsBanned = BANNED_WORDS.some((word) => message.includes(word));
  if (containsBanned) {
    return next(new AppError(400, ERROR_MESSAGES.NOT_ENTER_BANNED_WORDS));
  }

  // 取得對話實體
  const conversationRepo = dataSource.getRepository("Conversations");
  const messageRepo = dataSource.getRepository("Messages");

  // 找到或建立 Conversation
  let conversation = await conversationRepo.findOneBy({ user_id });

  if (!conversation) {
    conversation = conversationRepo.create({
      user_id,
      last_activity: new Date(),
    });
    await conversationRepo.save(conversation);
  } else {
    // 更新最後活動時間
    conversation.last_activity = new Date();
    await conversationRepo.save(conversation);
  }

  // 儲存使用者訊息
  await messageRepo.save(
    messageRepo.create({
      conversation_id: conversation.id,
      role: "user",
      content: message,
      sent_at: new Date(),
    })
  );

  // 取得 所有歷史訊息 組成 conversationHistory，且限制 token 總數
  const allMessages = await messageRepo.find({
    where: { conversation_id: conversation.id },
    order: { sent_at: "ASC" },
  });

  const MAX_HISTORY_TOKENS = 1000;
  let totalTokens = 0;
  const limitedMessages = [];

  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i];
    const text = `${msg.role === "user" ? "用戶" : "客服"}: ${msg.content}`;
    const tokens = countTokens(text);

    if (totalTokens + tokens > MAX_HISTORY_TOKENS) {
      break;
    }

    totalTokens += tokens;
    limitedMessages.unshift(text);
  }
  // 整理出在 token 數以內的訊息
  const trimmedHistory = limitedMessages.join("\n");

  const systemPrompt =
    "你是拾光堂的專業客服，以文藝、親切的風格專門回答顧客有關時光堂的問題，也回答與攝影器材購物相關的問題。";

  // 呼叫 fine-tuned 模型
  let responseText = "很抱歉，我目前無法提供回覆。";

  try {
    const response = await openai.responses.create({
      model: "ft:gpt-3.5-turbo-1106:tau::BjPv8re3",
      instructions: systemPrompt,
      input: trimmedHistory,
    });

    // 取得回應內容
    responseText = response.output_text?.trim() || responseText;
  } catch (error) {
    logger.error("OpenAI 回應錯誤", error);
  }

  // 儲存 AI 客服回應到資料庫
  await messageRepo.save(
    messageRepo.create({
      conversation_id: conversation.id,
      role: "assistant",
      content: responseText,
      sent_at: new Date(),
    })
  );

  // 回傳結果
  res.json({
    response: responseText,
    user_id,
  });
}

module.exports = { postAiCustomerService };
