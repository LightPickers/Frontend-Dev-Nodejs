const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Cart",
  tableName: "CART",
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
    product_id: {
      type: "uuid",
      nullable: false,
    },
    quantity: {
      type: "integer",
      default: 1,
      nullable: false,
    },
    price_at_time: {
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
    Users: {
      target: "Users",
      type: "many-to-one",
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "cart_users_id_fk",
      },
    },
    Products: {
      target: "Products",
      type: "many-to-one",
      joinColumn: {
        name: "product_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "cart_products_id_fk",
      },
    },
  },
  indices: [
    {
      name: "IDX_USER_PRODUCT_UNIQUE",
      columns: ["user_id", "product_id"],
      unique: true,
    },
  ],
});
