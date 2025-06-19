// // 加入寄送訂單確認Email
//     const userRepo = dataSource.getRepository("Users");
//     const user = await userRepo.findOneBy({ id: order.user_id });

//     const orderItemsFull = await dataSource
//       .getRepository("Order_items")
//       .find({ where: { order_id: order.id }, relations: { Products: true } });

//     const productList = orderItemsFull.map((item) => ({
//       name: item.Products.name,
//       quantity: item.quantity,
//       price: item.Products.selling_price,
//     }));

//     // 從訂單中取得 coupon_id
//     const couponRepo = dataSource.getRepository("Coupons");

//     let discountRate = 0; // 預設沒有折扣
//     if (order.coupon_id) {
//       const coupon = await couponRepo.findOne({
//         where: { id: order.coupon_id },
//         select: ["discount"],
//       });

//       if (coupon && typeof coupon.discount === "number") {
//         discountRate = coupon.discount * 0.1; // 例如 8 -> 0.8
//       }
//     }

//     // 計算折扣金額
//     const subtotal = order.amount - 60;
//     const discountAmount = Math.round(subtotal * (1 - discountRate));

//     await orderConfirm(user.email, {
//       customerName: user.name,
//       orderNumber: order.merchant_order_no,
//       orderDate: order.created_at,
//       products: productList,
//       subtotal: subtotal,
//       shippingFee: 60,
//       discount: discountAmount,
//       total: order.amount,
//       paymentMethod: order.payment_method,
//       recipientName: user.name,
//       recipientPhone: user.phone,
//       recipientAddress: `${user.address_zipcode} ${user.address_city} ${user.address_district} ${user.address_detail}`,
//     });
