const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Categories",
  tableName: "CATEGORIES",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 50,
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
    Products: {
      target: "Products",
      type: "one-to-many",
      inverseSide: "Categories",
    },
  },
});
