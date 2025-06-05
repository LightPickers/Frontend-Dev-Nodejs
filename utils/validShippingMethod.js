const shippingMethods = {
  HOME_DELIVERY: "home_delivery",
  //STORE_PICKUP : "store_pickup ",
  //POSTAL_DELIVERY: "postal_delivery",
};

// 驗證函式
function isValidShippingMethod(method) {
  return Object.values(shippingMethods).includes(method);
}

module.exports = { isValidShippingMethod };
