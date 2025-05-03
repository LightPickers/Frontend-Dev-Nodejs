module.exports = function handleErrorAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((error) => {
      console.error("Error:", error);
      next(error);
    });
  };
};
