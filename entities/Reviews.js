const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Reviews",
  tableName: "REVIEWS",
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
    rating: {
      type: "integer",
      nullable: false,
    },
    comment: {
      type: "text",
      nullable: false,
    },
    image: {
      type: "varchar",
      length: 2048,
      nullable: true,
    },
    reply: {
      type: "text",
      nullable: true,
    },
    likes_count: {
      type: "integer",
      default: 0,
      nullable: true,
    },
    is_deleted: {
      type: "boolean",
      default: "false",
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
        foreignKeyConstraintName: "reviews_users_id_fk",
      },
    },
    Products: {
      target: "Products",
      type: "many-to-one",
      joinColumn: {
        name: "product_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "reviews_products_id_fk",
      },
    },
  },
});
