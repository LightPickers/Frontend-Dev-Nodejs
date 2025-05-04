const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Order_items",
  tableName: "ORDER_ITEMS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    order_id: {
      type: "uuid",
      nullable: false,
    },
    product_id: {
      type: "uuid",
      nullable: false,
    },
    quantity: {
      type: "integer",
      nullable: false,
    },
    price: {
      type: "integer",
      nullable: false,
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
    Orders: {
      target: "Orders",
      type: "many-to-one",
      joinColumn: {
        name: "order_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "order_items_order_id_fk",
      },
    },
    Products: {
      target: "Products",
      type: "many-to-one",
      joinColumn: {
        name: "product_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "order_items_product_id_fk",
      },
    },
  },
});
