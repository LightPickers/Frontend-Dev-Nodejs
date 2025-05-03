const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Payments",
  tableName: "PAYMENTS",
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
    user_id: {
      type: "uuid",
      nullable: false,
    },
    transaction_id: {
      type: "varchar",
      length: 100,
      unique: true,
      nullable: false,
    },
    status: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    paid_at: {
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
    Orders: {
      target: "Orders",
      type: "many-to-one",
      joinColumn: {
        name: "order_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "payments_order_id_fk",
      },
    },
    Users: {
      target: "Users",
      type: "many-to-one",
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "payments_users_id_fk",
      },
    },
  },
});
