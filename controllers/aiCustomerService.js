const { dataSource } = require("../db/data-source");
const openai = require("../services/openaiService");
const logger = require("../utils/logger")("aiCustomerServiceController");
const countTokens = require("../utils/aiCustomerService/tokenCounter");
const extractKeywords = require("../utils/aiCustomerService/extractKeyword");
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

  // 商品關鍵字查詢邏輯
  const keyword = extractKeywords(message);
  const productRepo = dataSource.getRepository("Products");

  let productInfo = "";
  if (keyword) {
    const products = await productRepo
      .createQueryBuilder("product")
      .where("product.title LIKE :keyword OR product.subtitle LIKE :keyword", {
        keyword: `%${keyword}%`,
      })
      .andWhere("product.is_available = :isAvailable", { isAvailable: true })
      .limit(3)
      .getMany();

    if (products.length > 0) {
      productInfo = products
        .map(
          (p) =>
            `- **${p.name}**\n[![商品圖片](${p.primary_image})](https://lightpickers.github.io/Frontend-Dev-React/#/products/${p.id})`
        )
        .join("\n\n");
    } else {
      productInfo = "目前沒有找到相關商品。";
    }
  }

  /*
  // 組合對話歷史 conversationHistory，且限制 token 總數
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
  */

  console.log("推薦商品：", productInfo);

  // 組合完整 prompt，將商品資訊與對話歷史一起帶入
  const systemContent = `你是拾光堂的專業客服，以文藝、親切的風格回答顧客的問題，並推薦相關攝影器材。`;
  const userContent = `使用者訊息如下：${message}以下是根據訊息找到的推薦商品清單(格式為 Markdown 圖片連結)：請根據拾光堂商品${productInfo}的資訊、格式，針對用戶訊息推薦商品。每項推薦提供名稱、「商品圖是lightpickers商品頁面超連結的格式」，並附上一句簡短介紹。若${productInfo}裡沒有，就不推薦。在結尾，請以親切的語氣引導用戶點擊圖片前往商品頁面。`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
  });

  // 取得回應內容
  const assistantReply = response.choices[0].message.content;

  // 儲存 AI 客服回應到資料庫
  await messageRepo.save(
    messageRepo.create({
      conversation_id: conversation.id,
      role: "assistant",
      content: assistantReply,
      sent_at: new Date(),
    })
  );

  // 回傳結果
  res.json({
    response: assistantReply,
    user_id,
  });
}

module.exports = { postAiCustomerService };
