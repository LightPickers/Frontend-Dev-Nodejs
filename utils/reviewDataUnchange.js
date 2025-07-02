function isReviewDataUnchanged(oldReview, newReview, oldImages, newImages) {
  const isSameRating = oldReview.rating === newReview.rating;
  const isSameComment = oldReview.comment === newReview.comment;

  const sortImages = (images) => (images || []).sort(); // 僅取出 image 欄位並排序

  const oldImageList = sortImages(oldImages);
  const newImageList = sortImages(newImages);

  const isSameImages =
    oldImageList.length === newImageList.length &&
    oldImageList.every((img, i) => img === newImageList[i]);

  return isSameRating && isSameComment && isSameImages;
}

module.exports = isReviewDataUnchanged;
