const {
  generateNewebpayForm,
} = require("../../utils/newebpay/generateNewebpayForm");

class PaymentNewebpay {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async generateForm(order, productName, email, itemCount) {
    const { html, merchantOrderNo } = generateNewebpayForm(
      order,
      productName,
      email,
      itemCount
    );
    order.merchant_order_no = merchantOrderNo;
    await this.dataSource.getRepository("Orders").save(order);
    return html;
  }
}

module.exports = PaymentNewebpay;
