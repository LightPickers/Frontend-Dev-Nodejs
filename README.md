# 拾光堂前台後端 專案開發環境與目錄結構介紹
主題：《拾光堂》二手攝影器材電商平台
簡介：二手攝影器材仍然具有極高的使用價值。許多保存良好的器材，因缺乏合適的流通平台被閒置或低價處理。且購買全新器材的價格高昂，在摸索攝影的過程金錢成本過高，許多人難以負擔。
所以我們希望打造一個專門的二手攝影器材交易平台，讓器材能夠在攝影愛好者之間流轉，延續其價值。讓舊有的器材有最有效的利用。

前台網址：[https://lightpickers.github.io/Frontend-Dev-React/#/](https://lightpickers.github.io/Frontend-Dev-React/#/)

---

## 功能
測試帳號密碼
```bash
帳號：example1223@gmail.com
密碼：ASSffff8972
```
- 註冊 / 登入 (平台系統、第三方登入)
- 會員中心：瀏覽、更改個人資訊、查看訂單狀態
- 忘記密碼
- 瀏覽商品、商品內頁的詳細內容
- 查詢商品時，可以使用篩選功能 (品牌、商品狀態、價格區間)
- 將商品加入 收藏清單、購物車
- 將商品從 收藏清單、購物車 刪除
- 結帳時輸入優惠券代碼，領取折扣
- 使用 藍新金流 付款
- 使用 AI 智能客服 詢問問題

結帳資訊
```bash
優惠券代碼：2025summer
藍新金流
測試卡號：4000 2211 1111 1111
測試卡片過期日：01/28
測試安全碼：111
```
 
---

## 專案技術
- **後端語言**：Node.js
- **後端框架**：Express
- **資料庫**：PostgreSQL
- **部署平台**：Render（Web, PostgreSQL）+ Redis Cloud
- **身分驗證**：JWT、Bcrypt
- **金流整合**：藍新金流 newebpay（含 AES 加密 / SHA256）
- **快取**：Redis
- **排程**：node-cron (搭配 Redis)
- **AI客服**：openAI
- **Log 工具**：Pino（搭配 pino-pretty，方便開發時格式化 log）

---

## 架構
```bash
Frontend-Dev-Nodejs/
├── bin/                 # 伺服器啟動程式
│   ├── www.js
├── config/              # 環境與密鑰設定
│   ├── db.js
│   ├── google.js
│   ├── index.js
│   ├── neWebPaySecret.js
│   ├── openai.js
│   ├── redisSecret.js
│   ├── secret.js
│   ├── web.js
├── controllers/         # API 控制器
│   ├── aiCustomerService.js  # openai 智能客服 
│   ├── auth.js  # Google 第三方登入
│   ├── brands.js  # 品牌
│   ├── cart.js  # 購物車
│   ├── categories.js  # 類別
│   ├── category.js  # 類別
│   ├── conditions.js  #商品狀態
│   ├── email.js  # 信件寄送
│   ├── neWebPay.js  # 藍新金流 API
│   ├── orders.js  # 訂單
│   ├── products.js  # 商品
│   ├── savedList.js  # 
│   ├── upload.js  # 上傳圖片
│   ├── users.js  # 使用者
├── crons/               # 排程
│   ├── orderExpire.cron.js
├── db/                  # 資料庫
│   ├── data-source.js
├── emailTemplates/      # 信件樣板
│   ├── registerSuccess.html
│   ├── resetPassword.html
├── entities/            # TypeORM 資料模型
│   ├── Brands.js
│   ├── Cart.js
│   ├── Categories.js
│   ├── Conditions.js
│   ├── Conversation.js
│   ├── Coupons.js
│   ├── Favorites.js
│   ├── Messages.js
│   ├── Order_items.js
│   ├── Orders.js
│   ├── Payments.js
│   ├── Product_images.js
│   ├── Products.js
│   ├── Roles.js
│   ├── Users.js
├── middlewares/         # 中介層處理
│   ├── auth.js
│   ├── rateLimiter.js
│   ├── uploadImages.js
├── routes/              # 路由定義
│   ├── aiCustomerService.js
│   ├── auth.js
│   ├── brands.js
│   ├── cart.js
│   ├── categories.js
│   ├── category.js
│   ├── conditions.js
│   ├── email.js
│   ├── health.js
│   ├── neWebPay.js
│   ├── orders.js
│   ├── products.js
│   ├── upload.js
│   ├── users.js
├── services/            # openAI 服務
│   ├── openaiService.js
├── utils/               # 工具函式
│   ├── aiCustomerService.js
│   ├──   ├── bannedWords.js
│   ├──   ├── tokenCounter.js
│   ├── newebpay.js
│   ├──   ├── generateNewebpayForm.js
│   ├──   ├── neWebPayCrypto.js
│   ├── redis.js
│   ├──   ├── cache.js
│   ├──   ├── redis.js
│   ├──   ├── redisRestore.js
│   ├── appError.js
│   ├── errorMessages.js
│   ├── generateJWT.js
│   ├── handleErrorAsync.js
│   ├── logger.js
│   ├── sendEmail.js
│   ├── validateFields.js
│   ├── validatePasswordRule.js
│   ├── validatePatterns.js
│   ├── validateRules.js
│   ├── validateSignup.js
│   ├── validFilterCache.js
│   ├── validPaymentMethod.js
│   ├── validShippingMethod.js
│   ├── validUtils.js
├── app.js               # Express 應用程式主檔
├── README.md
```

---

## 資料庫設計
本專案使用 PostgreSQL + TypeORM 管理資料，資料表結構如下：
[🔗 資料表設計圖（dbdiagram.io）](https://dbdiagram.io/d/Light-Peakers-67ea32794f7afba184c42005)

---

## 第三方服務
- Google API
- openai API
- Redis
- 藍新金流

---

## 聯絡作者
您可以透過以下方式與我聯絡
- email: lightpickers666@gmail.com
