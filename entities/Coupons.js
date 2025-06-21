const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Coupons",
  tableName: "COUPONS",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    code: {
      type: "varchar",
      length: 50,
      nullable: false,
      unique: true,
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    discount: {
      type: "integer",
      nullable: false,
    },
    quantity: {
      type: "integer",
      nullable: false,
    },
    distributed_quantity: {
      type: "integer",
      default: 0,
      nullable: false,
    },
    start_at: {
      type: "timestamp",
      nullable: false,
    },
    end_at: {
      type: "timestamp",
      nullable: false,
    },
    is_available: {
      type: "boolean",
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
});
