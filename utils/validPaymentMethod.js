const paymentMethods = {
  CREDIT_CARD: "credit_card",
  //CASH_ON_DELIVERY: "cash_on_delivery",
  //BANK_TRANSFER: "bank_transfer",
  //LINE_PAY: "line_pay",
  //APPLE_PAY: "apple_pay",
  //GOOGLE_PAY: "google_pay",
  //STORE_CODE: "store_code",
};

// 驗證函式
function isValidPaymentMethod(method) {
  return Object.values(paymentMethods).includes(method);
}

module.exports = { isValidPaymentMethod };
