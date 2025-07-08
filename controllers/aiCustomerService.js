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
  const now = new Date();

  if (!conversation) {
    const insertResult = await conversationRepo.insert({
      user_id,
      last_activity: now,
    });
    conversation = { id: insertResult.identifiers[0].id };
  } else {
    await conversationRepo.update(
      { id: conversation.id },
      { last_activity: now }
    );
  }

  // 並行儲存使用者訊息
  const saveUserMessage = messageRepo.save(
    messageRepo.create({
      conversation_id: conversation.id,
      role: "user",
      content: message,
      sent_at: now,
    })
  );

  // 商品關鍵字查詢邏輯
  const keyword = extractKeywords(message);
  const productRepo = dataSource.getRepository("Products");

  // console.log(keyword);

  let productInfo = "";

  if (keyword && keyword.length > 0) {
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .select([
        "product.id",
        "product.name",
        "product.primary_image",
        "product.description",
      ]);

    // 用來放 OR 條件
    const keywordConditions = [];
    const params = {};

    keyword.forEach((word, index) => {
      const param = `keyword${index}`;
      keywordConditions.push(
        `(product.title LIKE :${param} OR product.subtitle LIKE :${param})`
      );
      params[param] = `%${word}%`;
    });

    // 加入關鍵字條件（整個用括號包住）
    queryBuilder.where(`(${keywordConditions.join(" OR ")})`, params);

    // 過濾 未供應 商品
    queryBuilder.andWhere("product.is_available = :isAvailable", {
      isAvailable: true,
    });

    // 限制最多 2 筆
    queryBuilder.limit(2);
    //console.log("🧪 SQL 查詢語句：", queryBuilder.getSql());
    const products = await queryBuilder.getMany();

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

    await saveUserMessage; // 等待訊息儲存
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

  // console.log("推薦商品：", productInfo);

  // 組合完整 prompt，將商品資訊與對話歷史一起帶入
  const systemContent = `你是拾光堂的專業客服，以親切的風格回答顧客問題，並推薦相關攝影器材。`;
  const userContent = `顧客問題如下：${message}。以下是推薦商品資料：${productInfo}請根據顧客問題與商品資料，回覆 Markdown 格式的推薦清單。每項商品包含商品名稱、圖片連結，並附一句簡短推薦，且品項以分隔線隔開。若無資料，就不推薦。結尾時示意點擊圖片前往商品頁。`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    temperature: 0.3,
    //max_tokens: 700,
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
