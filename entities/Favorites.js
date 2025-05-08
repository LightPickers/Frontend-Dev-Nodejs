const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Favorites",
  tableName: "FAVORITES",
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
        // foreignKeyConstraintName: "favorites_users_id_fk",
      },
      onDelete: "CASCADE",
    },
    Products: {
      target: "Products",
      type: "many-to-one",
      joinColumn: {
        name: "product_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
  foreignKeys: [
    {
      columnNames: ["user_id"],
      referencedTableName: "Users",
      referencedColumnNames: ["id"],
    },
    {
      columnNames: ["product_id"],
      referencedTableName: "Products",
      referencedColumnNames: ["id"],
    },
  ],
});
