const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Orders",
  tableName: "ORDERS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    user_id: {
      type: "uuid",
      nullable: false,
    },
    coupon_id: {
      type: "uuid",
      nullable: true,
    },
    status: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    desired_date: {
      type: "date",
      nullable: false,
    },
    shipping_method: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    payment_method: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    amount: {
      type: "integer",
      nullable: false,
    },
    merchant_order_no: {
      type: "varchar",
      length: 30,
      nullable: true,
    },
    canceled_at: {
      type: "timestamp",
      nullable: true,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
      nullable: false,
    },
    updated_at: {
      type: "timestamp",
      updateDate: true,
      nullable: false,
    },
  },
  relations: {
    Users: {
      target: "Users",
      type: "many-to-one",
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "orders_users_id_fk",
      },
    },
    Coupons: {
      target: "Coupons",
      type: "many-to-one",
      joinColumn: {
        name: "coupon_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "orders_coupon_id_fk",
      },
    },
    Order_items: {
      target: "Order_items",
      type: "one-to-many",
      inverseSide: "order",
    },
  },
});
