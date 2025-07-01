function isReviewDataUnchanged(oldReview, newReview) {
  const isSameRating = oldReview.rating === newReview.rating;
  const isSameComment = oldReview.comment === newReview.comment;
  const isSameImage =
    (!oldReview.image && !newReview.image) ||
    oldReview.image === newReview.image;

  return isSameRating && isSameComment && isSameImage;
}

module.exports = isReviewDataUnchanged;
