const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("reviewsController");
const {
  isUndefined,
  isValidString,
  isValidUrl,
  isValidArrayOfURL,
} = require("../utils/validUtils");
const { validateFields } = require("../utils/validateFields");
const { isUUID } = require("validator");
const {
  REVIEWS_RULE,
  PAGE_PER_RULE,
  PAGENUMBER_PERNUMBER_RULE,
  REVIEWS_REPLY_RULE,
} = require("../utils/validateRules");
const isReviewDataUnchanged = require("../utils/reviewDataUnchange");
const _ = require("lodash");
const AppError = require("../utils/appError");
const ERROR_MESSAGES = require("../utils/errorMessages");

// 67.新增商品評論
async function postReviews(req, res, next) {
  const { id: user_id } = req.user;
  const { product_id } = req.params;
  const { rating, comment, images } = req.body;

  // 驗證欄位
  const errorFields = validateFields(
    {
      rating,
      comment,
    },
    REVIEWS_RULE
  );
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  // 評分只能在 1~5分 之間
  if (rating < 1 || rating > 5) {
    logger.warn(ERROR_MESSAGES.REVIEWS_SCORE_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.REVIEWS_SCORE_NOT_RULE));
  }

  if (!isUUID(product_id)) {
    logger.warn(`Product ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Product ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  // 檢查該用戶是否已評論過此商品
  const reviewRepo = dataSource.getRepository("Reviews");
  const review = await reviewRepo.findOneBy({ user_id, product_id });
  if (review) {
    logger.warn(ERROR_MESSAGES.REVIEWS_ALREADY_EXIST);
    return next(new AppError(400, ERROR_MESSAGES.REVIEWS_ALREADY_EXIST));
  }

  // 將 Review 資料存入 db
  const newReview = reviewRepo.create({ user_id, product_id, rating, comment });
  const savedReview = await reviewRepo.save(newReview);

  // 如果有 image 有值
  if (images) {
    // 驗證 image URL 格式是否正確
    if (!isValidArrayOfURL(images)) {
      logger.warn(ERROR_MESSAGES.REVIEWS_PHOTO_URL_INCORRECT);
      return next(
        new AppError(400, ERROR_MESSAGES.REVIEWS_PHOTO_URL_INCORRECT)
      );
    }

    // images 是否超過 3 張
    if (images.length > 3) {
      logger.warn(ERROR_MESSAGES.REVIEWS_PHOTO_NOT_MORE_THAN_THREE);
      return next(
        new AppError(400, ERROR_MESSAGES.REVIEWS_PHOTO_NOT_MORE_THAN_THREE)
      );
    }

    // 將 review images 存入
    const reviewImagesRepo = dataSource.getRepository("Review_images");
    const newReviewImages = images.map((imageUrl) =>
      reviewImagesRepo.create({
        review_id: savedReview.id,
        image: imageUrl,
      })
    );
    await reviewImagesRepo.save(newReviewImages);
  }

  return res.status(201).json({
    status: true,
    message: "商品評論新增成功",
  });
}

// 69.修改商品評論
async function putReviews(req, res, next) {
  const { review_id } = req.params;
  const { rating, comment, images } = req.body;

  // 驗證欄位
  const errorFields = validateFields(
    {
      rating,
      comment,
    },
    REVIEWS_RULE
  );
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  // 評分只能在 1~5分 之間
  if (rating < 1 || rating > 5) {
    logger.warn(ERROR_MESSAGES.REVIEWS_SCORE_NOT_RULE);
    return next(new AppError(400, ERROR_MESSAGES.REVIEWS_SCORE_NOT_RULE));
  }

  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  // 如果有 images 有值
  if (images) {
    // 驗證 image URL 格式是否正確
    if (!isValidArrayOfURL(images)) {
      logger.warn(ERROR_MESSAGES.REVIEWS_PHOTO_URL_INCORRECT);
      return next(
        new AppError(400, ERROR_MESSAGES.REVIEWS_PHOTO_URL_INCORRECT)
      );
    }

    // images 是否超過 3 張
    if (images.length > 3) {
      logger.warn(ERROR_MESSAGES.REVIEWS_PHOTO_NOT_MORE_THAN_THREE);
      return next(
        new AppError(400, ERROR_MESSAGES.REVIEWS_PHOTO_NOT_MORE_THAN_THREE)
      );
    }
  }

  const reviewRepo = dataSource.getRepository("Reviews");
  const review = await reviewRepo.findOneBy({ id: review_id });

  // 檢查是否有該筆評論
  if (!review) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  const reviewImagesRepo = dataSource.getRepository("Review_images");
  const reviewImages = await reviewImagesRepo.find({ where: { review_id } });
  const reviewImageUrls = reviewImages.map((item) => item.image.trim());

  // 檢查資料是否有改變
  if (
    isReviewDataUnchanged(review, { rating, comment }, reviewImageUrls, images)
  ) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_CHANGE}`);
    return next(new AppError(400, `評論 ${ERROR_MESSAGES.DATA_NOT_CHANGE}`));
  }

  // 更新評論資料
  const updateResult = await reviewRepo.update(
    { id: review_id },
    { rating, comment }
  );

  // 檢查資料是否有更新
  if (updateResult.affected === 0) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`);
    return next(new AppError(400, `評論 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`));
  }

  // 如果圖片不同，先刪除舊圖片後，再加上新圖片
  const dbImages = reviewImages.map((obj) => obj.image.trim()).sort();
  const requestImages = images.map((img) => img.trim()).sort();

  if (!_.isEqual(dbImages, requestImages)) {
    const reviewImagesRepo = dataSource.getRepository("Review_images");
    await reviewImagesRepo.delete({ review_id });

    if (requestImages.length > 0) {
      const newReviewImages = requestImages.map((imageUrl) =>
        reviewImagesRepo.create({ review_id, image: imageUrl })
      );
      await reviewImagesRepo.save(newReviewImages);
    }
  }

  return res.status(200).json({
    status: true,
    message: "商品評論修改成功",
  });
}

// 76.取得首頁評論資料
async function getIndexReviews(req, res, next) {
  const indexReviews = await dataSource
    .getRepository("Reviews")
    .createQueryBuilder("reviews")
    .leftJoinAndSelect("reviews.Users", "user")
    .leftJoinAndSelect("reviews.Products", "product")
    .select([
      "reviews.id",
      "reviews.rating",
      "reviews.comment",
      "reviews.is_deleted",
      "reviews.created_at",
      "user.photo",
      "user.email",
      "product.name",
    ])
    .andWhere("reviews.is_deleted = :isDeleted", { isDeleted: false })
    .orderBy("reviews.rating", "DESC")
    .limit(5)
    .getMany();

  res.status(200).json({
    status: true,
    message: "取得首頁評論資料成功",
    data: {
      indexReviews,
    },
  });
}

// 68.取得評論列表
async function getReviews(req, res, next) {
  const { id: user_id } = req.user;
  const { page, per, name, keyword, sort } = req.query;

  // 解析排序參數
  let orderField = "reviews.created_at";
  let orderDirection = "DESC";

  switch (sort) {
    case "latest":
      orderField = "reviews.created_at";
      orderDirection = "DESC";
      break;
    case "oldest":
      orderField = "reviews.created_at";
      orderDirection = "ASC";
      break;
    case "rating_desc":
      orderField = "reviews.rating";
      orderDirection = "DESC";
      break;
    case "rating_asc":
      orderField = "reviews.rating";
      orderDirection = "ASC";
      break;
    case undefined:
    case "":
      // 預設值已設在上方，不做處理
      break;
    default:
      logger.warn(`sort ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
      return next(new AppError(400, `sort ${ERROR_MESSAGES.FIELDS_INCORRECT}`));
  }

  const errorFields = validateFields(
    {
      page,
      per,
    },
    PAGE_PER_RULE
  );
  if (errorFields) {
    const errorMessage = errorFields.join(", ");
    logger.warn(errorMessage);
    return next(new AppError(400, errorMessage));
  }

  // 將 Page、Per 轉換為數字型別，並驗證是否為正整數
  const pageNumber = parseInt(page, 10) || 1;
  const perNumber = parseInt(per, 10) || 10;
  const skip = perNumber * (pageNumber - 1);
  const errorPagePer = validateFields(
    {
      pageNumber,
      perNumber,
    },
    PAGENUMBER_PERNUMBER_RULE
  );
  if (errorPagePer) {
    const errorMessage = errorPagePer.join(", ");
    logger.warn(errorMessage);
    return next(new AppError(400, errorMessage));
  }

  // 跳過的資料筆數，不能為負數
  if (skip < 0) {
    logger.warn(`skip ${ERROR_MESSAGES.DATA_NEGATIVE}`);
    return next(new AppError(400, `skip ${ERROR_MESSAGES.DATA_NEGATIVE}`));
  }

  const queryBuilder = dataSource
    .getRepository("Reviews")
    .createQueryBuilder("reviews")
    .leftJoinAndSelect("reviews.Users", "user")
    .leftJoinAndSelect("reviews.Products", "product")
    .leftJoin(
      "Review_likes",
      "likes",
      "likes.review_id = reviews.id AND likes.user_id = :user_id",
      { user_id }
    )
    .select([
      "reviews.id",
      "reviews.rating",
      "reviews.comment",
      "reviews.reply",
      "reviews.likes_count",
      "reviews.is_deleted",
      "reviews.created_at",
      "user.photo",
      "user.email",
      "product.name",
    ])
    .addSelect(
      "CASE WHEN likes.id IS NOT NULL THEN true ELSE false END",
      "reviews_is_liked"
    )
    .orderBy(orderField, orderDirection)
    .skip(skip)
    .take(perNumber);

  // 判斷網址中的 name 是否有值，並驗證欄位
  if (name) {
    const nameErrorFields = validateFields({ name }, QUERY_NAME_RULE);
    if (nameErrorFields) {
      const errorMessage = nameErrorFields;
      logger.warn(errorMessage);
      return next(new AppError(400, errorMessage));
    } else {
      queryBuilder.andWhere("product.name = :name", { name });
    }
  }

  // 判斷網址中的 keyword 是否有值，並驗證欄位
  if (keyword) {
    const keywordErrorFields = validateFields({ keyword }, QUERY_KEYWORD_RULE);
    if (keywordErrorFields) {
      const errorMessage = keywordErrorFields;
      logger.warn(errorMessage);
      return next(new AppError(400, errorMessage));
    } else {
      queryBuilder.andWhere(
        "(product.name LIKE :keyword OR reviews.rating LIKE :keyword)", // 以 商品名稱 或 評論分數 進行搜尋
        { keyword: `%${keyword}%` }
      );
    }
  }

  // 將 reviews_is_liked 加回每筆結果中
  const rawReviews = await queryBuilder.getRawAndEntities();
  const reviews = rawReviews.entities.map((review, index) => {
    return {
      ...review,
      is_liked: rawReviews.raw[index]["reviews_is_liked"],
    };
  });

  // 取出 搜尋的 Reviews 和 搜尋筆數
  const totalReviews = await queryBuilder.getCount();

  // 計算 總頁數
  const totalPages = Math.ceil(totalReviews / perNumber);

  return res.status(200).json({
    status: true,
    message: "取得評論成功",
    data: {
      totalReviews,
      totalPages,
      reviews,
    },
  });
}

// 75.取得評論詳細資料
async function getReviewsDetail(req, res, next) {
  const { id: user_id } = req.user;
  const { review_id } = req.params;

  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  const review = await dataSource.getRepository("Reviews").findOne({
    select: {
      id: true,
      rating: true,
      comment: true,
      reply: true,
      likes_count: true,
      is_deleted: true,
      created_at: true,
      Users: {
        photo: true,
        email: true,
      },
      Products: {
        name: true,
      },
    },
    where: { id: review_id },
    relations: {
      Users: true,
      Products: true,
    },
  });

  // 檢查是否有該筆評論
  if (!review) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  // 取得評論照片
  const reviewImages = await dataSource.getRepository("Review_images").find({
    select: ["image"],
    where: { review_id },
  });
  const reviewImagesUrl = reviewImages.map((item) => item.image);

  // 檢查用戶是否已按讚此評論
  let is_liked = false;
  const reviewLikeRepo = dataSource.getRepository("Review_likes");
  const reviewLike = await reviewLikeRepo.findOneBy({ user_id, review_id });
  if (reviewLike) {
    is_liked = true;
  }

  return res.status(200).json({
    status: true,
    message: "商品評論取得成功",
    data: {
      review,
      reviewImagesUrl,
      is_liked,
    },
  });
}

// 70.新增商品評論讚
async function postReviewsLike(req, res, next) {
  const { id: user_id } = req.user;
  const { review_id } = req.params;
  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  await dataSource.transaction(async (manager) => {
    const reviewLikeRepo = manager.getRepository("Review_likes");
    const reviewRepo = manager.getRepository("Reviews");

    // 檢查用戶是否已按讚此評論
    const reviewLike = await reviewLikeRepo.findOneBy({ user_id, review_id });
    if (reviewLike) {
      logger.warn(ERROR_MESSAGES.REVIEW_LIKES_ALREADY_EXIST);
      return next(new AppError(400, ERROR_MESSAGES.REVIEW_LIKES_ALREADY_EXIST));
    }

    // 新增按讚
    const newLike = reviewLikeRepo.create({ user_id, review_id });
    await reviewLikeRepo.save(newLike);

    // 檢查是否有該筆評論
    const review = await reviewRepo.findOneBy({ id: review_id });
    if (!review) {
      logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
    }

    // 將總按讚數 +1
    await reviewRepo.increment({ id: review_id }, "likes_count", 1);
  });

  return res.status(201).json({
    status: true,
    message: "商品評論按讚成功",
  });
}

// 71.取消商品評論讚
async function deleteReviewsLike(req, res, next) {
  const { id: user_id } = req.user;
  const { review_id } = req.params;
  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  await dataSource.transaction(async (manager) => {
    const reviewLikeRepo = manager.getRepository("Review_likes");
    const reviewRepo = manager.getRepository("Reviews");

    // 檢查是否有該筆評論
    const review = await reviewRepo.findOneBy({ id: review_id });
    if (!review) {
      logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
    }

    // 檢查用戶是否有按讚此評論
    const reviewLike = await reviewLikeRepo.findOneBy({ user_id, review_id });
    if (!reviewLike) {
      logger.warn(`評論按讚 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
      return next(
        new AppError(404, `評論按讚 ${ERROR_MESSAGES.DATA_NOT_FOUND}`)
      );
    }

    // 取消按讚
    await reviewLikeRepo.delete({ user_id, review_id });

    // 將總按讚數 -1
    await reviewRepo.decrement({ id: review_id }, "likes_count", 1);
  });

  return res.status(200).json({
    status: true,
    message: "商品評論取消讚成功",
  });
}

//管理者功能
// 72.回覆商品評論
async function replyReviews(req, res, next) {
  console.log(req.user);
  const { review_id } = req.params;
  const { reply } = req.body;

  // 驗證欄位
  const errorFields = validateFields(
    {
      reply,
    },
    REVIEWS_REPLY_RULE
  );
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  const reviewRepo = dataSource.getRepository("Reviews");
  const review = await reviewRepo.findOneBy({ id: review_id });

  // 檢查是否有該筆評論
  if (!review) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  // 更新 Review 的 reply 欄位
  const updateResult = await reviewRepo.update({ id: review_id }, { reply });

  // 檢查資料是否有更新
  if (updateResult.affected === 0) {
    logger.warn(`評論回覆 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`);
    return next(
      new AppError(400, `評論回覆 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`)
    );
  }

  const result = await reviewRepo.findOneBy({ id: review_id });

  return res.status(200).json({
    status: true,
    message: "商品評論回覆成功",
    data: { reply: result.reply },
  });
}

// 73.修改商品回覆評論
async function putReplyReviews(req, res, next) {
  const { review_id } = req.params;
  const { reply } = req.body;

  // 驗證欄位
  const errorFields = validateFields(
    {
      reply,
    },
    REVIEWS_REPLY_RULE
  );
  if (errorFields) {
    const errorMessages = errorFields.join(", ");
    logger.warn(errorMessages);
    return next(new AppError(400, errorMessages));
  }

  if (!isUUID(review_id)) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(
      new AppError(400, `Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`)
    );
  }

  const reviewRepo = dataSource.getRepository("Reviews");
  const review = await reviewRepo.findOneBy({ id: review_id });

  // 檢查是否有該筆評論
  if (!review) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  // 檢查 Review 的 reply 是否有更改
  if (review.reply === reply) {
    logger.warn(`評論回覆 ${ERROR_MESSAGES.DATA_NOT_CHANGE}`);
    return next(
      new AppError(400, `評論回覆 ${ERROR_MESSAGES.DATA_NOT_CHANGE}`)
    );
  }

  // 更新 Review 的 reply 欄位
  const updateResult = await reviewRepo.update({ id: review_id }, { reply });

  // 檢查資料是否有更新
  if (updateResult.affected === 0) {
    logger.warn(`評論回覆 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`);
    return next(
      new AppError(400, `評論回覆 ${ERROR_MESSAGES.DATA_UPDATE_FAILED}`)
    );
  }

  const result = await reviewRepo.findOneBy({ id: review_id });

  return res.status(200).json({
    status: true,
    message: "商品評論回覆修改成功",
    data: { reply: result.reply },
  });
}

// 74.刪除商品評論
async function deleteReviews(req, res, next) {
  const { review_id } = req.params;

  // 驗證評論 ID 格式
  if (
    isUndefined(review_id) ||
    !isValidString(review_id) ||
    !isUUID(review_id)
  ) {
    logger.warn(`Review ID ${ERROR_MESSAGES.FIELDS_INCORRECT}`);
    return next(new AppError(400, ERROR_MESSAGES.FIELDS_INCORRECT));
  }

  const reviewRepo = dataSource.getRepository("Reviews");
  const review = await reviewRepo.findOneBy({ id: review_id });

  // 檢查是否有該筆評論
  if (!review) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`);
    return next(new AppError(404, `評論 ${ERROR_MESSAGES.DATA_NOT_FOUND}`));
  }

  // 更改評論 刪除狀態
  const result = await reviewRepo.update(
    { id: review_id },
    { is_deleted: true }
  );

  if (result.affected === 0) {
    logger.warn(`評論 ${ERROR_MESSAGES.DATA_NOT_DELETE}`);
    return next(new AppError(400, `評論 ${ERROR_MESSAGES.DATA_NOT_DELETE}`));
  }

  return res.status(200).json({
    status: true,
    message: "評論刪除成功",
  });
}

module.exports = {
  postReviews,
  putReviews,
  getIndexReviews,
  getReviews,
  getReviewsDetail,
  postReviewsLike,
  deleteReviewsLike,
  replyReviews,
  putReplyReviews,
  deleteReviews,
};
